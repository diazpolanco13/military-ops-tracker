import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para actualizar TODOS los campos de una entidad
 */
export function useUpdateEntityFull() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateEntityFull = async (entityId, updates) => {
    try {
      setUpdating(true);
      setError(null);

      // Si hay cambios de posición, actualizar con función RPC
      if (updates.latitude !== undefined && updates.longitude !== undefined) {
        const { error: updateError } = await supabase
          .rpc('update_entity_position', {
            p_entity_id: entityId,
            p_latitude: updates.latitude,
            p_longitude: updates.longitude,
          });

        if (updateError) throw updateError;

        // Remover lat/lng de updates para no duplicar
        delete updates.latitude;
        delete updates.longitude;
      }

      // Actualizar resto de campos
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('entities')
          .update(updates)
          .eq('id', entityId);

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating entity:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateEntityFull,
    updating,
    error,
  };
}

