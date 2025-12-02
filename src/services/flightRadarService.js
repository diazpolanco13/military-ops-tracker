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
 * Códigos de aerolíneas/operadores MILITARES
 * Campo [18] de la API - ¡CLAVE para identificar militares!
 * 
 * FlightRadar24 usa este campo para identificar operadores
 * Ejemplos:
 * - "RCH" = US Air Force (Reach)
 * - "CNV" = US Air Force (Convoy)
 * - "DAL" = Delta Airlines (civil)
 * - "AVA" = Avianca (civil)
 */
const MILITARY_AIRLINE_CODES = [
  // USA - Códigos oficiales de operador
  'RCH',     // US Air Force Cargo/Transport (Reach) ⭐ PRINCIPAL
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
  'USN',     // US Navy
  'USMC',    // US Marine Corps
  'USCG',    // US Coast Guard
  'ANG',     // Air National Guard
  
  // USA - Adicionales
  'SAM',     // Special Air Mission (Air Force One)
  'VENUS',   // US Air Force VIP
  'COYOTE',  // US Military
  'HAWK',    // US Military
  'EAGLE',   // US Military
  'SNAKE',   // US Military
  'TROPIC',  // US Military Caribbean ops
  'KING',    // US Military VIP
  'GUNDOG',  // US Military
  'ELVIS',   // US Military
  'TORCH',   // US Military
  'TANKER',  // US Military Refueling
  
  // Internacional - Latinoamérica/Caribe
  'FAC',     // Fuerza Aérea Colombiana
  'FAB',     // Fuerza Aérea Brasileña
  'FAV',     // Fuerza Aérea Venezolana
  'AME',     // Fuerza Aérea Mexicana
  'FARD',    // Fuerza Aérea República Dominicana
  'FAP',     // Fuerza Aérea Peruana
  'RAF',     // Royal Air Force (UK)
  'RAFAIR',  // Royal Air Force
];

/**
 * Prefijos de callsign militar (campo [16] o [9])
 */
const MILITARY_CALLSIGN_PREFIXES = [
  'RCH',     // Reach
  'CNV',     // Convoy
  'SPAR',    // Special Air Mission
  'ELVIS',   // Military callsign
  'NAVY',
  'USAF',
  'SAM',     // Special Air Mission
  'PAT',     // Air National Guard
  'ARMY',
  'GUARD',
];

/**
 * Códigos de aeronaves militares específicas
 * 
 * ⚠️ IMPORTANTE: Match EXACTO para evitar falsos positivos
 * - C17 = C-17 Globemaster (MILITAR) ✅
 * - C172 = Cessna 172 (CIVIL) ❌
 * - C130 = C-130 Hercules (MILITAR) ✅
 * - C182 = Cessna 182 (CIVIL) ❌
 */
