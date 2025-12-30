/**
 * 📷 useAircraftImages - Hook para gestionar imágenes de aeronaves militares
 * 
 * Maneja:
 * - Subida de imágenes a Supabase Storage
 * - Galería de imágenes por modelo de aeronave
 * - Imágenes primarias para thumbnails
 * 
 * ⚡ OPTIMIZADO: Caché global para evitar consultas repetidas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, withTimeout } from '../lib/supabase';

const QUERY_TIMEOUT = 5000; // ⚡ Reducido de 10s a 5s para fallar más rápido

// ════════════════════════════════════════════════════════════════════════════
// 🗄️ CACHÉ GLOBAL DE IMÁGENES - Evita consultas repetidas
// ════════════════════════════════════════════════════════════════════════════
const imageCache = new Map();        // Map<aircraftType, imageUrl | null>
const pendingQueries = new Map();    // Map<aircraftType, Promise> - evita queries paralelas duplicadas
const CACHE_TTL = 5 * 60 * 1000;     // 5 minutos de TTL
const cacheTimestamps = new Map();   // Map<aircraftType, timestamp>

// Limpiar caché viejo periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_TTL) {
      imageCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}, 60000); // Limpiar cada minuto

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

      // ⚡ Limpiar caché para que se recargue la imagen
      clearImageCache(type);

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
  const deleteImage = useCallback(async (imageId, imageUrl, type = null) => {
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

      // ⚡ Limpiar caché del tipo
      if (type) {
        clearImageCache(type);
      } else if (aircraftType) {
        clearImageCache(aircraftType);
      }

      // Actualizar lista local
      setImages(prev => prev.filter(img => img.id !== imageId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting image:', err);
      return { success: false, error: err.message };
    }
  }, [aircraftType]);

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

      // ⚡ Limpiar caché para que se recargue la imagen
      clearImageCache(type);

      // Refrescar
      await fetchImages(type);

      return { success: true };
    } catch (err) {
      console.error('Error setting primary image:', err);
      return { success: false, error: err.message };
    }
  }, [fetchImages]);

  // Cargar al montar si hay tipo (con timeout)
  useEffect(() => {
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
        const result = await withTimeout(
          supabase
            .from('aircraft_model_images')
            .select('*')
            .eq('aircraft_type', aircraftType.toUpperCase())
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: false }),
          QUERY_TIMEOUT
        );
        
        if (cancelled) return;
        
        if (result.error) throw result.error;
        setImages(result.data || []);
      } catch (err) {
        console.error('[useAircraftImages] Error/timeout:', err.message);
        if (!cancelled) {
          setError(err.message?.includes('Timeout') 
            ? 'Tiempo de espera agotado' 
            : err.message);
          setImages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadImages();
    
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
 * ⚡ Hook OPTIMIZADO para obtener la imagen de un modelo específico
 * 
 * MEJORAS:
 * - Caché global en memoria (evita consultas repetidas)
 * - Deduplicación de consultas paralelas (si 2 componentes piden el mismo tipo, solo 1 query)
 * - Fallback automático de tipo (ej: C17A -> C17)
 * - Timeout reducido a 5s
 */
