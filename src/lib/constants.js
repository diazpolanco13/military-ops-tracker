// Constantes de la aplicación

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Military Ops Tracker';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';

// Tipos de entidades
export const ENTITY_TYPES = {
  BARCO: 'barco',
  AVION: 'avion',
  TROPAS: 'tropas',
  TANQUE: 'tanque',
};

// Estados de entidades
export const ENTITY_STATUS = {
  ACTIVO: 'activo',
  EN_TRANSITO: 'en_transito',
  ESTACIONADO: 'estacionado',
  EN_MISION: 'en_mision',
  MANTENIMIENTO: 'mantenimiento',
  INACTIVO: 'inactivo',
};

// Labels en español
export const ENTITY_TYPE_LABELS = {
  [ENTITY_TYPES.BARCO]: 'Barco',
  [ENTITY_TYPES.AVION]: 'Avión',
  [ENTITY_TYPES.TROPAS]: 'Tropas',
  [ENTITY_TYPES.TANQUE]: 'Tanque',
};

export const ENTITY_STATUS_LABELS = {
  [ENTITY_STATUS.ACTIVO]: 'Activo',
  [ENTITY_STATUS.EN_TRANSITO]: 'En Tránsito',
  [ENTITY_STATUS.ESTACIONADO]: 'Estacionado',
  [ENTITY_STATUS.EN_MISION]: 'En Misión',
  [ENTITY_STATUS.MANTENIMIENTO]: 'Mantenimiento',
  [ENTITY_STATUS.INACTIVO]: 'Inactivo',
};

// Configuración de mapa
export const MAP_DEFAULTS = {
  CENTER_LAT: 15,    // Caribe
  CENTER_LNG: -75,   // Caribe
  ZOOM: 6,
};

// Límites del Caribe (bbox)
export const CARIBBEAN_BOUNDS = {
  north: 27,
  south: 10,
  east: -60,
  west: -90,
};

// ✈️ FlightRadar24 API Configuration
export const FLIGHTRADAR24_UPDATE_INTERVAL = 30000; // 30 segundos

