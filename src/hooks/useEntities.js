import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🎯 Hook para obtener entidades militares desde Supabase
 * Con suscripción en tiempo real
 */
export function useEntities() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 📡 Función para cargar entidades (extraída para reutilizar)
  const fetchEntities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('is_visible', true) // Solo visibles
        .is('archived_at', null) // Solo no archivadas
        .order('name', { ascending: true });

      if (error) throw error;

      setEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar entidades:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();

    // 🔄 Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('entities_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'entities',
        },
        (payload) => {
          console.log('🔄 Cambio detectado:', payload);

          if (payload.eventType === 'INSERT') {
            setEntities((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setEntities((prev) =>
              prev.map((entity) =>
                entity.id === payload.new.id ? payload.new : entity
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEntities((prev) =>
              prev.filter((entity) => entity.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función para agregar una entidad manualmente (sin refetch completo)
  const addEntity = (newEntity) => {
    setEntities((prev) => [...prev, newEntity]);
  };

  // Función para remover una entidad del estado (cuando se oculta/archiva/elimina)
  const removeEntity = (entityId) => {
    setEntities((prev) => prev.filter(e => e.id !== entityId));
  };

  return { entities, loading, error, refetch: fetchEntities, addEntity, removeEntity };
}