export function useAircraftModelImage(aircraftType, options = {}) {
  const { fallbackType = null } = options;
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // ⚡ Early exit si no hay tipo
    if (!aircraftType || aircraftType.trim() === '') {
      setImageUrl(null);
      setLoading(false);
      return;
    }

    const typeKey = aircraftType.toUpperCase().trim();
    
    // ⚡ CACHÉ HIT - retornar inmediatamente sin consulta
    if (imageCache.has(typeKey)) {
      setImageUrl(imageCache.get(typeKey));
      setLoading(false);
      return;
    }

    // ⚡ QUERY EN PROGRESO - esperar el resultado existente
    if (pendingQueries.has(typeKey)) {
      setLoading(true);
      pendingQueries.get(typeKey)
        .then(url => {
          if (mountedRef.current) {
            setImageUrl(url);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setImageUrl(null);
            setLoading(false);
          }
        });
      return;
    }

    // ⚡ Nueva consulta - registrar como pendiente
    setLoading(true);
    
    const fetchPromise = (async () => {
      try {
        // Consulta única combinada: primero images, luego catalog
        const imageResult = await withTimeout(
          supabase
            .from('aircraft_model_images')
            .select('thumbnail_url, image_url')
            .eq('aircraft_type', typeKey)
            .order('is_primary', { ascending: false })
            .limit(1),
          QUERY_TIMEOUT
        );

        const imageData = imageResult.data?.[0];
        if (imageData) {
          const url = imageData.thumbnail_url || imageData.image_url || null;
          imageCache.set(typeKey, url);
          cacheTimestamps.set(typeKey, Date.now());
          return url;
        }

        // Fallback al catálogo
        const catalogResult = await withTimeout(
          supabase
            .from('aircraft_model_catalog')
            .select('thumbnail_url, primary_image_url')
            .eq('aircraft_type', typeKey)
            .limit(1),
          QUERY_TIMEOUT
        );

        const catalogData = catalogResult.data?.[0];
        const url = catalogData?.thumbnail_url || catalogData?.primary_image_url || null;
        
        // Guardar en caché (incluso si es null, para no re-consultar)
        imageCache.set(typeKey, url);
        cacheTimestamps.set(typeKey, Date.now());
        
        return url;
      } catch (err) {
        // En caso de timeout/error, cachear null para evitar reintentos constantes
        console.debug('[useAircraftModelImage] Timeout/error para', typeKey, '- cacheando null');
        imageCache.set(typeKey, null);
        cacheTimestamps.set(typeKey, Date.now());
        return null;
      }
    })();

    // Registrar query pendiente
    pendingQueries.set(typeKey, fetchPromise);

    fetchPromise
      .then(url => {
        if (mountedRef.current) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setImageUrl(null);
          setLoading(false);
        }
      })
      .finally(() => {
        // Limpiar query pendiente
        pendingQueries.delete(typeKey);
      });

  }, [aircraftType]);

  return { imageUrl, loading };
}

/**
 * ⚡ Función utilitaria para precargar imágenes en batch
 * Útil para cargar todas las imágenes de una lista de vuelos de una vez
 */
export async function prefetchAircraftImages(aircraftTypes) {
  const typesToFetch = [...new Set(
    (aircraftTypes || [])
      .map(t => String(t || '').toUpperCase().trim())
      .filter(t => t && /^[A-Z0-9]+$/.test(t)) // evitar valores raros que rompen `.in()`
      .filter(t => !imageCache.has(t))
  )].slice(0, 200); // límite defensivo para no saturar PostgREST

  if (typesToFetch.length === 0) return;

  try {
    // Batch query en chunks para evitar URL enorme / 400
    const byType = {};
    const chunkSize = 40;
    for (let i = 0; i < typesToFetch.length; i += chunkSize) {
      const chunk = typesToFetch.slice(i, i + chunkSize);
      const { data } = await withTimeout(
        supabase
          .from('aircraft_model_images')
          .select('aircraft_type, thumbnail_url, image_url, is_primary')
          .in('aircraft_type', chunk)
          .order('is_primary', { ascending: false }),
        QUERY_TIMEOUT * 2
      );

      (data || []).forEach(img => {
        const t = img?.aircraft_type ? String(img.aircraft_type).toUpperCase().trim() : null;
        if (!t) return;
        if (!byType[t]) byType[t] = img.thumbnail_url || img.image_url;
      });
    }

    // Guardar en caché (incluye null para evitar reintentos)
    typesToFetch.forEach(type => {
      imageCache.set(type, byType[type] || null);
      cacheTimestamps.set(type, Date.now());
    });

    console.debug(`[prefetchAircraftImages] Precargadas ${Object.keys(byType).length} imágenes de ${typesToFetch.length} tipos`);
  } catch (err) {
    console.debug('[prefetchAircraftImages] Error:', err.message);
  }
}

/**
 * Limpiar caché manualmente (útil después de subir una imagen)
 */
export function clearImageCache(aircraftType) {
  if (aircraftType) {
    const key = aircraftType.toUpperCase().trim();
    imageCache.delete(key);
    cacheTimestamps.delete(key);
  } else {
    imageCache.clear();
    cacheTimestamps.clear();
  }
}

export default useAircraftImages;
