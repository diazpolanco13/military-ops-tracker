import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🫥 Hook para gestionar entidades ocultas
 * Obtiene, muestra y gestiona entidades con is_visible = false
 */
export function useHiddenEntities() {
  const [hiddenEntities, setHiddenEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📡 Función para cargar entidades ocultas
  const fetchHiddenEntities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('is_visible', false) // Solo ocultas
        .is('archived_at', null) // No archivadas
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
  };

  // 🔄 Mostrar una entidad oculta
  const showEntity = async (entityId) => {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ is_visible: true })
        .eq('id', entityId);

      if (error) throw error;

      // Actualizar estado local
      setHiddenEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      // 🔄 Notificar al mapa que se actualice
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

      // Limpiar estado local
      setHiddenEntities([]);
      
      // 🔄 Notificar al mapa que se actualice
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
          is_visible: false // Mantener oculta
        })
        .eq('id', entityId);

      if (error) throw error;

      // Remover de la lista de ocultas
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

      // Remover de la lista de ocultas
      setHiddenEntities(prev => prev.filter(entity => entity.id !== entityId));
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar entidad:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchHiddenEntities();

    // 🔄 Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('hidden_entities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
          filter: 'is_visible=eq.false',
        },
        (payload) => {
          console.log('🔄 Cambio en entidades ocultas:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Nueva entidad oculta
            if (payload.new.is_visible === false && !payload.new.archived_at) {
              setHiddenEntities(prev => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Entidad actualizada
            if (payload.new.is_visible === true || payload.new.archived_at) {
              // Ya no está oculta, remover de la lista
              setHiddenEntities(prev => prev.filter(entity => entity.id !== payload.new.id));
            } else if (payload.new.is_visible === false && !payload.new.archived_at) {
              // Ahora está oculta, agregar a la lista
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
            // Entidad eliminada
            setHiddenEntities(prev => prev.filter(entity => entity.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
  };
}
