import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 🫥 Hook para gestionar entidades ocultas
 * Optimizado: usa RealtimeManager centralizado
 */
export function useHiddenEntities() {
  const [hiddenEntities, setHiddenEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📡 Función para cargar entidades ocultas
  const fetchHiddenEntities = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('is_visible', false)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHiddenEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar entidades ocultas:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // 🔄 Mostrar una entidad oculta
  const showEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ is_visible: true })
        .eq('id', entityId);

      if (error) throw error;

      setHiddenEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      if (window.refetchEntities) {
        window.refetchEntities();
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al mostrar entidad:', err);
      return { success: false, error: err.message };
    }
  };

  // 🔄 Mostrar todas las entidades ocultas
  const showAllEntities = async () => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ is_visible: true })
        .eq('is_visible', false)
        .is('archived_at', null);

      if (error) throw error;

      setHiddenEntities([]);
      
      if (window.refetchEntities) {
        window.refetchEntities();
      }
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al mostrar todas las entidades:', err);
      return { success: false, error: err.message };
    }
  };

  // 🔄 Archivar una entidad oculta
  const archiveEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ 
          archived_at: new Date().toISOString(),
          is_visible: false
        })
        .eq('id', entityId);

      if (error) throw error;

      setHiddenEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al archivar entidad:', err);
      return { success: false, error: err.message };
    }
  };

  // 🔄 Eliminar permanentemente una entidad oculta
  const deleteEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId);

      if (error) throw error;

      setHiddenEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar entidad:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchHiddenEntities();

    // 🔄 Suscripción centralizada
    const unsubscribe = realtimeManager.subscribe('entities', (payload) => {
      if (payload.eventType === 'INSERT') {
        if (payload.new.is_visible === false && !payload.new.archived_at) {
          setHiddenEntities(prev => [payload.new, ...prev]);
        }
      } else if (payload.eventType === 'UPDATE') {
        if (payload.new.is_visible === true || payload.new.archived_at) {
          setHiddenEntities(prev => prev.filter(entity => entity.id !== payload.new.id));
        } else if (payload.new.is_visible === false && !payload.new.archived_at) {
          setHiddenEntities(prev => {
            const exists = prev.find(entity => entity.id === payload.new.id);
            if (!exists) {
              return [payload.new, ...prev];
            }
            return prev.map(entity => 
              entity.id === payload.new.id ? payload.new : entity
            );
          });
        }
      } else if (payload.eventType === 'DELETE') {
        setHiddenEntities(prev => prev.filter(entity => entity.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchHiddenEntities]);

  // 📊 Obtener estadísticas por tipo
  const getEntityCountsByType = () => {
    return hiddenEntities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {});
  };

  return {
    hiddenEntities,
    loading,
    error,
    refetch: fetchHiddenEntities,
    showEntity,
    showAllEntities,
    archiveEntity,
    deleteEntity,
    count: hiddenEntities.length,
    getEntityCountsByType,
  };
}
