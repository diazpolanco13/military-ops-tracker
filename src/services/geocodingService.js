/**
 * 🌍 Servicio de Geocodificación Inversa
 * 
 * Determina el país basándose en coordenadas usando:
 * 1. Cache local (Supabase)
 * 2. Nominatim API (OpenStreetMap) como fallback
 */

import { supabase } from '../lib/supabase';

// Cache en memoria para evitar llamadas repetidas
const geocodeCache = new Map();

// Rate limiting para Nominatim (máximo 1 request por segundo)
let lastNominatimCall = 0;
const NOMINATIM_DELAY = 1100; // 1.1 segundos

/**
 * Determinar país desde coordenadas
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 * @returns {Promise<{country_code: string, country_name: string} | null>}
 */
export async function getCountryFromCoordinates(lat, lon) {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  
  // Verificar cache en memoria
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }
  
  // Intentar con PostGIS (más rápido, sin rate limit)
  try {
    // Primero terrestrial
    const { data: terrestrial } = await supabase.rpc('get_country_at_point', {
      p_lon: lon,
      p_lat: lat
    });
    
    if (terrestrial && terrestrial.length > 0) {
      const result = {
        country_code: terrestrial[0].country_code,
        country_name: terrestrial[0].country_name
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    
    // Luego EEZ (zona marítima)
    const { data: maritime } = await supabase.rpc('get_eez_at_point', {
      p_lon: lon,
      p_lat: lat
    });
    
    if (maritime && maritime.length > 0) {
      const result = {
        country_code: maritime[0].country_code,
        country_name: maritime[0].country_name || maritime[0].zone_name
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('PostGIS geocoding failed:', err.message);
  }
  
  // Fallback a Nominatim
  return await reverseGeocodeNominatim(lat, lon, cacheKey);
}

/**
 * Reverse geocoding usando Nominatim API
 */
async function reverseGeocodeNominatim(lat, lon, cacheKey) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastCall = now - lastNominatimCall;
  if (timeSinceLastCall < NOMINATIM_DELAY) {
    await new Promise(resolve => setTimeout(resolve, NOMINATIM_DELAY - timeSinceLastCall));
  }
  lastNominatimCall = Date.now();
  
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SAE-RADAR/1.0 (Military Aircraft Tracker)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.address?.country_code) {
      const result = {
        country_code: data.address.country_code.toUpperCase(),
        country_name: data.address.country || data.display_name
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    
    // Si estamos en el océano, Nominatim puede devolver null
    // Guardamos null en cache para no reintentar
    geocodeCache.set(cacheKey, null);
    return null;
  } catch (err) {
    console.warn('Nominatim geocoding failed:', err.message);
    return null;
  }
}

/**
 * Procesar batch de coordenadas (para historial)
 * Respeta rate limiting de Nominatim
 */
export async function batchGeocodeHistory(historyRecords) {
  const results = [];
  
  for (const record of historyRecords) {
    if (!record.latitude || !record.longitude) {
      results.push({ ...record, country: null });
      continue;
    }
    
    // Si ya tiene país, no procesar
    if (record.country_code) {
      results.push({
        ...record,
        country: {
          country_code: record.country_code,
          country_name: record.country_name
        }
      });
      continue;
    }
    
    const country = await getCountryFromCoordinates(
      parseFloat(record.latitude),
      parseFloat(record.longitude)
    );
    
    results.push({ ...record, country });
  }
  
  return results;
}

/**
 * Actualizar historial en BD con países detectados
 */
export async function updateHistoryWithCountries(records) {
  const updates = [];
  
  for (const record of records) {
    if (record.country && record.country.country_code && !record.country_code) {
      updates.push({
        id: record.id,
        country_code: record.country.country_code,
        country_name: record.country.country_name
      });
    }
  }
  
  if (updates.length === 0) return { updated: 0 };
  
  // Actualizar en batch
  for (const update of updates) {
    await supabase
      .from('aircraft_location_history')
      .update({
        country_code: update.country_code,
        country_name: update.country_name
      })
      .eq('id', update.id);
  }
  
  return { updated: updates.length };
}

// Mapeo de códigos de país ISO a nombres en español
const COUNTRY_NAMES_ES = {
  'US': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'CU': 'Cuba',
  'CUB': 'Cuba',
  'MX': 'México',
  'MEX': 'México',
  'CO': 'Colombia',
  'COL': 'Colombia',
  'VE': 'Venezuela',
  'VEN': 'Venezuela',
  'JM': 'Jamaica',
  'JAM': 'Jamaica',
  'HT': 'Haití',
  'HTI': 'Haití',
  'DO': 'República Dominicana',
  'DOM': 'República Dominicana',
  'PR': 'Puerto Rico',
  'PRI': 'Puerto Rico',
  'BS': 'Bahamas',
  'BHS': 'Bahamas',
  'TT': 'Trinidad y Tobago',
  'TTO': 'Trinidad y Tobago',
  'PA': 'Panamá',
  'PAN': 'Panamá',
  'CR': 'Costa Rica',
  'CRI': 'Costa Rica',
  'NI': 'Nicaragua',
  'NIC': 'Nicaragua',
  'HN': 'Honduras',
  'HND': 'Honduras',
  'GT': 'Guatemala',
  'GTM': 'Guatemala',
  'BZ': 'Belice',
  'BLZ': 'Belice',
  'GY': 'Guyana',
  'GUY': 'Guyana',
  'SR': 'Surinam',
  'SUR': 'Surinam',
};

export function getCountryNameEs(code) {
  return COUNTRY_NAMES_ES[code?.toUpperCase()] || code;
}

export default {
  getCountryFromCoordinates,
  batchGeocodeHistory,
  updateHistoryWithCountries,
  getCountryNameEs
};

