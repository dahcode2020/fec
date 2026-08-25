PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspace (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  password_hash TEXT,
  password_salt TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  legal_form TEXT,
  address TEXT,
  ifu TEXT,
  activity TEXT,
  country TEXT NOT NULL DEFAULT 'BJ',
  currency TEXT NOT NULL DEFAULT 'XOF',
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, company_id, module_id)
);

CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  module_id TEXT,
  exercise_year TEXT,
  exercise_start TEXT,
  exercise_end TEXT,
  status TEXT NOT NULL DEFAULT 'Disponible',
  archived INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(company_id, code, module_id, exercise_year)
);

CREATE TABLE IF NOT EXISTS fiscal_years (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  snapshot_id TEXT,
  opened_at TEXT,
  finalized_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(company_id, year)
);

CREATE TABLE IF NOT EXISTS periods (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL,
  period_code TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(company_id, fiscal_year, period_code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year TEXT,
  journal_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  piece_date TEXT,
  reference TEXT,
  label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  integration_category TEXT,
  validated_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(entry_id, line_number)
);

CREATE TABLE IF NOT EXISTS financial_snapshots (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL,
  status TEXT NOT NULL,
  immutable INTEGER NOT NULL DEFAULT 1,
  snapshot_hash TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  line_count INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL,
  sealed_at TEXT NOT NULL,
  UNIQUE(company_id, fiscal_year)
);

CREATE TABLE IF NOT EXISTS fec_archives (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL,
  package_file TEXT NOT NULL,
  package_sha256 TEXT NOT NULL,
  mode TEXT NOT NULL,
  regime TEXT NOT NULL,
  data_json TEXT NOT NULL,
  sealed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_memberships_company ON memberships(company_id, module_id, active);
CREATE INDEX IF NOT EXISTS idx_dossiers_company_year ON dossiers(company_id, exercise_year, module_id);
CREATE INDEX IF NOT EXISTS idx_periods_company_year ON periods(company_id, fiscal_year, period_code);
CREATE INDEX IF NOT EXISTS idx_entries_company_date ON journal_entries(company_id, entry_date, status);
CREATE INDEX IF NOT EXISTS idx_entry_lines_entry ON journal_entry_lines(entry_id, line_number);
CREATE INDEX IF NOT EXISTS idx_audit_company_date ON audit_events(company_id, occurred_at);
