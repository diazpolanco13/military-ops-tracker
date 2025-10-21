import { useState, useEffect } from 'react';

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

  // Endpoint de Marine Regions WFS para EEZ (más confiable)
  // Alternativa: usar datos estáticos de Natural Earth
  const BASE_URL = 'https://geo.vliz.be/geoserver/MarineRegions/ows';

  useEffect(() => {
    if (!enabled || countries.length === 0) {
      setBoundaries(null);
      return;
    }

    // Verificar caché en localStorage
    const cacheKey = `maritime_boundaries_${countries.sort().join('_')}`;
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
          countries,
          featuresCount: data.features?.length || 0,
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
  PUERTO_RICO: 'PRI', // Territorio USA
  TRINIDAD_TOBAGO: 'TTO',
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
 * 🎨 Configuración de estilos por tipo de límite
 */
export const BOUNDARY_STYLES = {
  EEZ: {
    color: '#3b82f6', // Azul
    opacity: 0.3,
    weight: 2,
    fillOpacity: 0.1,
  },
  TERRITORIAL: {
    color: '#ef4444', // Rojo
    opacity: 0.5,
    weight: 2,
    fillOpacity: 0.15,
  },
  CONTIGUOUS: {
    color: '#f59e0b', // Naranja
    opacity: 0.4,
    weight: 2,
    fillOpacity: 0.12,
  },
};

