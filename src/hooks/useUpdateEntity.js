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
      console.log('🚀 [updatePosition] INICIANDO...');
      console.log('🚀 [updatePosition] entityId:', entityId);
      console.log('🚀 [updatePosition] coords:', { latitude, longitude });
      
      setUpdating(true);
      setError(null);

      console.log(`🚢 Llamando a Supabase RPC: update_entity_position`);

      // Actualizar posición usando SQL directo para manejar GEOGRAPHY
      const { data, error: updateError } = await supabase.rpc(
        'update_entity_position',
        {
          p_entity_id: entityId,
          p_latitude: latitude,
          p_longitude: longitude,
        }
      );

      console.log('📦 Respuesta de Supabase:', { data, error: updateError });

      if (updateError) {
        console.error('❌ Error de Supabase:', updateError);
        throw updateError;
      }

      console.log('✅ Posición actualizada correctamente en BD');
      return data;
    } catch (err) {
      console.error('❌ EXCEPCIÓN en updatePosition:', err);
      console.error('❌ Error completo:', JSON.stringify(err, null, 2));
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
      console.log('🏁 [updatePosition] FINALIZADO');
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

