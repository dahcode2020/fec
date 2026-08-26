import { createServer } from 'node:http';
import { createHash, randomBytes, randomUUID, pbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createPostgresWorkspaceStore } from '../storage/postgres-store.mjs';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const publicUrl = String(process.env.EMRYS_PUBLIC_URL || 'http://localhost:4174').replace(/\/$/, '');
const hashPassword = promisify(pbkdf2);
const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');
const store = createPostgresWorkspaceStore();
const allowedProviders = new Set(['FEDAPAY', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD']);
const allowedOrigins = new Set(String(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean));
const SESSION_SECONDS = 8 * 3600;

const now = () => new Date().toISOString();
const json = (value) => JSON.stringify(value ?? {});

function corsHeaders(request) {
  const origin = String(request.headers.origin || '');
  if (!origin || !allowedOrigins.has(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' };
}

function jsonResponse(request, response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(request), ...headers });
  response.end(JSON.stringify(payload));
}

function htmlResponse(request, response, status, body) {
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(request) });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) tooLarge = true;
    });
    request.on('end', () => {
      if (tooLarge) return reject(new Error('Requête trop volumineuse.'));
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('JSON invalide.')); }
    });
    request.on('error', reject);
  });
}

const passwordRecord = async (password, salt = randomBytes(16)) => ({
  salt: salt.toString('base64'),
  hash: (await hashPassword(password, salt, 120000, 32, 'sha256')).toString('base64')
});

async function passwordMatches(password, user) {
  if (!user.password_hash || !user.password_salt) return false;
  const actual = await hashPassword(password, Buffer.from(user.password_salt, 'base64'), 120000, 32, 'sha256');
  const expected = Buffer.from(user.password_hash, 'base64');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function trialLimits() {
  return { companies: 1, users: 1, csrEntries: 100, invoices: 20, thirdParties: 20, gpEmployees: 10, gcsfItems: 20, gcDocuments: 50, days: 30 };
}

function monthlyPeriods(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const lastDay = new Date(Date.UTC(Number(year), index + 1, 0)).getUTCDate();
    return {
      id: month,
      periodCode: month,
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    };
  });
}

function dossierCode(year) {
  return `EMRYS-${String(year).slice(-2)}`;
}

function publicUser(user) {
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

function cookieToken(request) {
  const cookie = String(request.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('emrys_session='));
  return cookie?.slice('emrys_session='.length) || null;
}

async function sessionFromRequest(request) {
  const token = cookieToken(request);
  if (!token) return null;
  const result = await store.query(
    `SELECT id, user_id AS "userId", expires_at AS "expiresAt"
       FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL`,
    [hashToken(token)]
  );
  const session = result.rows[0];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await store.query('UPDATE sessions SET revoked_at=$1 WHERE id=$2', [now(), session.id]);
    return null;
  }
  await store.query('UPDATE sessions SET last_seen_at=$1 WHERE id=$2', [now(), session.id]);
  return { token, ...session };
}

async function sessionUser(request) {
  const session = await sessionFromRequest(request);
  if (!session) return null;
  const result = await store.query('SELECT * FROM users WHERE id=$1 AND active=1', [session.userId]);
  return result.rows[0] ? { session, user: result.rows[0] } : null;
}

async function trialForUser(userId) {
  const result = await store.query('SELECT * FROM trials WHERE user_id=$1 ORDER BY expires_at DESC LIMIT 1', [userId]);
  const trial = result.rows[0];
  if (!trial) return null;
  if (trial.status === 'ACTIVE' && new Date(trial.expires_at).getTime() <= Date.now()) {
    await store.query("UPDATE trials SET status='EXPIRED' WHERE id=$1", [trial.id]);
    trial.status = 'EXPIRED';
  }
  return {
    id: trial.id,
    startsAt: trial.started_at,
    expiresAt: trial.expires_at,
    status: trial.status,
    limits: JSON.parse(trial.limits_json || '{}')
  };
}

