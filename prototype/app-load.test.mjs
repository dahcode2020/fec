import test from 'node:test';
import assert from 'node:assert/strict';

test('charge le module applicatif sans bloquer l’écran d’authentification', async () => {
  globalThis.document = { addEventListener() {} };
  await import(`./app.js?smoke=${Date.now()}`);
  assert.ok(true);
});
