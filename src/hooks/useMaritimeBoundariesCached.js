import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🌊 Hook para obtener límites marítimos CON CACHE EN SUPABASE
 * 
 * Estrategia de caché:
 * 1. Buscar en Supabase (maritime_boundaries_cache)
 * 2. Si existe → usar datos cacheados (RÁPIDO)
 * 3. Si no existe → fetch desde API externa → guardar en Supabase
 * 
 * Ventajas:
 * - Primera carga: igual que antes
 * - Cargas subsecuentes: instantáneas desde Supabase
 * - Los datos persisten entre sesiones
 * - No hay límite de tamaño (a diferencia de localStorage)
 * 
 * @param {string[]} countries - Array de códigos ISO3 de países
 * @param {boolean} enabled - Si está habilitado
 */
export function useMaritimeBoundariesCached(countries = [], enabled = true) {
  const [boundaries, setBoundaries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheHit, setCacheHit] = useState(false);
  const prevCountriesRef = useRef('');

  const BASE_URL = 'https://geo.vliz.be/geoserver/MarineRegions/ows';

  useEffect(() => {
    if (!enabled) {
      setBoundaries(null);
      prevCountriesRef.current = ''; // Reset para que cargue cuando se vuelva a activar
      return;
    }

    if (countries.length === 0) {
      setBoundaries(null);
      prevCountriesRef.current = '';
      return;
    }

    // Crear key estable
    const sortedCountries = [...countries].sort().join('_');
    
    // Solo fetch si los países cambiaron
    if (prevCountriesRef.current === sortedCountries) {
      console.log('⏭️ Países sin cambios, usando boundaries existentes');
      return;
    }
    
    console.log('🔄 Países cambiaron:', {
      anterior: prevCountriesRef.current,
      nuevo: sortedCountries,
      codes: countries
    });
    
    prevCountriesRef.current = sortedCountries;

    loadBoundaries();

    async function loadBoundaries() {
      setLoading(true);
      setError(null);
      setCacheHit(false);

      try {
        // PASO 1: Buscar en caché de Supabase
        const cachedData = await fetchFromCache(countries);
        
        if (cachedData) {
          console.log('✅ Cache HIT - Datos cargados desde Supabase:', cachedData.length, 'países');
          setBoundaries(cachedData);
          setCacheHit(true);
          setLoading(false);
          return;
        }

        // PASO 2: Cache MISS - Fetch desde API externa
        console.log('⏳ Cache MISS - Descargando desde Marine Regions API...');
        const apiData = await fetchFromAPI(countries);
        
        if (!apiData || !apiData.features) {
          throw new Error('No se recibieron datos de la API');
        }

        // PASO 3: Guardar en caché de Supabase para la próxima vez
        await saveToCache(apiData.features);
        
        setBoundaries(apiData);
        console.log('✅ Datos descargados y cacheados:', apiData.features.length, 'features');

      } catch (err) {
        console.error('❌ Error loading maritime boundaries:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [countries, enabled]);

  /**
   * Buscar datos en caché de Supabase
   */
  async function fetchFromCache(countryCodes) {
    try {
      // Buscar zonas MARÍTIMAS en caché
      let { data, error } = await supabase
        .from('maritime_boundaries_cache')
        .select('country_code, country_name, geojson, mrgid')
        .in('country_code', countryCodes);

      if (error) throw error;

      // También buscar límites TERRESTRES para visualización completa
      const { data: terrestrialData } = await supabase
        .from('terrestrial_boundaries_cache')
        .select('country_code, country_name, geojson')
        .in('country_code', countryCodes);

      // Combinar terrestres + marítimos
      if (terrestrialData && terrestrialData.length > 0) {
        console.log(`🗺️ Agregando ${terrestrialData.length} límites terrestres`);
        const terrestrialFeatures = terrestrialData.map(t => ({
          ...t,
          geojson: {
            ...t.geojson,
            properties: {
              ...t.geojson.properties,
              iso_sov1: t.country_code,
              geoname: t.country_name,
              type: 'terrestrial' // Marcar como terrestre
            }
          }
        }));
        data = [...(data || []), ...terrestrialFeatures];
      }

      if (!data || data.length === 0) {
        console.log('📦 Cache vacío para estos países');
        return null;
      }

      // Log de qué se encontró
      const foundCodes = data.map(d => d.country_code);
      const missingCodes = countryCodes.filter(c => !foundCodes.includes(c));
      
      console.log(`📦 Cache: ${data.length}/${countryCodes.length} países encontrados`);
      if (missingCodes.length > 0) {
        console.log(`⚠️ Faltantes en caché: ${missingCodes.join(', ')}`);
      }

      // ESTRATEGIA MIXTA: Usar lo que hay en caché y fetchear solo los faltantes
      if (missingCodes.length > 0) {
        console.log(`⏳ Descargando países faltantes: ${missingCodes.join(', ')}`);
        const apiData = await fetchFromAPI(missingCodes);
        
        if (apiData && apiData.features && apiData.features.length > 0) {
          // Guardar los nuevos en caché
          await saveToCache(apiData.features);
          
          // Combinar datos cacheados + nuevos descargados
          const cachedFeatures = data.map(country => country.geojson);
          const allFeatures = [...cachedFeatures, ...apiData.features];
          
          console.log(`✅ Combinados: ${cachedFeatures.length} cache + ${apiData.features.length} API = ${allFeatures.length} total`);
          
          return {
            type: 'FeatureCollection',
            features: allFeatures
          };
        }
      }

      // Convertir a features
      const features = data.map(country => country.geojson);
      
      console.log('✅ CACHE HIT completo:', {
        requestedCodes: countryCodes,
        foundCodes: data.map(d => d.country_code),
        featuresCount: features.length,
        featuresSample: features.map(f => ({
          type: f.type,
          geometryType: f.geometry?.type,
          iso: f.properties?.iso_sov1,
          name: f.properties?.geoname
        }))
      });
      
      return {
        type: 'FeatureCollection',
        features: features
      };

    } catch (err) {
      console.error('Error fetching from cache:', err);
      return null;
    }
  }

  /**
   * Fetch desde API externa (Marine Regions)
   * Obtiene TODAS las zonas EEZ de los países solicitados
   */
  async function fetchFromAPI(countryCodes) {
    const cqlFilter = countryCodes.map(c => `iso_sov1='${c}'`).join(' OR ');

    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'MarineRegions:eez',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      cql_filter: cqlFilter,
    });

    console.log('📡 Fetching from Marine Regions API:', {
      countries: countryCodes,
      url: `${BASE_URL}?${params}`
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📦 API Response:', {
      totalFeatures: data.features?.length,
      featuresByCountry: data.features?.reduce((acc, f) => {
        const code = f.properties?.iso_sov1;
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {})
    });

    return data;
  }

  /**
   * Guardar features en caché de Supabase
   * Puede guardar MÚLTIPLES zonas por país (ej: Colombia tiene varias)
   */
  async function saveToCache(features) {
    if (!features || features.length === 0) return;

    try {
      // Preparar datos para inserción
      const cacheRecords = features.map(feature => {
        const mrgid = feature.properties?.mrgid_eez || feature.properties?.mrgid;
        
        if (!mrgid) {
          console.warn('⚠️ Feature sin mrgid:', feature.properties);
        }
        
        return {
          country_code: feature.properties.iso_sov1,
          country_name: feature.properties.geoname || feature.properties.territory1 || 'Unknown',
          zone_name: feature.properties.geoname,
          mrgid: mrgid,
          geojson: feature, // Guardar feature completo
          source_url: BASE_URL,
          fetched_at: new Date().toISOString()
        };
      }).filter(record => record.mrgid); // Solo guardar si tiene mrgid válido

      // Insertar en batch
      const { error } = await supabase
        .from('maritime_boundaries_cache')
        .upsert(cacheRecords, {
          onConflict: 'mrgid', // Usar mrgid para evitar duplicados
          ignoreDuplicates: false
        });

      if (error) throw error;

      console.log('💾 Guardado en caché:', {
        features: cacheRecords.length,
        countries: [...new Set(cacheRecords.map(r => r.country_code))],
        zones: cacheRecords.map(r => r.zone_name)
      });

    } catch (err) {
      console.error('Error saving to cache:', err);
      // No lanzar error, el caché es opcional
    }
  }

  return { 
    boundaries, 
    loading, 
    error,
    cacheHit // Para debugging
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

