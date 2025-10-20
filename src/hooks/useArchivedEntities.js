import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEntityActions } from './useEntityActions';

/**
 * 🗃️ Hook para gestionar entidades archivadas
 * Permite restaurar y eliminar permanentemente entidades archivadas
 */
export function useArchivedEntities() {
  const [archivedEntities, setArchivedEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { deleteEntity } = useEntityActions();

  // 📡 Función para cargar entidades archivadas
  const fetchArchivedEntities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .not('archived_at', 'is', null) // Solo archivadas
        .order('archived_at', { ascending: false }); // Más recientes primero

      if (error) throw error;

      setArchivedEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar entidades archivadas:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedEntities();

    // 🔄 Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('archived_entities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
        },
        (payload) => {
          console.log('🔄 Cambio detectado en entidades archivadas:', payload);
          // Actualizar después de cualquier cambio
          setTimeout(() => {
            fetchArchivedEntities(true); // Silent para no mostrar loading
          }, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🔄 Restaurar una entidad archivada
  const restoreEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ 
          archived_at: null,
          is_visible: true // Hacer visible al restaurar
        })
        .eq('id', entityId);

      if (error) throw error;

      // Actualizar estado local
      setArchivedEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      // 🔄 Notificar al mapa que se actualice
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
          is_visible: true // Hacer visibles al restaurar
        })
        .not('archived_at', 'is', null);

      if (error) throw error;

      // Limpiar estado local
      setArchivedEntities([]);
      
      // 🔄 Notificar al mapa que se actualice
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

      // Actualizar estado local
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
