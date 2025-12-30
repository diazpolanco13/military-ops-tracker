import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 🗃️ Hook para gestionar entidades archivadas
 * Optimizado: usa RealtimeManager centralizado
 */
export function useArchivedEntities() {
  const [archivedEntities, setArchivedEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📡 Función para cargar entidades archivadas
  const fetchArchivedEntities = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      setArchivedEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar entidades archivadas:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedEntities();

    // 🔄 Suscripción centralizada
    const unsubscribe = realtimeManager.subscribe('entities', (payload) => {
      // Solo recargar si el cambio afecta archivado
      if (
        payload.new?.archived_at !== payload.old?.archived_at ||
        payload.eventType === 'DELETE'
      ) {
        fetchArchivedEntities(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchArchivedEntities]);

  // 🔄 Restaurar una entidad archivada
  const restoreEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ 
          archived_at: null,
          is_visible: true
        })
        .eq('id', entityId);

      if (error) throw error;

      setArchivedEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      if (window.refetchEntities) {
        window.refetchEntities();
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al restaurar entidad:', err);
      return { success: false, error: err.message };
    }
  };

  // 🔄 Restaurar todas las entidades archivadas
  const restoreAllEntities = async () => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ 
          archived_at: null,
          is_visible: true
        })
        .not('archived_at', 'is', null);

      if (error) throw error;

      setArchivedEntities([]);
      
      if (window.refetchEntities) {
        window.refetchEntities();
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al restaurar todas las entidades:', err);
      return { success: false, error: err.message };
    }
  };

  // 🔄 Eliminar permanentemente una entidad archivada
  const deleteArchivedEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId);

      if (error) throw error;

      setArchivedEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar entidad archivada:', err);
      return { success: false, error: err.message };
    }
  };

  // 📊 Obtener estadísticas por tipo
  const getEntityCountsByType = () => {
    return archivedEntities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {});
  };

  return {
    archivedEntities,
    loading,
    error,
    restoreEntity,
    restoreAllEntities,
    deleteArchivedEntity,
    count: archivedEntities.length,
    getEntityCountsByType,
    refetch: fetchArchivedEntities,
  };
}
