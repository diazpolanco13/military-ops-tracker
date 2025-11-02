import { supabase } from '../lib/supabase';

/**
 * 🗺️ Cargar límites de GADM (Global Administrative Areas)
 * 
 * GADM incluye la Guayana Esequiba como parte de Venezuela
 * Fuente: https://gadm.org/
 * 
 * Opciones de descarga:
 * 1. API directa (simplificada): https://geodata.ucdavis.edu/gadm/gadm4.1/json/
 * 2. Formato: gadm41_{ISO3}_0.json (nivel 0 = país completo)
 */

const GADM_BASE_URL = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json';

/**
 * Descargar y cachear límite de un país desde GADM
 */
export async function loadGADMCountry(countryCode) {
  console.log(`🌍 Descargando ${countryCode} desde GADM...`);
  
  try {
    // URL del GeoJSON de GADM para el país (nivel 0 = fronteras completas)
    const url = `${GADM_BASE_URL}/gadm41_${countryCode}_0.json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - País ${countryCode} no encontrado en GADM`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error('No se encontraron features en el GeoJSON');
    }

    console.log(`✅ ${countryCode} descargado:`, {
      features: data.features.length,
      type: data.type
    });

    // Guardar en caché de Supabase
    const feature = data.features[0]; // GADM nivel 0 tiene 1 feature por país
    
    const { error } = await supabase
      .from('terrestrial_boundaries_cache')
      .upsert({
        country_code: countryCode,
        country_name: feature.properties.COUNTRY || feature.properties.NAME_0 || countryCode,
        geojson: feature,
        source: 'GADM 4.1',
        source_url: url,
        admin_level: 0
      }, {
        onConflict: 'country_code',
        ignoreDuplicates: false
      });

    if (error) throw error;

    console.log(`💾 ${countryCode} guardado en caché`);

    return { success: true, feature };

  } catch (err) {
    console.error(`❌ Error con ${countryCode}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Pre-cargar Venezuela desde GADM (incluye Guayana Esequiba)
 */
export async function loadVenezuelaWithEsequibo() {
  console.log('🇻🇪 Cargando Venezuela con Guayana Esequiba desde GADM...');
  
  const result = await loadGADMCountry('VEN');
  
  if (result.success) {
    console.log('✅ Venezuela cargada correctamente con Guayana Esequiba incluida');
    return result;
  } else {
    console.error('❌ Error cargando Venezuela:', result.error);
    return result;
  }
}

/**
 * Cargar múltiples países del Caribe desde GADM
 */
export async function loadCaribbeanFromGADM() {
  const countries = [
    { code: 'VEN', name: 'Venezuela' },
    { code: 'COL', name: 'Colombia' },
    { code: 'CUB', name: 'Cuba' },
    { code: 'JAM', name: 'Jamaica' },
    { code: 'HTI', name: 'Haiti' },
    { code: 'DOM', name: 'República Dominicana' },
    { code: 'TTO', name: 'Trinidad y Tobago' },
    { code: 'SUR', name: 'Suriname' },
    { code: 'BHS', name: 'Bahamas' },
    { code: 'PAN', name: 'Panamá' },
  ];

  console.log(`🚀 Cargando ${countries.length} países desde GADM...`);

  const results = {
    success: [],
    errors: []
  };

  for (const country of countries) {
    const result = await loadGADMCountry(country.code);
    
    if (result.success) {
      results.success.push(country.code);
    } else {
      results.errors.push({ code: country.code, error: result.error });
    }

    // Pequeña pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('📊 RESUMEN GADM:');
  console.log(`✅ Exitosos: ${results.success.length}`);
  console.log(`❌ Errores: ${results.errors.length}`);

  return results;
}

/**
 * Helper para cargar JSON descargado manualmente desde GADM
 * Uso: window.uploadGADMToSupabase(jsonData, 'VEN')
 */
export async function uploadGADMToSupabase(gadmData, countryCode) {
  console.log(`📤 Subiendo ${countryCode} a Supabase...`);
  
  try {
    if (!gadmData || !gadmData.features) {
      throw new Error('JSON inválido - debe ser un FeatureCollection de GADM');
    }

    const feature = gadmData.features[0];
    const countryName = feature.properties.COUNTRY || feature.properties.NAME_0 || countryCode;

    const { error } = await supabase
      .from('terrestrial_boundaries_cache')
      .upsert({
        country_code: countryCode,
        country_name: countryName,
        geojson: feature,
        source: 'GADM 4.1 (manual)',
        source_url: 'https://gadm.org',
        admin_level: 0
      }, {
        onConflict: 'country_code',
        ignoreDuplicates: false
      });

    if (error) throw error;

    console.log(`✅ ${countryName} guardado correctamente en Supabase`);
    alert(`✅ ${countryName} cargado correctamente!\n\nAhora recarga la página y activa ${countryName} en el mapa.`);

    return { success: true };

  } catch (err) {
    console.error('❌ Error subiendo a Supabase:', err);
    alert(`❌ Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Exponer en window
if (typeof window !== 'undefined') {
  window.loadGADMCountry = loadGADMCountry;
  window.loadVenezuelaWithEsequibo = loadVenezuelaWithEsequibo;
  window.loadCaribbeanFromGADM = loadCaribbeanFromGADM;
  window.uploadGADMToSupabase = uploadGADMToSupabase;
}

