import { createHash } from 'node:crypto';

const hash = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const keyFor = (event) => `${event.entityType || event.entity_type}:${event.entityId || event.entity_id}`;

export function createInMemorySyncRemote() {
  let online = true;
  let cursor = 0;
  const events = [];
  const entities = new Map();
  const seen = new Set();
  return {
    setOnline(value) { online = Boolean(value); },
    isOnline() { return online; },
    push(localEvents = []) {
      if (!online) throw new Error('Service de synchronisation indisponible.');
      const acknowledgements = [];
      const conflicts = [];
      localEvents.forEach((event) => {
        const payload = typeof event.payload_json === 'string' ? JSON.parse(event.payload_json) : event.payload;
        const payloadHash = event.payload_hash || hash(payload);
        if (seen.has(event.id)) {
          acknowledgements.push({ id: event.id, cursor });
          return;
        }
        const key = keyFor(event);
        const current = entities.get(key);
        if (current && current.payloadHash !== payloadHash) {
          conflicts.push({ outboxId: event.id, companyId: event.company_id || event.companyId || null, entityType: event.entity_type || event.entityType, entityId: event.entity_id || event.entityId, local: payload, remote: current.payload, reason: 'La version distante a changé depuis la dernière synchronisation.' });
          return;
        }
        cursor += 1;
        const remoteEvent = { id: event.id, deviceId: event.device_id || event.deviceId || null, companyId: event.company_id || event.companyId || null, entityType: event.entity_type || event.entityType, entityId: event.entity_id || event.entityId, operation: event.operation || 'UPSERT', payload, payloadHash, cursor };
        entities.set(key, { payload, payloadHash, cursor });
        events.push(remoteEvent);
        seen.add(event.id);
        acknowledgements.push({ id: event.id, cursor });
      });
      return { acknowledgements, conflicts };
    },
    pull(afterCursor = '0', { limit = 100 } = {}) {
      if (!online) throw new Error('Service de synchronisation indisponible.');
      const cursorNumber = Number(afterCursor) || 0;
      return events.filter((event) => event.cursor > cursorNumber).slice(0, limit);
    },
    inspect() { return { cursor, eventCount: events.length, entityCount: entities.size }; }
  };
}

export function createSyncEngine({ store, remote, deviceId = `device-${Date.now()}` } = {}) {
  if (!store || !remote) throw new Error('Le moteur de synchronisation nécessite un store et un service distant.');
  return {
    deviceId,
    async sync({ companyId = null, scope = companyId || 'all', limit = 100 } = {}) {
      const summary = { status: 'SYNCED', pushed: 0, pulled: 0, applied: 0, duplicates: 0, conflicts: 0, failed: 0, cursorBefore: store.getSyncCursor(scope) || '0', cursorAfter: store.getSyncCursor(scope) || '0' };
      const pending = store.pendingSyncEvents({ companyId, limit });
      try {
        if (pending.length) {
          const result = remote.push(pending);
          let pushedCursor = Number(summary.cursorBefore) || 0;
          result.acknowledgements.forEach((acknowledgement) => { store.acknowledgeSyncEvent(acknowledgement.id); pushedCursor = Math.max(pushedCursor, Number(acknowledgement.cursor) || 0); summary.pushed += 1; });
          if (pushedCursor > 0) { summary.cursorAfter = String(pushedCursor); store.setSyncCursor(scope, summary.cursorAfter); }
          result.conflicts.forEach((conflict) => { store.recordConflict(conflict); const event = pending.find((item) => item.id === conflict.outboxId); if (event) store.markSyncEventFailed(event.id, conflict.reason); summary.conflicts += 1; });
          (result.errors || []).forEach((failure) => { const event = pending.find((item) => item.id === failure.id); if (event) store.markSyncEventFailed(event.id, failure.message || failure.code || 'Événement rejeté.'); summary.failed += 1; });
          if ((result.errors || []).length) summary.status = 'PARTIAL';
        }
        const cursor = store.getSyncCursor(scope) || '0';
        const incoming = remote.pull(cursor, { limit });
        incoming.forEach((event) => {
          if (!store.receiveSyncEvent(event)) { summary.duplicates += 1; summary.cursorAfter = String(event.cursor); return; }
          try { store.applySyncEvent(event); summary.applied += 1; }
          catch (error) {
            summary.failed += 1;
            if (typeof store.markSyncEventInboxFailed === 'function') store.markSyncEventInboxFailed(event.id, error.message);
            else store.markSyncEventFailed(event.id, error.message);
          }
          summary.pulled += 1;
          summary.cursorAfter = String(event.cursor);
        });
        if (incoming.length) store.setSyncCursor(scope, summary.cursorAfter);
        return summary;
      } catch (error) {
        pending.forEach((event) => store.markSyncEventFailed(event.id, error.message));
        return { ...summary, status: 'OFFLINE', failed: pending.length, error: error.message };
      }
    }
  };
}
