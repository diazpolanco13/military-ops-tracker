/**
 * 🚢 SERVICIO SHIP RADAR - Tracking de buques AIS
 * 
 * Integración con Supabase para obtener posiciones de buques
 * Datos alimentados por AISStream.io via worker externo
 */

import { supabase } from '../lib/supabase';

// Helper para obtener env vars
const getEnv = (key) => {
  if (import.meta.env[key]) return import.meta.env[key];
  if (typeof window !== 'undefined' && window.ENV?.[key]) return window.ENV[key];
  return undefined;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SHIP_POSITIONS_URL = `${SUPABASE_URL}/functions/v1/ship-positions`;

// Banderas por código de país
export const COUNTRY_FLAGS = {
  'US': '🇺🇸', 'VE': '🇻🇪', 'CO': '🇨🇴', 'PA': '🇵🇦', 'MX': '🇲🇽',
  'BR': '🇧🇷', 'GB': '🇬🇧', 'CN': '🇨🇳', 'RU': '🇷🇺', 'LR': '🇱🇷',
  'MT': '🇲🇹', 'BS': '🇧🇸', 'MH': '🇲🇭', 'SG': '🇸🇬', 'HK': '🇭🇰',
  'GR': '🇬🇷', 'CY': '🇨🇾', 'NO': '🇳🇴', 'CU': '🇨🇺', 'DO': '🇩🇴',
  'JM': '🇯🇲', 'TT': '🇹🇹', 'CA': '🇨🇦', 'NL': '🇳🇱', 'DE': '🇩🇪',
  'FR': '🇫🇷', 'ES': '🇪🇸', 'IT': '🇮🇹', 'AU': '🇦🇺', 'NZ': '🇳🇿',
  'XX': '🏳️',
};

// Colores por tipo de buque
export const SHIP_TYPE_COLORS = {
  military: '#ef4444',    // Rojo
  tanker: '#f59e0b',      // Naranja
  cargo: '#3b82f6',       // Azul
  passenger: '#22c55e',   // Verde
  fishing: '#8b5cf6',     // Morado
  other: '#6b7280',       // Gris
};

// Iconos por tipo de buque
export const SHIP_TYPE_ICONS = {
  military: '⚔️',
  tanker: '🛢️',
  cargo: '📦',
  passenger: '🚢',
  fishing: '🎣',
  tug: '⚓',
  other: '🚤',
};

/**
 * Obtener categoría del buque
 */
export function getShipCategory(ship) {
  if (ship.is_military) return 'military';
  if (ship.is_tanker) return 'tanker';
  
  const type = ship.ship_type;
  if (type >= 70 && type <= 79) return 'cargo';
  if (type >= 60 && type <= 69) return 'passenger';
  if (type === 30) return 'fishing';
  if (type === 52 || type === 31 || type === 32) return 'tug';
  
  return 'other';
}

/**
 * Obtener color del buque según categoría
 */
export function getShipColor(ship) {
  const category = getShipCategory(ship);
  return SHIP_TYPE_COLORS[category] || SHIP_TYPE_COLORS.other;
}

/**
 * Obtener icono del buque según categoría
 */
export function getShipIcon(ship) {
  const category = getShipCategory(ship);
  return SHIP_TYPE_ICONS[category] || SHIP_TYPE_ICONS.other;
}

/**
 * Obtener bandera del país
 */
export function getCountryFlag(countryCode) {
  return COUNTRY_FLAGS[countryCode] || COUNTRY_FLAGS['XX'];
}

/**
 * Obtener buques desde la API
 * @param {Object} options - Opciones de filtrado
 * @param {string} options.type - Tipo: 'military', 'tanker', 'all'
 * @param {Object} options.bounds - Límites geográficos {north, south, west, east}
 */
export async function getShips(options = {}) {
  try {
    const { type = 'all', bounds } = options;
    
    // Construir URL con parámetros
    const params = new URLSearchParams();
    if (type !== 'all') params.append('type', type);
    if (bounds) {
      params.append('bounds', `${bounds.north},${bounds.south},${bounds.west},${bounds.east}`);
    }
    
    // Obtener token de autenticación
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const url = `${SHIP_POSITIONS_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      throw new Error(`Error fetching ships: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Enriquecer datos
    const ships = (data.ships || []).map(ship => ({
      ...ship,
      category: getShipCategory(ship),
      color: getShipColor(ship),
      icon: getShipIcon(ship),
      countryFlag: getCountryFlag(ship.flag_country),
    }));
    
    return {
      success: true,
      ships,
      stats: data.stats,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching ships:', error);
    return {
      success: false,
      ships: [],
      stats: { total: 0, military: 0, tankers: 0 },
      error: error.message,
    };
  }
}

/**
 * Obtener detalles de un buque específico
 */
export async function getShipDetails(mmsi) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    const headers = { 'Accept': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const url = `${SHIP_POSITIONS_URL}?mmsi=${mmsi}`;
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      throw new Error(`Ship not found: ${mmsi}`);
    }
    
    const ship = await response.json();
    
    return {
      ...ship,
      category: getShipCategory(ship),
      color: getShipColor(ship),
      icon: getShipIcon(ship),
      countryFlag: getCountryFlag(ship.flag_country),
    };
  } catch (error) {
    console.error('Error fetching ship details:', error);
    return null;
  }
}

/**
 * Convertir velocidad de nudos a km/h
 */
export function knotsToKmh(knots) {
  return Math.round(knots * 1.852);
}

/**
 * Formatear nombre del buque
 */
export function formatShipName(name) {
  if (!name) return 'UNKNOWN';
  return name.trim().toUpperCase();
}

export default {
  getShips,
  getShipDetails,
  getShipCategory,
  getShipColor,
  getShipIcon,
  getCountryFlag,
  knotsToKmh,
  formatShipName,
  COUNTRY_FLAGS,
  SHIP_TYPE_COLORS,
  SHIP_TYPE_ICONS,
};
