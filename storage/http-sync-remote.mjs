const DEFAULT_LIMIT = 100;

function apiError(payload, status) {
  const error = new Error(payload?.message || `Le service de synchronisation a répondu ${status}.`);
  error.code = payload?.code || 'SYNC_HTTP_ERROR';
  error.status = status;
  return error;
}

/**
 * Adaptateur HTTP qui respecte le contrat attendu par createSyncEngine.
 *
 * Il est utilisable par Tauri, Node ou un navigateur. L’authentification reste
 * volontairement injectable : en production, on préfère un cookie de session
 * HttpOnly ou un mécanisme d’appareil plutôt qu’un jeton écrit en clair dans
 * le stockage local.
 */
export function createHttpSyncRemote({
  baseUrl = '',
  deviceId,
  deviceName = deviceId,
  fetchImpl = globalThis.fetch,
  getHeaders = () => ({})
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch est obligatoire pour l’adaptateur HTTP.');
  if (!deviceId) throw new Error('deviceId est obligatoire pour l’adaptateur HTTP.');
  const origin = String(baseUrl).replace(/\/$/, '');
  let online = true;

  async function request(path, options = {}) {
    try {
      const response = await fetchImpl(`${origin}${path}`, {
        credentials: 'include',
        ...options,
        headers: { Accept: 'application/json', ...getHeaders(), ...(options.headers || {}) }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw apiError(payload, response.status);
      online = true;
      return payload;
    } catch (error) {
      if (!error.status || error.status >= 500) online = false;
      throw error;
    }
  }

  return {
    deviceId,
    setOnline(value) { online = Boolean(value); },
    isOnline() { return online; },
    async push(localEvents = []) {
      if (!online) throw new Error('Service de synchronisation indisponible.');
      return request('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, deviceName, events: localEvents })
      });
    },
    async pull(afterCursor = '0', { limit = DEFAULT_LIMIT, companyId = null } = {}) {
      if (!online) throw new Error('Service de synchronisation indisponible.');
      const params = new URLSearchParams({ cursor: String(afterCursor), limit: String(limit) });
      if (companyId) params.set('companyId', companyId);
      const payload = await request(`/api/sync/pull?${params}`);
      return payload.events || [];
    },
    async status() {
      if (!online) throw new Error('Service de synchronisation indisponible.');
      return request('/api/sync/status');
    }
  };
}
