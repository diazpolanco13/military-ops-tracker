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
      
      // Actualizar estado local
      setSettings(prev => [...prev, data]);
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

      // Actualizar estado local
      setSettings(prev => prev.map(s => 
        s.country_code === countryCode ? data : s
      ));

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

      return { success: true, data };
    } catch (err) {
      console.error('Error updating color:', err);
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

      return { success: true };
    } catch (err) {
      console.error('Error removing country:', err);
      return { success: false, error: err.message };
    }
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
    addCountry,
    toggleVisibility,
    updateColor,
    removeCountry,
    getVisibleCountries,
    getVisibleCountryCodes,
    getColorMap,
    refetch: fetchSettings,
  };
}

