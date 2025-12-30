import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 🔢 Hook para obtener el conteo de entidades ocultas
 * Optimizado: usa RealtimeManager centralizado sin polling agresivo
 */
export function useHiddenCount() {
  const [hiddenCount, setHiddenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 📡 Función para obtener solo el conteo
  const fetchHiddenCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('is_visible', false)
        .is('archived_at', null);

      if (error) throw error;
      setHiddenCount(count || 0);
    } catch (err) {
      console.error('❌ Error al obtener conteo de ocultas:', err);
      setHiddenCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch inicial
    fetchHiddenCount();

    // 🔄 Suscripción centralizada (sin crear canal duplicado)
    const unsubscribe = realtimeManager.subscribe('entities', (payload) => {
      // Solo actualizar si el cambio afecta visibilidad
      if (
        payload.new?.is_visible !== payload.old?.is_visible ||
        payload.new?.archived_at !== payload.old?.archived_at ||
        payload.eventType === 'DELETE'
      ) {
        fetchHiddenCount();
      }
    });

    // ELIMINADO: El polling cada 5 segundos que saturaba la API
    // El RealtimeManager ya maneja reconexiones automáticas

    return () => {
      unsubscribe();
    };
  }, [fetchHiddenCount]);

  return {
    hiddenCount,
    loading,
    refetch: fetchHiddenCount,
  };
}
