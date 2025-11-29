/**
 * 🛩️ SERVICIO FLIGHTRADAR24 API
 * 
 * Integración con FlightRadar24 API para tracking de vuelos militares en tiempo real
 * Endpoint principal: https://fr24api.flightradar24.com
 * 
 * CAPACIDADES:
 * - Obtener vuelos por zona geográfica (bounding box)
 * - Filtrar vuelos militares por callsign/ICAO
 * - Tracking en tiempo real con actualización automática
 * - Detalles completos de cada vuelo
 */

/**
 * ✅ ENDPOINT CORRECTO VERIFICADO (probado con test-flightradar-api.js)
 * 
 * data-cloud.flightradar24.com - Funciona desde servidor Node.js
 * PROBLEMA: CORS bloqueado desde navegador (solo permite www.flightradar24.com)
 * SOLUCIÓN: Usar Supabase Edge Function como proxy
 */
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FLIGHTRADAR_PROXY_URL = `${SUPABASE_URL}/functions/v1/flightradar-proxy`;

/**
 * Códigos ICAO de aerolíneas militares de EEUU
 * https://en.wikipedia.org/wiki/List_of_aircraft_registration_prefixes
 */
const MILITARY_CALLSIGN_PREFIXES = [
  // USA - Principales
  'RCH',     // US Air Force Cargo/Transport (Reach)
  'CNV',     // US Air Force Cargo/Transport (Convoy)
  'EVAC',    // US Air Force Medical Evacuation
  'SPAR',    // US Air Force Special Air Mission
  'DUKE',    // US Navy E-6B Mercury
  'IRON',    // US Navy P-8 Poseidon
  'VENOM',   // US Marine Corps
  'THNDR',   // US Air Force Thunderbirds
  'JEDI',    // US Air Force
  'BOXER',   // US Military
  'HERKY',   // US Air Force C-130
  'PAT',     // US Air National Guard
  'NAVY',    // US Navy
  'USAF',    // US Air Force
  'MC',      // US Military Cargo
  'AE',      // US Air Force (Aeromedical Evacuation)
  
  // USA - Adicionales Caribe
  'SAM',     // Special Air Mission (Air Force One)
  'AF',      // Air Force
  'ARMY',    // US Army
  'GUARD',   // Coast Guard / National Guard
  'VENUS',   // US Air Force VIP
  'COYOTE',  // US Military
  'HAWK',    // US Military
  'EAGLE',   // US Military
  'SNAKE',   // US Military
  'TROPIC',  // US Military Caribbean ops
  'KING',    // US Military VIP
  'BAT',     // US Military (Batman callsign)
  
  // Internacional - Latinoamérica/Caribe
  'FAC',     // Fuerza Aérea Colombiana
  'FAB',     // Fuerza Aérea Brasileña
  'FAV',     // Fuerza Aérea Venezolana
  'AME',     // Fuerza Aérea Mexicana
  'FARD',    // Fuerza Aérea República Dominicana
  'FAP',     // Fuerza Aérea Peruana
];

/**
 * Códigos de aeronaves militares específicas
 */
const MILITARY_AIRCRAFT_TYPES = [
  'C130',    // C-130 Hercules
  'C17',     // C-17 Globemaster III
  'KC135',   // KC-135 Stratotanker
  'KC10',    // KC-10 Extender
  'KC46',    // KC-46 Pegasus
  'E3',      // E-3 Sentry (AWACS)
  'E6',      // E-6 Mercury
  'P8',      // P-8 Poseidon
  'B52',     // B-52 Stratofortress
  'B1',      // B-1 Lancer
  'F15',     // F-15 Eagle
  'F16',     // F-16 Fighting Falcon
  'F22',     // F-22 Raptor
  'F35',     // F-35 Lightning II
  'V22',     // V-22 Osprey
  'CH47',    // CH-47 Chinook
  'UH60',    // UH-60 Black Hawk
];

/**
 * Configuración de zona del Caribe AMPLIADA (bounding box)
 * 
 * Cubre TODO el Caribe y norte de Sudamérica:
 * - República Dominicana, Puerto Rico
 * - Trinidad y Tobago, Curazao, Aruba, Bonaire
 * - Venezuela (incluye Caracas)
 * - Colombia, Panamá
 * - Islas del Caribe (Jamaica, Bahamas, etc)
 * - Sur de Florida y Golfo de México
 */
export const CARIBBEAN_BOUNDS = {
  north: 27.0,   // Norte: Sur de Florida + Bahamas
  south: 8.0,    // Sur: Norte de Venezuela (incluye Caracas 10.5°N)
  west: -85.0,   // Oeste: Costa oeste de Panamá/Nicaragua
  east: -58.0,   // Este: Trinidad y Tobago + Barbados
};

/**
 * Obtener vuelos en una zona geográfica específica
 * @param {Object} bounds - Límites geográficos {north, south, west, east}
 * @returns {Promise<Array>} - Lista de vuelos
 */
