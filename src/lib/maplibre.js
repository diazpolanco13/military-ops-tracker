// Configuración de MapLibre GL JS (alternativa gratuita a Mapbox)

export const MAP_CONFIG = {
  // Centro en el Caribe
  center: [
    parseFloat(import.meta.env.VITE_MAP_CENTER_LNG) || -75,
    parseFloat(import.meta.env.VITE_MAP_CENTER_LAT) || 15
  ],
  zoom: parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 6,
  
  // Estilo oscuro militar usando OpenStreetMap
  style: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.85,
          'raster-brightness-min': 0.3, // Oscurecer para tema militar
          'raster-brightness-max': 0.7,
          'raster-saturation': -0.5, // Reducir saturación
        }
      }
    ],
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
  },
  
  // Opciones del mapa
  options: {
    minZoom: 2,
    maxZoom: 18,
    pitch: 0, // Ángulo de inclinación (0 = plano, 60 = 3D)
    bearing: 0, // Rotación del mapa
    antialias: true, // Mejor calidad visual
  }
};

// Colores por tipo de entidad
export const ENTITY_COLORS = {
  barco: '#3b82f6',    // Azul
  avion: '#6b7280',    // Gris
  tropas: '#10b981',   // Verde
  tanque: '#d97706',   // Naranja
};

// Si decides usar Mapbox en el futuro:
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

