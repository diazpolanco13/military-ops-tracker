#!/usr/bin/env node

/**
 * 📸 Script para subir imagen de prueba del USS The Sullivans
 * Ejecutar con: node scripts/upload-test-image.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase (leer de .env o usar valores directos)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'TU_SUPABASE_KEY';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'TU_SUPABASE_URL') {
  console.error('❌ ERROR: Configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.log('\nPuedes copiar los valores de tu archivo .env local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ID de la entidad USS The Sullivans
const ENTITY_ID = 'a30d5844-a723-4a72-9d2e-e623f3c7d9d8';
const IMAGE_PATH = resolve(__dirname, '../images/USS The Sullivans - 25x25.png');

async function uploadImage() {
  try {
    console.log('🚀 Iniciando subida de imagen de prueba...\n');
    
    // 1. Leer archivo
    console.log('📂 Leyendo imagen desde:', IMAGE_PATH);
    const imageBuffer = readFileSync(IMAGE_PATH);
    console.log(`✅ Imagen leída: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);
    
    // 2. Subir imagen principal como PNG (mantiene transparencia)
    const imagePath = `entities/${ENTITY_ID}/image.png`;
    console.log('⬆️  Subiendo imagen principal como PNG...');
    
    const { error: imageError } = await supabase.storage
      .from('entity-images')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });
    
    if (imageError) {
      console.error('❌ Error al subir imagen:', imageError.message);
      throw imageError;
    }
    
    console.log('✅ Imagen principal subida (PNG con transparencia)\n');
    
    // 3. Subir miniatura como PNG (mantiene transparencia)
    const thumbnailPath = `entities/${ENTITY_ID}/thumbnail.png`;
    console.log('⬆️  Subiendo miniatura como PNG...');
    
    const { error: thumbError } = await supabase.storage
      .from('entity-images')
      .upload(thumbnailPath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });
    
    if (thumbError) {
      console.error('❌ Error al subir miniatura:', thumbError.message);
      throw thumbError;
    }
    
    console.log('✅ Miniatura subida\n');
    
    // 4. Obtener URLs públicas
    const { data: imageData } = supabase.storage
      .from('entity-images')
      .getPublicUrl(imagePath);
    
    const { data: thumbData } = supabase.storage
      .from('entity-images')
      .getPublicUrl(thumbnailPath);
    
    const imageUrl = imageData.publicUrl;
    const thumbnailUrl = thumbData.publicUrl;
    
    console.log('🔗 URLs generadas:');
    console.log('   Imagen:', imageUrl);
    console.log('   Miniatura:', thumbnailUrl);
    console.log('');
    
    // 5. Actualizar tabla entities
    console.log('💾 Actualizando registro en base de datos...');
    
    const { error: updateError } = await supabase
      .from('entities')
      .update({
        image_url: imageUrl,
        image_thumbnail_url: thumbnailUrl,
      })
      .eq('id', ENTITY_ID);
    
    if (updateError) {
      console.error('❌ Error al actualizar entidad:', updateError.message);
      throw updateError;
    }
    
    console.log('✅ Base de datos actualizada\n');
    
    // 6. Verificar
    console.log('🔍 Verificando resultado...');
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('name, image_url, image_thumbnail_url')
      .eq('id', ENTITY_ID)
      .single();
    
    if (fetchError) {
      console.error('❌ Error al verificar:', fetchError.message);
      throw fetchError;
    }
    
    console.log('✅ Verificación exitosa:');
    console.log('   Entidad:', entity.name);
    console.log('   Imagen URL:', entity.image_url ? '✅ Configurada' : '❌ Falta');
    console.log('   Miniatura URL:', entity.image_thumbnail_url ? '✅ Configurada' : '❌ Falta');
    console.log('');
    
    console.log('🎉 ¡IMAGEN SUBIDA CORRECTAMENTE!');
    console.log('');
    console.log('📝 Próximos pasos:');
    console.log('   1. Reinicia el servidor: npm run dev');
    console.log('   2. Abre el mapa en el navegador');
    console.log('   3. Click en el marcador USS The Sullivans');
    console.log('   4. ¡Disfruta del popup profesional con imagen! 🚀');
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Verifica que el bucket "entity-images" existe en Supabase');
    console.log('   - Revisa las políticas de Storage (deben permitir INSERT)');
    console.log('   - Confirma que las credenciales son correctas');
    process.exit(1);
  }
}

// Ejecutar
uploadImage();