const MILITARY_AIRCRAFT_TYPES = [
  // Transporte militar (NO confundir con Cessna civil)
  'C130',    // C-130 Hercules
  'C17',     // C-17 Globemaster III
  'C5',      // C-5 Galaxy
  'C40',     // C-40 Clipper
  'C12',     // C-12 Huron
  
  // Reabastecimiento
  'KC135',   // KC-135 Stratotanker
  'KC10',    // KC-10 Extender
  'KC46',    // KC-46 Pegasus
  
  // Vigilancia/AWACS
  'E3',      // E-3 Sentry (AWACS)
  'E6',      // E-6 Mercury
  'E2',      // E-2 Hawkeye
  'E8',      // E-8 JSTARS
  'RC135',   // RC-135 Rivet Joint
  'P8',      // P-8 Poseidon
  'P3',      // P-3 Orion
  
  // Bombarderos
  'B52',     // B-52 Stratofortress
  'B1',      // B-1 Lancer
  'B2',      // B-2 Spirit
  
  // Cazas
  'F15',     // F-15 Eagle
  'F16',     // F-16 Fighting Falcon
  'F18',     // F/A-18 Hornet
  'F22',     // F-22 Raptor
  'F35',     // F-35 Lightning II
  
  // Helicópteros militares
  'V22',     // V-22 Osprey
  'CH47',    // CH-47 Chinook
  'UH60',    // UH-60 Black Hawk (también H60)
  'H60',     // H60 Black Hawk variant
  'MH60',    // MH-60 variant
  'HH60',    // HH-60 Pave Hawk
  'AH64',    // AH-64 Apache
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
 * Filtra por códigos de operador militar, callsigns y tipos de aeronave
 * @returns {Promise<Array>} - Lista de vuelos militares
 */
export async function getMilitaryFlights() {
  try {
    const allFlights = await getFlightsByZone(CARIBBEAN_BOUNDS);
    
    console.log(`\n═══════════════════════════════════════`);
    console.log(`📊 FLIGHTRADAR24 - ANÁLISIS DE VUELOS`);
    console.log(`═══════════════════════════════════════`);
    console.log(`✈️ Total de vuelos recibidos: ${allFlights.length}`);
    
    // Filtrar solo vuelos militares
    const militaryFlights = allFlights.filter(flight => 
      isMilitaryFlight(flight)
    );

    // Agregar categoría a cada vuelo militar
    const categorizedFlights = militaryFlights.map(flight => ({
      ...flight,
      category: getMilitaryCategory(flight)
    }));

    console.log(`🎯 Vuelos militares detectados: ${militaryFlights.length}`);
    console.log(`═══════════════════════════════════════\n`);
    
    if (militaryFlights.length > 0) {
      console.log(`📋 LISTA DE VUELOS MILITARES:`);
      militaryFlights.forEach(f => {
        const cat = getMilitaryCategory(f);
        console.log(`   ${f.callsign.padEnd(15)} | ${f.aircraft.type.padEnd(8)} | ${cat.padEnd(12)} | ${f.aircraft.airline || 'N/A'}`);
      });
      console.log('');
    }
    
    return categorizedFlights;
  } catch (error) {
    console.error('❌ Error fetching military flights:', error);
    return [];
  }
}

/**
 * Determinar si un vuelo es militar o gubernamental
 * 
 * ✅ MÉTODO CORRECTO (verificado con datos reales):
 * 1. PRIORITARIO: Campo airline ([18]) - Operador militar (ej: "RCH", "CNV")
 * 2. Secundario: Callsign militar (ej: "ELVIS21", "97-0042")
 * 3. Terciario: Tipo de aeronave (ej: "C17", "KC135")
 * 4. Cuaternario: Registro militar (ej: "97-0042")
 * 
 * @param {Object} flight - Datos del vuelo
 * @returns {Boolean}
 */
function isMilitaryFlight(flight) {
  const airline = (flight.aircraft?.airline || '').toUpperCase().trim();
  const callsign = (flight.callsign || '').toUpperCase().trim();
  const aircraftType = (flight.aircraft?.type || '').toUpperCase();
  const registration = (flight.registration || '').toUpperCase().trim();
  
  // ✅ 1. PRIORITARIO: Verificar código de aerolínea/operador militar
  // Este es el campo MÁS CONFIABLE según FlightRadar24
  const hasMilitaryAirline = MILITARY_AIRLINE_CODES.some(code => 
    airline === code || airline.startsWith(code)
  );

  if (hasMilitaryAirline) {
    console.log(`🎯 MILITAR (airline): ${callsign} - Operador: ${airline}`);
    return true;
  }

  // 2. Verificar callsign militar
  const hasMilitaryCallsign = MILITARY_CALLSIGN_PREFIXES.some(prefix => 
    callsign.startsWith(prefix)
  );

  // 3. Verificar tipo de aeronave militar ESPECÍFICO
  // IMPORTANTE: Excluir aviones civiles (C172, C182 son Cessna CIVILES, NO C-17 militar)
  const isMilitaryAircraft = MILITARY_AIRCRAFT_TYPES.some(type => {
    // Match EXACTO para evitar falsos positivos
    // C17 ≠ C172 (C17 es militar, C172 es civil)
    return aircraftType === type;
  });

  // 4. Verificar registro militar (formato XX-XXXX)
  // Ejemplo: "97-0042" (C-17 de USAF)
  const hasMilitaryRegistration = 
    registration.match(/^\d{2}-\d{4,5}$/) || // Formato militar: 97-0042
    registration.includes('USAF') ||
    registration.includes('ARMY') ||
    registration.includes('NAVY') ||
    registration.includes('MARINE');

  // 5. Verificar squawk codes militares
  const squawk = flight.aircraft?.squawk || '';
  const hasMilitarySquawk = 
    squawk === '1277' ||  // Military VFR
    squawk === '4000' ||  // Military ops
    squawk === '4001' ||  // Military ops
    squawk === '1300';    // Military training

  const isMilitary = hasMilitaryCallsign || isMilitaryAircraft || hasMilitaryRegistration || hasMilitarySquawk;
  
  if (isMilitary) {
    console.log(`🎯 MILITAR: ${callsign} | Tipo: ${aircraftType} | Reg: ${registration} | Airline: ${airline}`);
  }

  return isMilitary;
}

/**
 * Parsear datos de vuelo desde formato FlightRadar24
 * 
 * ✅ Formato REAL verificado (data-cloud.flightradar24.com):
 * [0]  icao24 (hex transponder)
 * [1]  latitude
 * [2]  longitude
 * [3]  heading (0-360°)
 * [4]  altitude (feet)
 * [5]  speed (knots)
 * [6]  squawk (transponder code)
 * [7]  registration (INVÁLIDO - siempre "F-BDWY1")
 * [8]  aircraftType (ej: "C17", "B738", "A320")
 * [9]  callsign (identificador del vuelo)
 * [10] timestamp (unix)
 * [11] origin (IATA code)
 * [12] destination (IATA code)
 * [13] flightNumber
 * [14] onGround (0 o 1)
 * [15] verticalSpeed (ft/min)
 * [16] icaoType (callsign REAL + número, ej: "ELVIS21", "AVA019")
 * [17] field17 (siempre 0)
 * [18] airline (¡CLAVE! - operador/aerolínea, ej: "RCH" = US Air Force)
 * 
 * @param {String} flightId - ID del vuelo
 * @param {Array} flightData - Array de datos del vuelo
 * @returns {Object} - Objeto de vuelo parseado
 */
function parseFlightData(flightId, flightData) {
  if (!Array.isArray(flightData) || flightData.length < 17) {
    return null; // Datos inválidos
  }

  // Filtrar solo vuelos en el aire
  if (flightData[14] === 1) return null; // onGround

  return {
    // Identificación
    id: flightId,
    icao24: flightData[0] || '',
    callsign: flightData[16] || flightData[9] || flightData[0] || 'UNKNOWN', // [16] es el callsign REAL
    registration: flightData[9] || '', // [9] puede tener registro militar real
    
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
      registration: flightData[9] || '',
      squawk: flightData[6] || '',  // Código transponder
      airline: flightData[18] || '', // ¡OPERADOR! (ej: "RCH", "AVA", "DAL")
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
 * 
 * Usa el endpoint /clickhandler de FlightRadar24 que devuelve:
 * - Nombre completo del modelo de aeronave
 * - País de registro
 * - Edad de la aeronave
 * - Número de serie (MSN)
 * - Fotos de la aeronave
 * - Información de la aerolínea
 * - Historial de vuelo
 * - Aeropuertos de origen/destino con nombres completos
 * 
 * @param {String} flightId - ID del vuelo (ej: "3d38ecfe")
 * @returns {Promise<Object>} - Detalles completos del vuelo
 */
export async function getFlightDetails(flightId) {
  if (!flightId) {
    console.warn('⚠️ getFlightDetails: No flight ID provided');
    return null;
  }

  try {
    console.log(`🔍 Fetching details for flight: ${flightId}`);
    
    // Obtener token de autenticación de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const url = `${FLIGHTRADAR_PROXY_URL}?flight=${flightId}`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error('❌ Error fetching flight details:', response.status);
      return null;
    }

    const data = await response.json();
    
    console.log('✅ Flight details received:', {
      id: flightId,
      aircraft: data.aircraft?.model?.text,
      airline: data.airline?.name,
      registration: data.aircraft?.registration
    });

    // Parsear y estructurar los datos
    return {
      // Identificación
      id: data.identification?.id || flightId,
      callsign: data.identification?.callsign || '',
      flightNumber: data.identification?.number?.default || '',
      
      // Aeronave
      aircraft: {
        type: data.aircraft?.model?.code || '',
        modelName: data.aircraft?.model?.text || '', // ¡Nombre completo! ej: "Boeing C-17A Globemaster III"
        registration: data.aircraft?.registration || '',
        countryId: data.aircraft?.countryId || null,
        age: data.aircraft?.age || null,
        msn: data.aircraft?.msn || null, // Serial number
        hex: data.aircraft?.hex || '',
        images: data.aircraft?.images || null, // Fotos de la aeronave
      },
      
      // Aerolínea/Operador
      airline: {
        name: data.airline?.name || '',
        code: data.airline?.code || '',
        url: data.airline?.url || '',
      },
      
      // Propietario
      owner: data.owner || null,
      
      // Aeropuertos
      origin: data.airport?.origin ? {
        code: data.airport.origin.code?.iata || data.airport.origin.code?.icao || '',
        name: data.airport.origin.name || '',
        city: data.airport.origin.position?.region?.city || '',
        country: data.airport.origin.position?.country?.name || '',
        timezone: data.airport.origin.timezone?.name || '',
      } : null,
      
      destination: data.airport?.destination ? {
        code: data.airport.destination.code?.iata || data.airport.destination.code?.icao || '',
        name: data.airport.destination.name || '',
        city: data.airport.destination.position?.region?.city || '',
        country: data.airport.destination.position?.country?.name || '',
        timezone: data.airport.destination.timezone?.name || '',
      } : null,
      
      // Estado
      status: {
        live: data.status?.live || false,
        text: data.status?.text || '',
      },
      
      // Tiempos
      time: data.time || null,
      
      // Trail (historial de posiciones)
      trail: data.trail || [],
      
      // Raw data
      _raw: data,
    };
  } catch (error) {
    console.error('❌ Error fetching flight details:', error);
    return null;
  }
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
 * @returns {String} - Categoría: 'combat', 'transport', 'tanker', 'surveillance', 'bomber', 'helicopter', 'other'
 */
export function getMilitaryCategory(flight) {
  const type = (flight.aircraft?.type || '').toUpperCase();
  const callsign = (flight.callsign || '').toUpperCase();
  const airline = (flight.aircraft?.airline || '').toUpperCase();

  // Cazas de combate
  if (type.includes('F15') || type.includes('F16') || type.includes('F22') || type.includes('F35') || 
      type.includes('F18') || type.includes('F14')) {
    return 'combat';
  }

  // Bombarderos
  if (type.includes('B52') || type.includes('B1') || type.includes('B2')) {
    return 'bomber';
  }

  // Reabastecimiento (Tankers)
  if (type.includes('KC135') || type.includes('KC10') || type.includes('KC46') || 
      type.includes('KC') || callsign.includes('TANKER')) {
    return 'tanker';
  }

  // Vigilancia/Patrulla/Reconocimiento
  if (type.includes('P8') || type.includes('P3') || type.includes('E3') || type.includes('E6') || 
      type.includes('E2') || type.includes('E8') || type.includes('RC135') || 
      airline === 'IRON' || callsign.startsWith('IRON')) {
    return 'surveillance';
  }

  // Transporte/Carga (más común en Caribe)
  if (type.includes('C130') || type.includes('C17') || type.includes('C5') || type.includes('C141') ||
      type.includes('C12') || type.includes('C40') ||
      airline === 'RCH' || airline === 'CNV' || 
      callsign.startsWith('RCH') || callsign.startsWith('CNV') || callsign.startsWith('SPAR')) {
    return 'transport';
  }

  // Helicópteros
  if (type.includes('CH47') || type.includes('UH60') || type.includes('AH64') || 
      type.includes('MH60') || type.includes('HH60')) {
    return 'helicopter';
  }

  // VIP/Special (Air Force One, etc)
  if (callsign.startsWith('SAM') || callsign.startsWith('VENUS') || airline === 'SAM') {
    return 'vip';
  }

  return 'other';
}

/**
 * Obtener color según categoría militar (estilo FlightRadar24)
 * @param {String} category - Categoría militar
 * @returns {String} - Color hex
 */
export function getCategoryColor(category) {
  const colors = {
    combat: '#ef4444',       // Rojo (cazas)
    bomber: '#dc2626',       // Rojo oscuro (bombarderos)
    transport: '#FFC107',    // Amarillo (transporte) - ¡COMO FLIGHTRADAR24!
    tanker: '#10b981',       // Verde (reabastecimiento)
    surveillance: '#f59e0b', // Naranja (vigilancia)
    helicopter: '#8b5cf6',   // Morado (helicópteros)
    vip: '#ec4899',          // Rosa (VIP/Special)
    other: '#FFC107',        // Amarillo (otros) - por defecto amarillo militar
  };

  return colors[category] || colors.other;
}

/**
 * 🎯 CLASIFICAR VUELO EN CATEGORÍA FLIGHTRADAR24
 * Categorías: passenger, cargo, military, business, general, helicopter, drones, other
 * 
 * @param {Object} flight - Datos del vuelo
 * @returns {String} - Categoría del vuelo
 */
export function getFlightCategory(flight) {
  const type = (flight.aircraft?.type || '').toUpperCase();
  const callsign = (flight.callsign || '').toUpperCase();
  const airline = (flight.aircraft?.airline || '').toUpperCase();
  const registration = (flight.registration || flight.aircraft?.registration || '').toUpperCase();

  // 1. MILITAR O GOBIERNO
  if (isMilitaryFlight(flight)) {
    return 'military';
  }

  // 2. HELICÓPTEROS (civiles)
  const heliTypes = ['H60', 'H47', 'H64', 'H53', 'S76', 'S92', 'EC', 'AS', 'R44', 'R22', 'B06', 'B07', 'A109', 'A139', 'BK17', 'EC35', 'EC45', 'EC55', 'EC75', 'EC30'];
  if (heliTypes.some(h => type.includes(h))) {
    return 'helicopter';
  }

  // 3. CARGA (freight)
  const cargoAirlines = ['FDX', 'UPS', 'DHL', 'ABX', 'GTI', 'CLX', 'CAL', 'KAL CARGO', 'NCA', 'PAC', 'SQC'];
  if (cargoAirlines.some(c => airline.includes(c)) || callsign.includes('CARGO') || callsign.includes('HEAVY')) {
    return 'cargo';
  }

  // 4. JETS PRIVADOS / EJECUTIVOS
  const businessTypes = ['GLF', 'G', 'CL', 'LJ', 'C525', 'C550', 'C560', 'C680', 'C750', 'FA', 'PC12', 'PC24', 'E55P', 'E550', 'GLEX', 'GL5T', 'GL7T', 'G280', 'G450', 'G550', 'G650', 'GALX'];
  if (businessTypes.some(b => type.startsWith(b) || type.includes(b))) {
    return 'business';
  }

  // 5. PASAJEROS (aerolíneas comerciales)
  const passengerAirlines = ['AAL', 'UAL', 'DAL', 'SWA', 'JBU', 'NKS', 'FFT', 'AAY', 'ASA', 'HAL', 'SKW', 'ENY', 'RPA', 'JIA', 'LAN', 'TAM', 'AVA', 'CMP', 'GLG', 'VIV', 'VOI', 'AZU', 'ARG', 'AEA', 'IBE', 'BAW', 'AFR', 'KLM', 'DLH', 'ACA', 'WJA', 'EZY'];
  const passengerTypes = ['A32', 'A33', 'A34', 'A35', 'A38', 'B73', 'B74', 'B75', 'B76', 'B77', 'B78', 'B38M', 'B39M', 'E17', 'E19', 'E75', 'E90', 'E95', 'CRJ', 'DH8', 'AT7', 'AT4'];
  if (passengerAirlines.some(a => airline.includes(a)) || passengerTypes.some(t => type.includes(t))) {
    return 'passenger';
  }

  // 6. AVIACIÓN GENERAL (pequeñas aeronaves)
  const generalTypes = ['C172', 'C182', 'C206', 'C208', 'PA28', 'PA32', 'PA34', 'PA46', 'SR20', 'SR22', 'DA40', 'DA42', 'BE33', 'BE35', 'BE36', 'BE55', 'BE58', 'M20', 'TB20', 'TB21'];
  if (generalTypes.some(t => type.includes(t))) {
    return 'general';
  }

  // 7. DRONES
  const droneTypes = ['RPAS', 'UAV', 'MQ9', 'MQ1', 'RQ4', 'HALE'];
  if (droneTypes.some(d => type.includes(d)) || callsign.includes('DRONE')) {
    return 'drones';
  }

  // 8. PLANEADORES
  const gliderTypes = ['GLID', 'SGS', 'ASK', 'ASW', 'LS8', 'DG8', 'VENTUS'];
  if (gliderTypes.some(g => type.includes(g))) {
    return 'gliders';
  }

  // 9. Si tiene operador pero no identificado, probablemente pasajero
  if (airline && airline.length >= 2) {
    return 'passenger';
  }

  // 10. Sin categorizar
  return 'uncategorized';
}

/**
 * Filtrar vuelos según categorías activas
 * @param {Array} flights - Lista de vuelos
 * @param {Object} activeFilters - Filtros activos { military: true, passenger: false, ... }
 * @returns {Array} - Vuelos filtrados
 */
export function filterFlightsByCategory(flights, activeFilters = {}) {
  // Si no hay filtros activos, mostrar todos
  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  if (!hasActiveFilters) {
    return flights;
  }

  return flights.filter(flight => {
    const category = flight.flightCategory || getFlightCategory(flight);
    return activeFilters[category] === true;
  });
}

/**
 * Obtener todos los vuelos (sin filtrar por militar) con categoría asignada
 */
export async function getAllFlights() {
  const allFlights = await getFlightsByZone(CARIBBEAN_BOUNDS);
  
  // Agregar categoría a cada vuelo
  return allFlights.map(flight => ({
    ...flight,
    flightCategory: getFlightCategory(flight),
    category: isMilitaryFlight(flight) ? getMilitaryCategory(flight) : null
  }));
}

export default {
  getFlightsByZone,
  getMilitaryFlights,
  getAllFlights,
  getFlightDetails,
  feetToMeters,
  knotsToKmh,
  getMilitaryCategory,
  getCategoryColor,
  getFlightCategory,
  filterFlightsByCategory,
  CARIBBEAN_BOUNDS,
};

