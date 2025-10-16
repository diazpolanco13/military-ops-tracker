import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🎯 Hook para actualizar la posición de entidades en Supabase
 * Incluye manejo de errores y loading states
 */
export function useUpdateEntity() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Actualiza la posición de una entidad
   * El trigger de PostgreSQL automáticamente:
   * - Actualiza el campo `position` (GEOGRAPHY)
   * - Registra el movimiento en `movement_history`
   * - Actualiza `updated_at` y `last_position_update`
   */
  const updatePosition = async (entityId, { latitude, longitude }) => {
    try {
      setUpdating(true);
      setError(null);

      console.log(`🚢 Actualizando ${entityId}:`, { latitude, longitude });

      // Actualizar posición usando SQL directo para manejar GEOGRAPHY
      const { data, error: updateError } = await supabase.rpc(
        'update_entity_position',
        {
          p_entity_id: entityId,
          p_latitude: latitude,
          p_longitude: longitude,
        }
      );

      if (updateError) throw updateError;

      console.log('✅ Posición actualizada correctamente');
      return data;
    } catch (err) {
      console.error('❌ Error al actualizar posición:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Actualiza cualquier campo de una entidad
   */
  const updateEntity = async (entityId, updates) => {
    try {
      setUpdating(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', entityId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('✅ Entidad actualizada:', data);
      return data;
    } catch (err) {
      console.error('❌ Error al actualizar entidad:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updatePosition,
    updateEntity,
    updating,
    error,
  };
}

