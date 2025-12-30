import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🌊 VALORES POR DEFECTO LOCALES
 * Usados cuando Supabase no está disponible o tarda
 * Solo Venezuela visible por defecto (el Esequibo tiene su propia capa)
 * 
 * 🎨 Colores más claros/suaves para mejor visualización
 */
const DEFAULT_SETTINGS = [
  { country_code: 'VEN', country_name: 'Venezuela', color: '#f87171', is_visible: true, opacity: 0.25 },  // Rojo más claro
  { country_code: 'COL', country_name: 'Colombia', color: '#fcd34d', is_visible: false, opacity: 0.25 }, // Amarillo claro
  { country_code: 'GUY', country_name: 'Guyana', color: '#6ee7b7', is_visible: false, opacity: 0.25 },   // Verde claro
  { country_code: 'TTO', country_name: 'Trinidad y Tobago', color: '#7dd3fc', is_visible: false, opacity: 0.25 },
  { country_code: 'CUB', country_name: 'Cuba', color: '#fdba74', is_visible: false, opacity: 0.25 },
  { country_code: 'DOM', country_name: 'República Dominicana', color: '#5eead4', is_visible: false, opacity: 0.25 },
  { country_code: 'USA', country_name: 'Estados Unidos', color: '#67e8f9', is_visible: false, opacity: 0.25 },
];

/**
 * 🌊 Hook para gestionar configuración de límites marítimos
 * 
 * ⚡ USA SOLO DEFAULTS LOCALES para visualización del mapa
 * 📡 La tabla de Supabase (maritime_boundaries_settings) se mantiene
 *    para el bot de Telegram que detecta incursiones
 * 
 * Esto evita duplicación de capas y carga instantánea
 */
