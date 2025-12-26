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

// Helper para obtener env vars (compatible con .env local y Docker)
const getEnv = (key) => {
  if (import.meta.env[key]) return import.meta.env[key];
  if (typeof window !== 'undefined' && window.ENV?.[key]) return window.ENV[key];
  return undefined;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
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
 * 🌍 DETECCIÓN DE PAÍS POR ICAO24 (HEX)
 * 
 * El código ICAO24 (hex) contiene el prefijo del país registrador.
 * Esta es la forma MÁS PRECISA de identificar el país de una aeronave.
 * 
 * Rangos ICAO24 oficiales: https://www.icao.int/publications/DOC8585
 */
const ICAO24_COUNTRY_RANGES = [
  // ===== ESTADOS UNIDOS (MILITAR) =====
  { start: 'AE0000', end: 'AFFFFF', code: 'US', flag: '🇺🇸', name: 'Estados Unidos', military: true },
  { start: 'AF0000', end: 'AFFFFF', code: 'US', flag: '🇺🇸', name: 'Estados Unidos', military: true },
  
  // ===== ESTADOS UNIDOS (CIVIL) =====
  { start: 'A00000', end: 'ADFFFF', code: 'US', flag: '🇺🇸', name: 'Estados Unidos', military: false },
  
  // ===== LATINOAMÉRICA =====
  { start: '0D8000', end: '0D8FFF', code: 'VE', flag: '🇻🇪', name: 'Venezuela', military: false },
  { start: '0AC000', end: 'ACFFFF', code: 'CO', flag: '🇨🇴', name: 'Colombia', military: false },
  { start: 'E40000', end: 'E4FFFF', code: 'BR', flag: '🇧🇷', name: 'Brasil', military: false },
  { start: '0D0000', end: '0D7FFF', code: 'MX', flag: '🇲🇽', name: 'México', military: false },
  { start: '0C4000', end: '0C4FFF', code: 'DO', flag: '🇩🇴', name: 'Rep. Dominicana', military: false },
  { start: '0C2000', end: '0C2FFF', code: 'PA', flag: '🇵🇦', name: 'Panamá', military: false },
  { start: '0AE000', end: '0AEFFF', code: 'CR', flag: '🇨🇷', name: 'Costa Rica', military: false },
  { start: '0A8000', end: '0A8FFF', code: 'CU', flag: '🇨🇺', name: 'Cuba', military: false },
  { start: '0B0000', end: '0B0FFF', code: 'EC', flag: '🇪🇨', name: 'Ecuador', military: false },
  { start: '0AA000', end: '0AAFFF', code: 'GT', flag: '🇬🇹', name: 'Guatemala', military: false },
  { start: 'E00000', end: 'E0FFFF', code: 'AR', flag: '🇦🇷', name: 'Argentina', military: false },
  { start: 'E80000', end: 'E8FFFF', code: 'CL', flag: '🇨🇱', name: 'Chile', military: false },
  { start: 'E94000', end: 'E94FFF', code: 'PE', flag: '🇵🇪', name: 'Perú', military: false },
  { start: '0A0000', end: '0A0FFF', code: 'TT', flag: '🇹🇹', name: 'Trinidad y Tobago', military: false },
  { start: '0C0000', end: '0C0FFF', code: 'JM', flag: '🇯🇲', name: 'Jamaica', military: false },
  
  // ===== EUROPA =====
  { start: '400000', end: '43FFFF', code: 'GB', flag: '🇬🇧', name: 'Reino Unido', military: false },
  { start: '380000', end: '3BFFFF', code: 'FR', flag: '🇫🇷', name: 'Francia', military: false },
  { start: '3C0000', end: '3FFFFF', code: 'DE', flag: '🇩🇪', name: 'Alemania', military: false },
  { start: '480000', end: '487FFF', code: 'NL', flag: '🇳🇱', name: 'Países Bajos', military: false },
  { start: '340000', end: '37FFFF', code: 'ES', flag: '🇪🇸', name: 'España', military: false },
  { start: '300000', end: '33FFFF', code: 'IT', flag: '🇮🇹', name: 'Italia', military: false },
  { start: '440000', end: '447FFF', code: 'AT', flag: '🇦🇹', name: 'Austria', military: false },
  { start: '500000', end: '5003FF', code: 'PT', flag: '🇵🇹', name: 'Portugal', military: false },
  { start: '100000', end: '1FFFFF', code: 'RU', flag: '🇷🇺', name: 'Rusia', military: false },
  
  // ===== OTROS =====
  { start: 'C00000', end: 'C3FFFF', code: 'CA', flag: '🇨🇦', name: 'Canadá', military: false },
  { start: '7C0000', end: '7FFFFF', code: 'AU', flag: '🇦🇺', name: 'Australia', military: false },
  { start: 'C80000', end: 'C87FFF', code: 'NZ', flag: '🇳🇿', name: 'Nueva Zelanda', military: false },
  { start: '780000', end: '7BFFFF', code: 'CN', flag: '🇨🇳', name: 'China', military: false },
  { start: '840000', end: '87FFFF', code: 'JP', flag: '🇯🇵', name: 'Japón', military: false },
  { start: '710000', end: '717FFF', code: 'IL', flag: '🇮🇱', name: 'Israel', military: false },
];

/**
 * Detectar país por código ICAO24 (hex)
 * @param {string} icao24 - Código hexadecimal del transponder
 * @returns {Object} - { code, flag, name, military }
 */
export function getCountryByICAO24(icao24) {
  if (!icao24 || typeof icao24 !== 'string') {
    return { code: 'XX', flag: '🏳️', name: 'Desconocido', military: false };
  }
  
  const hex = icao24.toUpperCase().replace(/[^A-F0-9]/g, '');
  if (hex.length < 2) {
    return { code: 'XX', flag: '🏳️', name: 'Desconocido', military: false };
  }
  
  // Buscar en rangos
  const hexNum = parseInt(hex.substring(0, 6).padEnd(6, '0'), 16);
  
  for (const range of ICAO24_COUNTRY_RANGES) {
    const startNum = parseInt(range.start, 16);
    const endNum = parseInt(range.end, 16);
    
    if (hexNum >= startNum && hexNum <= endNum) {
      return {
        code: range.code,
        flag: range.flag,
        name: range.name,
        military: range.military
      };
    }
  }
  
  // Detección por prefijo simple si no está en rangos
  const prefix2 = hex.substring(0, 2);
  const simpleMap = {
    'AE': { code: 'US', flag: '🇺🇸', name: 'Estados Unidos (Mil)', military: true },
    'AF': { code: 'US', flag: '🇺🇸', name: 'Estados Unidos (Mil)', military: true },
    'AD': { code: 'US', flag: '🇺🇸', name: 'Estados Unidos', military: false },
    '0D': { code: 'VE', flag: '🇻🇪', name: 'Venezuela', military: false },
    '0A': { code: 'CO', flag: '🇨🇴', name: 'Colombia', military: false },
    '0C': { code: 'DO', flag: '🇩🇴', name: 'Rep. Dominicana', military: false },
    'E4': { code: 'BR', flag: '🇧🇷', name: 'Brasil', military: false },
    '40': { code: 'GB', flag: '🇬🇧', name: 'Reino Unido', military: false },
    '38': { code: 'FR', flag: '🇫🇷', name: 'Francia', military: false },
    'C0': { code: 'CA', flag: '🇨🇦', name: 'Canadá', military: false },
    'C8': { code: 'NZ', flag: '🇳🇿', name: 'Nueva Zelanda', military: false },
  };
  
  if (simpleMap[prefix2]) {
    return simpleMap[prefix2];
  }
  
  return { code: 'XX', flag: '🏳️', name: 'Desconocido', military: false };
}

/**
 * 🎖️ BASE DE DATOS DE MODELOS DE AERONAVES
 * Mapeo de códigos ICAO a nombres completos
 */
export const AIRCRAFT_MODELS_DB = {
  // ===== TRANSPORTE MILITAR USA =====
  'C17': { name: 'Boeing C-17A Globemaster III', category: 'transport', country: 'US' },
  'C130': { name: 'Lockheed C-130 Hercules', category: 'transport', country: 'US' },
  'C5': { name: 'Lockheed C-5 Galaxy', category: 'transport', country: 'US' },
  'C5M': { name: 'Lockheed C-5M Super Galaxy', category: 'transport', country: 'US' },
  'C40': { name: 'Boeing C-40 Clipper', category: 'transport', country: 'US' },
  'C32': { name: 'Boeing C-32 (757 VIP)', category: 'vip', country: 'US' },
  'C37': { name: 'Gulfstream C-37A', category: 'vip', country: 'US' },
  'C12': { name: 'Beechcraft C-12 Huron', category: 'transport', country: 'US' },
  
  // ===== REABASTECIMIENTO =====
  'KC135': { name: 'Boeing KC-135 Stratotanker', category: 'tanker', country: 'US' },
  'KC10': { name: 'McDonnell Douglas KC-10 Extender', category: 'tanker', country: 'US' },
  'KC46': { name: 'Boeing KC-46 Pegasus', category: 'tanker', country: 'US' },
  
  // ===== VIGILANCIA/AWACS =====
  'E3': { name: 'Boeing E-3 Sentry AWACS', category: 'surveillance', country: 'US' },
  'E6': { name: 'Boeing E-6 Mercury', category: 'surveillance', country: 'US' },
  'E2': { name: 'Northrop Grumman E-2 Hawkeye', category: 'surveillance', country: 'US' },
  'E8': { name: 'Northrop Grumman E-8 Joint STARS', category: 'surveillance', country: 'US' },
  'RC135': { name: 'Boeing RC-135 Rivet Joint', category: 'surveillance', country: 'US' },
  'P8': { name: 'Boeing P-8A Poseidon', category: 'surveillance', country: 'US' },
  'P3': { name: 'Lockheed P-3 Orion', category: 'surveillance', country: 'US' },
  'U2': { name: 'Lockheed U-2 Dragon Lady', category: 'surveillance', country: 'US' },
  'RQ4': { name: 'Northrop Grumman RQ-4 Global Hawk', category: 'surveillance', country: 'US' },
  'MQ9': { name: 'General Atomics MQ-9 Reaper', category: 'surveillance', country: 'US' },
  
  // ===== CAZAS =====
  'F15': { name: 'McDonnell Douglas F-15 Eagle', category: 'combat', country: 'US' },
  'F16': { name: 'General Dynamics F-16 Fighting Falcon', category: 'combat', country: 'US' },
  'F18': { name: 'Boeing F/A-18 Hornet', category: 'combat', country: 'US' },
  'FA18': { name: 'Boeing F/A-18 Hornet', category: 'combat', country: 'US' },
  'F22': { name: 'Lockheed Martin F-22 Raptor', category: 'combat', country: 'US' },
  'F35': { name: 'Lockheed Martin F-35 Lightning II', category: 'combat', country: 'US' },
  'F185': { name: 'Lockheed Martin F-35A Lightning II', category: 'combat', country: 'US' },
  'EA18': { name: 'Boeing EA-18G Growler', category: 'combat', country: 'US' },
  
  // ===== BOMBARDEROS =====
  'B52': { name: 'Boeing B-52 Stratofortress', category: 'bomber', country: 'US' },
  'B1': { name: 'Rockwell B-1B Lancer', category: 'bomber', country: 'US' },
  'B2': { name: 'Northrop Grumman B-2 Spirit', category: 'bomber', country: 'US' },
  
  // ===== HELICÓPTEROS MILITARES =====
  'H60': { name: 'Sikorsky UH-60 Black Hawk', category: 'helicopter', country: 'US' },
  'UH60': { name: 'Sikorsky UH-60 Black Hawk', category: 'helicopter', country: 'US' },
  'MH60': { name: 'Sikorsky MH-60 Seahawk', category: 'helicopter', country: 'US' },
  'HH60': { name: 'Sikorsky HH-60 Pave Hawk', category: 'helicopter', country: 'US' },
  'CH47': { name: 'Boeing CH-47 Chinook', category: 'helicopter', country: 'US' },
  'H47': { name: 'Boeing CH-47 Chinook', category: 'helicopter', country: 'US' },
  'AH64': { name: 'Boeing AH-64 Apache', category: 'helicopter', country: 'US' },
  'V22': { name: 'Bell Boeing V-22 Osprey', category: 'helicopter', country: 'US' },
  
  // ===== US NAVY ESPECÍFICOS =====
  'C2': { name: 'Grumman C-2 Greyhound', category: 'transport', country: 'US' },
  'HAWK': { name: 'McDonnell Douglas T-45 Goshawk', category: 'trainer', country: 'US' },
  'T45': { name: 'McDonnell Douglas T-45 Goshawk', category: 'trainer', country: 'US' },
  'GLF5': { name: 'Gulfstream C-37A/G-V', category: 'vip', country: 'US' },
  'GLEX': { name: 'Bombardier Global Express', category: 'vip', country: 'US' },
  
  // ===== UK RAF =====
  'A400': { name: 'Airbus A400M Atlas', category: 'transport', country: 'GB' },
  'C130J': { name: 'Lockheed C-130J Super Hercules', category: 'transport', country: 'GB' },
  'EUFI': { name: 'Eurofighter Typhoon', category: 'combat', country: 'GB' },
  'TYPN': { name: 'Eurofighter Typhoon', category: 'combat', country: 'GB' },
  
  // ===== LATINOAMÉRICA =====
  'TUCR': { name: 'Embraer EMB-314 Super Tucano', category: 'combat', country: 'BR' },
  'T27': { name: 'Embraer EMB-312 Tucano', category: 'trainer', country: 'BR' },
  'C208': { name: 'Cessna 208 Caravan', category: 'transport', country: 'US' },
  'B350': { name: 'Beechcraft King Air 350', category: 'transport', country: 'US' },
  'DH8B': { name: 'De Havilland Dash 8-200', category: 'transport', country: 'CA' },
  
  // ===== COMERCIALES (más comunes) =====
  'A320': { name: 'Airbus A320', category: 'passenger', country: 'EU' },
  'A321': { name: 'Airbus A321', category: 'passenger', country: 'EU' },
  'A319': { name: 'Airbus A319', category: 'passenger', country: 'EU' },
  'A330': { name: 'Airbus A330', category: 'passenger', country: 'EU' },
  'A350': { name: 'Airbus A350 XWB', category: 'passenger', country: 'EU' },
  'A380': { name: 'Airbus A380', category: 'passenger', country: 'EU' },
  'B737': { name: 'Boeing 737', category: 'passenger', country: 'US' },
  'B738': { name: 'Boeing 737-800', category: 'passenger', country: 'US' },
  'B38M': { name: 'Boeing 737 MAX 8', category: 'passenger', country: 'US' },
  'B39M': { name: 'Boeing 737 MAX 9', category: 'passenger', country: 'US' },
  'B747': { name: 'Boeing 747', category: 'passenger', country: 'US' },
  'B757': { name: 'Boeing 757', category: 'passenger', country: 'US' },
  'B767': { name: 'Boeing 767', category: 'passenger', country: 'US' },
  'B777': { name: 'Boeing 777', category: 'passenger', country: 'US' },
  'B787': { name: 'Boeing 787 Dreamliner', category: 'passenger', country: 'US' },
  'E190': { name: 'Embraer E190', category: 'passenger', country: 'BR' },
  'E195': { name: 'Embraer E195', category: 'passenger', country: 'BR' },
  'E145': { name: 'Embraer ERJ-145', category: 'passenger', country: 'BR' },
  'MD82': { name: 'McDonnell Douglas MD-82', category: 'passenger', country: 'US' },
  'MD83': { name: 'McDonnell Douglas MD-83', category: 'passenger', country: 'US' },
};

/**
 * Obtener información del modelo de aeronave
 * @param {string} icaoType - Código ICAO del tipo de aeronave
 * @returns {Object} - { name, category, country } o null
 */
export function getAircraftModel(icaoType) {
  if (!icaoType) return null;
  
  const type = icaoType.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Búsqueda exacta
  if (AIRCRAFT_MODELS_DB[type]) {
    return AIRCRAFT_MODELS_DB[type];
  }
  
  // Búsqueda parcial
  for (const [key, value] of Object.entries(AIRCRAFT_MODELS_DB)) {
    if (type.includes(key) || key.includes(type)) {
      return value;
    }
  }
  
  return null;
}

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
  south: 1.0,    // Sur: Venezuela completa (Amazonas ~1°N)
  west: -85.0,   // Oeste: Costa oeste de Panamá/Nicaragua
  east: -58.0,   // Este: Trinidad y Tobago + Barbados
  // Incluye: Venezuela, Rep. Dominicana, Puerto Rico, Cuba, Jamaica, 
  // Panamá, Colombia norte, Trinidad, Curazao, Aruba, etc.
};

