import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🌊 Hook para gestionar configuración de límites marítimos desde BD
 * CRUD completo para maritime_boundaries_settings
 */
export function useMaritimeSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0); // Para forzar re-renders

  // Fetch inicial
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maritime_boundaries_settings')
        .select('*')
        .order('country_name');

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching maritime settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

