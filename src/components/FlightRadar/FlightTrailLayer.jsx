import { useEffect, useRef, useState } from 'react';
import { getFlightDetails } from '../../services/flightRadarService';

/**
 * 🛫 CAPA DE TRAYECTORIA DE VUELO - ESTILO FLIGHTRADAR24
 * 
 * Dibuja la línea de trayectoria del vuelo seleccionado
 * usando el historial de posiciones (trail) de la API
 * 
 * La línea se gradúa de color según la altitud:
 * - Rojo = Baja altitud
 * - Amarillo = Media altitud  
 * - Verde = Alta altitud
 */

const TRAIL_SOURCE_ID = 'flight-trail-source';
const TRAIL_LAYER_ID = 'flight-trail-layer';
const TRAIL_OUTLINE_LAYER_ID = 'flight-trail-outline';
const FLIGHTS_LAYER_ID = 'flights-layer';

// Colores para el gradiente de altitud
const ALTITUDE_COLORS = {
  low: '#ef4444',      // Rojo - baja altitud
  medium: '#f59e0b',   // Naranja - media
  high: '#22c55e',     // Verde - alta
};

/**
 * Convertir trail a GeoJSON con segmentos coloreados por altitud
 */
function trailToGeoJSON(trail) {
  if (!trail || trail.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Filtrar puntos válidos y convertir a coordenadas
  const coordinates = trail
    .filter(point => point.lat && point.lng)
    .map(point => [point.lng, point.lat, point.alt || 0]);

  console.log(`🗺️ Trail: ${trail.length} puntos raw -> ${coordinates.length} puntos válidos`);

  if (coordinates.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Crear segmentos con colores según altitud
  const features = [];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const avgAlt = ((start[2] || 0) + (end[2] || 0)) / 2;
    
    // Determinar color según altitud (en pies)
    let color;
    if (avgAlt < 10000) {
      color = ALTITUDE_COLORS.low;
    } else if (avgAlt < 25000) {
      color = ALTITUDE_COLORS.medium;
    } else {
      color = ALTITUDE_COLORS.high;
    }

    features.push({
      type: 'Feature',
      properties: { altitude: avgAlt, color, index: i },
      geometry: {
        type: 'LineString',
        coordinates: [[start[0], start[1]], [end[0], end[1]]]
      }
    });
  }

  return { type: 'FeatureCollection', features };
}

export default function FlightTrailLayer({ 
  map, 
  selectedFlight,
  showTrail = true
}) {
  const initializedRef = useRef(false);
  const lastFlightIdRef = useRef(null);
  const [trail, setTrail] = useState([]);

  /**
   * Inicializar capas en el mapa
   */
  useEffect(() => {
    if (!map) return;

    const init = () => {
      try {
        // Crear source vacío
        if (!map.getSource(TRAIL_SOURCE_ID)) {
          map.addSource(TRAIL_SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
        }

        const beforeLayerId = map.getLayer(FLIGHTS_LAYER_ID) ? FLIGHTS_LAYER_ID : undefined;

        // Capa de outline (sombra)
        if (!map.getLayer(TRAIL_OUTLINE_LAYER_ID)) {
          map.addLayer({
            id: TRAIL_OUTLINE_LAYER_ID,
            type: 'line',
            source: TRAIL_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#000000',
              'line-width': 5,
              'line-opacity': 0.5,
              'line-blur': 1
            }
          }, beforeLayerId);
        }

        // Capa principal del trail
        if (!map.getLayer(TRAIL_LAYER_ID)) {
          map.addLayer({
            id: TRAIL_LAYER_ID,
            type: 'line',
            source: TRAIL_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 3,
              'line-opacity': 0.9
            }
          }, beforeLayerId);
        }

        initializedRef.current = true;
        console.log('✅ FlightTrailLayer: Capas inicializadas');
      } catch (error) {
        console.error('❌ Error inicializando FlightTrailLayer:', error);
      }
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once('load', init);
    }

    // Reinicializar cuando cambia el estilo
    const handleStyleLoad = () => {
      initializedRef.current = false;
      setTimeout(init, 100);
    };
    map.on('style.load', handleStyleLoad);

    return () => {
      map.off('style.load', handleStyleLoad);
      try {
        if (map.getLayer(TRAIL_LAYER_ID)) map.removeLayer(TRAIL_LAYER_ID);
        if (map.getLayer(TRAIL_OUTLINE_LAYER_ID)) map.removeLayer(TRAIL_OUTLINE_LAYER_ID);
        if (map.getSource(TRAIL_SOURCE_ID)) map.removeSource(TRAIL_SOURCE_ID);
        initializedRef.current = false;
      } catch (e) { /* ignore */ }
    };
  }, [map]);

  /**
   * Fetch trail cuando cambia el vuelo seleccionado
   */
  useEffect(() => {
    // Limpiar si no hay vuelo seleccionado
    if (!selectedFlight?.id || !showTrail) {
      setTrail([]);
      lastFlightIdRef.current = null;
      return;
    }

    const flightId = selectedFlight.id;

    // Evitar re-fetch del mismo vuelo
    if (lastFlightIdRef.current === flightId) {
      return;
    }

    console.log('🛫 Fetching trail for flight:', flightId);
    lastFlightIdRef.current = flightId;

    // Fetch async
    getFlightDetails(flightId)
      .then(details => {
        if (details?.trail && Array.isArray(details.trail)) {
          console.log(`✅ Trail recibido: ${details.trail.length} puntos`);
          setTrail(details.trail);
        } else {
          console.log('⚠️ No hay trail disponible');
          setTrail([]);
        }
      })
      .catch(error => {
        console.error('❌ Error fetching trail:', error);
        setTrail([]);
      });

  }, [selectedFlight?.id, showTrail]);

  /**
   * Actualizar datos del trail en el mapa
   */
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const source = map.getSource(TRAIL_SOURCE_ID);
      if (source) {
        const geojson = trailToGeoJSON(trail);
        source.setData(geojson);
        console.log(`🗺️ Trail actualizado en mapa: ${geojson.features.length} segmentos`);
      }
    } catch (e) {
      console.error('Error actualizando trail:', e);
    }
  }, [map, trail]);

  /**
   * Ocultar/mostrar capas según showTrail
   */
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const visibility = showTrail && trail.length > 0 ? 'visible' : 'none';
      
      if (map.getLayer(TRAIL_LAYER_ID)) {
        map.setLayoutProperty(TRAIL_LAYER_ID, 'visibility', visibility);
      }
      if (map.getLayer(TRAIL_OUTLINE_LAYER_ID)) {
        map.setLayoutProperty(TRAIL_OUTLINE_LAYER_ID, 'visibility', visibility);
      }
    } catch (e) { /* ignore */ }
  }, [map, showTrail, trail.length]);

  return null;
}
