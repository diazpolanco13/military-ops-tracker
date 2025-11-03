/**
 * 🌦️ Configuración de Capas Climáticas
 * DOBLE INTEGRACIÓN: OpenWeatherMap + RainViewer
 */

// API Key de OpenWeatherMap (opcional - si no está, se usa RainViewer)
export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

/**
 * 🗺️ CAPAS DE CLIMA DISPONIBLES
 * Sistema híbrido: OpenWeatherMap (completo) + RainViewer (fallback gratuito)
 */
export const WEATHER_LAYERS = {
  // ☁️ NUBES
  clouds: {
    id: 'weather-clouds',
    name: '☁️ Cobertura de Nubes',
    description: 'Nubes en tiempo real',
    owmLayer: 'clouds_new', // OpenWeatherMap
    rainviewerType: 'satellite', // RainViewer fallback
    opacity: 0.6,
    color: '#FFFFFF'
  },
  
  // 🌧️ PRECIPITACIÓN
  precipitation: {
    id: 'weather-precipitation',
    name: '🌧️ Precipitación',
    description: 'Lluvia y nieve en tiempo real',
    owmLayer: 'precipitation_new', // OpenWeatherMap
    rainviewerType: 'radar', // RainViewer fallback
    opacity: 0.7,
    color: '#0099FF'
  },
  
  // 🌡️ TEMPERATURA (Solo OpenWeatherMap)
  temperature: {
    id: 'weather-temperature',
    name: '🌡️ Temperatura',
    description: 'Temperatura del aire',
    owmLayer: 'temp_new', // Solo OpenWeatherMap
    rainviewerType: null, // No disponible en RainViewer
    opacity: 0.6,
    color: '#FF6B35'
  },
  
  // 💨 VIENTO (Solo OpenWeatherMap)
  wind: {
    id: 'weather-wind',
    name: '💨 Viento',
    description: 'Velocidad y dirección del viento',
    owmLayer: 'wind_new', // Solo OpenWeatherMap
    rainviewerType: null, // No disponible en RainViewer
    opacity: 0.7,
    color: '#00D9FF'
  },
  
  // 📊 PRESIÓN (Solo OpenWeatherMap)
  pressure: {
    id: 'weather-pressure',
    name: '📊 Presión Atmosférica',
    description: 'Presión del aire',
    owmLayer: 'pressure_new', // Solo OpenWeatherMap
    rainviewerType: null, // No disponible en RainViewer
    opacity: 0.6,
    color: '#A8E6CF'
  }
};

/**
 * 🌐 Obtener timestamp más reciente de RainViewer
 * RainViewer actualiza cada 10 minutos
 */
async function getRainViewerTimestamp() {
  try {
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await response.json();
    
    // Retornar el timestamp más reciente (último frame disponible)
    if (data.radar && data.radar.past && data.radar.past.length > 0) {
      return data.radar.past[data.radar.past.length - 1].time;
    }
    
    // Fallback: timestamp actual menos 10 minutos
    return Math.floor(Date.now() / 1000) - 600;
  } catch (error) {
    console.warn('⚠️ Error obteniendo timestamp de RainViewer:', error);
    // Fallback: timestamp actual menos 10 minutos
    return Math.floor(Date.now() / 1000) - 600;
  }
}

/**
 * Construir URL de RainViewer (SIN API KEY REQUERIDA)
 */
function getRainViewerTileUrl(timestamp, size = 256, color = 1) {
  // RainViewer tiles públicos - completamente gratis
  // size: 256 o 512
  // color: 0-8 (paleta de colores)
  return `https://tilecache.rainviewer.com/v2/radar/${timestamp}/${size}/{z}/{x}/{y}/${color}/1_1.png`;
}

/**
 * Construir URL de satélite infrarrojo RainViewer
 */
function getRainViewerSatelliteUrl(timestamp, size = 256) {
  return `https://tilecache.rainviewer.com/v2/satellite/${timestamp}/${size}/{z}/{x}/{y}/0/0_0.png`;
}

/**
 * Construir URL de OpenWeatherMap
 */
