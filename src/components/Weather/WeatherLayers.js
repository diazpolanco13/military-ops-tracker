/**
 * 🌦️ Configuración de Capas Climáticas
 * Integración con RainViewer API (GRATUITA - SIN API KEY)
 */

/**
 * 🗺️ CAPAS DE CLIMA DISPONIBLES
 * RainViewer ofrece tiles GRATUITOS sin API key:
 * - Radar de precipitación (lluvia/nieve)
 * - Satélite de nubes
 * - Completamente gratis, sin límites
 */
export const WEATHER_LAYERS = {
  // 🌧️ RADAR DE PRECIPITACIÓN (RainViewer - GRATIS, SIN API KEY)
  precipitation: {
    id: 'rainviewer-precipitation',
    name: '🌧️ Radar de Precipitación',
    description: 'Lluvia y nieve en tiempo real - Global',
    source: 'rainviewer',
    opacity: 0.6,
    color: '#0099FF'
  },
  
  // ☁️ SATÉLITE DE NUBES (RainViewer - GRATIS, SIN API KEY)
  clouds: {
    id: 'rainviewer-satellite',
    name: '☁️ Satélite Infrarrojo',
    description: 'Nubes vía satélite - Global',
    source: 'rainviewer',
    opacity: 0.5,
    color: '#FFFFFF'
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
 * Agregar capa de clima al mapa (RainViewer - SIN API KEY)
 */
export async function addWeatherLayer(map, layerType) {
  const layer = WEATHER_LAYERS[layerType];
  
  if (!layer) {
    console.warn(`⚠️ Weather layer type "${layerType}" no existe`);
    return false;
  }

  // Verificar si la capa ya existe
  if (map.getSource(layer.id)) {
    // Solo cambiar la visibilidad si ya existe
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
    console.log(`🌦️ Obteniendo timestamp de RainViewer para ${layer.name}...`);
    
    // Obtener timestamp más reciente de RainViewer
    const timestamp = await getRainViewerTimestamp();
    console.log(`⏰ Timestamp obtenido: ${timestamp}`);
    
    // Construir URL según el tipo de capa
    let tileUrl;
    if (layerType === 'precipitation') {
      tileUrl = getRainViewerTileUrl(timestamp);
    } else if (layerType === 'clouds') {
      tileUrl = getRainViewerSatelliteUrl(timestamp);
    } else {
      console.warn(`⚠️ Tipo de capa no soportado: ${layerType}`);
      return false;
    }
    
    console.log(`🔗 URL de tiles: ${tileUrl.replace(/{z}.*/, '...')}`);
    
    // Agregar source
    map.addSource(layer.id, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      attribution: '© <a href="https://rainviewer.com/">RainViewer</a>',
      maxzoom: 12,
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

    console.log(`✅ Capa de clima "${layer.name}" agregada correctamente con RainViewer`);
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
 * NOTA: Solo precipitation y clouds están soportadas con RainViewer
 */
export function getActiveWeatherLayers() {
  const saved = localStorage.getItem('activeWeatherLayers');
  return saved ? JSON.parse(saved) : {
    precipitation: false,
    clouds: false
  };
}

/**
 * Guardar capas activas en localStorage
 */
export function saveActiveWeatherLayers(layers) {
  localStorage.setItem('activeWeatherLayers', JSON.stringify(layers));
}

