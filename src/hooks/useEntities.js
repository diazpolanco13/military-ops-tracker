import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 🎯 Hook para obtener entidades militares desde Supabase
 * Optimizado: usa RealtimeManager centralizado para evitar canales duplicados
 */
export function useEntities() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📡 Función para cargar entidades (extraída para reutilizar)
  const fetchEntities = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('is_visible', true)
        .is('archived_at', null)
        .order('created_at', { ascending: false }) // Ordenar por más recientes primero
        .limit(500); // ✅ OPTIMIZACIÓN: Limitar a 500 entidades más recientes

      if (error) throw error;

      setEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar entidades:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();

    // 🔄 Suscripción centralizada usando RealtimeManager
    const unsubscribe = realtimeManager.subscribe('entities', (payload) => {
      console.log('🔄 Cambio detectado:', payload.eventType);

      if (payload.eventType === 'INSERT') {
        // Solo agregar si es visible y no archivada
        if (payload.new?.is_visible && !payload.new?.archived_at) {
          setEntities((prev) => [...prev, payload.new]);
        }
      } else if (payload.eventType === 'UPDATE') {
        setEntities((prev) => {
          const updated = payload.new;
          // Si dejó de ser visible o fue archivada, removerla
          if (!updated.is_visible || updated.archived_at) {
            return prev.filter((e) => e.id !== updated.id);
          }
          // Si ya existía, actualizarla
          const exists = prev.some((e) => e.id === updated.id);
          if (exists) {
            return prev.map((e) => (e.id === updated.id ? updated : e));
          }
          // Si no existía pero ahora es visible, agregarla
          return [...prev, updated];
        });
      } else if (payload.eventType === 'DELETE') {
        setEntities((prev) => prev.filter((e) => e.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchEntities]);

  // Función para agregar una entidad manualmente (sin refetch completo)
  const addEntity = (newEntity) => {
    setEntities((prev) => [...prev, newEntity]);
  };

  // Función para remover una entidad del estado
  const removeEntity = (entityId) => {
    setEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  return { entities, loading, error, refetch: fetchEntities, addEntity, removeEntity };
}
