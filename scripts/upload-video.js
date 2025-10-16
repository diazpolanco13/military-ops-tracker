import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de .env.local manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env.local');

try {
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
  console.log('✅ Variables de entorno cargadas desde .env.local\n');
} catch (error) {
  console.error('⚠️  No se pudo leer .env.local:', error.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas:');
  console.error('VITE_SUPABASE_URL: ' + (supabaseUrl ? '✅' : '❌'));
  console.error('VITE_SUPABASE_ANON_KEY: ' + (supabaseKey ? '✅' : '❌'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 🎥 Subir video a Supabase Storage
 * @param {string} videoPath - Ruta local del video
 * @param {string} entityId - ID de la entidad
 * @param {string} entityName - Nombre de la entidad
 */
async function uploadVideo(videoPath, entityId, entityName) {
  try {
    console.log(`📹 Subiendo video: ${videoPath}`);

    // Leer archivo
    const videoBuffer = readFileSync(videoPath);
    const fileExt = extname(videoPath);
    const fileName = `${entityId}-${entityName.replace(/\s+/g, '-').toLowerCase()}${fileExt}`;

    console.log(`📝 Nombre del archivo: ${fileName}`);

    // Subir a Storage
    const { data, error: uploadError } = await supabase.storage
      .from('entity-videos')
      .upload(`videos/${fileName}`, videoBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'video/webm',
      });

    if (uploadError) throw uploadError;

    console.log(`✅ Video subido exitosamente`);

    // Obtener URL pública
    const { data: publicData } = supabase.storage
      .from('entity-videos')
      .getPublicUrl(`videos/${fileName}`);

    const videoUrl = publicData.publicUrl;
    console.log(`🔗 URL pública: ${videoUrl}`);

    // Actualizar BD con URL del video
    const { error: updateError } = await supabase
      .from('entities')
      .update({ video_url: videoUrl })
      .eq('id', entityId);

    if (updateError) throw updateError;

    console.log(`✅ BD actualizada para entidad: ${entityName}`);
    console.log(`\n🎉 ¡Video listo! Recarga la app y abre el sidebar de ${entityName}`);
    return videoUrl;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * 📺 Script principal
 */
async function main() {
  const videoPath = process.argv[2];
  const entityId = process.argv[3];
  const entityName = process.argv[4];

  if (!videoPath || !entityId || !entityName) {
    console.error('\n❌ Falta información');
    console.error('\nUso: node scripts/upload-video.js <videoPath> <entityId> <entityName>');
    console.error('\nEjemplo:');
    console.error('  node scripts/upload-video.js ./images/grok-video.webm a30d5844-a723-4a72-9d2e-e623f3c7d9d8 "USS The Sullivans"');
    process.exit(1);
  }

  await uploadVideo(videoPath, entityId, entityName);
}

main().catch(console.error);
