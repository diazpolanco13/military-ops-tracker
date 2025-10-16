import { supabase } from '../lib/supabase';
import { 
  resizeImage, 
  createThumbnail, 
  validateImageFile, 
  blobToFile 
} from '../utils/imageOptimizer';

/**
 * 📤 Servicio de gestión de imágenes de entidades
 * - Sube imágenes a Supabase Storage
 * - Optimiza automáticamente (imagen completa + miniatura)
 * - Actualiza la tabla entities con las URLs
 */

/**
 * Sube una imagen de entidad a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>}
 */
export async function uploadEntityImage(file, entityId) {
  try {
    // 1. Validar archivo
    validateImageFile(file);
    
    console.log('📤 Subiendo imagen para entidad:', entityId);
    console.log('📦 Tamaño original:', (file.size / 1024).toFixed(2), 'KB');
    
    // 2. Detectar formato de archivo (PNG o JPEG)
    const isPNG = file.type === 'image/png';
    const ext = isPNG ? 'png' : 'jpg';
    const contentType = isPNG ? 'image/png' : 'image/jpeg';
    
    // 3. Optimizar imagen principal (mantiene transparencia si es PNG)
    console.log('🔧 Optimizando imagen principal...');
    const optimizedBlob = await resizeImage(file, 800, 800, 0.95);
    const optimizedFile = blobToFile(
      optimizedBlob, 
      `${entityId}-original.${ext}`
    );
    console.log('✅ Imagen optimizada:', (optimizedBlob.size / 1024).toFixed(2), 'KB');
    
    // 4. Crear miniatura (mantiene transparencia y tamaño pequeño)
    console.log('🔧 Creando miniatura...');
    const thumbnailBlob = await createThumbnail(file, 200);
    const thumbnailFile = blobToFile(
      thumbnailBlob, 
      `${entityId}-thumbnail.${ext}`
    );
    console.log('✅ Miniatura creada:', (thumbnailBlob.size / 1024).toFixed(2), 'KB');
    
    // 5. Subir imagen principal
    
    const imagePath = `entities/${entityId}/image.${ext}`;
    const { error: imageError } = await supabase.storage
      .from('entity-images')
      .upload(imagePath, optimizedFile, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true, // Reemplazar si ya existe
      });
    
    if (imageError) {
      console.error('❌ Error al subir imagen:', imageError);
      throw new Error(`Error al subir imagen: ${imageError.message}`);
    }
    
    console.log('✅ Imagen principal subida');
    
    // 6. Subir miniatura
    const thumbnailPath = `entities/${entityId}/thumbnail.${ext}`;
    const { error: thumbError } = await supabase.storage
      .from('entity-images')
      .upload(thumbnailPath, thumbnailFile, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true,
      });
    
    if (thumbError) {
      console.error('❌ Error al subir miniatura:', thumbError);
      throw new Error(`Error al subir miniatura: ${thumbError.message}`);
    }
    
    console.log('✅ Miniatura subida');
    
    // 7. Obtener URLs públicas
    const { data: imageData } = supabase.storage
      .from('entity-images')
      .getPublicUrl(imagePath);
    
    const { data: thumbData } = supabase.storage
      .from('entity-images')
      .getPublicUrl(thumbnailPath);
    
    const imageUrl = imageData.publicUrl;
    const thumbnailUrl = thumbData.publicUrl;
    
    console.log('🔗 URL imagen:', imageUrl);
    console.log('🔗 URL miniatura:', thumbnailUrl);
    
    // 8. Actualizar tabla entities con las URLs
    const { error: updateError } = await supabase
      .from('entities')
      .update({
        image_url: imageUrl,
        image_thumbnail_url: thumbnailUrl,
      })
      .eq('id', entityId);
    
    if (updateError) {
      console.error('❌ Error al actualizar entidad:', updateError);
      throw new Error(`Error al actualizar entidad: ${updateError.message}`);
    }
    
    console.log('✅ Entidad actualizada con URLs de imágenes');
    
    return {
      imageUrl,
      thumbnailUrl,
    };
    
  } catch (error) {
    console.error('❌ Error en uploadEntityImage:', error);
    throw error;
  }
}

/**
 * Elimina la imagen de una entidad
 * @param {string} entityId - ID de la entidad
 */
export async function deleteEntityImage(entityId) {
  try {
    // Eliminar archivos de Storage
    const paths = [
      `entities/${entityId}/image.jpg`,
      `entities/${entityId}/thumbnail.jpg`,
    ];
    
    const { error } = await supabase.storage
      .from('entity-images')
      .remove(paths);
    
    if (error) {
      console.error('Error al eliminar imágenes:', error);
      throw error;
    }
    
    // Actualizar tabla entities
    await supabase
      .from('entities')
      .update({
        image_url: null,
        image_thumbnail_url: null,
      })
      .eq('id', entityId);
    
    console.log('✅ Imagen eliminada correctamente');
    
  } catch (error) {
    console.error('❌ Error al eliminar imagen:', error);
    throw error;
  }
}

/**
 * Obtiene la URL de la imagen de una entidad
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<{imageUrl: string|null, thumbnailUrl: string|null}>}
 */
export async function getEntityImageUrls(entityId) {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('image_url, image_thumbnail_url')
      .eq('id', entityId)
      .single();
    
    if (error) throw error;
    
    return {
      imageUrl: data?.image_url || null,
      thumbnailUrl: data?.image_thumbnail_url || null,
    };
    
  } catch (error) {
    console.error('Error al obtener URLs de imagen:', error);
    return { imageUrl: null, thumbnailUrl: null };
  }
}

