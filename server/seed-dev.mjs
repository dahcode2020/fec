import { pbkdf2, randomBytes, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { createPostgresWorkspaceStore } from '../storage/postgres-store.mjs';

if (process.env.NODE_ENV === 'production') throw new Error('Le compte de démonstration est interdit en production.');

const hashPassword = promisify(pbkdf2);
const store = createPostgresWorkspaceStore();
const DEMO = {
  userId: 'user-emrys-dev-demo',
  email: 'demo@emrys.local',
  password: 'EmrysTest2026',
  workspaceId: 'workspace-emrys-dev-demo',
  companyId: 'company-emrys-dev-demo',
  dossierId: 'dossier-emrys-dev-demo-2026',
  fiscalYear: '2026'
};
const limits = { companies: 1, users: 1, csrEntries: 100, invoices: 20, thirdParties: 20, gpEmployees: 10, gcsfItems: 20, gcDocuments: 50, days: 30 };
const now = () => new Date().toISOString();
const json = (value) => JSON.stringify(value ?? {});

async function passwordRecord(password) {
  const salt = randomBytes(16);
  const hash = await hashPassword(password, salt, 120000, 32, 'sha256');
  return { salt: salt.toString('base64'), hash: hash.toString('base64') };
}

function monthlyPeriods(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const lastDay = new Date(Date.UTC(Number(year), index + 1, 0)).getUTCDate();
    return { id: month, start: `${year}-${month}-01`, end: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
  });
}

async function seed() {
  await store.migrate();
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  const record = await passwordRecord(DEMO.password);
  let userId = DEMO.userId;

  await store.transaction(async (tx) => {
    const existing = await tx.query('SELECT id FROM users WHERE email=$1 FOR UPDATE', [DEMO.email]);
    userId = existing.rows[0]?.id || DEMO.userId;
    await tx.query(
      `INSERT INTO users (id, name, email, active, password_hash, password_salt, email_verified_at, created_at)
       VALUES ($1,$2,$3,1,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, active=1,
         password_hash=EXCLUDED.password_hash, password_salt=EXCLUDED.password_salt,
         email_verified_at=EXCLUDED.email_verified_at`,
      [userId, 'Démonstration EMRYS', DEMO.email, record.hash, record.salt, createdAt, createdAt]
    );
    await tx.query('INSERT INTO workspace (id, name, created_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name', [DEMO.workspaceId, 'Espace de démonstration EMRYS', createdAt]);
    await tx.query(
      `INSERT INTO companies (id, workspace_id, name, short_name, legal_form, country, currency, archived, created_at)
       VALUES ($1,$2,$3,'EMRYS','À configurer','BJ','XOF',0,$4)
       ON CONFLICT (id) DO UPDATE SET workspace_id=EXCLUDED.workspace_id, name=EXCLUDED.name`,
      [DEMO.companyId, DEMO.workspaceId, 'EMRYS Démonstration', createdAt]
    );
    await tx.query(
      `INSERT INTO memberships (id, user_id, company_id, module_id, role, active, created_at)
       VALUES ($1,$2,$3,'CSR','ADMIN',1,$4)
       ON CONFLICT (user_id, company_id, module_id) DO UPDATE SET role='ADMIN', active=1`,
      [`membership-${DEMO.userId}`, userId, DEMO.companyId, createdAt]
    );
    await tx.query(
      `INSERT INTO dossiers (id, company_id, code, module_id, exercise_year, exercise_start, exercise_end, status, archived, data_json, created_at)
       VALUES ($1,$2,'EMRYS-26','CSR','2026','2026-01-01','2026-12-31','Actif',0,$3,$4)
       ON CONFLICT (id) DO UPDATE SET status='Actif', archived=0, data_json=EXCLUDED.data_json`,
      [DEMO.dossierId, DEMO.companyId, json({ seeded: true }), createdAt]
    );
    await tx.query(
      `INSERT INTO fiscal_years (id, company_id, year, label, status, data_json)
       VALUES ($1,$2,'2026','Exercice 2026','OPEN',$3)
       ON CONFLICT (company_id, year) DO UPDATE SET status='OPEN', data_json=EXCLUDED.data_json`,
      [`fy-${DEMO.companyId}-2026`, DEMO.companyId, json({ seeded: true })]
    );
    for (const period of monthlyPeriods(DEMO.fiscalYear)) {
      await tx.query(
        `INSERT INTO periods (id, company_id, fiscal_year, period_code, start_date, end_date, status, data_json)
         VALUES ($1,$2,'2026',$3,$4,$5,'OPEN',$6)
         ON CONFLICT (company_id, fiscal_year, period_code) DO UPDATE SET status='OPEN', data_json=EXCLUDED.data_json`,
        [`${DEMO.companyId}-${period.id}`, DEMO.companyId, period.id, period.start, period.end, json(period)]
      );
    }
    await tx.query(
      `INSERT INTO trials (id, user_id, workspace_id, plan_code, started_at, expires_at, status, limits_json, created_at)
       VALUES ($1,$2,$3,'CSR · Démonstration',$4,$5,'ACTIVE',$6,$4)
       ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, expires_at=EXCLUDED.expires_at, status='ACTIVE', limits_json=EXCLUDED.limits_json`,
      [`trial-${DEMO.userId}`, userId, DEMO.workspaceId, createdAt, expiresAt, json(limits)]
    );
    await tx.query(
      `INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json)
       VALUES ($1,$2,$3,'DEV_DEMO_SEEDED',$4,$5) ON CONFLICT (id) DO NOTHING`,
      [`audit-${randomUUID()}`, DEMO.companyId, userId, createdAt, json({ source: 'seed-dev' })]
    );
  });
  console.log(`Compte de démonstration créé dans la base PostgreSQL active.`);
  console.log(`E-mail : ${DEMO.email}`);
  console.log(`Mot de passe : ${DEMO.password}`);
  console.log(`Société : ${DEMO.companyId}`);
}

seed().catch((error) => { console.error('seed_dev_failed', error); process.exitCode = 1; }).finally(async () => { await store.close(); });
