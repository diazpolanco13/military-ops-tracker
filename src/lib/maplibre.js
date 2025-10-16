// Configuración de Mapbox GL JS (profesional)

// Token de Mapbox
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlhenBvbGFuY28xMyIsImEiOiJjbWd0bXV1MzkwNjc2Mm1weG5iZGtxajZvIn0.6v22Z0fCiQbs5QDiiwLS6g';

// 🎨 ESTILOS DISPONIBLES DE MAPBOX
export const MAPBOX_STYLES = {
  // Estilos Oscuros (Militar/Táctico)
  DARK: 'mapbox://styles/mapbox/dark-v11',              // ⬛ Oscuro profesional (actual)
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',  // 🛰️ Satélite con calles
  NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1',     // 🌙 Navegación nocturna
  
  // Estilos Claros
  LIGHT: 'mapbox://styles/mapbox/light-v11',            // ⬜ Claro minimalista
  STREETS: 'mapbox://styles/mapbox/streets-v12',        // 🗺️ Calles estándar (colorido)
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',      // 🏔️ Terreno/topográfico
  
  // Estilos Especiales
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',     // 🛰️ Satélite puro (sin calles)
  NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',         // ☀️ Navegación diurna
};

export const MAP_CONFIG = {
  // Centro en Venezuela y el Caribe
  center: [
    parseFloat(import.meta.env.VITE_MAP_CENTER_LNG) || -66.1057,
    parseFloat(import.meta.env.VITE_MAP_CENTER_LAT) || 14.2095
  ],
  zoom: parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 10,
  
  // Estilo activo (cámbialo aquí)
  style: MAPBOX_STYLES.SATELLITE_STREETS,  // 🛰️ Satélite con calles (RECOMENDADO para militar)
  
  // Opciones del mapa
  options: {
    minZoom: 2,
    maxZoom: 18,
    pitch: 0, // Ángulo de inclinación (0 = plano, 60 = 3D)
    bearing: 0, // Rotación del mapa
    antialias: true, // Mejor calidad visual
  }
};

// Colores por tipo de entidad (para marcadores)
export const ENTITY_COLORS = {
  barco: '#3b82f6',    // Azul
  avion: '#6b7280',    // Gris
  tropas: '#10b981',   // Verde
  tanque: '#d97706',   // Naranja
};
