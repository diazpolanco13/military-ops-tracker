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

// 🔄 Monitor de estado de conexión
let connectionStatus = 'unknown';
let reconnectTimer = null;

export function getConnectionStatus() {
  return connectionStatus;
}

// Verificar conexión periódicamente y reconectar si es necesario
export function startConnectionMonitor(onStatusChange) {
  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('entities').select('id', { count: 'exact', head: true });
      
      if (error) {
        if (connectionStatus !== 'disconnected') {
          connectionStatus = 'disconnected';
          console.warn('⚠️ Conexión perdida con Supabase');
          onStatusChange?.('disconnected');
        }
      } else {
        if (connectionStatus !== 'connected') {
          connectionStatus = 'connected';
          console.log('✅ Conexión restaurada con Supabase');
          onStatusChange?.('connected');
        }
      }
    } catch (err) {
      if (connectionStatus !== 'error') {
        connectionStatus = 'error';
        console.error('❌ Error de conexión:', err.message);
        onStatusChange?.('error');
      }
    }
  };

  // Verificar cada 30 segundos
  checkConnection();
  reconnectTimer = setInterval(checkConnection, 30000);

  return () => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
    }
  };
}

// Exponer para debug
if (typeof window !== 'undefined') {
  window.supabaseStatus = () => ({
    connectionStatus,
    url: supabaseUrl,
  });
}
