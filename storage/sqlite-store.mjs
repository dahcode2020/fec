import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = resolve(ROOT, 'schema.sql');
const SCHEMA_TEXT = readFileSync(SCHEMA, 'utf8');

const json = (value) => JSON.stringify(value ?? {});
const flag = (value) => value ? 1 : 0;
const now = () => new Date().toISOString();
const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

function ensureParent(filename) {
  if (filename === ':memory:') return;
  mkdirSync(dirname(resolve(filename)), { recursive: true });
}

export function createSqliteWorkspaceStore({ filename = ':memory:' } = {}) {
  ensureParent(filename);
  const db = new DatabaseSync(filename);
  db.exec(SCHEMA_TEXT);
  db.prepare('INSERT OR IGNORE INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(1, 'initial-domain-schema', now());
  db.prepare('INSERT OR IGNORE INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(2, 'offline-sync-and-backups', now());

  const transaction = (callback) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  const enqueueInternal = ({ id, companyId = null, entityType, entityId, operation = 'UPSERT', payload }) => {
    const eventId = id || `sync-${entityType}-${entityId}-${randomUUID()}`;
    db.prepare(`INSERT OR IGNORE INTO sync_outbox (id, company_id, entity_type, entity_id, operation, payload_json, payload_hash, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`).run(eventId, companyId, entityType, entityId, operation, json(payload), hash(payload), now());
    return eventId;
  };

  const store = {
    db,
    transaction,
    schemaVersion() { return db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get().version; },
    enqueueSyncEvent(event) { return transaction(() => enqueueInternal(event)); },
    pendingSyncEvents({ companyId = null, limit = 100 } = {}) {
      return companyId ? db.prepare("SELECT * FROM sync_outbox WHERE (company_id = ? OR company_id IS NULL) AND status IN ('PENDING', 'FAILED') ORDER BY created_at LIMIT ?").all(companyId, limit) : db.prepare("SELECT * FROM sync_outbox WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at LIMIT ?").all(limit);
    },
    acknowledgeSyncEvent(id, cursor = null) {
      db.prepare("UPDATE sync_outbox SET status='ACKED', acknowledged_at=? WHERE id=?").run(now(), id);
      if (cursor !== null) this.setSyncCursor('default', cursor);
    },
    markSyncEventFailed(id, error) {
      db.prepare("UPDATE sync_outbox SET status='FAILED', attempts=attempts+1, last_error=? WHERE id=?").run(String(error), id);
    },
    receiveSyncEvent(event) {
      const result = db.prepare(`INSERT OR IGNORE INTO sync_inbox (id, device_id, entity_type, entity_id, operation, payload_json, received_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'RECEIVED')`).run(event.id, event.deviceId || null, event.entityType, event.entityId, event.operation || 'UPSERT', json(event.payload), now());
      return result.changes === 1;
    },
    markSyncEventApplied(id) { db.prepare("UPDATE sync_inbox SET status='APPLIED', applied_at=? WHERE id=?").run(now(), id); },
    applySyncEvent(event) {
      const payload = event.payload || (typeof event.payload_json === 'string' ? JSON.parse(event.payload_json) : null);
      if (!payload) throw new Error(`Événement ${event.id} sans contenu.`);
      switch (event.entityType) {
        case 'USER': this.saveUser(payload, { enqueue: false }); break;
        case 'COMPANY': this.saveCompany(payload, { enqueue: false }); break;
        case 'MEMBERSHIP': this.saveMembership(payload, { enqueue: false }); break;
        case 'DOSSIER': this.saveDossier(payload, { enqueue: false }); break;
        case 'FISCAL_YEAR': this.saveFiscalYear(payload, event.companyId, { enqueue: false }); break;
        case 'PERIOD': this.savePeriod(payload, event.companyId, payload.fiscalYear, { enqueue: false }); break;
        case 'JOURNAL_ENTRY':
          if (!db.prepare('SELECT 1 AS found FROM journal_entries WHERE id=?').get(event.entityId)) this.insertJournalEntry(payload, payload.fiscalYear || null, { enqueue: false });
          break;
        case 'FINANCIAL_SNAPSHOT': this.saveSnapshot(payload, { enqueue: false }); break;
        case 'FEC_ARCHIVE': this.saveFecArchive(payload, { enqueue: false }); break;
        case 'AUDIT_EVENT':
          if (!db.prepare('SELECT 1 AS found FROM audit_events WHERE id=?').get(event.entityId)) this.saveAuditEvent(payload, { enqueue: false });
          break;
        default: throw new Error(`Type d’entité non pris en charge : ${event.entityType}`);
      }
      this.markSyncEventApplied(event.id);
    },
    setSyncCursor(scope, cursor) { db.prepare(`INSERT INTO sync_cursors (scope, cursor, updated_at) VALUES (?, ?, ?) ON CONFLICT(scope) DO UPDATE SET cursor=excluded.cursor, updated_at=excluded.updated_at`).run(scope, String(cursor), now()); },
    getSyncCursor(scope = 'default') { return db.prepare('SELECT cursor FROM sync_cursors WHERE scope=?').get(scope)?.cursor || null; },
    recordConflict(conflict) { db.prepare(`INSERT INTO sync_conflicts (id, outbox_id, company_id, entity_type, entity_id, local_json, remote_json, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)`).run(conflict.id || `conflict-${Date.now()}`, conflict.outboxId || null, conflict.companyId || null, conflict.entityType, conflict.entityId, json(conflict.local), json(conflict.remote), conflict.reason, now()); },
    saveWorkspace(workspace) {
      db.prepare('INSERT INTO workspace (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name').run(workspace.id, workspace.name, workspace.createdAt || now());
    },
    saveUser(user, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO users (id, name, email, active, password_hash, password_salt, last_login_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, active=excluded.active, password_hash=excluded.password_hash, password_salt=excluded.password_salt, last_login_at=excluded.last_login_at`).run(user.id, user.name, user.email, flag(user.active !== false), user.passwordHash || null, user.passwordSalt || null, user.lastLoginAt || null, user.createdAt || now());
        if (enqueue) enqueueInternal({ companyId: null, entityType: 'USER', entityId: user.id, payload: user });
      });
    },
    saveCompany(company, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO companies (id, name, short_name, legal_form, address, ifu, activity, country, currency, archived, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, short_name=excluded.short_name, legal_form=excluded.legal_form, address=excluded.address, ifu=excluded.ifu, activity=excluded.activity, country=excluded.country, currency=excluded.currency, archived=excluded.archived`).run(company.id, company.name, company.shortName || company.short_name || null, company.legalForm || company.legal_form || null, company.address || null, company.ifu || null, company.activity || null, company.country || 'BJ', company.currency || 'XOF', flag(company.archived), company.createdAt || now());
        if (enqueue) enqueueInternal({ companyId: company.id, entityType: 'COMPANY', entityId: company.id, payload: company });
      });
    },
    saveMembership(membership, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO memberships (id, user_id, company_id, module_id, role, active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, company_id, module_id) DO UPDATE SET role=excluded.role, active=excluded.active`).run(membership.id, membership.userId, membership.companyId, membership.moduleId, membership.role, flag(membership.active !== false), membership.createdAt || now());
        if (enqueue) enqueueInternal({ companyId: membership.companyId, entityType: 'MEMBERSHIP', entityId: membership.id, payload: membership });
      });
    },
    saveDossier(dossier, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO dossiers (id, company_id, code, module_id, exercise_year, exercise_start, exercise_end, status, archived, data_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET code=excluded.code, status=excluded.status, archived=excluded.archived, data_json=excluded.data_json`).run(dossier.id, dossier.companyId, dossier.dossier || dossier.code, dossier.moduleId || null, dossier.exerciseYear || null, dossier.exerciseStart || null, dossier.exerciseEnd || null, dossier.status || 'Disponible', flag(dossier.archived || dossier.status === 'Archivé'), json(dossier), dossier.createdAt || now());
        if (enqueue) enqueueInternal({ companyId: dossier.companyId, entityType: 'DOSSIER', entityId: dossier.id, payload: dossier });
      });
    },
    saveFiscalYear(year, companyId, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO fiscal_years (id, company_id, year, label, status, snapshot_id, opened_at, finalized_at, data_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(company_id, year) DO UPDATE SET label=excluded.label, status=excluded.status, snapshot_id=excluded.snapshot_id, opened_at=excluded.opened_at, finalized_at=excluded.finalized_at, data_json=excluded.data_json`).run(year.id || `${companyId}-${year.year}`, companyId, String(year.year || year.id), year.label || `Exercice ${year.year || year.id}`, year.status || 'OPEN', year.snapshotId || null, year.openedAt || null, year.finalizedAt || null, json(year));
        if (enqueue) enqueueInternal({ companyId, entityType: 'FISCAL_YEAR', entityId: year.id || `${companyId}-${year.year}`, payload: year });
      });
    },
    savePeriod(period, companyId, fiscalYear, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO periods (id, company_id, fiscal_year, period_code, start_date, end_date, status, data_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(company_id, fiscal_year, period_code) DO UPDATE SET start_date=excluded.start_date, end_date=excluded.end_date, status=excluded.status, data_json=excluded.data_json`).run(period.id, companyId, String(fiscalYear), period.id, period.start, period.end, period.status || 'OPEN', json(period));
        if (enqueue) enqueueInternal({ companyId, entityType: 'PERIOD', entityId: period.id, payload: { ...period, fiscalYear } });
      });
    },
    insertJournalEntry(entry, fiscalYear = null, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO journal_entries (id, company_id, fiscal_year, journal_id, entry_date, piece_date, reference, label, status, integration_category, validated_at, data_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(entry.id, entry.companyId, fiscalYear || entry.fiscalYear || null, entry.journalId, entry.date, entry.pieceDate || entry.date, entry.reference || null, entry.label || '', entry.status || 'DRAFT', entry.integrationCategory || null, entry.validatedAt || null, json(entry), entry.createdAt || now());
        const statement = db.prepare(`INSERT INTO journal_entry_lines (entry_id, line_number, account_id, label, debit, credit, data_json) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        (entry.lines || []).forEach((line, index) => statement.run(entry.id, index + 1, line.accountId, line.label || '', Number(line.debit || 0), Number(line.credit || 0), json(line)));
        if (enqueue) enqueueInternal({ companyId: entry.companyId, entityType: 'JOURNAL_ENTRY', entityId: entry.id, payload: { ...entry, fiscalYear: fiscalYear || entry.fiscalYear || null } });
        return entry.id;
      });
    },
    saveSnapshot(snapshot, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO financial_snapshots (id, company_id, fiscal_year, status, immutable, snapshot_hash, source_count, line_count, data_json, sealed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(company_id, fiscal_year) DO UPDATE SET status=excluded.status, immutable=excluded.immutable, snapshot_hash=excluded.snapshot_hash, source_count=excluded.source_count, line_count=excluded.line_count, data_json=excluded.data_json, sealed_at=excluded.sealed_at`).run(snapshot.id, snapshot.companyId, String(snapshot.fiscalYear), snapshot.status || 'SEALED', flag(snapshot.immutable !== false), snapshot.snapshotHash || '', Number(snapshot.sourceCount || snapshot.sourceEntryIds?.length || 0), Number(snapshot.lineCount || 0), json(snapshot), snapshot.sealedAt || snapshot.generatedAt || now());
        if (enqueue) enqueueInternal({ companyId: snapshot.companyId, entityType: 'FINANCIAL_SNAPSHOT', entityId: snapshot.id, payload: snapshot });
      });
    },
    saveFecArchive(archive, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare(`INSERT INTO fec_archives (id, company_id, fiscal_year, package_file, package_sha256, mode, regime, data_json, sealed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING`).run(archive.id, archive.companyId, String(archive.exercise || archive.fiscalYear), archive.packageFile, archive.packageSha256, archive.mode, archive.regime, json(archive), archive.sealedAt || now());
        if (enqueue) enqueueInternal({ companyId: archive.companyId, entityType: 'FEC_ARCHIVE', entityId: archive.id, payload: archive });
      });
    },
    saveAuditEvent(event, { enqueue = true } = {}) {
      return transaction(() => {
        db.prepare('INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json) VALUES (?, ?, ?, ?, ?, ?)').run(event.id, event.companyId || null, event.userId || null, event.action || event.type || 'UNKNOWN', event.at || event.occurredAt || now(), json(event));
        if (enqueue) enqueueInternal({ companyId: event.companyId || null, entityType: 'AUDIT_EVENT', entityId: event.id, payload: event });
      });
    },
    listUsers() { return db.prepare('SELECT * FROM users ORDER BY name').all(); },
    listCompanies() { return db.prepare('SELECT * FROM companies ORDER BY name').all(); },
    listMemberships(companyId = null) { return companyId ? db.prepare('SELECT * FROM memberships WHERE company_id = ? ORDER BY user_id').all(companyId) : db.prepare('SELECT * FROM memberships ORDER BY company_id, user_id').all(); },
    listFiscalYears(companyId) { return db.prepare('SELECT * FROM fiscal_years WHERE company_id = ? ORDER BY year DESC').all(companyId); },
    getSnapshot(companyId, fiscalYear) { return db.prepare('SELECT * FROM financial_snapshots WHERE company_id = ? AND fiscal_year = ?').get(companyId, String(fiscalYear)) || null; },
    backupTo(backupFile, metadata = {}) {
      if (filename === ':memory:') throw new Error('Une base SQLite en mémoire ne peut pas être sauvegardée sur disque.');
      const target = resolve(backupFile);
      ensureParent(target);
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
      const bytes = readFileSync(target);
      const manifest = { id: `backup-${Date.now()}`, backupFile: target, databaseHash: hash(bytes), schemaVersion: this.schemaVersion(), sizeBytes: bytes.length, createdAt: now(), ...metadata };
      db.prepare('INSERT INTO backup_manifests (id, backup_file, database_hash, schema_version, size_bytes, created_at, data_json) VALUES (?, ?, ?, ?, ?, ?, ?)').run(manifest.id, manifest.backupFile, manifest.databaseHash, manifest.schemaVersion, manifest.sizeBytes, manifest.createdAt, json(manifest));
      return manifest;
    },
    verifyBackup(manifest) {
      const bytes = readFileSync(resolve(manifest.backupFile));
      return { valid: hash(bytes) === manifest.databaseHash && bytes.length === Number(manifest.sizeBytes), hash: hash(bytes), sizeBytes: bytes.length };
    },
    close() { db.close(); }
  };
  return store;
}

export function restoreSqliteBackup({ backupFile, targetFile, expectedHash = null } = {}) {
  const source = resolve(backupFile);
  const target = resolve(targetFile);
  const bytes = readFileSync(source);
  const databaseHash = hash(bytes);
  if (expectedHash && databaseHash !== expectedHash) throw new Error('L’empreinte de la sauvegarde ne correspond pas au manifeste.');
  ensureParent(target);
  const temporary = `${target}.restore-${process.pid}-${Date.now()}`;
  copyFileSync(source, temporary);
  try {
    renameSync(temporary, target);
  } catch (error) {
    try { rmSync(temporary, { force: true }); } catch { /* Le fichier temporaire sera nettoyé au prochain lancement. */ }
    throw error;
  }
  return { targetFile: target, databaseHash, sizeBytes: bytes.length };
}
