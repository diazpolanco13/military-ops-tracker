import { supabase } from '../lib/supabase';

/**
 * 🗺️ Cargar límites terrestres desde Natural Earth (via CDN)
 * 
 * Fuente: Natural Earth 1:50m Cultural Vectors
 * URL: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/
 */

const NATURAL_EARTH_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';

/**
 * Descargar y cachear límites terrestres de países específicos
 */
export async function loadTerrestrialBoundaries(countryCodes = []) {
  console.log('🌍 Descargando límites terrestres desde Natural Earth...');
  
  try {
    // Descargar GeoJSON completo de Natural Earth
    const response = await fetch(NATURAL_EARTH_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Natural Earth descargado: ${data.features.length} países`);

    // Filtrar solo los países solicitados
    const targetFeatures = data.features.filter(feature => {
      const iso3 = feature.properties.ADM0_A3 || feature.properties.ISO_A3;
      return countryCodes.includes(iso3);
    });

    console.log(`🎯 Países filtrados: ${targetFeatures.length}/${countryCodes.length}`);

    // Guardar en Supabase
    const saved = [];
    const errors = [];

    for (const feature of targetFeatures) {
      const iso3 = feature.properties.ADM0_A3 || feature.properties.ISO_A3;
      const name = feature.properties.NAME || feature.properties.ADMIN;

      try {
        // Simplificar el GeoJSON si es muy complejo
        const simplifiedFeature = {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            iso3: iso3,
            name: name,
            name_es: feature.properties.NAME_ES || name,
            type: 'country',
            source: 'Natural Earth'
          }
        };

        const { error } = await supabase
          .from('terrestrial_boundaries_cache')
          .upsert({
            country_code: iso3,
            country_name: name,
            geojson: simplifiedFeature,
            source: 'Natural Earth 1:50m',
            source_url: NATURAL_EARTH_URL
          }, {
            onConflict: 'country_code',
            ignoreDuplicates: false
          });

        if (error) throw error;

        console.log(`✅ ${name} (${iso3}) cacheado`);
        saved.push(iso3);

      } catch (err) {
        console.error(`❌ Error con ${iso3}:`, err.message);
        errors.push({ code: iso3, error: err.message });
      }
    }

    return {
      success: saved.length,
      errors: errors.length,
      total: countryCodes.length,
      saved,
      errorDetails: errors
    };

  } catch (err) {
    console.error('❌ Error descargando Natural Earth:', err);
    throw err;
  }
}

/**
 * Pre-cargar países del Caribe
 */
export async function preloadCaribbeanTerrestrial() {
  const CARIBBEAN_COUNTRIES = [
    'VEN', 'COL', 'GUY', 'SUR', 'TTO', 'CUB', 'JAM', 'HTI', 'DOM',
    'PAN', 'CRI', 'NIC', 'HND', 'BLZ', 'GTM', 'MEX', 'USA', 'BHS'
  ];

  return await loadTerrestrialBoundaries(CARIBBEAN_COUNTRIES);
}

// Exponer en window para consola
if (typeof window !== 'undefined') {
  window.loadTerrestrialBoundaries = loadTerrestrialBoundaries;
  window.preloadCaribbeanTerrestrial = preloadCaribbeanTerrestrial;
}

