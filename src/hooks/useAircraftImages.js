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
   * NOTA: Esta función se usa para refrescar después de upload/delete
   */
  const fetchImages = useCallback(async (type) => {
    const typeToFetch = type || aircraftType;
    if (!typeToFetch) {
      setImages([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('aircraft_model_images')
        .select('*')
        .eq('aircraft_type', typeToFetch.toUpperCase())
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (queryError) throw queryError;
      setImages(data || []);
    } catch (err) {
      console.error('Error fetching aircraft images:', err);
      setError(err.message);
      setImages([]);
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
  const setPrimaryImage = useCallback(async (imageId, type) => {
    try {
      // Quitar primary de todas
      await supabase
        .from('aircraft_model_images')
        .update({ is_primary: false })
        .eq('aircraft_type', type.toUpperCase());

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
          .eq('aircraft_type', type.toUpperCase());
      }

      // Refrescar
      await fetchImages(type);

      return { success: true };
    } catch (err) {
      console.error('Error setting primary image:', err);
      return { success: false, error: err.message };
    }
  }, [fetchImages]);

  // Cargar al montar si hay tipo
  useEffect(() => {
    // Bandera local para este efecto específico
    let cancelled = false;
    
    if (!aircraftType) {
      setImages([]);
      setLoading(false);
      return;
    }
    
    const loadImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: queryError } = await supabase
          .from('aircraft_model_images')
          .select('*')
          .eq('aircraft_type', aircraftType.toUpperCase())
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });
        
        // Si el efecto fue cancelado, no actualizar estado
        if (cancelled) return;
        
        if (queryError) throw queryError;
        setImages(data || []);
      } catch (err) {
        console.error('[useAircraftImages] Error:', err);
        if (!cancelled) {
          setError(err.message);
          setImages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadImages();
    
    // Cleanup: cancelar esta petición específica
    return () => {
      cancelled = true;
    };
  }, [aircraftType]);

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
    let cancelled = false;
    
    if (!aircraftType) {
      setImageUrl(null);
      return;
    }

    const fetchImage = async () => {
      setLoading(true);
      try {
        // Primero buscar en aircraft_model_images (sin `.single()` para evitar 406 cuando no hay filas)
        const { data: imageRows } = await supabase
          .from('aircraft_model_images')
          .select('thumbnail_url, image_url')
          .eq('aircraft_type', aircraftType.toUpperCase())
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        if (cancelled) return;

        const imageData = imageRows?.[0] || null;
        if (imageData) {
          setImageUrl(imageData.thumbnail_url || imageData.image_url || null);
          setLoading(false);
          return;
        }

        // Si no hay, buscar en el catálogo
        const { data: catalogRows } = await supabase
          .from('aircraft_model_catalog')
          .select('thumbnail_url, primary_image_url')
          .eq('aircraft_type', aircraftType.toUpperCase())
          .limit(1);

        if (cancelled) return;

        const catalogData = catalogRows?.[0] || null;
        if (catalogData) {
          setImageUrl(catalogData.thumbnail_url || catalogData.primary_image_url || null);
        }
      } catch (err) {
        // Silencioso - simplemente no hay imagen
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchImage();
    
    return () => {
      cancelled = true;
    };
  }, [aircraftType]);

  return { imageUrl, loading };
}

export default useAircraftImages;
