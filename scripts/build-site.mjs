import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const output = resolve(root, 'dist');
const publicSite = resolve(root, 'prototype/site');
const application = resolve(root, 'prototype');

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(publicSite, output, { recursive: true });

const appOutput = resolve(output, 'app');
mkdirSync(appOutput, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'sync-client.js']) cpSync(resolve(application, file), resolve(appOutput, file));
cpSync(resolve(application, 'data'), resolve(appOutput, 'data'), { recursive: true });

// The application is deliberately a static client at this stage. Its API
// calls stay relative so Vercel can proxy /api/* to the independent API.
writeFileSync(resolve(output, 'health.txt'), 'EMRYS static site build OK\n');
console.log(`Site EMRYS construit dans ${output} (public + app/)`);
