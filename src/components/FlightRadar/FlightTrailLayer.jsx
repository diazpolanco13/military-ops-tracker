import { useEffect, useRef, useState } from 'react';
import { getFlightDetails, getAirportCoordinates } from '../../services/flightRadarService';
import { useMapLayers, createLineLayerConfig } from '../../hooks/useMapLayers';

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

// IDs de sources y layers
const TRAIL_SOURCE_ID = 'flight-trail-source';
const TRAIL_LAYER_ID = 'flight-trail-layer';
const TRAIL_OUTLINE_LAYER_ID = 'flight-trail-outline';
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
const TRANSPONDER_OFF_COLOR = '#1f2937';

/**
 * Convertir trail a GeoJSON con segmentos coloreados por altitud
 */
function trailToGeoJSON(trail) {
  if (!trail || trail.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  const coordinates = trail
    .filter(point => point.lat && point.lng)
    .map(point => [point.lng, point.lat, point.alt || 0]);

  if (coordinates.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features = [];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const avgAlt = ((start[2] || 0) + (end[2] || 0)) / 2;
    
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
 */
function createGapLineGeoJSON(trail, currentPosition) {
  if (!trail || trail.length === 0 || !currentPosition) {
    return { type: 'FeatureCollection', features: [] };
  }

  const sortedTrail = [...trail]
    .filter(p => p.lat && p.lng && p.ts)
    .sort((a, b) => a.ts - b.ts);

  if (sortedTrail.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const lastTrailPoint = sortedTrail[sortedTrail.length - 1];
  const currentTs = currentPosition.timestamp || (Date.now() / 1000);
  const timeDiff = currentTs - lastTrailPoint.ts;
  
  if (timeDiff < 60) {
    return { type: 'FeatureCollection', features: [] };
  }

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

  if (distance < 1) {
    return { type: 'FeatureCollection', features: [] };
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { type: 'gap', timeDiff, distance },
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
 */
function createPredictionLineGeoJSON(currentPosition, destinationAirport) {
  if (!currentPosition || !destinationAirport) {
    return { type: 'FeatureCollection', features: [] };
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { type: 'prediction', destination: destinationAirport.name },
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

/**
 * Configuración de layers para el hook
 */
const getLayersConfig = (beforeLayerId) => ({
  id: 'flight-trail',
  sources: [
    { id: TRAIL_SOURCE_ID },
    { id: GAP_SOURCE_ID },
    { id: PREDICTION_SOURCE_ID },
  ],
  layers: [
    // Orden de abajo hacia arriba
    createLineLayerConfig(PREDICTION_LAYER_ID, PREDICTION_SOURCE_ID, {
      color: TRANSPONDER_OFF_COLOR,
      width: 2,
      opacity: 0.7,
      dasharray: [4, 4],
    }),
    createLineLayerConfig(GAP_LAYER_ID, GAP_SOURCE_ID, {
      color: TRANSPONDER_OFF_COLOR,
      width: 3,
      opacity: 0.85,
    }),
    createLineLayerConfig(TRAIL_OUTLINE_LAYER_ID, TRAIL_SOURCE_ID, {
      color: '#000000',
      width: 5,
      opacity: 0.5,
      blur: 1,
    }),
    {
      id: TRAIL_LAYER_ID,
      type: 'line',
      source: TRAIL_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-opacity': 0.9,
      },
    },
  ],
  beforeLayerId,
});

export default function FlightTrailLayer({ 
  map, 
  selectedFlight,
  showTrail = true
}) {
  const lastFlightIdRef = useRef(null);
  const [trail, setTrail] = useState([]);
  const [destinationAirport, setDestinationAirport] = useState(null);

  // Determinar beforeLayerId
  const beforeLayerId = map?.getLayer(FLIGHTS_LAYER_ID) ? FLIGHTS_LAYER_ID : undefined;

  // Hook para manejar layers de forma robusta
  const { isReady, setSourceData, clearAllSources } = useMapLayers(
    map, 
    getLayersConfig(beforeLayerId)
  );

  /**
   * Fetch trail cuando cambia el vuelo seleccionado
   */
  useEffect(() => {
    // LIMPIAR si no hay vuelo seleccionado
    if (!selectedFlight?.id || !showTrail) {
      if (lastFlightIdRef.current !== null) {
        console.log('🧹 Limpiando trail - vuelo deseleccionado');
        setTrail([]);
        setDestinationAirport(null);
        lastFlightIdRef.current = null;
        clearAllSources();
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

    // Obtener coordenadas del destino
    if (selectedFlight.destination) {
      const destAirport = getAirportCoordinates(selectedFlight.destination);
      if (destAirport) {
        console.log(`🛬 Destino encontrado: ${selectedFlight.destination}`);
        setDestinationAirport({ ...destAirport, code: selectedFlight.destination });
      } else {
        setDestinationAirport(null);
      }
    } else {
      setDestinationAirport(null);
    }

    // Fetch async
    getFlightDetails(flightId)
      .then(details => {
        if (lastFlightIdRef.current !== flightId) return;
        
        if (details?.trail && Array.isArray(details.trail)) {
          console.log(`✅ Trail recibido: ${details.trail.length} puntos`);
          setTrail(details.trail);
        } else {
          setTrail([]);
        }
      })
      .catch(error => {
        console.error('❌ Error fetching trail:', error);
        if (lastFlightIdRef.current === flightId) {
          setTrail([]);
        }
      });

  }, [selectedFlight?.id, selectedFlight?.destination, showTrail, clearAllSources]);

  /**
   * Actualizar trail en el mapa cuando cambian los datos
   */
  useEffect(() => {
    if (!isReady || trail.length === 0) return;

    const geojson = trailToGeoJSON(trail);
    setSourceData(TRAIL_SOURCE_ID, geojson);
    console.log(`🗺️ Trail actualizado: ${geojson.features.length} segmentos`);
  }, [isReady, trail, setSourceData]);

  /**
   * Actualizar gap y predicción cuando cambia la posición del avión
   */
  useEffect(() => {
    if (!isReady || !selectedFlight || trail.length === 0) return;

    // Gap (transponder apagado)
    const gapGeoJSON = createGapLineGeoJSON(trail, selectedFlight);
    setSourceData(GAP_SOURCE_ID, gapGeoJSON);

    // Predicción hacia destino
    if (destinationAirport) {
      const hasGap = gapGeoJSON.features.length > 0 || 
                     selectedFlight.signal?.isTransponderActive === false;
      
      if (hasGap) {
        const predictionGeoJSON = createPredictionLineGeoJSON(selectedFlight, destinationAirport);
        setSourceData(PREDICTION_SOURCE_ID, predictionGeoJSON);
      } else {
        setSourceData(PREDICTION_SOURCE_ID, { type: 'FeatureCollection', features: [] });
      }
    }
  }, [isReady, trail, selectedFlight?.latitude, selectedFlight?.longitude, 
      selectedFlight?.signal?.isTransponderActive, destinationAirport, setSourceData]);

  return null;
}
