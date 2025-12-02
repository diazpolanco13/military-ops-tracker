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
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Throttle para no saturar
    },
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

