import { useState, useEffect, useRef } from 'react';

/**
 * 🌊 Hook para obtener límites marítimos de países desde ArcGIS REST API
 * 
 * Fuente: ArcGIS World Maritime Boundaries and EEZ
 * Endpoint: https://services2.arcgis.com/xsh7pVZv42relbEf/ArcGIS/rest/services/
 * 
 * Tipos de límites:
 * - EEZ (Exclusive Economic Zone): 200 NM
 * - Territorial Sea: 12 NM
 * - Contiguous Zone: 24 NM
 * 
 * @param {string[]} countries - Array de códigos ISO3 de países (ej: ['VEN', 'CUB'])
 * @param {boolean} enabled - Si está habilitado (para control de toggle)
 */
export function useMaritimeBoundaries(countries = [], enabled = true) {
  const [boundaries, setBoundaries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevCountriesRef = useRef('');

  // Endpoint de Marine Regions WFS para EEZ (más confiable)
  // Alternativa: usar datos estáticos de Natural Earth
  const BASE_URL = 'https://geo.vliz.be/geoserver/MarineRegions/ows';

  useEffect(() => {
    if (!enabled || countries.length === 0) {
      setBoundaries(null);
      return;
    }

    // Crear key estable (ordenar para evitar diferencias por orden)
    const sortedCountries = [...countries].sort().join('_');
    
    // ⚡ OPTIMIZACIÓN: Solo fetch si los países cambiaron realmente
    if (prevCountriesRef.current === sortedCountries) {
      return; // Mismos países, no hacer nada
    }
    
    prevCountriesRef.current = sortedCountries;
    const cacheKey = `maritime_boundaries_${sortedCountries}`;
    
    // Verificar caché en localStorage
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Cache válido por 7 días
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
          setBoundaries(cachedData.data);
          return;
        }
      } catch (e) {
        console.warn('Error parsing cached boundaries:', e);
      }
    }

    // Fetch desde API
    fetchBoundaries();

    async function fetchBoundaries() {
      setLoading(true);
      setError(null);

      try {
        // Construir filtro CQL para Marine Regions WFS
        // Campo: iso_sov1 (códigos ISO3)
        const cqlFilter = countries.map(c => `iso_sov1='${c}'`).join(' OR ');

        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'MarineRegions:eez', // Capa de EEZ
          outputFormat: 'application/json', // GeoJSON
          srsName: 'EPSG:4326',
          cql_filter: cqlFilter,
        });

        const response = await fetch(`${BASE_URL}?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('🌊 Maritime boundaries loaded:', {
          requestedCountries: countries,
          featuresCount: data.features?.length || 0,
          loadedCountries: data.features?.map(f => ({
            name: f.properties.geoname || f.properties.territory,
            iso3: f.properties.iso_sov1,
            iso2: f.properties.iso_ter1
          })),
          data
        });

        // Guardar en caché
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now(),
          }));
        } catch (e) {
          console.warn('Error caching boundaries:', e);
        }

        setBoundaries(data);
      } catch (err) {
        console.error('❌ Error fetching maritime boundaries:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [countries, enabled]);

  return { boundaries, loading, error };
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
  PUERTO_RICO: 'USA', // Territorio USA - se filtra por geoname
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
  USA: 'USA', // Para Florida, USVI, etc.
};

/**
 * 🎨 Colores por país (personalizables)
 * Cada país tiene su color distintivo para los límites marítimos
 */
export const COUNTRY_COLORS = {
  VEN: '#ef4444', // Venezuela - Rojo
  CUB: '#f97316', // Cuba - Naranja
  COL: '#fbbf24', // Colombia - Amarillo
  JAM: '#84cc16', // Jamaica - Verde lima
  HTI: '#22c55e', // Haití - Verde
  DOM: '#14b8a6', // Rep. Dominicana - Turquesa
  PRI: '#06b6d4', // Puerto Rico - Cyan (mismo que USA para consistencia)
  TTO: '#0ea5e9', // Trinidad & Tobago - Azul cielo
  GUY: '#10b981', // Guyana - Verde esmeralda
  SUR: '#14b8a6', // Suriname - Turquesa oscuro
  BHS: '#3b82f6', // Bahamas - Azul
  ABW: '#6366f1', // Aruba - Índigo
  CUW: '#8b5cf6', // Curaçao - Violeta
  PAN: '#a855f7', // Panamá - Púrpura
  CRI: '#d946ef', // Costa Rica - Fucsia
  NIC: '#ec4899', // Nicaragua - Rosa
  HND: '#f43f5e', // Honduras - Rosa oscuro
  BLZ: '#10b981', // Belice - Esmeralda
  GTM: '#059669', // Guatemala - Verde oscuro
  MEX: '#dc2626', // México - Rojo oscuro
  USA: '#06b6d4', // Estados Unidos - Cyan (incluye Puerto Rico, USVI)
};

