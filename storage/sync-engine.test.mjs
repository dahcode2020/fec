import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqliteWorkspaceStore } from './sqlite-store.mjs';
import { createInMemorySyncRemote, createSyncEngine } from './sync-engine.mjs';

const date = '2026-08-26T10:00:00.000Z';

function seedStore() {
  const store = createSqliteWorkspaceStore();
  store.saveUser({ id: 'u-1', name: 'Claire Dossou', email: 'claire@test.bj', createdAt: date });
  store.saveCompany({ id: 'co-1', name: 'Acacia Conseil', ifu: '3201900045612', createdAt: date });
  store.saveMembership({ id: 'm-1', userId: 'u-1', companyId: 'co-1', moduleId: 'CSR', role: 'ADMIN', createdAt: date });
  return store;
}

test('synchronise deux bases locales sans réappliquer les événements', async () => {
  const first = seedStore();
  const second = createSqliteWorkspaceStore();
  const remote = createInMemorySyncRemote();
  const firstSync = createSyncEngine({ store: first, remote, deviceId: 'device-a' });
  const secondSync = createSyncEngine({ store: second, remote, deviceId: 'device-b' });

  const pushed = await firstSync.sync({ scope: 'all' });
  assert.equal(pushed.status, 'SYNCED');
  assert.equal(pushed.pushed, 3);
  const pulled = await secondSync.sync({ scope: 'all' });
  assert.equal(pulled.applied, 3);
  assert.equal(second.listCompanies()[0].name, 'Acacia Conseil');
  assert.equal(second.listMemberships('co-1')[0].role, 'ADMIN');
  const repeat = await secondSync.sync({ scope: 'all' });
  assert.equal(repeat.pulled, 0);
  assert.equal(repeat.duplicates, 0);
  first.close();
  second.close();
});

test('conserve un conflit au lieu d’écraser une version distante', async () => {
  const first = seedStore();
  const second = seedStore();
  const remote = createInMemorySyncRemote();
  const firstSync = createSyncEngine({ store: first, remote, deviceId: 'device-a' });
  const secondSync = createSyncEngine({ store: second, remote, deviceId: 'device-b' });
  await firstSync.sync({ companyId: 'co-1', scope: 'co-1' });
  first.saveCompany({ id: 'co-1', name: 'Acacia Conseil — local', ifu: '3201900045612', createdAt: date });
  second.saveCompany({ id: 'co-1', name: 'Acacia Conseil — distant', ifu: '3201900045612', createdAt: date });
  const result = await secondSync.sync({ companyId: 'co-1', scope: 'co-1' });
  assert.equal(result.conflicts, 1);
  assert.equal(second.db.prepare("SELECT COUNT(*) AS count FROM sync_conflicts WHERE status='OPEN'").get().count, 1);
  assert.equal(second.listCompanies()[0].name, 'Acacia Conseil — distant');
  first.close();
  second.close();
});

test('reste hors ligne puis reprend les événements en attente', async () => {
  const store = seedStore();
  const remote = createInMemorySyncRemote();
  const engine = createSyncEngine({ store, remote, deviceId: 'device-a' });
  remote.setOnline(false);
  const offline = await engine.sync({ scope: 'all' });
  assert.equal(offline.status, 'OFFLINE');
  assert.ok(store.pendingSyncEvents().every((event) => event.status === 'FAILED'));
  remote.setOnline(true);
  const online = await engine.sync({ scope: 'all' });
  assert.equal(online.status, 'SYNCED');
  assert.equal(store.pendingSyncEvents().length, 0);
  store.close();
});
