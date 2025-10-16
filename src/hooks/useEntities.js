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

  useEffect(() => {
    // 📡 Función para cargar entidades
    async function fetchEntities() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('entities')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        setEntities(data || []);
        setError(null);
      } catch (err) {
        console.error('❌ Error al cargar entidades:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

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

  return { entities, loading, error };
}

