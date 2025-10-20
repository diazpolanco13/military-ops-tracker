import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🔢 Hook para obtener el conteo de entidades ocultas
 * Optimizado para mostrar en navbar sin cargar todas las entidades
 */
export function useHiddenCount() {
  const [hiddenCount, setHiddenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 📡 Función para obtener solo el conteo
  const fetchHiddenCount = async () => {
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
  };

  useEffect(() => {
    fetchHiddenCount();

    // 🔄 Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('hidden_count_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
        },
        (payload) => {
          // Actualizar conteo después de cualquier cambio
          setTimeout(() => {
            fetchHiddenCount();
          }, 100);
        }
      )
      .subscribe();

    // 🔄 Actualización periódica como respaldo (cada 5 segundos)
    const interval = setInterval(() => {
      fetchHiddenCount();
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    hiddenCount,
    loading,
    refetch: fetchHiddenCount,
  };
}