export function useMaritimeSettings() {
  // SOLO usar defaults locales - NO consultar Supabase para visualización
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false); // No hay loading porque es local
  const [error, setError] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [usingDefaults] = useState(true); // Siempre true ahora

  // NO fetch de Supabase - usar solo defaults locales
  // La tabla de Supabase se mantiene para el bot de Telegram
  useEffect(() => {
    console.log('⚡ Maritime settings: usando configuración LOCAL (instantáneo)');
    console.log('📡 Nota: La tabla de Supabase se mantiene para el bot de Telegram');
  }, []);

  // Función para refetch (no hace nada, pero mantiene compatibilidad)
  async function fetchSettings() {
    console.log('ℹ️ fetchSettings: usando defaults locales, Supabase no se consulta para visualización');
    // No hacer nada - mantener defaults
  }

  /**
   * Agregar nuevo país
   */
  async function addCountry(countryCode, countryName, color = '#3b82f6') {
    try {
      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .insert([{
          country_code: countryCode,
          country_name: countryName,
          color: color,
          is_visible: true,
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Country added to DB:', data);
      
      // Actualizar estado local
      setSettings(prev => {
        const updated = [...prev, data];
        console.log('📊 Settings updated:', { prev: prev.length, new: updated.length });
        return updated;
      });

      // Forzar trigger para re-render
      setUpdateTrigger(prev => prev + 1);

      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('maritimeSettingsChanged', {
        detail: { country: countryCode, visible: true, action: 'added' }
      }));
      
      return { success: true, data };
    } catch (err) {
      console.error('Error adding country:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Toggle visibilidad de país
   */
  async function toggleVisibility(countryCode) {
    try {
      const country = settings.find(s => s.country_code === countryCode);
      if (!country) return { success: false, error: 'País no encontrado' };

      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .update({ is_visible: !country.is_visible })
        .eq('country_code', countryCode)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local - CREAR NUEVO ARRAY para forzar re-render
      setSettings(prev => {
        const updated = prev.map(s => 
          s.country_code === countryCode ? { ...data } : s
        );
        
        console.log('🔄 Settings updated after toggle:', {
          country: countryCode,
          newVisibility: data.is_visible,
          visibleCount: updated.filter(s => s.is_visible).length,
          visibleCodes: updated.filter(s => s.is_visible).map(s => s.country_code)
        });
        
        return updated;
      });

      // Forzar trigger para que los componentes que dependen se re-rendericen
      setUpdateTrigger(prev => prev + 1);

      // Disparar evento personalizado para que MapContainer se entere
      window.dispatchEvent(new CustomEvent('maritimeSettingsChanged', {
        detail: { country: countryCode, visible: data.is_visible }
      }));

      return { success: true, data };
    } catch (err) {
      console.error('Error toggling visibility:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Actualizar color de país
   */
  async function updateColor(countryCode, newColor) {
    try {
      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .update({ color: newColor })
        .eq('country_code', countryCode)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setSettings(prev => prev.map(s => 
        s.country_code === countryCode ? data : s
      ));

      // Forzar trigger
      setUpdateTrigger(prev => prev + 1);

      // Disparar evento
      window.dispatchEvent(new Event('maritimeColorsChanged'));
      window.dispatchEvent(new CustomEvent('maritimeSettingsChanged', {
        detail: { country: countryCode, action: 'colorChanged' }
      }));

      return { success: true, data };
    } catch (err) {
      console.error('Error updating color:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Actualizar opacidad de país
   */
  async function updateOpacity(countryCode, newOpacity) {
    try {
      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .update({ opacity: newOpacity })
        .eq('country_code', countryCode)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setSettings(prev => prev.map(s => 
        s.country_code === countryCode ? data : s
      ));

      // Forzar trigger
      setUpdateTrigger(prev => prev + 1);

      // Disparar evento para actualizar mapa
      window.dispatchEvent(new Event('maritimeColorsChanged'));
      window.dispatchEvent(new CustomEvent('maritimeSettingsChanged', {
        detail: { country: countryCode, action: 'opacityChanged' }
      }));

      return { success: true, data };
    } catch (err) {
      console.error('Error updating opacity:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Eliminar país
   */
  async function removeCountry(countryCode) {
    try {
      const { error } = await supabase
        .from('maritime_boundaries_settings')
        .delete()
        .eq('country_code', countryCode);

      if (error) throw error;

      // Actualizar estado local
      setSettings(prev => prev.filter(s => s.country_code !== countryCode));

      // Forzar trigger
      setUpdateTrigger(prev => prev + 1);

      // Disparar evento
      window.dispatchEvent(new CustomEvent('maritimeSettingsChanged', {
        detail: { country: countryCode, action: 'removed' }
      }));

      return { success: true };
    } catch (err) {
      console.error('Error removing country:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 🔔 Toggle alertas de Telegram para un país
   */
  async function toggleAlert(countryCode) {
    try {
      const country = settings.find(s => s.country_code === countryCode);
      if (!country) return { success: false, error: 'País no encontrado' };

      const newAlertState = !country.alert_enabled;
      
      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .update({ alert_enabled: newAlertState })
        .eq('country_code', countryCode)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setSettings(prev => prev.map(s => 
        s.country_code === countryCode ? { ...data } : s
      ));

      // Forzar trigger
      setUpdateTrigger(prev => prev + 1);

      console.log(`🔔 Alertas ${newAlertState ? 'activadas' : 'desactivadas'} para ${countryCode}`);

      return { success: true, data };
    } catch (err) {
      console.error('Error toggling alert:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 🔔 Obtener países con alertas activas
   */
  function getAlertEnabledCountries() {
    return settings.filter(s => s.alert_enabled);
  }

  /**
   * 🔔 Obtener códigos de países con alertas activas
   */
  function getAlertEnabledCountryCodes() {
    return settings.filter(s => s.alert_enabled).map(s => s.country_code);
  }

  /**
   * Obtener solo países visibles
   */
  function getVisibleCountries() {
    return settings.filter(s => s.is_visible);
  }

  /**
   * Obtener códigos de países visibles (para API)
   */
  function getVisibleCountryCodes() {
    return settings.filter(s => s.is_visible).map(s => s.country_code);
  }

  /**
   * Obtener mapa de colores por código
   */
  function getColorMap() {
    const colorMap = {};
    settings.forEach(s => {
      colorMap[s.country_code] = s.color;
    });
    return colorMap;
  }

  return {
    settings,
    loading,
    error,
    usingDefaults, // true si estamos usando valores locales (Supabase no disponible)
    updateTrigger, // Para que los componentes puedan detectar cambios
    addCountry,
    toggleVisibility,
    toggleAlert,
    updateColor,
    updateOpacity,
    removeCountry,
    getVisibleCountries,
    getVisibleCountryCodes,
    getAlertEnabledCountries,
    getAlertEnabledCountryCodes,
    getColorMap,
    refetch: fetchSettings,
  };
}