async function userContext(userId) {
  const [companies, memberships, dossiers, fiscalYears] = await Promise.all([
    store.query(
      `SELECT c.* FROM companies c
       INNER JOIN memberships m ON m.company_id=c.id
       WHERE m.user_id=$1 AND m.active=1
       GROUP BY c.id ORDER BY c.name`,
      [userId]
    ),
    store.query(
      `SELECT id, user_id AS "userId", company_id AS "companyId", module_id AS "moduleId",
              role, active, created_at AS "createdAt"
       FROM memberships WHERE user_id=$1 AND active=1`,
      [userId]
    ),
    store.query(
      `SELECT id, company_id AS "companyId", code AS dossier, module_id AS "moduleId",
              exercise_year AS "exerciseYear", exercise_start AS "exerciseStart",
              exercise_end AS "exerciseEnd", status
       FROM dossiers WHERE company_id IN
         (SELECT company_id FROM memberships WHERE user_id=$1 AND active=1)`,
      [userId]
    ),
    store.query(
      `SELECT company_id AS "companyId", year AS id, label, status,
              snapshot_id AS "snapshotId", opened_at AS "openedAt", finalized_at AS "finalizedAt"
       FROM fiscal_years WHERE company_id IN
         (SELECT company_id FROM memberships WHERE user_id=$1 AND active=1)`,
      [userId]
    )
  ]);
  const currentYear = new Date().getUTCFullYear();
  return {
    companies: companies.rows.map((company) => ({
      id: company.id,
      name: company.name,
      shortName: company.short_name || 'EM',
      legalForm: company.legal_form || 'À configurer',
      type: company.legal_form || 'À configurer',
      address: company.address || '',
      activity: company.activity || '',
      code: company.short_name || 'EMRYS',
      exerciseStart: `${currentYear}-01-01`,
      exerciseEnd: `${currentYear}-12-31`,
      meta: `${company.legal_form || 'À configurer'} · ${company.currency || 'XOF'}`,
      ifu: company.ifu || '',
      color: 'teal',
      currency: company.currency || 'XOF'
    })),
    memberships: memberships.rows,
    dossiers: dossiers.rows,
    fiscalYears: fiscalYears.rows
  };
}

