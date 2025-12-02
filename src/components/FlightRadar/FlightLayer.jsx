import { useEffect, useRef, useCallback } from 'react';
import { getCategoryColor, getMilitaryCategory } from '../../services/flightRadarService';

/**
 * 🛩️ CAPA DE VUELOS NATIVA - CON ICONOS SVG ORIGINALES
 * 
 * Usa capas GeoJSON nativas de Mapbox para sincronización perfecta
 * Los iconos se cargan como imágenes SVG
 */

const FLIGHTS_SOURCE_ID = 'flights-source';
const FLIGHTS_LAYER_ID = 'flights-layer';
const FLIGHTS_SELECTED_LAYER_ID = 'flights-selected-layer';
const PLANE_ICON = 'plane-yellow';
const PLANE_SELECTED_ICON = 'plane-red';
const HELI_ICON = 'heli-yellow';
const HELI_SELECTED_ICON = 'heli-red';

// Determinar si es helicóptero
const isHelicopter = (type) => {
  const heliTypes = ['H60', 'H47', 'H64', 'H53', 'UH60', 'CH47', 'AH64', 'MH60', 'HH60', 'S76', 'S92', 'EC', 'AS', 'R44', 'R22', 'B06', 'B07'];
  return heliTypes.some(h => (type || '').toUpperCase().includes(h));
};

// SVG del avión (Lucide Plane) - apuntando hacia ARRIBA
const PLANE_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="0.5">
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
</svg>`;

// SVG del helicóptero - apuntando hacia ARRIBA
const HELI_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="${color}" stroke="#000" stroke-width="0.8">
  <rect x="4" y="5" width="24" height="3" rx="1.5"/>
  <rect x="15" y="7" width="2" height="4"/>
  <ellipse cx="16" cy="14" rx="6" ry="5"/>
  <ellipse cx="16" cy="12" rx="3" ry="2" fill="#1e293b"/>
  <rect x="15" y="19" width="2" height="8"/>
  <ellipse cx="16" cy="27" rx="4" ry="1.5"/>
  <rect x="8" y="17" width="1.5" height="4"/>
  <rect x="22.5" y="17" width="1.5" height="4"/>
  <rect x="6" y="20.5" width="6" height="1.5" rx="0.75"/>
  <rect x="20" y="20.5" width="6" height="1.5" rx="0.75"/>
</svg>`;

