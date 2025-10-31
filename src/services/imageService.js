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
    console.log('📤 Subiendo archivo para entidad:', entityId);
    console.log('📦 Tamaño original:', (file.size / 1024).toFixed(2), 'KB');
    
    // Detectar si es video o imagen
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(webm|mp4)$/i);
    
    if (isVideo) {
      // Para videos, subir directamente sin optimización
      return await uploadVideoFile(file, entityId);
    }
    
    // 1. Validar archivo de imagen
    validateImageFile(file);
    
    // 2. Detectar formato de archivo (PNG o JPEG)
    const isPNG = file.type === 'image/png';
    const ext = isPNG ? 'png' : 'jpg';
    const contentType = isPNG ? 'image/png' : 'image/jpeg';
    
    // 3. Optimizar imagen principal (alta calidad para modales/cards)
    console.log('🔧 Optimizando imagen principal...');
    const optimizedBlob = await resizeImage(file, 1200, 1200, 0.90); // Alta calidad para modales
    const optimizedFile = blobToFile(
      optimizedBlob, 
      `${entityId}-original.${ext}`
    );
    console.log('✅ Imagen optimizada:', (optimizedBlob.size / 1024).toFixed(2), 'KB');
    
    // 4. Crear miniatura (pequeña para iconos de mapa)
    console.log('🔧 Creando miniatura...');
    const thumbnailBlob = await createThumbnail(file, 200); // Miniatura para iconos del mapa
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
    
    // 8. Actualizar tabla entities con las URLs (solo si NO es template temporal)
    const isTemplate = entityId.startsWith('template-');
    
    if (!isTemplate) {
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
    } else {
      console.log('✅ Upload para plantilla - skip actualización de BD');
    }
    
    return {
      full: imageUrl,
      thumbnail: thumbnailUrl,
      imageUrl, // Mantener compatibilidad
      thumbnailUrl,
    };
    
  } catch (error) {
    console.error('❌ Error en uploadEntityImage:', error);
    throw error;
  }
}

/**
 * Sube un video (WEBM/MP4) sin optimización
 * @param {File} file - Archivo de video
 * @param {string} entityId - ID de la entidad o template
 * @returns {Promise<{full: string, thumbnail: string}>}
 */
async function uploadVideoFile(file, entityId) {
  try {
    const ext = file.name.match(/\.(webm|mp4)$/i)?.[1] || 'webm';
    const videoPath = `entities/${entityId}/video.${ext}`;
    
    console.log('🎬 Subiendo video...');
    
    // Subir video directamente al bucket de videos
    const { error: uploadError } = await supabase.storage
      .from('entity-videos')
      .upload(videoPath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });
    
    if (uploadError) {
      throw new Error(`Error al subir video: ${uploadError.message}`);
    }
    
    console.log('✅ Video subido');
    
    // Obtener URL pública del bucket de videos
    const { data } = supabase.storage
      .from('entity-videos')
      .getPublicUrl(videoPath);
    
    const videoUrl = data.publicUrl;
    console.log('🔗 URL video:', videoUrl);
    
    // No actualizar BD si es template
    const isTemplate = entityId.startsWith('template-');
    
    if (!isTemplate) {
      const { error: updateError } = await supabase
        .from('entities')
        .update({ video_url: videoUrl }) // ← CORREGIDO: video_url en vez de image_url
        .eq('id', entityId);
      
      if (updateError) {
        console.error('⚠️ Error al actualizar entidad con video:', updateError);
      } else {
        console.log('✅ Entidad actualizada con video_url');
      }
    }
    
    return {
      full: videoUrl,
      thumbnail: videoUrl, // Para videos, usar mismo URL
      videoUrl: videoUrl, // ← AÑADIDO: devolver videoUrl
      imageUrl: videoUrl, // Mantener compatibilidad
      thumbnailUrl: videoUrl,
    };
    
  } catch (error) {
    console.error('❌ Error en uploadVideoFile:', error);
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