export async function getFlightsByZone(bounds = CARIBBEAN_BOUNDS) {
  try {
    // Params: bounds=north,south,west,east
    const boundsString = `${bounds.north},${bounds.south},${bounds.west},${bounds.east}`;
    
    // Obtener token de autenticación de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.warn('⚠️ No hay sesión activa, intentando sin autenticación');
    }
    
    // ✅ Usar Edge Function como proxy (evita CORS)
    const url = `${FLIGHTRADAR_PROXY_URL}?bounds=${boundsString}`;

    console.log('🛩️ Fetching flights from FlightRadar24 (via Supabase proxy)...');
    console.log('📍 Zona:', boundsString);

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Agregar token de autenticación si existe
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Proxy error:', errorData);
      throw new Error(`FlightRadar proxy error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 Datos recibidos:', Object.keys(data).length, 'items');
    
    // La API retorna un objeto con flight IDs como keys
    // Ejemplo: { "abc123": [...], "def456": [...], ... }
    const flights = Object.entries(data)
      .filter(([key]) => key !== 'full_count' && key !== 'version')
      .map(([flightId, flightData]) => parseFlightData(flightId, flightData))
      .filter(f => f !== null); // Filtrar datos inválidos

    console.log('✈️ Vuelos parseados:', flights.length);
    return flights;
  } catch (error) {
    console.error('❌ Error fetching flights from FlightRadar24:', error);
    throw error;
  }
}

/**
 * Obtener vuelos MILITARES en el Caribe
 * Filtra por callsigns y tipos de aeronave militar
 * @returns {Promise<Array>} - Lista de vuelos militares
 */
export async function getMilitaryFlights() {
  try {
    const allFlights = await getFlightsByZone(CARIBBEAN_BOUNDS);
    
    // 🧪 MODO DEBUG: Mostrar TODOS los vuelos (sin filtrar militares)
    // Para verificar que la integración funciona
    console.log(`✈️ Vuelos totales recibidos: ${allFlights.length}`);
    console.log('📄 Muestra de vuelos:', allFlights.slice(0, 3));
    
    // Filtrar solo vuelos militares
    const militaryFlights = allFlights.filter(flight => 
      isMilitaryFlight(flight)
    );

    console.log(`✈️ Vuelos totales: ${allFlights.length}, Militares: ${militaryFlights.length}`);
    
    // 🧪 TEMPORAL: Retornar TODOS los vuelos para verificar que se muestran
    // TODO: Cambiar a return militaryFlights cuando funcione
    return allFlights.length > 0 ? allFlights : militaryFlights;
  } catch (error) {
    console.error('❌ Error fetching military flights:', error);
    return [];
  }
}

/**
 * Determinar si un vuelo es militar o gubernamental
 * @param {Object} flight - Datos del vuelo
 * @returns {Boolean}
 */
function isMilitaryFlight(flight) {
  const callsign = (flight.callsign || '').toUpperCase().trim();
  const aircraftType = (flight.aircraft?.type || '').toUpperCase();
  const registration = (flight.registration || flight.aircraft?.registration || '').toUpperCase();
  
  // 1. Verificar callsign militar
  const hasMilitaryCallsign = MILITARY_CALLSIGN_PREFIXES.some(prefix => 
    callsign.startsWith(prefix)
  );

  // 2. Verificar tipo de aeronave militar
  const isMilitaryAircraft = MILITARY_AIRCRAFT_TYPES.some(type => 
    aircraftType.includes(type)
  );

  // 3. Verificar registro militar/gobierno
  // USA: N-numbers especiales (16xxxx, 17xxxx, 2xxxx, 8xxxx, 9xxxx)
  // Ejemplo: N166XX (USAF), N2000X (Government)
  const hasMilitaryRegistration = 
    registration.startsWith('N16') ||  // USAF
    registration.startsWith('N17') ||  // USAF
    registration.startsWith('N2')  ||  // Government
    registration.startsWith('N8')  ||  // Special
    registration.startsWith('N9')  ||  // Military
    registration.startsWith('N5')  ||  // US Army
    registration.match(/^\d{2}-\d{4}$/) || // Formato militar internacional
    registration.includes('USAF') ||
    registration.includes('ARMY') ||
    registration.includes('NAVY') ||
    registration.includes('MARINE');

  // 4. Verificar squawk codes militares
  const squawk = flight.aircraft?.squawk || '';
  const hasMilitarySquawk = 
    squawk === '1277' ||  // Military VFR
    squawk === '4000' ||  // Military ops
    squawk === '4001' ||  // Military ops
    squawk === '1300';    // Military training

  return hasMilitaryCallsign || isMilitaryAircraft || hasMilitaryRegistration || hasMilitarySquawk;
}

/**
 * Parsear datos de vuelo desde formato FlightRadar24
 * 
 * ✅ Formato REAL verificado (data-cloud.flightradar24.com):
 * [icao24, lat, lon, heading, altitude, speed, squawk, registration, aircraft_type, callsign, timestamp, ...]
 * Ejemplo: ["A26454", 19.8, -66.46, 37, 63000, 16, "", "F-BDWY1", "BALL", "N253TH", 1764273627, ...]
 * 
 * @param {String} flightId - ID del vuelo
 * @param {Array} flightData - Array de datos del vuelo
 * @returns {Object} - Objeto de vuelo parseado
 */
function parseFlightData(flightId, flightData) {
  if (!Array.isArray(flightData) || flightData.length < 11) {
    return null; // Datos inválidos
  }

  // Filtrar solo vuelos en el aire
  if (flightData[14] === 1) return null; // onGround

  return {
    // Identificación
    id: flightId,
    icao24: flightData[0] || '',
    callsign: flightData[9] || flightData[7] || flightData[0] || 'UNKNOWN',
    registration: flightData[7] || '',
    
    // Posición
    latitude: parseFloat(flightData[1]),
    longitude: parseFloat(flightData[2]),
    heading: parseInt(flightData[3]) || 0,      // Rumbo en grados (0-360)
    altitude: parseInt(flightData[4]) || 0,     // Altitud en pies
    
    // Velocidad
    speed: parseInt(flightData[5]) || 0,        // Velocidad en nudos
    verticalSpeed: parseInt(flightData[15]) || 0, // Velocidad vertical en ft/min
    
    // Aeronave
    aircraft: {
      type: flightData[8] || 'UNKNOWN',
      registration: flightData[7] || '',
      squawk: flightData[6] || '',  // Código transponder
    },
    
    // Vuelo
    origin: flightData[11] || '',      // Código IATA origen
    destination: flightData[12] || '', // Código IATA destino
    flightNumber: flightData[13] || '',
    
    // Estado
    onGround: flightData[14] === 1,
    
    // Metadata
    timestamp: flightData[10] || Date.now() / 1000,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Obtener detalles completos de un vuelo específico
 * @param {String} flightId - ID del vuelo
 * @returns {Promise<Object>} - Detalles del vuelo
 */
export async function getFlightDetails(flightId) {
  // TODO: Implementar detalles de vuelo específico si es necesario
  // Por ahora, la información básica viene en el feed principal
  console.warn('getFlightDetails not implemented yet');
  return null;
}

/**
 * Convertir altitud de pies a metros
 * @param {Number} altitudFeet - Altitud en pies
 * @returns {Number} - Altitud en metros
 */
export function feetToMeters(altitudFeet) {
  return Math.round(altitudFeet * 0.3048);
}

/**
 * Convertir velocidad de nudos a km/h
 * @param {Number} speedKnots - Velocidad en nudos
 * @returns {Number} - Velocidad en km/h
 */
export function knotsToKmh(speedKnots) {
  return Math.round(speedKnots * 1.852);
}

/**
 * Determinar categoría de aeronave militar
 * @param {Object} flight - Datos del vuelo
 * @returns {String} - Categoría: 'combat', 'transport', 'tanker', 'surveillance', 'other'
 */
export function getMilitaryCategory(flight) {
  const type = (flight.aircraft?.type || '').toUpperCase();
  const callsign = (flight.callsign || '').toUpperCase();

  // Cazas de combate
  if (type.includes('F15') || type.includes('F16') || type.includes('F22') || type.includes('F35')) {
    return 'combat';
  }

  // Transporte/Carga
  if (type.includes('C130') || type.includes('C17') || callsign.startsWith('RCH') || callsign.startsWith('CNV')) {
    return 'transport';
  }

  // Reabastecimiento
  if (type.includes('KC') || type.includes('TANKER')) {
    return 'tanker';
  }

  // Vigilancia/Patrulla
  if (type.includes('P8') || type.includes('E3') || type.includes('E6') || callsign.startsWith('IRON')) {
    return 'surveillance';
  }

  // Bombarderos
  if (type.includes('B52') || type.includes('B1') || type.includes('B2')) {
    return 'bomber';
  }

  return 'other';
}

/**
 * Obtener color según categoría militar
 * @param {String} category - Categoría militar
 * @returns {String} - Color hex
 */
export function getCategoryColor(category) {
  const colors = {
    combat: '#ef4444',       // Rojo (cazas)
    transport: '#3b82f6',    // Azul (transporte)
    tanker: '#10b981',       // Verde (reabastecimiento)
    surveillance: '#f59e0b', // Naranja (vigilancia)
    bomber: '#dc2626',       // Rojo oscuro (bombarderos)
    other: '#6b7280',        // Gris (otros)
  };

  return colors[category] || colors.other;
}

export default {
  getFlightsByZone,
  getMilitaryFlights,
  getFlightDetails,
  feetToMeters,
  knotsToKmh,
  getMilitaryCategory,
  getCategoryColor,
  CARIBBEAN_BOUNDS,
};

