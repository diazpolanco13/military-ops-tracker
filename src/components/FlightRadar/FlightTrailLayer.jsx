import { useEffect, useRef, useState } from 'react';
import { getFlightDetails, getAirportCoordinates } from '../../services/flightRadarService';

/**
 * 🛫 CAPA DE TRAYECTORIA DE VUELO - ESTILO FLIGHTRADAR24
 * 
 * Dibuja la línea de trayectoria del vuelo seleccionado
 * usando el historial de posiciones (trail) de la API
 * 
 * TIPOS DE LÍNEAS:
 * 1. Trail normal: Coloreado por altitud (rojo/naranja/verde) - datos ADS-B reales
 * 2. Línea negra continua: Transponder apagado (gap entre trail y posición actual)
 * 3. Línea negra punteada: Predicción de ruta hacia destino
 */

const TRAIL_SOURCE_ID = 'flight-trail-source';
const TRAIL_LAYER_ID = 'flight-trail-layer';
const TRAIL_OUTLINE_LAYER_ID = 'flight-trail-outline';

// Nuevas capas para transponder apagado y predicción
const GAP_SOURCE_ID = 'flight-gap-source';
const GAP_LAYER_ID = 'flight-gap-layer';
const PREDICTION_SOURCE_ID = 'flight-prediction-source';
const PREDICTION_LAYER_ID = 'flight-prediction-layer';

const FLIGHTS_LAYER_ID = 'flights-layer';

// Colores para el gradiente de altitud
const ALTITUDE_COLORS = {
  low: '#ef4444',      // Rojo - baja altitud
  medium: '#f59e0b',   // Naranja - media
  high: '#22c55e',     // Verde - alta
};

// Color para transponder apagado
const TRANSPONDER_OFF_COLOR = '#1f2937'; // Gris oscuro/negro

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

/**
 * Crear GeoJSON para línea de gap (transponder apagado)
 * Conecta el último punto del trail con la posición actual del avión
 */
function createGapLineGeoJSON(trail, currentPosition) {
  if (!trail || trail.length === 0 || !currentPosition) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Ordenar trail cronológicamente (el más reciente puede estar primero)
  const sortedTrail = [...trail]
    .filter(p => p.lat && p.lng && p.ts)
    .sort((a, b) => a.ts - b.ts);

  if (sortedTrail.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const lastTrailPoint = sortedTrail[sortedTrail.length - 1];
  
  // Calcular diferencia temporal
  const currentTs = currentPosition.timestamp || (Date.now() / 1000);
  const timeDiff = currentTs - lastTrailPoint.ts;
  
  // Solo dibujar gap si hay más de 60 segundos de diferencia
  if (timeDiff < 60) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Calcular distancia en km
  const R = 6371;
  const lat1 = lastTrailPoint.lat * Math.PI / 180;
  const lat2 = currentPosition.latitude * Math.PI / 180;
  const deltaLat = (currentPosition.latitude - lastTrailPoint.lat) * Math.PI / 180;
  const deltaLon = (currentPosition.longitude - lastTrailPoint.lng) * Math.PI / 180;
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Solo dibujar si la distancia es significativa (>1km)
  if (distance < 1) {
    return { type: 'FeatureCollection', features: [] };
  }

  console.log(`⚫ Gap detectado: ${(timeDiff/60).toFixed(1)} min, ${distance.toFixed(1)} km`);

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        type: 'gap',
        timeDiff: timeDiff,
        distance: distance,
        gapMinutes: (timeDiff / 60).toFixed(1)
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [lastTrailPoint.lng, lastTrailPoint.lat],
          [currentPosition.longitude, currentPosition.latitude]
        ]
      }
    }]
  };
}

/**
 * Crear GeoJSON para línea de predicción hacia destino
 * Línea punteada desde posición actual hasta aeropuerto de destino
 */
function createPredictionLineGeoJSON(currentPosition, destinationAirport) {
  if (!currentPosition || !destinationAirport) {
    return { type: 'FeatureCollection', features: [] };
  }

  console.log(`📍 Predicción: ${currentPosition.latitude.toFixed(2)}, ${currentPosition.longitude.toFixed(2)} → ${destinationAirport.name}`);

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        type: 'prediction',
        destination: destinationAirport.name,
        destinationCode: destinationAirport.code
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [currentPosition.longitude, currentPosition.latitude],
          [destinationAirport.lng, destinationAirport.lat]
        ]
      }
    }]
  };
}

