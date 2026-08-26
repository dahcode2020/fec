import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, pbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createSqliteWorkspaceStore } from '../storage/sqlite-store.mjs';
import { createMonthlyPeriods, createUser, makeDossierCode } from '../prototype/core.js';

const ROOT = resolve(fileURLToPath(new URL('../prototype/site/', import.meta.url)));
const APP_ROOT = resolve(fileURLToPath(new URL('../prototype/', import.meta.url)));
const PORT = Number(process.env.PORT || 4174);
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = process.env.EMRYS_DB_PATH || '/tmp/emrys-dev.sqlite';
const hashPassword = promisify(pbkdf2);
const sessions = new Map();
const store = createSqliteWorkspaceStore({ filename: DB_FILE });
const allowedProviders = new Set(['FEDAPAY', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD']);

const jsonResponse = (response, status, payload, headers = {}) => {
  const body = JSON.stringify(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(body);
};

const readJson = (request) => new Promise((resolveBody, reject) => {
  let body = '';
  request.on('data', (chunk) => { body += chunk; if (body.length > 1000000) reject(new Error('Requête trop volumineuse.')); });
  request.on('end', () => { try { resolveBody(JSON.parse(body || '{}')); } catch { reject(new Error('JSON invalide.')); } });
  request.on('error', reject);
});

const passwordRecord = async (password, salt = randomBytes(16)) => ({ salt: salt.toString('base64'), hash: (await hashPassword(password, salt, 120000, 32, 'sha256')).toString('base64') });
const passwordMatches = async (password, user) => {
  if (!user.password_hash || !user.password_salt) return false;
  const actual = await hashPassword(password, Buffer.from(user.password_salt, 'base64'), 120000, 32, 'sha256');
  const expected = Buffer.from(user.password_hash, 'base64');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

function trialLimits() {
  return { companies: 1, users: 1, csrEntries: 100, invoices: 20, thirdParties: 20, gpEmployees: 10, gcsfItems: 20, gcDocuments: 50, days: 30 };
}

function sessionFromRequest(request) {
  const cookie = String(request.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('emrys_session='));
  const token = cookie?.slice('emrys_session='.length);
  const session = token ? sessions.get(token) : null;
  if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; }
  return { token, ...session };
}

function publicUser(user) {
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

function trialForUser(userId) {
  const trial = store.db.prepare('SELECT * FROM trials WHERE user_id=? ORDER BY expires_at DESC LIMIT 1').get(userId);
  if (!trial) return null;
  const expired = trial.status === 'ACTIVE' && new Date(trial.expires_at).getTime() <= Date.now();
  if (expired) {
    store.db.prepare("UPDATE trials SET status='EXPIRED' WHERE id=?").run(trial.id);
    trial.status = 'EXPIRED';
  }
  return { id: trial.id, startsAt: trial.started_at, expiresAt: trial.expires_at, status: trial.status, limits: JSON.parse(trial.limits_json || '{}') };
}

function sessionUser(request) {
  const session = sessionFromRequest(request);
  if (!session) return null;
  const user = store.db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(session.userId);
  return user ? { session, user } : null;
}

function userContext(userId) {
  const companies = store.db.prepare(`SELECT c.* FROM companies c INNER JOIN memberships m ON m.company_id=c.id WHERE m.user_id=? AND m.active=1 GROUP BY c.id ORDER BY c.name`).all(userId).map((company) => ({ id: company.id, name: company.name, shortName: company.short_name || 'EM', legalForm: company.legal_form || 'À configurer', type: company.legal_form || 'À configurer', address: company.address || '', activity: company.activity || '', code: company.short_name || 'EMRYS', exerciseStart: `${new Date().getUTCFullYear()}-01-01`, exerciseEnd: `${new Date().getUTCFullYear()}-12-31`, meta: `${company.legal_form || 'À configurer'} · ${company.currency || 'XOF'}`, ifu: company.ifu || '', color: 'teal', currency: company.currency || 'XOF' }));
  const memberships = store.db.prepare('SELECT id, user_id AS userId, company_id AS companyId, module_id AS moduleId, role, active, created_at AS createdAt FROM memberships WHERE user_id=? AND active=1').all(userId);
  const dossiers = store.db.prepare('SELECT id, company_id AS companyId, code AS dossier, module_id AS moduleId, exercise_year AS exerciseYear, exercise_start AS exerciseStart, exercise_end AS exerciseEnd, status FROM dossiers WHERE company_id IN (SELECT company_id FROM memberships WHERE user_id=? AND active=1)').all(userId);
  const fiscalYears = store.db.prepare('SELECT company_id AS companyId, year AS id, label, status, snapshot_id AS snapshotId, opened_at AS openedAt, finalized_at AS finalizedAt FROM fiscal_years WHERE company_id IN (SELECT company_id FROM memberships WHERE user_id=? AND active=1)').all(userId);
  return { companies, memberships, dossiers, fiscalYears };
}

async function api(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/health') return jsonResponse(response, 200, { ok: true, service: 'emrys-dev-api', database: DB_FILE, schemaVersion: store.schemaVersion() });
  if (request.method === 'GET' && pathname === '/api/me') {
    const current = sessionUser(request);
    if (!current) return jsonResponse(response, 401, { code: 'AUTH_REQUIRED', message: 'Session absente ou expirée.' });
    return jsonResponse(response, 200, { ok: true, user: publicUser(current.user), trial: trialForUser(current.user.id), context: userContext(current.user.id) });
  }
  if (request.method === 'GET' && pathname === '/api/trial') {
    const current = sessionUser(request);
    if (!current) return jsonResponse(response, 401, { code: 'AUTH_REQUIRED', message: 'Session absente ou expirée.' });
    return jsonResponse(response, 200, { ok: true, trial: trialForUser(current.user.id) });
  }
  if (request.method === 'POST' && pathname === '/api/logout') {
    const session = sessionFromRequest(request);
    if (session) sessions.delete(session.token);
    return jsonResponse(response, 200, { ok: true }, { 'Set-Cookie': 'emrys_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }
  if (request.method === 'POST' && pathname === '/api/signup') {
    try {
      const input = await readJson(request);
      const name = String(input.name || '').trim();
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return jsonResponse(response, 400, { code: 'INVALID_SIGNUP', message: 'Nom, e-mail valide et mot de passe de huit caractères minimum sont requis.' });
      const existing = store.db.prepare('SELECT id FROM users WHERE email=?').get(email);
      if (existing) return jsonResponse(response, 409, { code: 'EMAIL_EXISTS', message: 'Cette adresse e-mail est déjà utilisée.' });
      const userId = `user-${randomUUID()}`;
      const workspaceId = `workspace-${randomUUID()}`;
      const companyId = `company-${randomUUID()}`;
      const companyName = String(input.companyName || '').trim() || `${name} — Entreprise`;
      const exerciseYear = String(new Date().getUTCFullYear());
      const dossierId = `dossier-${randomUUID()}`;
      const dossierCode = makeDossierCode('EMRYS', `${exerciseYear}-01-01`);
      const record = await passwordRecord(password);
      const user = createUser({ id: userId, name, email, passwordHash: record.hash, passwordSalt: record.salt });
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + 30 * 86400000);
      const trial = { id: `trial-${randomUUID()}`, userId, workspaceId, planCode: input.plan || null, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), status: 'ACTIVE', limits: trialLimits(), createdAt: startedAt.toISOString() };
      const audit = { id: `audit-${randomUUID()}`, userId, action: 'TRIAL_CREATED', at: startedAt.toISOString(), data: { workspaceId, plan: input.plan || null } };
      store.transaction(() => {
        store.db.prepare(`INSERT INTO users (id, name, email, active, password_hash, password_salt, last_login_at, created_at) VALUES (?, ?, ?, 1, ?, ?, NULL, ?)`).run(user.id, user.name, user.email, user.passwordHash, user.passwordSalt, user.createdAt);
        store.db.prepare('INSERT INTO workspace (id, name, created_at) VALUES (?, ?, ?)').run(workspaceId, `${name} — EMRYS`, startedAt.toISOString());
        store.db.prepare('INSERT INTO companies (id, name, short_name, legal_form, address, ifu, activity, country, currency, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)').run(companyId, companyName, 'EMRYS', 'À configurer', null, null, null, 'BJ', 'XOF', startedAt.toISOString());
        store.db.prepare('INSERT INTO memberships (id, user_id, company_id, module_id, role, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').run(`membership-${randomUUID()}`, userId, companyId, 'CSR', 'ADMIN', startedAt.toISOString());
        store.db.prepare('INSERT INTO dossiers (id, company_id, code, module_id, exercise_year, exercise_start, exercise_end, status, archived, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)').run(dossierId, companyId, dossierCode, 'CSR', exerciseYear, `${exerciseYear}-01-01`, `${exerciseYear}-12-31`, 'Actif', JSON.stringify({ trial: true }), startedAt.toISOString());
        store.db.prepare('INSERT INTO fiscal_years (id, company_id, year, label, status, data_json) VALUES (?, ?, ?, ?, ?, ?)').run(`fy-${companyId}-${exerciseYear}`, companyId, exerciseYear, `Exercice ${exerciseYear}`, 'OPEN', JSON.stringify({ trial: true }));
        createMonthlyPeriods(Number(exerciseYear)).forEach((period) => store.db.prepare('INSERT INTO periods (id, company_id, fiscal_year, period_code, start_date, end_date, status, data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(`${companyId}-${period.id}`, companyId, exerciseYear, period.id, period.start, period.end, 'OPEN', JSON.stringify(period)));
        store.db.prepare('INSERT INTO trials (id, user_id, workspace_id, plan_code, started_at, expires_at, status, limits_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(trial.id, trial.userId, trial.workspaceId, trial.planCode, trial.startedAt, trial.expiresAt, trial.status, JSON.stringify(trial.limits), trial.createdAt);
        store.db.prepare('INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json) VALUES (?, NULL, ?, ?, ?, ?)').run(audit.id, audit.userId, audit.action, audit.at, JSON.stringify(audit));
      });
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 8 * 3600000 });
      return jsonResponse(response, 201, { ok: true, user: publicUser(user), trial: { startsAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), status: 'ACTIVE', limits: trialLimits() }, context: userContext(user.id), session: { expiresIn: 8 * 3600 } }, { 'Set-Cookie': `emrys_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${8 * 3600}` });
    } catch (error) { return jsonResponse(response, 500, { code: 'SIGNUP_FAILED', message: error.message }); }
  }
  if (request.method === 'POST' && pathname === '/api/login') {
    try {
      const input = await readJson(request);
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      const user = store.db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(email);
      if (!user || !(await passwordMatches(password, user))) return jsonResponse(response, 401, { code: 'INVALID_CREDENTIALS', message: 'Adresse e-mail ou mot de passe incorrect.' });
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 8 * 3600000 });
      store.db.prepare('UPDATE users SET last_login_at=? WHERE id=?').run(new Date().toISOString(), user.id);
      return jsonResponse(response, 200, { ok: true, user: publicUser(user), trial: trialForUser(user.id), context: userContext(user.id), session: { expiresIn: 8 * 3600 } }, { 'Set-Cookie': `emrys_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${8 * 3600}` });
    } catch (error) { return jsonResponse(response, 500, { code: 'LOGIN_FAILED', message: error.message }); }
  }
  if (request.method === 'GET' && pathname === '/api/auth/google/start') {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) return jsonResponse(response, 503, { code: 'GOOGLE_NOT_CONFIGURED', message: 'L’authentification Google sera activée après configuration du client OAuth côté serveur.' });
    const state = randomBytes(24).toString('base64url');
    sessions.set(`oauth:${state}`, { type: 'GOOGLE_OAUTH', expiresAt: Date.now() + 10 * 60000 });
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: process.env.GOOGLE_REDIRECT_URI, response_type: 'code', scope: 'openid email profile', state, access_type: 'offline', prompt: 'select_account' });
    response.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    return response.end();
  }
  if (request.method === 'POST' && pathname === '/api/payment/checkout') {
    try {
      const input = await readJson(request);
      const provider = String(input.provider || '').toUpperCase();
      if (!allowedProviders.has(provider) || !input.planCode || !Number.isFinite(Number(input.amountXof)) || Number(input.amountXof) <= 0) return jsonResponse(response, 400, { code: 'INVALID_PAYMENT_ORDER', message: 'Fournisseur, offre et montant sont obligatoires.' });
      if (provider === 'FEDAPAY' && !process.env.FEDAPAY_SECRET_KEY) return jsonResponse(response, 503, { code: 'FEDAPAY_NOT_CONFIGURED', message: 'FedaPay n’est pas encore configuré côté serveur.' });
      return jsonResponse(response, 501, { code: 'PAYMENT_ADAPTER_PENDING', message: `Le connecteur ${provider} sera activé après configuration du compte marchand.` });
    } catch (error) { return jsonResponse(response, 400, { code: 'PAYMENT_REQUEST_INVALID', message: error.message }); }
  }
  return jsonResponse(response, 404, { code: 'NOT_FOUND', message: 'Ressource inconnue.' });
}

function staticFile(pathname, response) {
  if (pathname === '/app') {
    response.writeHead(302, { Location: '/app/' });
    return response.end();
  }
  const isApp = pathname.startsWith('/app/');
  const base = isApp ? APP_ROOT : ROOT;
  const relativePath = isApp ? (pathname.slice('/app/'.length) || 'index.html') : (pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
  const file = resolve(join(base, normalize(relativePath)));
  if (!file.startsWith(`${base}/`) && file !== base || !existsSync(file)) return jsonResponse(response, 404, { code: 'NOT_FOUND', message: 'Page inconnue.' });
  const type = ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8' })[extname(file)] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type, 'Cache-Control': pathname === '/' || isApp ? 'no-store' : 'public, max-age=300' });
  response.end(readFileSync(file));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return api(request, response, url.pathname);
  if (request.method !== 'GET' && request.method !== 'HEAD') return jsonResponse(response, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' });
  return staticFile(url.pathname, response);
});

server.listen(PORT, HOST, () => console.log(`EMRYS site + API de développement sur http://${HOST}:${PORT} · SQLite ${DB_FILE}`));
process.on('SIGTERM', () => { store.close(); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { store.close(); server.close(() => process.exit(0)); });