function getOpenWeatherMapUrl(layerName) {
  return `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;
}

/**
 * Agregar capa de clima al mapa
 * Sistema híbrido: Intenta OpenWeatherMap primero, fallback a RainViewer
 */
export async function addWeatherLayer(map, layerType) {
  const layer = WEATHER_LAYERS[layerType];
  
  if (!layer) {
    console.warn(`⚠️ Weather layer type "${layerType}" no existe`);
    return false;
  }

  // Verificar si la capa ya existe
  if (map.getSource(layer.id)) {
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'visible');
      console.log(`👁️ Mostrando capa existente: ${layer.name}`);
      return true;
    } catch (error) {
      console.error(`Error mostrando capa ${layerType}:`, error);
      return false;
    }
  }

  try {
    let tileUrl;
    let attribution;
    let useOpenWeatherMap = false;
    
    // 🎯 ESTRATEGIA HÍBRIDA:
    // 1. Si hay API key de OpenWeatherMap, úsala
    // 2. Si no hay API key O la capa no está disponible en OWM, usa RainViewer
    
    if (OPENWEATHER_API_KEY && layer.owmLayer) {
      // Intentar con OpenWeatherMap
      tileUrl = getOpenWeatherMapUrl(layer.owmLayer);
      attribution = '© <a href="https://openweathermap.org/">OpenWeatherMap</a>';
      useOpenWeatherMap = true;
      console.log(`🌐 Usando OpenWeatherMap para ${layer.name}`);
    } else if (layer.rainviewerType) {
      // Fallback a RainViewer (gratis, sin API key)
      const timestamp = await getRainViewerTimestamp();
      
      if (layer.rainviewerType === 'radar') {
        tileUrl = getRainViewerTileUrl(timestamp);
      } else if (layer.rainviewerType === 'satellite') {
        tileUrl = getRainViewerSatelliteUrl(timestamp);
      }
      
      attribution = '© <a href="https://rainviewer.com/">RainViewer</a>';
      console.log(`🌐 Usando RainViewer para ${layer.name} (sin API key)`);
    } else {
      console.warn(`⚠️ ${layer.name} requiere API key de OpenWeatherMap`);
      console.info(`💡 Configura VITE_OPENWEATHER_API_KEY en .env`);
      console.info(`💡 Obtén tu API key gratis en: https://openweathermap.org/api`);
      return false;
    }
    
    // Agregar source
    map.addSource(layer.id, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      attribution: attribution,
      maxzoom: 18,
      minzoom: 0
    });

    // Agregar layer
    map.addLayer({
      id: layer.id,
      type: 'raster',
      source: layer.id,
      paint: {
        'raster-opacity': layer.opacity,
        'raster-fade-duration': 300
      }
    });

    const source = useOpenWeatherMap ? 'OpenWeatherMap' : 'RainViewer';
    console.log(`✅ Capa "${layer.name}" agregada con ${source}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error agregando capa de clima ${layerType}:`, error);
    return false;
  }
}

/**
 * Remover capa de clima del mapa
 */
export function removeWeatherLayer(map, layerType) {
  const layer = WEATHER_LAYERS[layerType];
  if (!layer) return;

  try {
    if (map.getLayer(layer.id)) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
  } catch (error) {
    console.error(`Error removing weather layer ${layerType}:`, error);
  }
}

/**
 * Toggle capa de clima
 */
export function toggleWeatherLayer(map, layerType, enabled) {
  if (enabled) {
    addWeatherLayer(map, layerType);
  } else {
    removeWeatherLayer(map, layerType);
  }
}

/**
 * Cambiar opacidad de capa de clima
 */
export function setWeatherLayerOpacity(map, layerType, opacity) {
  const layer = WEATHER_LAYERS[layerType];
  if (!layer) return;

  try {
    if (map.getLayer(layer.id)) {
      map.setPaintProperty(layer.id, 'raster-opacity', opacity);
    }
  } catch (error) {
    console.error(`Error setting opacity for ${layerType}:`, error);
  }
}

/**
 * Obtener capas activas desde localStorage
 */
export function getActiveWeatherLayers() {
  const saved = localStorage.getItem('activeWeatherLayers');
  return saved ? JSON.parse(saved) : {
    clouds: false,
    precipitation: false,
    temperature: false,
    wind: false,
    pressure: false
  };
}

/**
 * Guardar capas activas en localStorage
 */
export function saveActiveWeatherLayers(layers) {
  localStorage.setItem('activeWeatherLayers', JSON.stringify(layers));
}

