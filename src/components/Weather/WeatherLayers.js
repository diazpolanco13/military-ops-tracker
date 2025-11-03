/**
 * 🌦️ Configuración de Capas Climáticas
 * Integración con OpenWeatherMap API
 */

// API Key de OpenWeatherMap (gratuita)
// Obtén tu key en: https://openweathermap.org/api
export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

/**
 * 🗺️ CAPAS DE CLIMA DISPONIBLES
 * OpenWeatherMap ofrece tiles gratuitos para:
 * - Nubes
 * - Precipitación
 * - Temperatura
 * - Presión
 * - Viento
 */
export const WEATHER_LAYERS = {
  clouds: {
    id: 'clouds_new',
    name: '☁️ Nubes',
    description: 'Cobertura de nubes en tiempo real',
    url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
    opacity: 0.6,
    color: '#FFFFFF'
  },
  precipitation: {
    id: 'precipitation_new',
    name: '🌧️ Precipitación',
    description: 'Lluvia y nieve en tiempo real',
    url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
    opacity: 0.7,
    color: '#0099FF'
  },
  temperature: {
    id: 'temp_new',
    name: '🌡️ Temperatura',
    description: 'Temperatura del aire',
    url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
    opacity: 0.6,
    color: '#FF6B35'
  },
  wind: {
    id: 'wind_new',
    name: '💨 Viento',
    description: 'Velocidad y dirección del viento',
    url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
    opacity: 0.7,
    color: '#00D9FF'
  },
  pressure: {
    id: 'pressure_new',
    name: '📊 Presión',
    description: 'Presión atmosférica',
    url: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`,
    opacity: 0.6,
    color: '#A8E6CF'
  }
};

/**
 * Agregar capa de clima al mapa
 */
export function addWeatherLayer(map, layerType) {
  const layer = WEATHER_LAYERS[layerType];
  
  // ⚠️ VALIDACIÓN CRÍTICA: No intentar agregar capas si no hay API key
  if (!layer) {
    console.warn(`⚠️ Weather layer type "${layerType}" no existe`);
    return false;
  }
  
  if (!OPENWEATHER_API_KEY) {
    console.warn('⚠️ No se puede agregar capa de clima: VITE_OPENWEATHER_API_KEY no está configurada en .env');
    console.info('💡 Obtén tu API key gratis en: https://openweathermap.org/api');
    return false;
  }

  // Verificar si la capa ya existe
  if (map.getSource(layer.id)) {
    // Solo cambiar la visibilidad si ya existe
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'visible');
      return true;
    } catch (error) {
      console.error(`Error mostrando capa ${layerType}:`, error);
      return false;
    }
  }

  try {
    // Agregar source
    map.addSource(layer.id, {
      type: 'raster',
      tiles: [layer.url],
      tileSize: 256,
      attribution: '© <a href="https://openweathermap.org/">OpenWeatherMap</a>',
      // ✅ PREVENIR BUCLE INFINITO: No reintentar si falla
      maxzoom: 18,
      scheme: 'xyz'
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

    console.log(`✅ Capa de clima "${layer.name}" agregada correctamente`);
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

