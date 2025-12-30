import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 🔢 Hook para obtener el conteo de entidades archivadas
 * Optimizado: usa RealtimeManager centralizado sin polling agresivo
 */
export function useArchivedCount() {
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 📡 Función para obtener solo el conteo
  const fetchArchivedCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .not('archived_at', 'is', null);

      if (error) throw error;
      setArchivedCount(count || 0);
    } catch (err) {
      console.error('❌ Error al obtener conteo de archivadas:', err);
      setArchivedCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch inicial
    fetchArchivedCount();

    // 🔄 Suscripción centralizada (sin crear canal duplicado)
    const unsubscribe = realtimeManager.subscribe('entities', (payload) => {
      // Solo actualizar si el cambio afecta archivado
      if (
        payload.new?.archived_at !== payload.old?.archived_at ||
        payload.eventType === 'DELETE'
      ) {
        fetchArchivedCount();
      }
    });

    // ELIMINADO: El polling cada 5 segundos que saturaba la API

    return () => {
      unsubscribe();
    };
  }, [fetchArchivedCount]);

  return {
    archivedCount,
    loading,
    refetch: fetchArchivedCount,
  };
}
