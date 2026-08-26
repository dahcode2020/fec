import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqliteWorkspaceStore } from './sqlite-store.mjs';
import { createSyncEngine } from './sync-engine.mjs';

const date = '2026-08-26T10:00:00.000Z';

test('conserve une erreur de push dans l’outbox au lieu de l’acquitter', async () => {
  const store = createSqliteWorkspaceStore();
  store.saveCompany({ id: 'co-1', name: 'Acacia Conseil', createdAt: date });
  const pending = store.pendingSyncEvents()[0];
  const remote = {
    push: () => ({ acknowledgements: [], conflicts: [], errors: [{ id: pending.id, code: 'SYNC_EVENT_REJECTED', message: 'Événement refusé.' }] }),
    pull: () => []
  };
  const result = await createSyncEngine({ store, remote }).sync({ scope: 'all' });
  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.failed, 1);
  assert.equal(store.pendingSyncEvents()[0].status, 'FAILED');
  store.close();
});
