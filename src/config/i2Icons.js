/**
 * Mapeo de iconos IBM i2 Analyst's Notebook para el sistema Military Ops Tracker
 * Todos los iconos están en /public/Icons/i2/
 */

// Base path para los iconos
export const I2_ICONS_BASE_PATH = '/Icons/i2/';

/**
 * Iconos por tipo de entidad militar
 */
export const ENTITY_TYPE_ICONS = {
  // BUQUES DE GUERRA
  destructor: 'Destroyer.png',
  crucero: 'Cruiser.png',
  fragata: 'Maritime.png',
  portaaviones: 'Aircraft Carrier.png',
  submarino: 'Submarine.png',
  
  // AERONAVES - CAZAS Y BOMBARDEROS
  avion: 'Fighter.png',
  caza: 'Fighter.png',
  bombardero: 'Bomber.png',
  
  // HELICOPTEROS
  helicoptero: 'Attack Helicopter.png',
  'helicoptero-ataque': 'Attack Helicopter.png',
  'helicoptero-transporte': 'Support Helicopter.png',
  
  // DRONES
  drone: 'UAV.png',
  uav: 'UAV.png',
  
  // AERONAVES ESPECIALES
  'patrulla-maritima': 'Surveillance Aircraft (Fixed Wing).png',
  vigilancia: 'Surveillance Aircraft (Rotary Wing).png',
  transporte: 'Cargo Plane (Fixed Wing).png',
  'transporte-rotary': 'Cargo Plane (Rotary Wing).png',
  
  // PERSONAL Y TROPAS
  tropas: 'Patrol.png',
  soldado: 'Soldier.png',
  personal: 'Profmale.png',
  insurgente: 'Insurgent.png',
  combatiente: 'Insurgent.png',
  
  // VEHICULOS TERRESTRES
  tanque: 'MBT.png',
  vehiculo: 'Utility Vehicle.png',
  'vehiculo-patrulla': 'Patrol Vehicle.png',
  apc: 'APC.png',
  mbrl: 'MBRL.png',
  lanzacohetes: 'MBRL.png',
  
  // INSTALACIONES Y LUGARES
  lugar: 'Military Base.png',
  base: 'Military Base.png',
  'base-militar': 'Airfield.png',
  puerto: 'Port.png',
  aeropuerto: 'Terminal.png',
  'centro-comunicaciones': 'Communications Center.png',
  radar: 'Radar Site.png',
  
  // ARMAMENTO
  misil: 'Missile.png',
  bomba: 'Bomb.png',
  explosion: 'Explosion.png',
  
  // EVENTOS
  ataque: 'Rocket Attack.png',
  amenaza: 'Threat Actor.png',
};

/**
 * Iconos por código de plantilla (templates genéricas)
 */
export const TEMPLATE_CODE_ICONS = {
  // BUQUES
  'destructor-general': 'Destroyer.png',
  'crucero-ticonderoga': 'Destroyer.png',
  'fragata-general': 'Maritime.png',
  'portaaviones-general': 'Aircraft Carrier.png',
  'portaaviones-anfibio-general': 'Aircraft Carrier.png',
  'submarino-general': 'Submarine.png',
  
  // AERONAVES
  'caza-general': 'Fighter.png',
  'bombardero-general': 'Bomber.png',
  'transporte-general': 'Cargo Plane (Fixed Wing).png',
  'patrulla-maritima-general': 'Surveillance Aircraft (Fixed Wing).png',
  
  // HELICOPTEROS
  'helicoptero-ataque-general': 'Attack Helicopter.png',
  'helicoptero-transporte-general': 'Support Helicopter.png',
  
  // DRONES
  'drone-general': 'UAV.png',
  
  // TROPAS
  'tropas-general': 'Patrol.png',
  'tropas-southcom-general': 'Patrol.png',
  
  // INSURGENTES
  'insurgente-general': 'Insurgent.png',
  
  // VEHICULOS
  'vehiculo-apc-general': 'APC.png',
  'vehiculo-patrulla-general': 'Patrol Vehicle.png',
  'vehiculo-utilitario-general': 'Utility Vehicle.png',
  'vehiculo-tanque-general': 'MBT.png',
  'vehiculo-mbrl-general': 'MBRL.png',
  
  // LUGARES E INSTALACIONES
  'base-militar-general': 'Airfield.png',
  'centro-comunicaciones-general': 'Communications Center.png',
  'radar-general': 'Radar Site.png',
  'aeropuerto-general': 'Terminal.png',
};

/**
 * Iconos para categorías principales (headers de grupos)
 */
export const CATEGORY_ICONS = {
  'Buques de Guerra': 'Destroyer.png',
  'Aeronaves': 'Fighter.png',
  'Personal y Tropas': 'Patrol.png',
  'Vehículos Militares': 'APC.png',
  'Fuerzas Irregulares': 'Insurgent.png',
  'Instalaciones': 'Military Base.png',
  'Instalaciones y Lugares': 'Airfield.png',
  'Eventos': 'Explosion.png',
};

/**
 * Iconos para estados/acciones
 */
export const STATUS_ICONS = {
  activo: 'Star.png',
  patrullando: 'Radar Site.png',
  estacionado: 'Parking Lot.png',
  en_transito: 'Lateral Movement.png',
  en_vuelo: 'Cargo Plane (Fixed Wing).png',
  alerta: 'Bomb.png',
};

/**
 * Iconos auxiliares para la UI
 */
export const UI_ICONS = {
  search: 'Search.png',
  favorite: 'Star.png',
  document: 'Document.png',
  database: 'Database.png',
  explosion: 'Explosion.png',
  map: 'Map.png',
  intelligence: 'Intelligence Officer.png',
};

/**
 * Helper function para obtener la ruta completa de un icono
 * @param {string} iconName - Nombre del archivo de icono (ej: 'Destroyer.png')
 * @returns {string} Ruta completa del icono
 */
export function getIconPath(iconName) {
  if (!iconName) return null;
  return `${I2_ICONS_BASE_PATH}${iconName}`;
}

/**
 * Helper function para obtener el icono según el tipo de entidad
 * @param {string} entityType - Tipo de entidad (ej: 'destructor', 'avion')
 * @returns {string} Ruta completa del icono o null
 */
export function getEntityIcon(entityType) {
  const iconName = ENTITY_TYPE_ICONS[entityType];
  return iconName ? getIconPath(iconName) : null;
}

/**
 * Helper function para obtener el icono según el código de plantilla
 * @param {string} templateCode - Código de plantilla (ej: 'destructor-general')
 * @returns {string} Ruta completa del icono o null
 */
export function getTemplateIcon(templateCode) {
  const iconName = TEMPLATE_CODE_ICONS[templateCode];
  return iconName ? getIconPath(iconName) : null;
}

/**
 * Helper function para obtener el icono de categoría
 * @param {string} categoryName - Nombre de categoría (ej: 'Buques de Guerra')
 * @returns {string} Ruta completa del icono o null
 */
export function getCategoryIcon(categoryName) {
  const iconName = CATEGORY_ICONS[categoryName];
  return iconName ? getIconPath(iconName) : null;
}

// Export default con todas las configuraciones
export default {
  ENTITY_TYPE_ICONS,
  TEMPLATE_CODE_ICONS,
  CATEGORY_ICONS,
  STATUS_ICONS,
  UI_ICONS,
  getIconPath,
  getEntityIcon,
  getTemplateIcon,
  getCategoryIcon,
};

