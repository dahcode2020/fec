import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpSyncRemote } from './http-sync-remote.mjs';

test('adapte le moteur de synchronisation au contrat HTTP push/pull', async () => {
  const calls = [];
  const remote = createHttpSyncRemote({
    baseUrl: 'https://api.emrys-saas.com',
    deviceId: 'device-http',
    deviceName: 'Portable de Claire',
    getHeaders: () => ({ 'X-Test-Client': 'sync-test' }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/push')) return { ok: true, status: 200, json: async () => ({ ok: true, acknowledgements: [{ id: 'out-1', cursor: '7' }], conflicts: [], errors: [] }) };
      if (url.includes('/pull')) return { ok: true, status: 200, json: async () => ({ ok: true, events: [{ id: 'in-1', entityType: 'DOSSIER', entityId: 'd-1', cursor: '8', payload: { id: 'd-1' } }] }) };
      return { ok: true, status: 200, json: async () => ({ ok: true, conflicts: 0, cursor: '8' }) };
    }
  });

  const pushed = await remote.push([{ id: 'out-1', entityType: 'DOSSIER', entityId: 'd-1', payload: { id: 'd-1' } }]);
  assert.equal(pushed.acknowledgements[0].cursor, '7');
  const pulled = await remote.pull('7', { limit: 25, companyId: 'co-1' });
  assert.equal(pulled[0].cursor, '8');
  const status = await remote.status();
  assert.equal(status.cursor, '8');
  assert.equal(remote.isOnline(), true);
  assert.equal(calls[0].options.credentials, 'include');
  assert.equal(calls[0].options.headers['X-Test-Client'], 'sync-test');
  assert.match(calls[1].url, /cursor=7/);
  assert.match(calls[1].url, /companyId=co-1/);

  remote.setOnline(false);
  await assert.rejects(() => remote.pull('8'), /indisponible/);
});

test('signale une erreur HTTP et repasse hors ligne sur une panne serveur', async () => {
  const remote = createHttpSyncRemote({
    deviceId: 'device-http',
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ code: 'DATABASE_UNAVAILABLE', message: 'Base indisponible.' }) })
  });
  await assert.rejects(
    () => remote.status(),
    (error) => error.code === 'DATABASE_UNAVAILABLE' && error.status === 503
  );
  assert.equal(remote.isOnline(), false);
});
