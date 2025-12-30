/**
 * 🧵 singleflight - Deduplicación de operaciones async por clave.
 *
 * Útil para evitar "tormentas" de peticiones cuando múltiples componentes llaman
 * la misma operación (ej: supabase.auth.getSession + queries de rol).
 *
 * - Si hay una promesa en vuelo para `key`, se reutiliza.
 * - Opcional: cache de resultado por TTL.
 */
const inflight = new Map(); // key -> Promise
const cache = new Map(); // key -> { value, expiresAt }

export function singleflight(key, fn, { ttlMs = 0 } = {}) {
  if (!key) throw new Error('singleflight: key requerida');
  if (typeof fn !== 'function') throw new Error('singleflight: fn debe ser función');

  const now = Date.now();

  if (ttlMs > 0) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return Promise.resolve(cached.value);
    }
    // limpiar cache vencida
    if (cached) cache.delete(key);
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const value = await fn();
    if (ttlMs > 0) {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
    return value;
  })()
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}

export function singleflightClear(key) {
  inflight.delete(key);
  cache.delete(key);
}