/**
 * Obtener vuelos en una zona geográfica específica
 * @param {Object} bounds - Límites geográficos {north, south, west, east}
 * @returns {Promise<Array>} - Lista de vuelos
 */
export async function getFlightsByZone(bounds = null) {
  try {
    // Usar bounds proporcionados o los por defecto
    const effectiveBounds = bounds || CARIBBEAN_BOUNDS;
    
    // Params: bounds=north,south,west,east
    const boundsString = `${effectiveBounds.north},${effectiveBounds.south},${effectiveBounds.west},${effectiveBounds.east}`;
    
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
 * Obtener vuelos MILITARES usando la API oficial
 * La API oficial con categories=M devuelve solo militares/gobierno
 * @param {Object} bounds - Límites del viewport {north, south, west, east}
 * @returns {Promise<Array>} - Lista de vuelos militares
 */
export async function getMilitaryFlights(bounds = CARIBBEAN_BOUNDS) {
  try {
    // Usar los bounds proporcionados (del viewport del mapa)
    const allFlights = await getFlightsByZone(bounds);
    
    console.log(`\n═══════════════════════════════════════`);
    console.log(`📊 FLIGHTRADAR24 - VUELOS MILITARES`);
    console.log(`═══════════════════════════════════════`);
    console.log(`✈️ Vuelos militares recibidos: ${allFlights.length}`);
    
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
 * 0. ⭐ ICAO24 militar (prefijos AE, AF = USA militar) - MÁS CONFIABLE
 * 1. Campo airline ([18]) - Operador militar (ej: "RCH", "CNV")
 * 2. Callsign militar (ej: "ELVIS21", "97-0042")
 * 3. Tipo de aeronave (ej: "C17", "KC135")
 * 4. Registro militar (ej: "97-0042")
 * 
 * @param {Object} flight - Datos del vuelo
 * @returns {Boolean}
 */
function isMilitaryFlight(flight) {
  const icao24 = (flight.icao24 || '').toUpperCase();
  const airline = (flight.aircraft?.airline || '').toUpperCase().trim();
  const callsign = (flight.callsign || '').toUpperCase().trim();
  const aircraftType = (flight.aircraft?.type || '').toUpperCase();
  const registration = (flight.registration || '').toUpperCase().trim();
  
  // ⭐ 0. MÁS CONFIABLE: ICAO24 militar USA (prefijos AE, AF)
  // AE0000-AFFFFF = Militar USA
  // AD0000-ADFFFF = Civil USA (NO incluir)
  if (icao24.startsWith('AE') || icao24.startsWith('AF')) {
    return true;
  }
  
  // ✅ 1. PRIORITARIO: Verificar código de aerolínea/operador militar
  // Este es el campo MÁS CONFIABLE según FlightRadar24
  const hasMilitaryAirline = MILITARY_AIRLINE_CODES.some(code => 
    airline === code || airline.startsWith(code)
  );

  if (hasMilitaryAirline) {
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

  return hasMilitaryCallsign || isMilitaryAircraft || hasMilitaryRegistration || hasMilitarySquawk;
}

/**
 * 📡 TIPOS DE SEÑAL DE TRANSPONDER
 * 
 * El campo [7] de la API indica el tipo de señal:
 * - "F-BDWY1" o similar = Señal ADS-B real/válida
 * - "F-EST" = Estimated (posición estimada, transponder apagado)
 * - "F-MLAT" = Multilateración (señal débil, triangulación)
 * - "" (vacío) = Sin información de señal
 */
export const SIGNAL_TYPES = {
  ADSB: 'adsb',        // Señal ADS-B directa (transponder activo)
  ESTIMATED: 'estimated', // Posición estimada (transponder apagado)
  MLAT: 'mlat',        // Multilateración (señal débil)
  UNKNOWN: 'unknown',  // Desconocido
};

/**
 * Detectar tipo de señal del transponder
 * @param {string} signalField - Campo [7] de la API
 * @returns {Object} - { type, isTransponderActive, label, color }
 */
export function detectSignalType(signalField) {
  const field = (signalField || '').toUpperCase();
  
  if (field.includes('EST')) {
    return {
      type: SIGNAL_TYPES.ESTIMATED,
      isTransponderActive: false,
      label: 'OFF',
      labelEn: 'Transponder Off',
      color: '#ef4444', // Rojo
      icon: '📍',
      description: 'Transponder apagado - posición estimada'
    };
  }
  
  if (field.includes('MLAT')) {
    return {
      type: SIGNAL_TYPES.MLAT,
      isTransponderActive: true, // Técnicamente activo pero débil
      label: 'MLAT',
      labelEn: 'Multilateration',
      color: '#f59e0b', // Naranja
      icon: '📶',
      description: 'Señal débil - multilateración'
    };
  }
  
  if (field.startsWith('F-') || field.length > 0) {
    return {
      type: SIGNAL_TYPES.ADSB,
      isTransponderActive: true,
      label: 'ON',
      labelEn: 'ADS-B Active',
      color: '#22c55e', // Verde
      icon: '✅',
      description: 'Transponder activo - señal ADS-B'
    };
  }
  
  return {
    type: SIGNAL_TYPES.UNKNOWN,
    isTransponderActive: null,
    label: '?',
    labelEn: 'Unknown',
    color: '#6b7280', // Gris
    icon: '❓',
    description: 'Estado de transponder desconocido'
  };
}

/**
 * 🛫 BASE DE DATOS DE AEROPUERTOS (Caribe y región)
 * Coordenadas para dibujar líneas de predicción al destino
 */
export const AIRPORTS_DB = {
  // Panamá
  'BLB': { lat: 8.9148, lng: -79.5996, name: 'Balboa Panama Pacifico', city: 'Panama City', country: 'PA' },
  'PTY': { lat: 9.0714, lng: -79.3835, name: 'Tocumen International', city: 'Panama City', country: 'PA' },
  
  // Curazao / ABC
  'CUR': { lat: 12.1889, lng: -68.9598, name: 'Hato International', city: 'Willemstad', country: 'CW' },
  'AUA': { lat: 12.5014, lng: -70.0152, name: 'Queen Beatrix International', city: 'Oranjestad', country: 'AW' },
  'BON': { lat: 12.1310, lng: -68.2685, name: 'Flamingo International', city: 'Kralendijk', country: 'BQ' },
  
  // Venezuela
  'CCS': { lat: 10.6031, lng: -66.9906, name: 'Simón Bolívar International', city: 'Caracas', country: 'VE' },
  'MAR': { lat: 10.5583, lng: -71.7279, name: 'La Chinita International', city: 'Maracaibo', country: 'VE' },
  'VLN': { lat: 10.1500, lng: -67.9283, name: 'Arturo Michelena', city: 'Valencia', country: 'VE' },
  
  // Colombia
  'BOG': { lat: 4.7016, lng: -74.1469, name: 'El Dorado International', city: 'Bogotá', country: 'CO' },
  'CTG': { lat: 10.4424, lng: -75.5130, name: 'Rafael Núñez International', city: 'Cartagena', country: 'CO' },
  'BAQ': { lat: 10.8896, lng: -74.7808, name: 'Ernesto Cortissoz', city: 'Barranquilla', country: 'CO' },
  'MDE': { lat: 6.1644, lng: -75.4231, name: 'José María Córdova', city: 'Medellín', country: 'CO' },
  
  // Puerto Rico / USVI
  'SJU': { lat: 18.4394, lng: -66.0018, name: 'Luis Muñoz Marín', city: 'San Juan', country: 'PR' },
  'STT': { lat: 18.3373, lng: -64.9734, name: 'Cyril E. King', city: 'Charlotte Amalie', country: 'VI' },
  
  // República Dominicana
  'SDQ': { lat: 18.4297, lng: -69.6689, name: 'Las Américas', city: 'Santo Domingo', country: 'DO' },
  'PUJ': { lat: 18.5674, lng: -68.3634, name: 'Punta Cana International', city: 'Punta Cana', country: 'DO' },
  
  // Trinidad y Tobago
  'POS': { lat: 10.5954, lng: -61.3372, name: 'Piarco International', city: 'Port of Spain', country: 'TT' },
  
  // Jamaica
  'KIN': { lat: 17.9357, lng: -76.7875, name: 'Norman Manley', city: 'Kingston', country: 'JM' },
  'MBJ': { lat: 18.5037, lng: -77.9134, name: 'Sangster International', city: 'Montego Bay', country: 'JM' },
  
  // Cuba
  'HAV': { lat: 22.9892, lng: -82.4091, name: 'José Martí International', city: 'Havana', country: 'CU' },
  
  // USA - Florida / Bases Militares
  'MIA': { lat: 25.7959, lng: -80.2870, name: 'Miami International', city: 'Miami', country: 'US' },
  'FLL': { lat: 26.0726, lng: -80.1527, name: 'Fort Lauderdale-Hollywood', city: 'Fort Lauderdale', country: 'US' },
  'TPA': { lat: 27.9755, lng: -82.5332, name: 'Tampa International', city: 'Tampa', country: 'US' },
  'JAX': { lat: 30.4941, lng: -81.6879, name: 'Jacksonville International', city: 'Jacksonville', country: 'US' },
  'MCO': { lat: 28.4294, lng: -81.3090, name: 'Orlando International', city: 'Orlando', country: 'US' },
  
  // Bases Militares USA
  'NQX': { lat: 24.5757, lng: -81.6897, name: 'NAS Key West', city: 'Key West', country: 'US' },
  'NPA': { lat: 30.3527, lng: -87.3186, name: 'NAS Pensacola', city: 'Pensacola', country: 'US' },
  'NJK': { lat: 32.8292, lng: -115.6714, name: 'NAF El Centro', city: 'El Centro', country: 'US' },
  
  // Honduras
  'SAP': { lat: 15.4526, lng: -87.9236, name: 'Ramón Villeda Morales', city: 'San Pedro Sula', country: 'HN' },
  'TGU': { lat: 14.0609, lng: -87.2172, name: 'Toncontín International', city: 'Tegucigalpa', country: 'HN' },
  
  // Costa Rica
  'SJO': { lat: 9.9939, lng: -84.2088, name: 'Juan Santamaría', city: 'San José', country: 'CR' },
  
  // Guatemala
  'GUA': { lat: 14.5833, lng: -90.5275, name: 'La Aurora International', city: 'Guatemala City', country: 'GT' },
  
  // Guyana
  'GEO': { lat: 6.4985, lng: -58.2541, name: 'Cheddi Jagan International', city: 'Georgetown', country: 'GY' },
  
  // Surinam
  'PBM': { lat: 5.4528, lng: -55.1878, name: 'Johan Adolf Pengel', city: 'Paramaribo', country: 'SR' },
};

/**
 * Obtener coordenadas de un aeropuerto por código IATA
 * @param {string} iataCode - Código IATA del aeropuerto
 * @returns {Object|null} - { lat, lng, name, city, country } o null
 */
export function getAirportCoordinates(iataCode) {
  if (!iataCode) return null;
  return AIRPORTS_DB[iataCode.toUpperCase()] || null;
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
 * [7]  signalType - CLAVE: "F-EST" = estimado, "F-BDWY1" = ADS-B activo
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

  const icao24 = flightData[0] || '';
  const aircraftType = flightData[8] || 'UNKNOWN';
  const signalField = flightData[7] || '';
  
  // Detectar país por ICAO24
  const countryInfo = getCountryByICAO24(icao24);
  
  // Obtener modelo de aeronave
  const modelInfo = getAircraftModel(aircraftType);
  
  // 📡 Detectar estado del transponder
  const signalInfo = detectSignalType(signalField);

  return {
    // Identificación
    id: flightId,
    icao24: icao24,
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
      type: aircraftType,
      registration: flightData[9] || '',
      squawk: flightData[6] || '',  // Código transponder
      airline: flightData[18] || '', // ¡OPERADOR! (ej: "RCH", "AVA", "DAL")
      // Nuevo: Modelo completo
      modelName: modelInfo?.name || null,
      modelCategory: modelInfo?.category || null,
    },
    
    // Vuelo
    origin: flightData[11] || '',      // Código IATA origen
    destination: flightData[12] || '', // Código IATA destino
    flightNumber: flightData[13] || '',
    
    // Estado
    onGround: flightData[14] === 1,
    
    // 📡 ESTADO DEL TRANSPONDER (NUEVO)
    signal: {
      raw: signalField,
      type: signalInfo.type,
      isTransponderActive: signalInfo.isTransponderActive,
      label: signalInfo.label,
      color: signalInfo.color,
      icon: signalInfo.icon,
      description: signalInfo.description,
    },
    
    // 🌍 PAÍS (detectado por ICAO24)
    country: {
      code: countryInfo.code,
      flag: countryInfo.flag,
      name: countryInfo.name,
      military: countryInfo.military,
    },
    
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
  // Si no hay filtros activos, no mostrar ningún vuelo
  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  if (!hasActiveFilters) {
    return []; // ✅ Sin filtros = sin vuelos
  }

  return flights.filter(flight => {
    const category = flight.flightCategory || getFlightCategory(flight);
    return activeFilters[category] === true;
  });
}

/**
 * Obtener todos los vuelos con categoría asignada
 * @param {Object} bounds - Límites del viewport {north, south, west, east}
 */
export async function getAllFlights(bounds = null) {
  // API pública gratuita - devuelve todos los vuelos
  const allFlights = await getFlightsByZone(bounds);
  
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
  detectSignalType,
  getAirportCoordinates,
  CARIBBEAN_BOUNDS,
  AIRPORTS_DB,
  SIGNAL_TYPES,
};

