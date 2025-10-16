import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env.local');

const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key] = value;
    }
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    console.log('🪣 Creando bucket entity-videos...\n');
    
    const { data, error } = await supabase.storage.createBucket('entity-videos', {
      public: true,
    });

    if (error) throw error;

    console.log('✅ Bucket creado exitosamente!');
    console.log('📍 Bucket: entity-videos');
    console.log('🔓 Acceso: Público\n');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  El bucket entity-videos ya existe');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

createBucket();
