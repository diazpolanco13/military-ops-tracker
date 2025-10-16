import { supabase } from '../lib/supabase';

/**
 * 🎥 Servicio de gestión de videos de entidades
 * - Sube videos a Supabase Storage
 * - Actualiza la tabla entities con la URL del video
 */

/**
 * Sube un video de entidad a Supabase Storage
 * @param {File} file - Archivo de video (.webm, .mp4, etc.)
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<{videoUrl: string}>}
 */
export async function uploadEntityVideo(file, entityId) {
  try {
    // 1. Validar archivo de video
    if (!file.type.startsWith('video/')) {
      throw new Error('El archivo debe ser un video válido');
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('El video no puede superar los 50MB');
    }

    console.log('📤 Subiendo video para entidad:', entityId);
    console.log('📦 Tamaño del video:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    // 2. Determinar extensión del archivo
    const fileName = file.name.toLowerCase();
    let ext = 'webm'; // default

    if (fileName.endsWith('.mp4')) ext = 'mp4';
    else if (fileName.endsWith('.webm')) ext = 'webm';
    else if (fileName.endsWith('.mov')) ext = 'mov';
    else if (fileName.endsWith('.avi')) ext = 'avi';

    const contentType = file.type;

    // 3. Crear nombre único para el archivo
    const videoFileName = `${entityId}-${Date.now()}.${ext}`;
    const videoPath = `videos/${videoFileName}`;

    // 4. Subir video a Supabase Storage
    console.log('🔧 Subiendo video a storage...');
    const { error: uploadError } = await supabase.storage
      .from('entity-videos')
      .upload(videoPath, file, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true, // Reemplazar si ya existe
      });

    if (uploadError) {
      console.error('❌ Error al subir video:', uploadError);
      throw new Error(`Error al subir video: ${uploadError.message}`);
    }

    console.log('✅ Video subido correctamente');

    // 5. Obtener URL pública
    const { data } = supabase.storage
      .from('entity-videos')
      .getPublicUrl(videoPath);

    const videoUrl = data.publicUrl;
    console.log('🔗 URL del video:', videoUrl);

    // 6. Actualizar tabla entities con la URL del video
    const { error: updateError } = await supabase
      .from('entities')
      .update({
        video_url: videoUrl,
      })
      .eq('id', entityId);

    if (updateError) {
      console.error('❌ Error al actualizar entidad:', updateError);
      throw new Error(`Error al actualizar entidad: ${updateError.message}`);
    }

    console.log('✅ Entidad actualizada con URL del video');

    return {
      videoUrl,
    };

  } catch (error) {
    console.error('❌ Error en uploadEntityVideo:', error);
    throw error;
  }
}

/**
 * Elimina el video de una entidad
 * @param {string} entityId - ID de la entidad
 */
export async function deleteEntityVideo(entityId) {
  try {
    // Obtener la URL actual del video para extraer el path
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('video_url')
      .eq('id', entityId)
      .single();

    if (fetchError || !entity?.video_url) {
      console.log('No hay video para eliminar');
      return;
    }

    // Extraer el path del video de la URL
    const url = new URL(entity.video_url);
    const pathParts = url.pathname.split('/');
    const videoPath = pathParts.slice(-2).join('/'); // Obtener "videos/filename.ext"

    // Eliminar archivo de Storage
    const { error: storageError } = await supabase.storage
      .from('entity-videos')
      .remove([videoPath]);

    if (storageError) {
      console.error('Error al eliminar video del storage:', storageError);
      // No lanzamos error aquí para continuar con la actualización de la BD
    }

    // Actualizar tabla entities
    const { error: updateError } = await supabase
      .from('entities')
      .update({
        video_url: null,
      })
      .eq('id', entityId);

    if (updateError) {
      console.error('❌ Error al actualizar entidad:', updateError);
      throw new Error(`Error al actualizar entidad: ${updateError.message}`);
    }

    console.log('✅ Video eliminado correctamente');

  } catch (error) {
    console.error('❌ Error al eliminar video:', error);
    throw error;
  }
}

/**
 * Obtiene la URL del video de una entidad
 * @param {string} entityId - ID de la entidad
 * @returns {Promise<{videoUrl: string|null}>}
 */
export async function getEntityVideoUrl(entityId) {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('video_url')
      .eq('id', entityId)
      .single();

    if (error) throw error;

    return {
      videoUrl: data?.video_url || null,
    };

  } catch (error) {
    console.error('Error al obtener URL del video:', error);
    return { videoUrl: null };
  }
}
