import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSqliteWorkspaceStore, restoreSqliteBackup } from './sqlite-store.mjs';

const date = '2026-08-26T10:00:00.000Z';

test('persiste le socle utilisateurs, sociétés, droits et exercices dans SQLite', () => {
  const store = createSqliteWorkspaceStore();
  store.saveWorkspace({ id: 'ws-1', name: 'Cabinet test', createdAt: date });
  store.saveUser({ id: 'u-1', name: 'Claire Dossou', email: 'claire@test.bj', active: true, createdAt: date });
  store.saveCompany({ id: 'co-1', name: 'Acacia Conseil', shortName: 'AC', ifu: '3201900045612', country: 'BJ', currency: 'XOF', createdAt: date });
  store.saveMembership({ id: 'm-1', userId: 'u-1', companyId: 'co-1', moduleId: 'CSR', role: 'ADMIN', active: true, createdAt: date });
  store.saveDossier({ id: 'd-1', companyId: 'co-1', dossier: 'ACACIA-25', moduleId: 'CSR', exerciseYear: '2025', status: 'Actif', createdAt: date });
  store.saveFiscalYear({ id: 'fy-1', year: '2025', label: 'Exercice 2025', status: 'FINALIZED', snapshotId: 'snapshot-1', finalizedAt: date }, 'co-1');
  store.savePeriod({ id: '2025-01', start: '2025-01-01', end: '2025-01-31', status: 'CLOSED' }, 'co-1', '2025');
  store.saveSnapshot({ id: 'snapshot-1', companyId: 'co-1', fiscalYear: '2025', status: 'FINALIZED', immutable: true, snapshotHash: 'abc123', sourceCount: 2, lineCount: 4, data: { result: 100 }, sealedAt: date });
  store.saveAuditEvent({ id: 'audit-1', companyId: 'co-1', userId: 'u-1', action: 'SNAPSHOT_SEALED', at: date, data: { sourceCount: 2 } });

  assert.equal(store.listUsers().length, 1);
  assert.equal(store.listCompanies()[0].currency, 'XOF');
  assert.equal(store.listMemberships('co-1')[0].role, 'ADMIN');
  assert.equal(store.listFiscalYears('co-1')[0].status, 'FINALIZED');
  assert.equal(store.getSnapshot('co-1', '2025').snapshot_hash, 'abc123');
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM periods').get().count, 1);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM audit_events').get().count, 1);
  assert.equal(store.schemaVersion(), 5);
  assert.ok(store.pendingSyncEvents().length >= 7);
  const syncEvent = store.pendingSyncEvents({ companyId: 'co-1' })[0];
  assert.equal(store.receiveSyncEvent({ id: 'remote-1', deviceId: 'device-1', entityType: 'COMPANY', entityId: 'co-1', operation: 'UPSERT', payload: { id: 'co-1' } }), true);
  assert.equal(store.receiveSyncEvent({ id: 'remote-1', deviceId: 'device-1', entityType: 'COMPANY', entityId: 'co-1', operation: 'UPSERT', payload: { id: 'co-1' } }), false);
  store.acknowledgeSyncEvent(syncEvent.id, 'cursor-1');
  assert.equal(store.getSyncCursor(), 'cursor-1');
  store.close();
});

test('protège les relations SQLite par les clés étrangères', () => {
  const store = createSqliteWorkspaceStore();
  store.saveUser({ id: 'u-1', name: 'Utilisateur', email: 'u@test.bj', createdAt: date });
  assert.throws(() => store.saveMembership({ id: 'm-1', userId: 'u-1', companyId: 'unknown', moduleId: 'CSR', role: 'READER', createdAt: date }), /FOREIGN KEY/);
  store.close();
});

test('sauvegarde et restaure la base par copie vérifiée sans modifier la source', () => {
  const directory = mkdtempSync(join(tmpdir(), 'fec-sqlite-'));
  const sourceFile = join(directory, 'source.sqlite');
  const backupFile = join(directory, 'backup.sqlite');
  const restoredFile = join(directory, 'restored.sqlite');
  const store = createSqliteWorkspaceStore({ filename: sourceFile });
  store.saveCompany({ id: 'co-1', name: 'Source Conseil', ifu: '3201900045612', createdAt: date });
  const manifest = store.backupTo(backupFile, { companyId: 'co-1', reason: 'Avant migration' });
  assert.equal(manifest.schemaVersion, 5);
  assert.equal(store.verifyBackup(manifest).valid, true);
  store.close();
  const restored = restoreSqliteBackup({ backupFile, targetFile: restoredFile, expectedHash: manifest.databaseHash });
  assert.equal(restored.databaseHash, manifest.databaseHash);
  const restoredStore = createSqliteWorkspaceStore({ filename: restoredFile });
  assert.equal(restoredStore.listCompanies()[0].name, 'Source Conseil');
  assert.equal(restoredStore.db.prepare('SELECT COUNT(*) AS count FROM backup_manifests').get().count, 0);
  restoredStore.close();
  rmSync(directory, { recursive: true, force: true });
});
