import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🔢 Hook para obtener el conteo de entidades archivadas
 * Optimizado para mostrar en navbar sin cargar todas las entidades
 */
export function useArchivedCount() {
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 📡 Función para obtener solo el conteo
  const fetchArchivedCount = async () => {
    try {
      const { count, error } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .not('archived_at', 'is', null); // Solo archivadas

      if (error) throw error;

      setArchivedCount(count || 0);
    } catch (err) {
      console.error('❌ Error al obtener conteo de archivadas:', err);
      setArchivedCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedCount();

    // 🔄 Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('archived_count_changes')
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
            fetchArchivedCount();
          }, 100);
        }
      )
      .subscribe();

    // 🔄 Actualización periódica como respaldo (cada 5 segundos)
    const interval = setInterval(() => {
      fetchArchivedCount();
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    archivedCount,
    loading,
    refetch: fetchArchivedCount,
  };
}