export default function FlightTrailLayer({ 
  map, 
  selectedFlight,
  showTrail = true
}) {
  const initializedRef = useRef(false);
  const lastFlightIdRef = useRef(null);
  const [trail, setTrail] = useState([]);
  const [destinationAirport, setDestinationAirport] = useState(null);

  /**
   * Inicializar capas en el mapa
   */
  useEffect(() => {
    if (!map) return;

    const init = () => {
      try {
        const emptyGeoJSON = { type: 'FeatureCollection', features: [] };
        const beforeLayerId = map.getLayer(FLIGHTS_LAYER_ID) ? FLIGHTS_LAYER_ID : undefined;

        // ===== CREAR TODOS LOS SOURCES PRIMERO =====
        if (!map.getSource(TRAIL_SOURCE_ID)) {
          map.addSource(TRAIL_SOURCE_ID, { type: 'geojson', data: emptyGeoJSON });
        }
        if (!map.getSource(GAP_SOURCE_ID)) {
          map.addSource(GAP_SOURCE_ID, { type: 'geojson', data: emptyGeoJSON });
        }
        if (!map.getSource(PREDICTION_SOURCE_ID)) {
          map.addSource(PREDICTION_SOURCE_ID, { type: 'geojson', data: emptyGeoJSON });
        }

        // ===== AÑADIR CAPAS EN ORDEN (de abajo hacia arriba) =====
        // 1. Predicción (más abajo, punteada)
        if (!map.getLayer(PREDICTION_LAYER_ID)) {
          map.addLayer({
            id: PREDICTION_LAYER_ID,
            type: 'line',
            source: PREDICTION_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': TRANSPONDER_OFF_COLOR,
              'line-width': 2,
              'line-opacity': 0.7,
              'line-dasharray': [4, 4]
            }
          }, beforeLayerId);
        }

        // 2. Gap (transponder apagado, continua negra)
        if (!map.getLayer(GAP_LAYER_ID)) {
          map.addLayer({
            id: GAP_LAYER_ID,
            type: 'line',
            source: GAP_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': TRANSPONDER_OFF_COLOR,
              'line-width': 3,
              'line-opacity': 0.85
            }
          }, beforeLayerId);
        }

        // 3. Trail outline (sombra)
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

        // 4. Trail principal (encima de todo, coloreado por altitud)
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
        console.log('✅ FlightTrailLayer: Capas inicializadas (trail + gap + prediction)');
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
        // Limpiar todas las capas
        [TRAIL_LAYER_ID, TRAIL_OUTLINE_LAYER_ID, GAP_LAYER_ID, PREDICTION_LAYER_ID].forEach(layerId => {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });
        [TRAIL_SOURCE_ID, GAP_SOURCE_ID, PREDICTION_SOURCE_ID].forEach(sourceId => {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        });
        initializedRef.current = false;
      } catch (e) { /* ignore */ }
    };
  }, [map]);

  /**
   * Fetch trail y datos de destino cuando cambia el vuelo seleccionado
   * También limpia cuando se deselecciona
   */
  useEffect(() => {
    // LIMPIAR si no hay vuelo seleccionado
    if (!selectedFlight?.id || !showTrail) {
      // Solo limpiar si había algo antes
      if (lastFlightIdRef.current !== null || trail.length > 0) {
        console.log('🧹 Limpiando trail - vuelo deseleccionado');
        setTrail([]);
        setDestinationAirport(null);
        lastFlightIdRef.current = null;
        
        // Limpiar sources del mapa
        if (map && initializedRef.current) {
          const emptyGeoJSON = { type: 'FeatureCollection', features: [] };
          try {
            const trailSource = map.getSource(TRAIL_SOURCE_ID);
            const gapSource = map.getSource(GAP_SOURCE_ID);
            const predictionSource = map.getSource(PREDICTION_SOURCE_ID);
            
            if (trailSource) trailSource.setData(emptyGeoJSON);
            if (gapSource) gapSource.setData(emptyGeoJSON);
            if (predictionSource) predictionSource.setData(emptyGeoJSON);
          } catch (e) { /* ignore */ }
        }
      }
      return;
    }

    const flightId = selectedFlight.id;

    // Evitar re-fetch del mismo vuelo
    if (lastFlightIdRef.current === flightId) {
      return;
    }

    console.log('🛫 Fetching trail for flight:', flightId);
    lastFlightIdRef.current = flightId;

    // Obtener coordenadas del destino si está declarado
    if (selectedFlight.destination) {
      const destAirport = getAirportCoordinates(selectedFlight.destination);
      if (destAirport) {
        console.log(`🛬 Destino encontrado: ${selectedFlight.destination} - ${destAirport.name}`);
        setDestinationAirport({ ...destAirport, code: selectedFlight.destination });
      } else {
        console.log(`⚠️ Destino ${selectedFlight.destination} no está en la base de datos`);
        setDestinationAirport(null);
      }
    } else {
      setDestinationAirport(null);
    }

    // Fetch async
    getFlightDetails(flightId)
      .then(details => {
        // Verificar que todavía estamos en el mismo vuelo
        if (lastFlightIdRef.current !== flightId) return;
        
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
        if (lastFlightIdRef.current === flightId) {
          setTrail([]);
        }
      });

  }, [selectedFlight?.id, selectedFlight?.destination, showTrail, map]);

  /**
   * Actualizar datos del trail en el mapa
   * Solo se actualiza cuando cambia el trail, NO cuando cambia selectedFlight
   */
  useEffect(() => {
    if (!map || trail.length === 0) return;

    const updateTrail = () => {
      try {
        const trailSource = map.getSource(TRAIL_SOURCE_ID);
        if (trailSource) {
          const geojson = trailToGeoJSON(trail);
          trailSource.setData(geojson);
          console.log(`🗺️ Trail actualizado en mapa: ${geojson.features.length} segmentos`);
        } else {
          console.log('⚠️ Trail source no encontrado, reintentando...');
          // Si el source no existe, esperar un poco y reintentar
          setTimeout(updateTrail, 200);
        }
      } catch (e) {
        console.error('Error actualizando trail:', e);
      }
    };

    // Si las capas no están inicializadas, esperar
    if (!initializedRef.current) {
      console.log('⏳ Esperando inicialización de capas para trail...');
      const checkInit = setInterval(() => {
        if (initializedRef.current || map.getSource(TRAIL_SOURCE_ID)) {
          clearInterval(checkInit);
          updateTrail();
        }
      }, 100);
      // Timeout de seguridad
      setTimeout(() => clearInterval(checkInit), 5000);
      return;
    }

    updateTrail();
  }, [map, trail]);

  /**
   * Actualizar líneas de gap y predicción
   * Estas SÍ necesitan actualizarse cuando cambia la posición del avión
   */
  useEffect(() => {
    if (!map || !selectedFlight || trail.length === 0) return;

    const updateGapAndPrediction = () => {
      try {
        // Actualizar línea de gap (transponder apagado)
        const gapSource = map.getSource(GAP_SOURCE_ID);
        if (gapSource) {
          const gapGeoJSON = createGapLineGeoJSON(trail, selectedFlight);
          gapSource.setData(gapGeoJSON);
          if (gapGeoJSON.features.length > 0) {
            console.log(`⚫ Gap actualizado`);
          }
        }

        // Actualizar línea de predicción hacia destino
        const predictionSource = map.getSource(PREDICTION_SOURCE_ID);
        if (predictionSource && destinationAirport) {
          const gapGeoJSON = createGapLineGeoJSON(trail, selectedFlight);
          const hasGap = gapGeoJSON.features.length > 0 || selectedFlight.signal?.isTransponderActive === false;
          
          if (hasGap) {
            const predictionGeoJSON = createPredictionLineGeoJSON(selectedFlight, destinationAirport);
            predictionSource.setData(predictionGeoJSON);
            console.log(`📍 Predicción actualizada hacia ${destinationAirport.code}`);
          } else {
            predictionSource.setData({ type: 'FeatureCollection', features: [] });
          }
        }
      } catch (e) {
        console.error('Error actualizando gap/prediction:', e);
      }
    };

    // Pequeño delay para asegurar que el trail ya se actualizó
    const timeoutId = setTimeout(updateGapAndPrediction, 50);
    return () => clearTimeout(timeoutId);
  }, [map, trail, selectedFlight?.latitude, selectedFlight?.longitude, destinationAirport]);

  /**
   * Ocultar/mostrar capas según showTrail
   * Solo depende de showTrail y si hay trail, NO de selectedFlight
   */
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const hasTrail = trail.length > 0;
      const visibility = showTrail && hasTrail ? 'visible' : 'none';
      
      // Trail principal - visible si hay datos
      if (map.getLayer(TRAIL_LAYER_ID)) {
        map.setLayoutProperty(TRAIL_LAYER_ID, 'visibility', visibility);
      }
      if (map.getLayer(TRAIL_OUTLINE_LAYER_ID)) {
        map.setLayoutProperty(TRAIL_OUTLINE_LAYER_ID, 'visibility', visibility);
      }
      
      // Gap y predicción - siempre visible cuando showTrail está activo
      // (los datos vacíos simplemente no se ven)
      const gapVisibility = showTrail ? 'visible' : 'none';
      if (map.getLayer(GAP_LAYER_ID)) {
        map.setLayoutProperty(GAP_LAYER_ID, 'visibility', gapVisibility);
      }
      if (map.getLayer(PREDICTION_LAYER_ID)) {
        map.setLayoutProperty(PREDICTION_LAYER_ID, 'visibility', gapVisibility);
      }
    } catch (e) { /* ignore */ }
  }, [map, showTrail, trail.length]);

  return null;
}
