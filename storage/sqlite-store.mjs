import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = resolve(ROOT, 'schema.sql');
const SCHEMA_TEXT = readFileSync(SCHEMA, 'utf8');

const json = (value) => JSON.stringify(value ?? {});
const flag = (value) => value ? 1 : 0;
const now = () => new Date().toISOString();

function ensureParent(filename) {
  if (filename === ':memory:') return;
  mkdirSync(dirname(resolve(filename)), { recursive: true });
}

export function createSqliteWorkspaceStore({ filename = ':memory:' } = {}) {
  ensureParent(filename);
  const db = new DatabaseSync(filename);
  db.exec(SCHEMA_TEXT);

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

  const store = {
    db,
    transaction,
    saveWorkspace(workspace) {
      db.prepare('INSERT INTO workspace (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name').run(workspace.id, workspace.name, workspace.createdAt || now());
    },
    saveUser(user) {
      db.prepare(`INSERT INTO users (id, name, email, active, password_hash, password_salt, last_login_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, active=excluded.active, password_hash=excluded.password_hash, password_salt=excluded.password_salt, last_login_at=excluded.last_login_at`).run(user.id, user.name, user.email, flag(user.active !== false), user.passwordHash || null, user.passwordSalt || null, user.lastLoginAt || null, user.createdAt || now());
    },
    saveCompany(company) {
      db.prepare(`INSERT INTO companies (id, name, short_name, legal_form, address, ifu, activity, country, currency, archived, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, short_name=excluded.short_name, legal_form=excluded.legal_form, address=excluded.address, ifu=excluded.ifu, activity=excluded.activity, country=excluded.country, currency=excluded.currency, archived=excluded.archived`).run(company.id, company.name, company.shortName || company.short_name || null, company.legalForm || company.legal_form || null, company.address || null, company.ifu || null, company.activity || null, company.country || 'BJ', company.currency || 'XOF', flag(company.archived), company.createdAt || now());
    },
    saveMembership(membership) {
      db.prepare(`INSERT INTO memberships (id, user_id, company_id, module_id, role, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, company_id, module_id) DO UPDATE SET role=excluded.role, active=excluded.active`).run(membership.id, membership.userId, membership.companyId, membership.moduleId, membership.role, flag(membership.active !== false), membership.createdAt || now());
    },
    saveDossier(dossier) {
      db.prepare(`INSERT INTO dossiers (id, company_id, code, module_id, exercise_year, exercise_start, exercise_end, status, archived, data_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET code=excluded.code, status=excluded.status, archived=excluded.archived, data_json=excluded.data_json`).run(dossier.id, dossier.companyId, dossier.dossier || dossier.code, dossier.moduleId || null, dossier.exerciseYear || null, dossier.exerciseStart || null, dossier.exerciseEnd || null, dossier.status || 'Disponible', flag(dossier.archived || dossier.status === 'Archivé'), json(dossier), dossier.createdAt || now());
    },
    saveFiscalYear(year, companyId) {
      db.prepare(`INSERT INTO fiscal_years (id, company_id, year, label, status, snapshot_id, opened_at, finalized_at, data_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(company_id, year) DO UPDATE SET label=excluded.label, status=excluded.status, snapshot_id=excluded.snapshot_id, opened_at=excluded.opened_at, finalized_at=excluded.finalized_at, data_json=excluded.data_json`).run(year.id || `${companyId}-${year.year}`, companyId, String(year.year || year.id), year.label || `Exercice ${year.year || year.id}`, year.status || 'OPEN', year.snapshotId || null, year.openedAt || null, year.finalizedAt || null, json(year));
    },
    savePeriod(period, companyId, fiscalYear) {
      db.prepare(`INSERT INTO periods (id, company_id, fiscal_year, period_code, start_date, end_date, status, data_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(company_id, fiscal_year, period_code) DO UPDATE SET start_date=excluded.start_date, end_date=excluded.end_date, status=excluded.status, data_json=excluded.data_json`).run(period.id, companyId, String(fiscalYear), period.id, period.start, period.end, period.status || 'OPEN', json(period));
    },
    insertJournalEntry(entry, fiscalYear = null) {
      return transaction(() => {
        db.prepare(`INSERT INTO journal_entries (id, company_id, fiscal_year, journal_id, entry_date, piece_date, reference, label, status, integration_category, validated_at, data_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(entry.id, entry.companyId, fiscalYear || entry.fiscalYear || null, entry.journalId, entry.date, entry.pieceDate || entry.date, entry.reference || null, entry.label || '', entry.status || 'DRAFT', entry.integrationCategory || null, entry.validatedAt || null, json(entry), entry.createdAt || now());
        const statement = db.prepare(`INSERT INTO journal_entry_lines (entry_id, line_number, account_id, label, debit, credit, data_json) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        (entry.lines || []).forEach((line, index) => statement.run(entry.id, index + 1, line.accountId, line.label || '', Number(line.debit || 0), Number(line.credit || 0), json(line)));
        return entry.id;
      });
    },
    saveSnapshot(snapshot) {
      db.prepare(`INSERT INTO financial_snapshots (id, company_id, fiscal_year, status, immutable, snapshot_hash, source_count, line_count, data_json, sealed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(company_id, fiscal_year) DO UPDATE SET status=excluded.status, immutable=excluded.immutable, snapshot_hash=excluded.snapshot_hash, source_count=excluded.source_count, line_count=excluded.line_count, data_json=excluded.data_json, sealed_at=excluded.sealed_at`).run(snapshot.id, snapshot.companyId, String(snapshot.fiscalYear), snapshot.status || 'SEALED', flag(snapshot.immutable !== false), snapshot.snapshotHash || '', Number(snapshot.sourceCount || snapshot.sourceEntryIds?.length || 0), Number(snapshot.lineCount || 0), json(snapshot), snapshot.sealedAt || snapshot.generatedAt || now());
    },
    saveFecArchive(archive) {
      db.prepare(`INSERT INTO fec_archives (id, company_id, fiscal_year, package_file, package_sha256, mode, regime, data_json, sealed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING`).run(archive.id, archive.companyId, String(archive.exercise || archive.fiscalYear), archive.packageFile, archive.packageSha256, archive.mode, archive.regime, json(archive), archive.sealedAt || now());
    },
    saveAuditEvent(event) {
      db.prepare('INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json) VALUES (?, ?, ?, ?, ?, ?)').run(event.id, event.companyId || null, event.userId || null, event.action || event.type || 'UNKNOWN', event.at || event.occurredAt || now(), json(event));
    },
    listUsers() { return db.prepare('SELECT * FROM users ORDER BY name').all(); },
    listCompanies() { return db.prepare('SELECT * FROM companies ORDER BY name').all(); },
    listMemberships(companyId = null) { return companyId ? db.prepare('SELECT * FROM memberships WHERE company_id = ? ORDER BY user_id').all(companyId) : db.prepare('SELECT * FROM memberships ORDER BY company_id, user_id').all(); },
    listFiscalYears(companyId) { return db.prepare('SELECT * FROM fiscal_years WHERE company_id = ? ORDER BY year DESC').all(companyId); },
    getSnapshot(companyId, fiscalYear) { return db.prepare('SELECT * FROM financial_snapshots WHERE company_id = ? AND fiscal_year = ?').get(companyId, String(fiscalYear)) || null; },
    close() { db.close(); }
  };
  return store;
}
