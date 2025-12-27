/**
 * 📷 useAircraftImages - Hook para gestionar imágenes de aeronaves militares
 * 
 * Maneja:
 * - Subida de imágenes a Supabase Storage
 * - Galería de imágenes por modelo de aeronave
 * - Imágenes primarias para thumbnails
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'entity-images';
const AIRCRAFT_FOLDER = 'aircraft';

/**
 * Hook principal para imágenes de aeronaves
 */
export function useAircraftImages(aircraftType = null) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar imágenes para un tipo de aeronave
   */
  const fetchImages = useCallback(async (type = aircraftType) => {
    if (!type) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('aircraft_model_images')
        .select('*')
        .eq('aircraft_type', type.toUpperCase())
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (queryError) throw queryError;
      setImages(data || []);
    } catch (err) {
      console.error('Error fetching aircraft images:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [aircraftType]);

  /**
   * Subir una imagen
   */
  const uploadImage = useCallback(async (file, options = {}) => {
    const { 
      aircraftType: type, 
      aircraftModel, 
      caption = '', 
      source = 'User Upload',
      isPrimary = false 
    } = options;

    if (!type || !file) {
      return { success: false, error: 'Tipo de aeronave y archivo requeridos' };
    }

    setUploading(true);
    setError(null);

    try {
      // Generar nombre único
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${AIRCRAFT_FOLDER}/${type.toUpperCase()}/${timestamp}.${fileExt}`;

      // Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Crear thumbnail URL (misma imagen por ahora, podría optimizarse)
      const thumbnailUrl = imageUrl;

      // Si es primary, quitar el flag de otras imágenes del mismo tipo
      if (isPrimary) {
        await supabase
          .from('aircraft_model_images')
          .update({ is_primary: false })
          .eq('aircraft_type', type.toUpperCase());
      }

      // Guardar en BD
      const { data: imageRecord, error: dbError } = await supabase
        .from('aircraft_model_images')
        .insert({
          aircraft_type: type.toUpperCase(),
          aircraft_model: aircraftModel || type,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          image_source: source,
          image_caption: caption,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Si es primary, actualizar el catálogo
      if (isPrimary) {
        await supabase
          .from('aircraft_model_catalog')
          .update({ 
            primary_image_url: imageUrl,
            thumbnail_url: thumbnailUrl 
          })
          .eq('aircraft_type', type.toUpperCase());
      }

      // Refrescar lista
      await fetchImages(type);

      return { success: true, data: imageRecord };
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  }, [fetchImages]);

  /**
   * Eliminar una imagen
   */
  const deleteImage = useCallback(async (imageId, imageUrl) => {
    try {
      // Extraer path del storage desde la URL
      const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
      const filePath = urlParts[1];

      // Eliminar del storage
      if (filePath) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);
      }

      // Eliminar de BD
      const { error: dbError } = await supabase
        .from('aircraft_model_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Actualizar lista local
      setImages(prev => prev.filter(img => img.id !== imageId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting image:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Establecer imagen como primaria
   */
  const setPrimaryImage = useCallback(async (imageId, aircraftType) => {
    try {
      // Quitar primary de todas
      await supabase
        .from('aircraft_model_images')
        .update({ is_primary: false })
        .eq('aircraft_type', aircraftType.toUpperCase());

      // Establecer la nueva primary
      const { data, error: updateError } = await supabase
        .from('aircraft_model_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Actualizar catálogo
      if (data) {
        await supabase
          .from('aircraft_model_catalog')
          .update({ 
            primary_image_url: data.image_url,
            thumbnail_url: data.thumbnail_url 
          })
          .eq('aircraft_type', aircraftType.toUpperCase());
      }

      // Refrescar
      await fetchImages(aircraftType);

      return { success: true };
    } catch (err) {
      console.error('Error setting primary image:', err);
      return { success: false, error: err.message };
    }
  }, [fetchImages]);

  // Cargar al montar si hay tipo
  useEffect(() => {
    if (aircraftType) {
      fetchImages();
    }
  }, [aircraftType, fetchImages]);

  // Imagen primaria
  const primaryImage = images.find(img => img.is_primary) || images[0] || null;

  return {
    images,
    primaryImage,
    loading,
    uploading,
    error,
    fetchImages,
    uploadImage,
    deleteImage,
    setPrimaryImage,
  };
}

/**
 * Hook para obtener la imagen de un modelo específico
 */
export function useAircraftModelImage(aircraftType) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!aircraftType) return;

    const fetchImage = async () => {
      setLoading(true);
      try {
        // Primero buscar en aircraft_model_images
        const { data: imageData } = await supabase
          .from('aircraft_model_images')
          .select('thumbnail_url, image_url')
          .eq('aircraft_type', aircraftType.toUpperCase())
          .eq('is_primary', true)
          .single();

        if (imageData) {
          setImageUrl(imageData.thumbnail_url || imageData.image_url);
          return;
        }

        // Si no hay, buscar en el catálogo
        const { data: catalogData } = await supabase
          .from('aircraft_model_catalog')
          .select('thumbnail_url, primary_image_url')
          .eq('aircraft_type', aircraftType.toUpperCase())
          .single();

        if (catalogData) {
          setImageUrl(catalogData.thumbnail_url || catalogData.primary_image_url);
        }
      } catch (err) {
        // Silencioso - simplemente no hay imagen
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [aircraftType]);

  return { imageUrl, loading };
}

export default useAircraftImages;