async function createOneTimeToken(tx, table, userId, minutes) {
  const raw = randomBytes(32).toString('base64url');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + minutes * 60000).toISOString();
  const id = `${table}-${randomUUID()}`;
  await tx.query(
    `INSERT INTO ${table} (id, user_id, token_hash, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, hashToken(raw), createdAt.toISOString(), expiresAt]
  );
  return { raw, id, expiresAt };
}

function verificationUrl(raw) {
  return `${publicUrl}/api/auth/verify?token=${encodeURIComponent(raw)}`;
}

function resetUrl(raw) {
  return `${publicUrl}/api/password/reset?token=${encodeURIComponent(raw)}`;
}

function exposeDevelopmentToken() {
  return !isProduction && process.env.DEV_EXPOSE_TOKENS === 'true';
}

async function api(request, response, pathname) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { ...corsHeaders(request), 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
    return response.end();
  }

  if (request.method === 'GET' && pathname === '/api/health') {
    try {
      const healthy = await store.health();
      return jsonResponse(request, response, healthy ? 200 : 503, { ok: healthy, service: 'emrys-api', database: 'postgresql', schemaVersion: await store.schemaVersion() });
    } catch (error) {
      return jsonResponse(request, response, 503, { ok: false, service: 'emrys-api', code: 'DATABASE_UNAVAILABLE', message: error.message });
    }
  }

  if (request.method === 'GET' && pathname === '/api/ready') {
    try {
      await store.migrate();
      return jsonResponse(request, response, 200, { ok: true, ready: true, schemaVersion: await store.schemaVersion() });
    } catch (error) {
      return jsonResponse(request, response, 503, { ok: false, ready: false, code: 'API_NOT_READY', message: error.message });
    }
  }

  if (request.method === 'GET' && pathname === '/api/me') {
    const current = await sessionUser(request);
    if (!current) return jsonResponse(request, response, 401, { code: 'AUTH_REQUIRED', message: 'Session absente ou expirée.' });
    return jsonResponse(request, response, 200, { ok: true, user: publicUser(current.user), trial: await trialForUser(current.user.id), context: await userContext(current.user.id) });
  }

  if (request.method === 'GET' && pathname === '/api/trial') {
    const current = await sessionUser(request);
    if (!current) return jsonResponse(request, response, 401, { code: 'AUTH_REQUIRED', message: 'Session absente ou expirée.' });
    return jsonResponse(request, response, 200, { ok: true, trial: await trialForUser(current.user.id) });
  }

  if (request.method === 'POST' && pathname === '/api/logout') {
    const session = await sessionFromRequest(request);
    if (session) await store.query('UPDATE sessions SET revoked_at=$1 WHERE id=$2', [now(), session.id]);
    return jsonResponse(request, response, 200, { ok: true }, { 'Set-Cookie': `emrys_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${isProduction ? '; Secure' : ''}` });
  }

  if (request.method === 'POST' && pathname === '/api/signup') {
    try {
      const input = await readJson(request);
      const name = String(input.name || '').trim();
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        return jsonResponse(request, response, 400, { code: 'INVALID_SIGNUP', message: 'Nom, e-mail valide et mot de passe de huit caractères minimum sont requis.' });
      }
      const existing = await store.query('SELECT id FROM users WHERE email=$1', [email]);
      if (existing.rows[0]) return jsonResponse(request, response, 409, { code: 'EMAIL_EXISTS', message: 'Cette adresse e-mail est déjà utilisée.' });

      const userId = `user-${randomUUID()}`;
      const workspaceId = `workspace-${randomUUID()}`;
      const companyId = `company-${randomUUID()}`;
      const companyName = String(input.companyName || '').trim() || `${name} — Entreprise`;
      const exerciseYear = String(new Date().getUTCFullYear());
      const dossierId = `dossier-${randomUUID()}`;
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + 30 * 86400000);
      const record = await passwordRecord(password);
      let verification;

      await store.transaction(async (tx) => {
        await tx.query(
          `INSERT INTO users (id, name, email, active, password_hash, password_salt, email_verified_at, last_login_at, created_at)
           VALUES ($1, $2, $3, 1, $4, $5, NULL, NULL, $6)`,
          [userId, name, email, record.hash, record.salt, startedAt.toISOString()]
        );
        verification = await createOneTimeToken(tx, 'email_verification_tokens', userId, 60);
        await tx.query('INSERT INTO workspace (id, name, created_at) VALUES ($1, $2, $3)', [workspaceId, `${name} — EMRYS`, startedAt.toISOString()]);
        await tx.query(
          `INSERT INTO companies (id, workspace_id, name, short_name, legal_form, address, ifu, activity, country, currency, archived, created_at)
           VALUES ($1, $2, $3, 'EMRYS', 'À configurer', NULL, NULL, NULL, 'BJ', 'XOF', 0, $4)`,
          [companyId, workspaceId, companyName, startedAt.toISOString()]
        );
        await tx.query(
          `INSERT INTO memberships (id, user_id, company_id, module_id, role, active, created_at)
           VALUES ($1, $2, $3, 'CSR', 'ADMIN', 1, $4)`,
          [`membership-${randomUUID()}`, userId, companyId, startedAt.toISOString()]
        );
        await tx.query(
          `INSERT INTO dossiers (id, company_id, code, module_id, exercise_year, exercise_start, exercise_end, status, archived, data_json, created_at)
           VALUES ($1, $2, $3, 'CSR', $4, $5, $6, 'Actif', 0, $7, $8)`,
          [dossierId, companyId, dossierCode(exerciseYear), exerciseYear, `${exerciseYear}-01-01`, `${exerciseYear}-12-31`, json({ trial: true }), startedAt.toISOString()]
        );
        await tx.query(
          `INSERT INTO fiscal_years (id, company_id, year, label, status, data_json)
           VALUES ($1, $2, $3, $4, 'OPEN', $5)`,
          [`fy-${companyId}-${exerciseYear}`, companyId, exerciseYear, `Exercice ${exerciseYear}`, json({ trial: true })]
        );
        for (const period of monthlyPeriods(exerciseYear)) {
          await tx.query(
            `INSERT INTO periods (id, company_id, fiscal_year, period_code, start_date, end_date, status, data_json)
             VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7)`,
            [`${companyId}-${period.id}`, companyId, exerciseYear, period.periodCode, period.start, period.end, json(period)]
          );
        }
        await tx.query(
          `INSERT INTO trials (id, user_id, workspace_id, plan_code, started_at, expires_at, status, limits_json, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8)`,
          [`trial-${randomUUID()}`, userId, workspaceId, String(input.plan || '') || null, startedAt.toISOString(), expiresAt.toISOString(), json(trialLimits()), startedAt.toISOString()]
        );
        await tx.query(
          `INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json)
           VALUES ($1, NULL, $2, 'TRIAL_CREATED', $3, $4)`,
          [`audit-${randomUUID()}`, userId, startedAt.toISOString(), json({ workspaceId, plan: input.plan || null })]
        );
      });

      const payload = {
        ok: true,
        user: { id: userId, name, email },
        trial: { startsAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), status: 'ACTIVE', limits: trialLimits() },
        context: await userContext(userId),
        emailVerified: false,
        verificationRequired: true
      };
      if (exposeDevelopmentToken()) payload.verificationUrl = verificationUrl(verification.raw);
      return jsonResponse(request, response, 201, payload);
    } catch (error) {
      if (error.code === '23505') return jsonResponse(request, response, 409, { code: 'EMAIL_EXISTS', message: 'Cette adresse e-mail est déjà utilisée.' });
      console.error('signup_failed', error);
      return jsonResponse(request, response, 500, { code: 'SIGNUP_FAILED', message: 'L’inscription n’a pas pu être finalisée.' });
    }
  }

  if (request.method === 'GET' && pathname === '/api/auth/verify') {
    const token = new URL(request.url, `http://${request.headers.host || 'localhost'}`).searchParams.get('token') || '';
    const result = await store.query(
      `SELECT id, user_id AS "userId", expires_at AS "expiresAt"
       FROM email_verification_tokens WHERE token_hash=$1 AND used_at IS NULL`,
      [hashToken(token)]
    );
    const row = result.rows[0];
    if (!row || new Date(row.expiresAt).getTime() <= Date.now()) return htmlResponse(request, response, 400, '<h1>Lien invalide ou expiré</h1><p>Demandez un nouveau lien depuis EMRYS.</p>');
    const verifiedAt = now();
    await store.transaction(async (tx) => {
      await tx.query('UPDATE users SET email_verified_at=$1 WHERE id=$2', [verifiedAt, row.userId]);
      await tx.query('UPDATE email_verification_tokens SET used_at=$1 WHERE id=$2', [verifiedAt, row.id]);
      await tx.query(
        `INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json)
         VALUES ($1, NULL, $2, 'EMAIL_VERIFIED', $3, $4)`,
        [`audit-${randomUUID()}`, row.userId, verifiedAt, json({ userId: row.userId })]
      );
    });
    return htmlResponse(request, response, 200, `<h1>Adresse e-mail vérifiée</h1><p>Votre compte EMRYS est activé.</p><p><a href="${publicUrl}/app/">Accéder à EMRYS</a></p>`);
  }

  if (request.method === 'POST' && pathname === '/api/password/reset/request') {
    try {
      const input = await readJson(request);
      const email = String(input.email || '').trim().toLowerCase();
      const result = { ok: true, message: 'Si cette adresse existe, un lien de réinitialisation sera envoyé.' };
      const userResult = await store.query('SELECT id FROM users WHERE email=$1 AND active=1', [email]);
      if (userResult.rows[0]) {
        const token = await store.transaction((tx) => createOneTimeToken(tx, 'password_reset_tokens', userResult.rows[0].id, 30));
        if (exposeDevelopmentToken()) result.resetUrl = resetUrl(token.raw);
      }
      return jsonResponse(request, response, 200, result);
    } catch (error) {
      return jsonResponse(request, response, 400, { code: 'PASSWORD_RESET_REQUEST_INVALID', message: error.message });
    }
  }

  if (request.method === 'GET' && pathname === '/api/password/reset') {
    const token = new URL(request.url, `http://${request.headers.host || 'localhost'}`).searchParams.get('token') || '';
    const safeToken = JSON.stringify(token).replace(/</g, '\\u003c');
    return htmlResponse(request, response, 200, `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Réinitialiser le mot de passe — EMRYS</title><body style="font-family:system-ui;max-width:420px;margin:60px auto;padding:20px"><h1>Réinitialiser votre mot de passe</h1><p>Choisissez un nouveau mot de passe EMRYS.</p><form id="form"><input id="password" type="password" minlength="8" required placeholder="8 caractères minimum" style="display:block;width:100%;padding:10px;margin:15px 0"><button type="submit">Enregistrer</button></form><p id="message"></p><script>const token=${safeToken};document.querySelector('#form').addEventListener('submit',async(e)=>{e.preventDefault();const r=await fetch('/api/password/reset/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password:document.querySelector('#password').value})});const p=await r.json();document.querySelector('#message').textContent=p.message||'Opération terminée.';if(r.ok)document.querySelector('#form').remove()});</script></body></html>`);
  }

  if (request.method === 'POST' && pathname === '/api/password/reset/confirm') {
    try {
      const input = await readJson(request);
      const token = String(input.token || '');
      const password = String(input.password || '');
      if (password.length < 8) return jsonResponse(request, response, 400, { code: 'INVALID_PASSWORD', message: 'Le mot de passe doit contenir au moins huit caractères.' });
      const tokenResult = await store.query(
        `SELECT id, user_id AS "userId", expires_at AS "expiresAt"
         FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL`,
        [hashToken(token)]
      );
      const row = tokenResult.rows[0];
      if (!row || new Date(row.expiresAt).getTime() <= Date.now()) return jsonResponse(request, response, 400, { code: 'INVALID_RESET_TOKEN', message: 'Lien de réinitialisation invalide ou expiré.' });
      const record = await passwordRecord(password);
      const updatedAt = now();
      await store.transaction(async (tx) => {
        await tx.query('UPDATE users SET password_hash=$1, password_salt=$2 WHERE id=$3', [record.hash, record.salt, row.userId]);
        await tx.query('UPDATE password_reset_tokens SET used_at=$1 WHERE id=$2', [updatedAt, row.id]);
        await tx.query('UPDATE sessions SET revoked_at=$1 WHERE user_id=$2 AND revoked_at IS NULL', [updatedAt, row.userId]);
        await tx.query(
          `INSERT INTO audit_events (id, company_id, user_id, action, occurred_at, data_json)
           VALUES ($1, NULL, $2, 'PASSWORD_RESET', $3, $4)`,
          [`audit-${randomUUID()}`, row.userId, updatedAt, json({ userId: row.userId })]
        );
      });
      return jsonResponse(request, response, 200, { ok: true, message: 'Mot de passe réinitialisé. Reconnectez-vous.' });
    } catch (error) {
      return jsonResponse(request, response, 400, { code: 'PASSWORD_RESET_FAILED', message: error.message });
    }
  }

  if (request.method === 'POST' && pathname === '/api/login') {
    try {
      const input = await readJson(request);
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      const result = await store.query('SELECT * FROM users WHERE email=$1 AND active=1', [email]);
      const user = result.rows[0];
      if (!user || !(await passwordMatches(password, user))) return jsonResponse(request, response, 401, { code: 'INVALID_CREDENTIALS', message: 'Adresse e-mail ou mot de passe incorrect.' });
      if (!user.email_verified_at) return jsonResponse(request, response, 403, { code: 'EMAIL_NOT_VERIFIED', message: 'Vérifiez votre adresse e-mail avant de vous connecter.' });
      const token = randomBytes(32).toString('base64url');
      const sessionId = `session-${randomUUID()}`;
      const loggedAt = now();
      const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
      await store.query(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at)
         VALUES ($1, $2, $3, $4, $4, $5)`,
        [sessionId, user.id, hashToken(token), loggedAt, expiresAt]
      );
      await store.query('UPDATE users SET last_login_at=$1 WHERE id=$2', [loggedAt, user.id]);
      return jsonResponse(request, response, 200, { ok: true, user: publicUser(user), trial: await trialForUser(user.id), context: await userContext(user.id), session: { expiresIn: SESSION_SECONDS } }, { 'Set-Cookie': `emrys_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${isProduction ? '; Secure' : ''}` });
    } catch (error) {
      console.error('login_failed', error);
      return jsonResponse(request, response, 500, { code: 'LOGIN_FAILED', message: 'La connexion n’a pas pu être finalisée.' });
    }
  }

  if (request.method === 'GET' && pathname === '/api/auth/google/start') {
    // Keep the public button honest until the callback can verify the Google
    // code, link an identity and create the EMRYS session. Redirecting to a
    // half-configured OAuth flow would strand the user after consent.
    return jsonResponse(request, response, 503, {
      code: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REDIRECT_URI ? 'GOOGLE_CALLBACK_PENDING' : 'GOOGLE_NOT_CONFIGURED',
      message: 'L’authentification Google sera activée après finalisation du callback OAuth côté serveur.'
    });
  }

  if (request.method === 'POST' && pathname === '/api/payment/checkout') {
    const current = await sessionUser(request);
    if (!current) return jsonResponse(request, response, 401, { code: 'AUTH_REQUIRED', message: 'Connectez-vous avant de demander une licence.' });
    try {
      const input = await readJson(request);
      const provider = String(input.provider || '').toUpperCase();
      const amountXof = Number(input.amountXof);
      if (!allowedProviders.has(provider) || !input.planCode || !Number.isFinite(amountXof) || amountXof <= 0) return jsonResponse(request, response, 400, { code: 'INVALID_PAYMENT_ORDER', message: 'Fournisseur, offre et montant sont obligatoires.' });
      if (provider === 'FEDAPAY' && !process.env.FEDAPAY_SECRET_KEY) return jsonResponse(request, response, 503, { code: 'FEDAPAY_NOT_CONFIGURED', message: 'FedaPay n’est pas encore configuré côté serveur.' });
      const orderId = `payment-${randomUUID()}`;
      await store.query(
        `INSERT INTO payment_orders (id, user_id, plan_code, amount_xof, currency, provider, status, created_at, data_json)
         VALUES ($1, $2, $3, $4, 'XOF', $5, 'PENDING', $6, $7)`,
        [orderId, current.user.id, String(input.planCode), Math.round(amountXof), provider, now(), json({ source: 'api' })]
      );
      return jsonResponse(request, response, 202, { ok: true, orderId, status: 'PENDING', message: `La commande est enregistrée. Le connecteur ${provider} reste à activer côté marchand.` });
    } catch (error) {
      return jsonResponse(request, response, 400, { code: 'PAYMENT_REQUEST_INVALID', message: error.message });
    }
  }

  return jsonResponse(request, response, 404, { code: 'NOT_FOUND', message: 'Ressource inconnue.' });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (!url.pathname.startsWith('/api/')) return jsonResponse(request, response, 404, { code: 'NOT_FOUND', message: 'Cette API ne sert pas de pages publiques.' });
  try {
    await api(request, response, url.pathname);
  } catch (error) {
    console.error('unhandled_api_error', error);
    if (!response.headersSent) jsonResponse(request, response, 500, { code: 'INTERNAL_ERROR', message: 'Erreur interne du service EMRYS.' });
    else response.destroy();
  }
});

async function start() {
  await store.migrate();
  server.listen(PORT, HOST, () => console.log(`EMRYS API PostgreSQL sur http://${HOST}:${PORT}`));
}

async function shutdown(signal) {
  console.log(`${signal} reçu, arrêt de l’API EMRYS…`);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
start().catch((error) => {
  console.error('api_start_failed', error);
  process.exitCode = 1;
});
