import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { get } from 'node:http';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const ENV_FILE = resolve(ROOT, '.env');
const API_PORT = Number(process.env.EMRYS_API_PORT || 8080);
const SITE_PORT = Number(process.env.EMRYS_SITE_PORT || 4174);
const children = [];
let stopping = false;

function readDatabaseUrl() {
  if (!existsSync(ENV_FILE)) throw new Error('Le fichier .env est absent. Créez-le à partir de .env.example et renseignez DATABASE_URL.');
  const line = readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).find((entry) => /^\s*DATABASE_URL\s*=/.test(entry));
  const value = line?.split('=', 2)[1]?.trim().replace(/^['"]|['"]$/g, '');
  if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error('DATABASE_URL doit contenir la chaîne PostgreSQL fournie par Neon.');
  return value;
}

function portIsFree(port) {
  return new Promise((resolvePort) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const done = (free) => { socket.destroy(); resolvePort(free); };
    socket.once('connect', () => done(false));
    socket.once('error', (error) => done(error.code === 'ECONNREFUSED'));
  });
}

function waitForApi(timeoutMs = 30_000) {
  const started = Date.now();
  return new Promise((resolveWait, rejectWait) => {
    const attempt = () => {
      get({ host: '127.0.0.1', port: API_PORT, path: '/api/health' }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          try {
            const payload = JSON.parse(body);
            if (response.statusCode === 200 && payload.ok === true) return resolveWait(payload);
          } catch { /* L’API est encore en démarrage. */ }
          retry();
        });
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - started >= timeoutMs) return rejectWait(new Error(`L’API Neon ne répond pas correctement sur le port ${API_PORT}.`));
      setTimeout(attempt, 500);
    };
    attempt();
  });
}

function stopChildren(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => { if (!child.killed) child.kill('SIGTERM'); });
  setTimeout(() => process.exit(exitCode), 1500).unref();
}

async function main() {
  readDatabaseUrl();
  const [apiFree, siteFree] = await Promise.all([portIsFree(API_PORT), portIsFree(SITE_PORT)]);
  if (!apiFree || !siteFree) {
    const busy = [!apiFree && `${API_PORT} (API)`, !siteFree && `${SITE_PORT} (site)`].filter(Boolean).join(', ');
    throw new Error(`Port(s) déjà utilisé(s) : ${busy}. Arrêtez l’ancien serveur avec Ctrl+C avant de relancer dev:neon.`);
  }

  const api = spawn(process.execPath, ['--env-file=.env', 'server/api-server.mjs'], { cwd: ROOT, env: process.env, stdio: 'inherit' });
  children.push(api);
  api.once('exit', (code) => { if (!stopping) { console.error(`\nAPI arrêtée (code ${code ?? 'inconnu'}).`); stopChildren(code || 1); } });
  const health = await waitForApi();
  console.log(`Neon OK · schéma PostgreSQL ${health.schemaVersion}`);

  const site = spawn(process.execPath, ['server/dev-server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, EMRYS_API_ORIGIN: `http://127.0.0.1:${API_PORT}`, PORT: String(SITE_PORT), HOST: '0.0.0.0' },
    stdio: 'inherit'
  });
  children.push(site);
  site.once('exit', (code) => { if (!stopping) { console.error(`\nSite arrêté (code ${code ?? 'inconnu'}).`); stopChildren(code || 1); } });
  console.log(`\nEMRYS prêt : http://localhost:${SITE_PORT}/app/`);
  console.log('API : 8080 · Site et proxy : 4174 · Arrêt : Ctrl+C');
}

process.once('SIGINT', () => stopChildren(0));
process.once('SIGTERM', () => stopChildren(0));
main().catch((error) => { console.error(`dev:neon impossible : ${error.message}`); stopChildren(1); });
