import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🎛️ Hook para gestionar la configuración del monitor de incursiones
 * Incluye:
 * - Configuración general (bounds, tiempos, telegram)
 * - Patrones de aeronaves
 * - Patrones de callsigns
 * - Estadísticas de zonas de alerta
 */
export function useIncursionMonitorConfig() {
  // Estado principal
  const [config, setConfig] = useState(null);
  const [aircraftPatterns, setAircraftPatterns] = useState([]);
  const [callsignPatterns, setCallsignPatterns] = useState([]);
  const [alertZones, setAlertZones] = useState([]);
  
  // Estado de carga y errores
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // =============================================
  // CARGAR DATOS
  // =============================================
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todo en paralelo
      const [configRes, aircraftRes, callsignRes, zonesRes] = await Promise.all([
        supabase.from('incursion_monitor_config').select('*').limit(1).single(),
        supabase.from('military_aircraft_patterns').select('*').order('alert_priority', { ascending: true }).order('aircraft_name'),
        supabase.from('military_callsign_patterns').select('*').order('alert_priority', { ascending: true }).order('pattern'),
        supabase.from('maritime_boundaries_settings').select(`
          id,
          country_code,
          country_name,
          is_visible,
          alert_enabled,
          color
        `).order('country_name')
      ]);

      if (configRes.error && configRes.error.code !== 'PGRST116') throw configRes.error;
      if (aircraftRes.error) throw aircraftRes.error;
      if (callsignRes.error) throw callsignRes.error;
      if (zonesRes.error) throw zonesRes.error;

      setConfig(configRes.data || null);
      setAircraftPatterns(aircraftRes.data || []);
      setCallsignPatterns(callsignRes.data || []);
      setAlertZones(zonesRes.data || []);

    } catch (err) {
      console.error('Error cargando config de incursiones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // =============================================
  // ACTUALIZAR CONFIGURACIÓN GENERAL
  // =============================================
  const updateConfig = useCallback(async (updates) => {
    if (!config?.id) return { success: false, error: 'No hay configuración cargada' };

    try {
      setSaving(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('incursion_monitor_config')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setConfig(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error actualizando config:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [config?.id]);

  // =============================================
  // CRUD PATRONES DE AERONAVES
  // =============================================
  const addAircraftPattern = useCallback(async (pattern) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('military_aircraft_patterns')
        .insert(pattern)
        .select()
        .single();

      if (error) throw error;
      setAircraftPatterns(prev => [...prev, data].sort((a, b) => a.alert_priority - b.alert_priority));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const updateAircraftPattern = useCallback(async (id, updates) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('military_aircraft_patterns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setAircraftPatterns(prev => prev.map(p => p.id === id ? data : p));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteAircraftPattern = useCallback(async (id) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('military_aircraft_patterns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAircraftPatterns(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  // =============================================
  // CRUD PATRONES DE CALLSIGN
  // =============================================
  const addCallsignPattern = useCallback(async (pattern) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('military_callsign_patterns')
        .insert(pattern)
        .select()
        .single();

      if (error) throw error;
      setCallsignPatterns(prev => [...prev, data].sort((a, b) => a.alert_priority - b.alert_priority));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCallsignPattern = useCallback(async (id, updates) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('military_callsign_patterns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCallsignPatterns(prev => prev.map(p => p.id === id ? data : p));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteCallsignPattern = useCallback(async (id) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('military_callsign_patterns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCallsignPatterns(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  // =============================================
  // TOGGLE ZONA DE ALERTA
  // =============================================
  const toggleAlertZone = useCallback(async (id, enabled) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .update({ alert_enabled: enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setAlertZones(prev => prev.map(z => z.id === id ? { ...z, alert_enabled: enabled } : z));
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  // =============================================
  // CRUD DESTINOS TELEGRAM
  // =============================================
  const addTelegramDestination = useCallback(async (destination) => {
    if (!config?.id) return { success: false, error: 'No hay configuración' };
    
    try {
      setSaving(true);
      const newDestination = {
        id: crypto.randomUUID(),
        name: destination.name || 'Nuevo destino',
        chat_id: destination.chat_id,
        enabled: destination.enabled ?? true,
        type: destination.type || 'channel'
      };
      
      const currentDestinations = config.telegram_destinations || [];
      const updatedDestinations = [...currentDestinations, newDestination];
      
      const { error } = await supabase
        .from('incursion_monitor_config')
        .update({ telegram_destinations: updatedDestinations })
        .eq('id', config.id);
      
      if (error) throw error;
      
      setConfig(prev => ({ ...prev, telegram_destinations: updatedDestinations }));
      return { success: true, data: newDestination };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [config?.id, config?.telegram_destinations]);

  const updateTelegramDestination = useCallback(async (destinationId, updates) => {
    if (!config?.id) return { success: false, error: 'No hay configuración' };
    
    try {
      setSaving(true);
      const currentDestinations = config.telegram_destinations || [];
      const updatedDestinations = currentDestinations.map(d => 
        d.id === destinationId ? { ...d, ...updates } : d
      );
      
      const { error } = await supabase
        .from('incursion_monitor_config')
        .update({ telegram_destinations: updatedDestinations })
        .eq('id', config.id);
      
      if (error) throw error;
      
      setConfig(prev => ({ ...prev, telegram_destinations: updatedDestinations }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [config?.id, config?.telegram_destinations]);

  const deleteTelegramDestination = useCallback(async (destinationId) => {
    if (!config?.id) return { success: false, error: 'No hay configuración' };
    
    try {
      setSaving(true);
      const currentDestinations = config.telegram_destinations || [];
      const updatedDestinations = currentDestinations.filter(d => d.id !== destinationId);
      
      const { error } = await supabase
        .from('incursion_monitor_config')
        .update({ telegram_destinations: updatedDestinations })
        .eq('id', config.id);
      
      if (error) throw error;
      
      setConfig(prev => ({ ...prev, telegram_destinations: updatedDestinations }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [config?.id, config?.telegram_destinations]);

  // =============================================
  // TEST DE TELEGRAM (a un destino específico)
  // Usa Edge Function para evitar problemas de CORS
  // =============================================
  const testTelegram = useCallback(async (destinationId) => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase.functions.invoke('telegram-test', {
        body: { destination_id: destinationId }
      });
      
      if (error) {
        return { success: false, error: error.message || 'Error al invocar función' };
      }
      
      if (data?.success) {
        return { success: true, messageId: data.message_id, destination: data.destination };
      } else {
        return { success: false, error: data?.error || 'Error desconocido' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  // =============================================
  // ESTADÍSTICAS RÁPIDAS
  // =============================================
  const stats = {
    totalAircraftPatterns: aircraftPatterns.length,
    activeAircraftPatterns: aircraftPatterns.filter(p => p.is_active).length,
    totalCallsignPatterns: callsignPatterns.length,
    activeCallsignPatterns: callsignPatterns.filter(p => p.is_active).length,
    totalAlertZones: alertZones.length,
    activeAlertZones: alertZones.filter(z => z.alert_enabled).length,
    isMonitorActive: config?.is_active ?? false,
    lastExecution: config?.last_execution_at,
    totalExecutions: config?.total_executions ?? 0,
    totalIncursions: config?.total_incursions_detected ?? 0
  };

  return {
    // Data
    config,
    aircraftPatterns,
    callsignPatterns,
    alertZones,
    stats,
    
    // Estado
    loading,
    saving,
    error,
    
    // Acciones
    loadConfig,
    updateConfig,
    
    // Aeronaves
    addAircraftPattern,
    updateAircraftPattern,
    deleteAircraftPattern,
    
    // Callsigns
    addCallsignPattern,
    updateCallsignPattern,
    deleteCallsignPattern,
    
    // Zonas
    toggleAlertZone,
    
    // Telegram
    testTelegram,
    addTelegramDestination,
    updateTelegramDestination,
    deleteTelegramDestination
  };
}

// Helpers para categorías
export const AIRCRAFT_CATEGORIES = [
  { value: 'transport', label: 'Transporte', icon: '🛫', color: 'blue' },
  { value: 'reconnaissance', label: 'Reconocimiento', icon: '👁️', color: 'red' },
  { value: 'tanker', label: 'Cisterna', icon: '⛽', color: 'yellow' },
  { value: 'awacs', label: 'AWACS', icon: '📡', color: 'purple' },
  { value: 'fighter', label: 'Combate', icon: '✈️', color: 'orange' },
  { value: 'helicopter', label: 'Helicóptero', icon: '🚁', color: 'green' },
  { value: 'drone', label: 'Dron', icon: '🛸', color: 'pink' },
  { value: 'bomber', label: 'Bombardero', icon: '💣', color: 'red' },
  { value: 'patrol', label: 'Patrulla', icon: '🔍', color: 'cyan' },
  { value: 'other', label: 'Otro', icon: '❓', color: 'gray' }
];

export const MISSION_TYPES = [
  { value: 'transport', label: 'Transporte' },
  { value: 'refueling', label: 'Reabastecimiento' },
  { value: 'reconnaissance', label: 'Reconocimiento' },
  { value: 'patrol', label: 'Patrulla' },
  { value: 'vip', label: 'VIP/Gobierno' },
  { value: 'training', label: 'Entrenamiento' },
  { value: 'combat', label: 'Combate' },
  { value: 'search_rescue', label: 'Búsqueda y Rescate' },
  { value: 'general', label: 'General' }
];

export const MILITARY_BRANCHES = [
  { value: 'USAF', label: 'USAF (Fuerza Aérea)', icon: '🦅' },
  { value: 'Navy', label: 'Navy (Armada)', icon: '⚓' },
  { value: 'Marines', label: 'Marines', icon: '🎖️' },
  { value: 'Army', label: 'Army (Ejército)', icon: '🪖' },
  { value: 'Coast Guard', label: 'Coast Guard', icon: '🚢' },
  { value: 'Other', label: 'Otro', icon: '❓' }
];

export const PRIORITY_LEVELS = [
  { value: 1, label: 'Crítica', color: 'red', description: 'AWACS, Reconocimiento, Drones' },
  { value: 2, label: 'Alta', color: 'orange', description: 'Combate, Cisternas' },
  { value: 3, label: 'Normal', color: 'yellow', description: 'Transporte estándar' },
  { value: 4, label: 'Baja', color: 'green', description: 'Helicópteros, Patrulla costera' },
  { value: 5, label: 'Mínima', color: 'gray', description: 'Entrenamiento' }
];
