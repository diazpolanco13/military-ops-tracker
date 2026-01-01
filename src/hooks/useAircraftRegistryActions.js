import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🎛️ Acciones del registro de aeronaves (SIN cargar inventario)
 * Objetivo: que vistas de detalle (modal/vista completa) no disparen queries del listado.
 */
export function useAircraftRegistryActions() {
  /**
   * Actualizar notas de una aeronave (por ICAO24)
   */
  const updateNotes = useCallback(async (icao24, notes) => {
    try {
      if (!icao24) return { success: false, error: 'icao24 requerido' };

      const { data, error } = await supabase
        .from('military_aircraft_registry')
        .update({
          notes: notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('icao24', String(icao24).toUpperCase())
        .select('icao24, notes')
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Recalcular base probable (RPC)
   */
  const recalculateBase = useCallback(async (icao24) => {
    try {
      if (!icao24) return { success: false, error: 'icao24 requerido' };
      const { error } = await supabase.rpc('recalculate_probable_base', {
        p_icao24: String(icao24).toUpperCase(),
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Historial de ubicaciones (paginable por limit)
   */
  const getLocationHistory = useCallback(async (icao24, limit = 200) => {
    try {
      if (!icao24) return [];
      const { data, error } = await supabase
        .from('aircraft_location_history')
        .select('*')
        .eq('icao24', String(icao24).toUpperCase())
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[useAircraftRegistryActions] getLocationHistory error:', err.message);
      return [];
    }
  }, []);

  return {
    updateNotes,
    recalculateBase,
    getLocationHistory,
  };
}

export default useAircraftRegistryActions;