// Convertir SVG a imagen para Mapbox
const svgToImage = (svgString, size = 32) => {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

export default function FlightLayer({ 
  map, 
  flights = [], 
  selectedFlight, 
  onFlightClick 
}) {
  const initializedRef = useRef(false);

  // Convertir vuelos a GeoJSON
  const getGeoJSON = useCallback((forSelected = false) => {
    const filteredFlights = forSelected 
      ? flights.filter(f => f.id === selectedFlight?.id)
      : flights.filter(f => f.id !== selectedFlight?.id);
      
    return {
      type: 'FeatureCollection',
      features: filteredFlights.map(flight => {
        const isHeli = isHelicopter(flight.aircraft?.type);
        
        return {
          type: 'Feature',
          properties: {
            id: flight.id,
            callsign: flight.callsign || 'UNKNOWN',
            // Heading ajustado: el SVG del avión apunta a -45°, así que sumamos 45
            heading: (flight.heading || 0) - 45,
            headingHeli: flight.heading || 0, // El heli ya apunta arriba
            isHelicopter: isHeli,
          },
          geometry: {
            type: 'Point',
            coordinates: [flight.longitude, flight.latitude]
          }
        };
      })
    };
  }, [flights, selectedFlight]);

  // Inicializar: cargar iconos y crear capas
  useEffect(() => {
    if (!map || initializedRef.current) return;

    const init = async () => {
      try {
        // Cargar iconos SVG como imágenes
        const [planeYellow, planeRed, heliYellow, heliRed] = await Promise.all([
          svgToImage(PLANE_SVG('#FFC107')),
          svgToImage(PLANE_SVG('#ef4444')),
          svgToImage(HELI_SVG('#FFC107')),
          svgToImage(HELI_SVG('#ef4444')),
        ]);

        // Agregar imágenes a Mapbox
        if (!map.hasImage(PLANE_ICON)) map.addImage(PLANE_ICON, planeYellow);
        if (!map.hasImage(PLANE_SELECTED_ICON)) map.addImage(PLANE_SELECTED_ICON, planeRed);
        if (!map.hasImage(HELI_ICON)) map.addImage(HELI_ICON, heliYellow);
        if (!map.hasImage(HELI_SELECTED_ICON)) map.addImage(HELI_SELECTED_ICON, heliRed);

        // Crear sources
        if (!map.getSource(FLIGHTS_SOURCE_ID)) {
          map.addSource(FLIGHTS_SOURCE_ID, {
            type: 'geojson',
            data: getGeoJSON(false)
          });
        }

        if (!map.getSource(FLIGHTS_SOURCE_ID + '-selected')) {
          map.addSource(FLIGHTS_SOURCE_ID + '-selected', {
            type: 'geojson',
            data: getGeoJSON(true)
          });
        }

        // Capa de vuelos normales
        if (!map.getLayer(FLIGHTS_LAYER_ID)) {
          map.addLayer({
            id: FLIGHTS_LAYER_ID,
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID,
            layout: {
              'icon-image': [
                'case',
                ['get', 'isHelicopter'], HELI_ICON,
                PLANE_ICON
              ],
              'icon-size': 1,
              'icon-rotate': [
                'case',
                ['get', 'isHelicopter'], ['get', 'headingHeli'],
                ['get', 'heading']
              ],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
            minzoom: 3,
          });
        }

        // Capa de labels
        if (!map.getLayer(FLIGHTS_LAYER_ID + '-labels')) {
          map.addLayer({
            id: FLIGHTS_LAYER_ID + '-labels',
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID,
            layout: {
              'text-field': ['get', 'callsign'],
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': 10,
              'text-offset': [0, 1.3],
              'text-anchor': 'top',
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': '#FFC107',
              'text-halo-color': 'rgba(0,0,0,0.9)',
              'text-halo-width': 1.5,
            },
            minzoom: 6,
          });
        }

        // Capa de vuelo seleccionado
        if (!map.getLayer(FLIGHTS_SELECTED_LAYER_ID)) {
          map.addLayer({
            id: FLIGHTS_SELECTED_LAYER_ID,
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID + '-selected',
            layout: {
              'icon-image': [
                'case',
                ['get', 'isHelicopter'], HELI_SELECTED_ICON,
                PLANE_SELECTED_ICON
              ],
              'icon-size': 1.3,
              'icon-rotate': [
                'case',
                ['get', 'isHelicopter'], ['get', 'headingHeli'],
                ['get', 'heading']
              ],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          });
        }

        // Label del seleccionado
        if (!map.getLayer(FLIGHTS_SELECTED_LAYER_ID + '-label')) {
          map.addLayer({
            id: FLIGHTS_SELECTED_LAYER_ID + '-label',
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID + '-selected',
            layout: {
              'text-field': ['get', 'callsign'],
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
            },
            paint: {
              'text-color': '#ef4444',
              'text-halo-color': 'rgba(0,0,0,0.95)',
              'text-halo-width': 2,
            },
          });
        }

        initializedRef.current = true;
        console.log('✅ FlightLayer: Iconos SVG cargados correctamente');
      } catch (error) {
        console.error('❌ FlightLayer error:', error);
      }
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once('load', init);
    }

    // Reinicializar al cambiar estilo
    const handleStyleLoad = () => {
      initializedRef.current = false;
      init();
    };
    map.on('style.load', handleStyleLoad);

    return () => {
      map.off('style.load', handleStyleLoad);
      
      // Limpiar todo al desmontar
      try {
        if (map.getLayer(FLIGHTS_SELECTED_LAYER_ID + '-label')) map.removeLayer(FLIGHTS_SELECTED_LAYER_ID + '-label');
        if (map.getLayer(FLIGHTS_SELECTED_LAYER_ID)) map.removeLayer(FLIGHTS_SELECTED_LAYER_ID);
        if (map.getLayer(FLIGHTS_LAYER_ID + '-labels')) map.removeLayer(FLIGHTS_LAYER_ID + '-labels');
        if (map.getLayer(FLIGHTS_LAYER_ID)) map.removeLayer(FLIGHTS_LAYER_ID);
        if (map.getSource(FLIGHTS_SOURCE_ID + '-selected')) map.removeSource(FLIGHTS_SOURCE_ID + '-selected');
        if (map.getSource(FLIGHTS_SOURCE_ID)) map.removeSource(FLIGHTS_SOURCE_ID);
        if (map.hasImage(PLANE_ICON)) map.removeImage(PLANE_ICON);
        if (map.hasImage(PLANE_SELECTED_ICON)) map.removeImage(PLANE_SELECTED_ICON);
        if (map.hasImage(HELI_ICON)) map.removeImage(HELI_ICON);
        if (map.hasImage(HELI_SELECTED_ICON)) map.removeImage(HELI_SELECTED_ICON);
        initializedRef.current = false;
        console.log('🧹 FlightLayer: Capas limpiadas al desmontar');
      } catch (e) {
        console.log('⚠️ Error limpiando capas:', e.message);
      }
    };
  }, [map]);

  // Actualizar datos cuando cambien los vuelos
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const source = map.getSource(FLIGHTS_SOURCE_ID);
      const selectedSource = map.getSource(FLIGHTS_SOURCE_ID + '-selected');
      
      if (source) source.setData(getGeoJSON(false));
      if (selectedSource) selectedSource.setData(getGeoJSON(true));
    } catch (e) {
      // Ignorar
    }
  }, [map, flights, selectedFlight, getGeoJSON]);

  // Manejar clicks
  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [FLIGHTS_LAYER_ID, FLIGHTS_SELECTED_LAYER_ID]
      });

      if (features.length > 0) {
        const flightId = features[0].properties.id;
        const flight = flights.find(f => f.id === flightId);
        if (flight && onFlightClick) {
          onFlightClick(flight);
        }
      }
    };

    const setCursor = () => { map.getCanvas().style.cursor = 'pointer'; };
    const resetCursor = () => { map.getCanvas().style.cursor = ''; };

    const setup = () => {
      if (map.getLayer(FLIGHTS_LAYER_ID)) {
        map.on('click', FLIGHTS_LAYER_ID, handleClick);
        map.on('click', FLIGHTS_SELECTED_LAYER_ID, handleClick);
        map.on('mouseenter', FLIGHTS_LAYER_ID, setCursor);
        map.on('mouseleave', FLIGHTS_LAYER_ID, resetCursor);
      }
    };

    if (initializedRef.current) {
      setup();
    } else {
      map.once('idle', setup);
    }

    return () => {
      try {
        map.off('click', FLIGHTS_LAYER_ID, handleClick);
        map.off('click', FLIGHTS_SELECTED_LAYER_ID, handleClick);
        map.off('mouseenter', FLIGHTS_LAYER_ID, setCursor);
        map.off('mouseleave', FLIGHTS_LAYER_ID, resetCursor);
      } catch (e) {}
    };
  }, [map, flights, onFlightClick]);

  return null;
}
