import { useState, useEffect, useMemo } from 'react';
import { MARITIME_BOUNDARIES } from '../data/maritimeBoundaries';
import { TERRESTRIAL_BOUNDARIES } from '../data/terrestrialBoundaries';

/**
 * 🌊 Hook para límites marítimos y terrestres desde archivos LOCALES
 * 
 * Ventajas:
 * - ⚡ Carga instantánea (sin network requests)
 * - 🔒 Funciona offline
 * - 📦 Datos bundleados con la app
 * 
 * @param {string[]} countries - Array de códigos ISO3 de países (ej: ['VEN', 'COL'])
 * @param {boolean} enabled - Si está habilitado
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.includeTerrestrial - Incluir límites terrestres (default: true)
 * @param {boolean} options.includeMaritimo - Incluir límites marítimos (default: true)
 */
export function useMaritimeBoundariesLocal(countries = [], enabled = true, options = {}) {
  const { includeTerrestrial = true, includeMaritime = true } = options;
  
  const [loading, setLoading] = useState(true);

  // Filtrar features por países seleccionados
  const boundaries = useMemo(() => {
    if (!enabled || countries.length === 0) {
      return null;
    }

    const features = [];

    // Agregar límites marítimos
    if (includeMaritime && MARITIME_BOUNDARIES?.features) {
      const maritimeFeatures = MARITIME_BOUNDARIES.features.filter(feature => {
        const code = feature.properties?.iso_sov1;
        return countries.includes(code);
      });
      features.push(...maritimeFeatures);
    }

    // Agregar límites terrestres
    if (includeTerrestrial && TERRESTRIAL_BOUNDARIES?.features) {
      const terrestrialFeatures = TERRESTRIAL_BOUNDARIES.features.filter(feature => {
        const code = feature.properties?.country_code || feature.properties?.ISO_A3;
        return countries.includes(code);
      }).map(feature => {
        const countryCode = feature.properties?.country_code || feature.properties?.ISO_A3;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            // Unificar: usar iso_sov1 para que el layer aplique colores correctamente
            iso_sov1: countryCode,
            type: 'terrestrial'
          }
        };
      });
      features.push(...terrestrialFeatures);
    }

    if (features.length === 0) {
      return null;
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }, [countries, enabled, includeTerrestrial, includeMaritime]);

  // Simular loading para consistencia con hooks anteriores
  useEffect(() => {
    if (enabled && countries.length > 0) {
      setLoading(true);
      // Micro-delay para que React pueda renderizar el loading si es necesario
      const timer = setTimeout(() => setLoading(false), 10);
      return () => clearTimeout(timer);
    }
    setLoading(false);
  }, [countries, enabled]);

  return { 
    boundaries, 
    loading,
    error: null,
    cacheHit: true // Siempre es "cache hit" porque son datos locales
  };
}

/**
 * 🗺️ Países del Caribe (códigos ISO3)
 */
export const CARIBBEAN_COUNTRIES = {
  VENEZUELA: 'VEN',
  CUBA: 'CUB',
  COLOMBIA: 'COL',
  JAMAICA: 'JAM',
  HAITI: 'HTI',
  DOMINICAN_REPUBLIC: 'DOM',
  PUERTO_RICO: 'USA',
  TRINIDAD_TOBAGO: 'TTO',
  GUYANA: 'GUY',
  SURINAME: 'SUR',
  BAHAMAS: 'BHS',
  ARUBA: 'ABW',
  CURACAO: 'CUW',
  PANAMA: 'PAN',
  COSTA_RICA: 'CRI',
  NICARAGUA: 'NIC',
  HONDURAS: 'HND',
  BELIZE: 'BLZ',
  GUATEMALA: 'GTM',
  MEXICO: 'MEX',
  USA: 'USA',
};

/**
 * 🎨 Colores por país
 */
export const COUNTRY_COLORS = {
  VEN: '#ef4444',
  CUB: '#f97316',
  COL: '#fbbf24',
  JAM: '#84cc16',
  HTI: '#22c55e',
  DOM: '#14b8a6',
  PRI: '#06b6d4',
  TTO: '#0ea5e9',
  GUY: '#10b981',
  SUR: '#14b8a6',
  BHS: '#3b82f6',
  ABW: '#6366f1',
  CUW: '#8b5cf6',
  PAN: '#a855f7',
  CRI: '#d946ef',
  NIC: '#ec4899',
  HND: '#f43f5e',
  BLZ: '#10b981',
  GTM: '#059669',
  MEX: '#dc2626',
  USA: '#06b6d4',
};

/**
 * 📊 Obtener estadísticas de los datos locales
 */
export function getBoundariesStats() {
  return {
    maritime: {
      totalFeatures: MARITIME_BOUNDARIES?.features?.length || 0,
      countries: [...new Set(MARITIME_BOUNDARIES?.features?.map(f => f.properties?.iso_sov1) || [])]
    },
    terrestrial: {
      totalFeatures: TERRESTRIAL_BOUNDARIES?.features?.length || 0,
      countries: [...new Set(TERRESTRIAL_BOUNDARIES?.features?.map(f => f.properties?.country_code) || [])]
    }
  };
}

