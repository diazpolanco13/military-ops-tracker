import { createClient } from '@supabase/supabase-js';

// Helper para obtener env vars (runtime en Docker o build-time en dev)
const getEnv = (key) => {
  // Primero intenta import.meta.env (desarrollo local con .env)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Si no existe, intenta window.ENV (producción Docker)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  console.log('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
}

// ─────────────────────────────────────────────────────────────────────────────
// 📈 Métricas (solo cliente): contador de requests a Supabase para detectar ráfagas
// - No requiere cambios en Supabase.
// - Se alimenta desde el fetch global del cliente.
// - Se expone en window para debug: window.supabaseMetrics()
// ─────────────────────────────────────────────────────────────────────────────
const __supabaseMetrics = {
  startedAt: Date.now(),
  total: 0,
  byPath: {}, // "/rest/v1/entities": count
  byStatus: {}, // "200": count
  last: [], // últimos N requests
};

function __recordSupabaseRequest({ url, status, ms, method }) {
  try {
    __supabaseMetrics.total += 1;
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const key = `${u.pathname}`;
    __supabaseMetrics.byPath[key] = (__supabaseMetrics.byPath[key] || 0) + 1;
    const s = String(status || '0');
    __supabaseMetrics.byStatus[s] = (__supabaseMetrics.byStatus[s] || 0) + 1;
    __supabaseMetrics.last.unshift({
      t: Date.now(),
      method: method || 'GET',
      path: key,
      status: status || 0,
      ms: ms || 0,
    });
    if (__supabaseMetrics.last.length > 50) __supabaseMetrics.last.length = 50;
  } catch {
    // no-op
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 5, // REDUCIDO de 10 a 5 para evitar saturación
    },
    // Reconexión automática con backoff
    timeout: 30000, // 30 segundos de timeout
  },
  global: {
    headers: {
      'x-client-info': 'sae-radar/2.0',
    },
    // Instrumentar requests HTTP (PostgREST, storage, functions) para identificar exceso de QPS.
    // Mantiene el fetch original y no altera el payload.
    fetch: async (url, options) => {
      const start = Date.now();
      const method = options?.method || 'GET';
      try {
        const res = await fetch(url, options);
        const ms = Date.now() - start;

        // Registrar solo requests a Supabase (misma base URL) si se puede inferir
        if (supabaseUrl && typeof url === 'string' && url.startsWith(supabaseUrl)) {
          __recordSupabaseRequest({ url, status: res.status, ms, method });
        }
        return res;
      } catch (e) {
        const ms = Date.now() - start;
        if (supabaseUrl && typeof url === 'string' && url.startsWith(supabaseUrl)) {
          __recordSupabaseRequest({ url, status: 0, ms, method });
        }
        throw e;
      }
    },
  },
  db: {
    schema: 'public',
  },
});

// Helper para verificar conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('entities').select('count');
    if (error) throw error;
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return false;
  }
}

// ❌ Connection Monitor ELIMINADO (optimización)
// Supabase maneja reconexión automática internamente.
// Este monitor hacía 2 queries/min innecesarias (120 queries/hora).

/**
 * 🕐 Helper para ejecutar consultas con timeout
 * Evita que la app se cuelgue si Supabase no responde
 * 
 * @param {Promise} promise - La promesa a ejecutar
 * @param {number} timeoutMs - Timeout en milisegundos (default: 10000)
 * @returns {Promise} - La promesa con timeout
 */
export async function withTimeout(promise, timeoutMs = 10000) {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: la operación tardó más de ${timeoutMs/1000}s`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 🔄 Wrapper para consultas Supabase con timeout
 * 
 * @param {Promise|PostgrestBuilder} queryOrPromise - Query de Supabase o Promise
 * @param {number} timeout - Timeout en ms (default 10000)
 * @returns {Promise<{data, error}>} - Resultado de la consulta
 */
export async function safeQuery(queryOrPromise, timeout = 10000) {
  try {
    // Si es un PostgrestBuilder (tiene .then), ejecutarlo directamente
    const promise = typeof queryOrPromise.then === 'function' 
      ? queryOrPromise 
      : Promise.resolve(queryOrPromise);
    
    const result = await withTimeout(promise, timeout);
    return result;
  } catch (error) {
    // Devolver formato consistente con Supabase
    return { data: null, error: error.message || 'Query failed' };
  }
}

// Exponer métricas para debug (admin/dev)
export function getSupabaseMetrics() {
  return {
    ...__supabaseMetrics,
    uptimeMs: Date.now() - __supabaseMetrics.startedAt,
  };
}

export function resetSupabaseMetrics() {
  __supabaseMetrics.startedAt = Date.now();
  __supabaseMetrics.total = 0;
  __supabaseMetrics.byPath = {};
  __supabaseMetrics.byStatus = {};
  __supabaseMetrics.last = [];
}

if (typeof window !== 'undefined') {
  window.supabaseMetrics = () => getSupabaseMetrics();
  window.resetSupabaseMetrics = () => resetSupabaseMetrics();
}
