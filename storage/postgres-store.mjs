import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = readFileSync(resolve(ROOT, 'schema.postgres.sql'), 'utf8');
const POSTGRES_SCHEMA_VERSION = 5;

const now = () => new Date().toISOString();
const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

function connectionOptions({ connectionString = process.env.DATABASE_URL, max = process.env.DATABASE_POOL_MAX, ssl = process.env.DATABASE_SSL } = {}) {
  if (!connectionString) throw new Error('DATABASE_URL est obligatoire pour l’API EMRYS.');
  const useSsl = ssl === 'true' || ssl === true || /(?:^|[?&])sslmode=require(?:&|$)/i.test(connectionString);
  return {
    connectionString,
    max: Number(max || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: process.env.NODE_ENV !== 'production',
    ssl: useSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined
  };
}

/**
 * PostgreSQL adapter for the central EMRYS API.
 *
 * It deliberately exposes a small pg-shaped contract instead of leaking the
 * pool throughout the application. Local SQLite and central PostgreSQL can
 * therefore keep the same identifiers, JSON payloads and sync invariants.
 */
export function createPostgresWorkspaceStore(options = {}) {
  const pool = options.pool || new Pool(connectionOptions(options));
  let migrationPromise;

  const migrate = async () => {
    if (!migrationPromise) {
      migrationPromise = (async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(SCHEMA);
          await client.query(
            `INSERT INTO schema_migrations (version, name, applied_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (version) DO UPDATE SET name=EXCLUDED.name`,
            [POSTGRES_SCHEMA_VERSION, 'postgres-central-foundation', now()]
          );
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK').catch(() => {});
          migrationPromise = null;
          throw error;
        } finally {
          client.release();
        }
      })();
    }
    return migrationPromise;
  };

  const query = async (text, params = []) => {
    await migrate();
    return pool.query(text, params);
  };

  const transaction = async (callback) => {
    await migrate();
    const client = await pool.connect();
    const tx = {
      query: (text, params = []) => client.query(text, params),
      hash
    };
    try {
      await client.query('BEGIN');
      const result = await callback(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  };

  return {
    pool,
    query,
    transaction,
    migrate,
    async health() {
      await migrate();
      const result = await pool.query('SELECT 1 AS ok');
      return result.rows[0]?.ok === 1;
    },
    async schemaVersion() {
      const result = await query('SELECT COALESCE(MAX(version), 0)::integer AS version FROM schema_migrations');
      return result.rows[0]?.version || 0;
    },
    async close() {
      await pool.end();
    }
  };
}

export { POSTGRES_SCHEMA_VERSION, hash };
