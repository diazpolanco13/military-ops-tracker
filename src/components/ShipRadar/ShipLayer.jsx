import { useEffect, useRef, useCallback } from 'react';
import { getShipColor } from '../../services/shipRadarService';

/**
 * 🚢 CAPA DE BUQUES - Similar a FlightLayer
 * 
 * Renderiza buques en el mapa usando Mapbox GL
 */

const SHIPS_SOURCE_ID = 'ships-source';
const SHIPS_LAYER_ID = 'ships-layer';
const SHIPS_SELECTED_LAYER_ID = 'ships-selected-layer';
const SHIP_ICON = 'ship-icon';
const SHIP_SELECTED_ICON = 'ship-selected-icon';

// SVG de buque - vista superior
const SHIP_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="0.5">
  <path d="M12 2L8 8v4l-4 2v4l4 2v2h8v-2l4-2v-4l-4-2V8l-4-6zm0 2l2.5 4h-5L12 4zm-3 6h6v3H9v-3zm-4 5l3-1.5v3L5 15zm14 0l-3 1.5v-3l3 1.5z"/>
</svg>`;

// Convertir SVG a imagen
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

export default function ShipLayer({ 
  map, 
  ships = [], 
  selectedShip, 
  onShipClick,
  visible = true
}) {
  const initializedRef = useRef(false);

  // Convertir buques a GeoJSON
  const getGeoJSON = useCallback((forSelected = false) => {
    const filteredShips = forSelected 
      ? ships.filter(s => s.mmsi === selectedShip?.mmsi)
      : ships.filter(s => s.mmsi !== selectedShip?.mmsi);
      
    return {
      type: 'FeatureCollection',
      features: filteredShips.map(ship => ({
        type: 'Feature',
        properties: {
          mmsi: ship.mmsi,
          name: ship.ship_name || 'UNKNOWN',
          heading: ship.heading || ship.course || 0,
          category: ship.category,
          color: ship.color,
        },
        geometry: {
          type: 'Point',
          coordinates: [ship.longitude, ship.latitude]
        }
      }))
    };
  }, [ships, selectedShip]);

  // Inicializar capas
  useEffect(() => {
    if (!map) return;

    const init = async () => {
      try {
        // Cargar iconos
        if (!map.hasImage(SHIP_ICON)) {
          const shipImg = await svgToImage(SHIP_SVG('#f59e0b'));
          map.addImage(SHIP_ICON, shipImg, { sdf: false });
        }
        
        if (!map.hasImage(SHIP_SELECTED_ICON)) {
          const selectedImg = await svgToImage(SHIP_SVG('#ef4444'));
          map.addImage(SHIP_SELECTED_ICON, selectedImg, { sdf: false });
        }

        // Source
        if (!map.getSource(SHIPS_SOURCE_ID)) {
          map.addSource(SHIPS_SOURCE_ID, {
            type: 'geojson',
            data: getGeoJSON(false)
          });
        }

        // Source para seleccionado
        if (!map.getSource(`${SHIPS_SOURCE_ID}-selected`)) {
          map.addSource(`${SHIPS_SOURCE_ID}-selected`, {
            type: 'geojson',
            data: getGeoJSON(true)
          });
        }

        // Capa principal de buques
        if (!map.getLayer(SHIPS_LAYER_ID)) {
          map.addLayer({
            id: SHIPS_LAYER_ID,
            type: 'symbol',
            source: SHIPS_SOURCE_ID,
            layout: {
              'icon-image': SHIP_ICON,
              'icon-size': 0.8,
              'icon-rotate': ['get', 'heading'],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'text-field': ['get', 'name'],
              'text-size': 10,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-optional': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1,
            }
          });
        }

        // Capa para buque seleccionado
        if (!map.getLayer(SHIPS_SELECTED_LAYER_ID)) {
          map.addLayer({
            id: SHIPS_SELECTED_LAYER_ID,
            type: 'symbol',
            source: `${SHIPS_SOURCE_ID}-selected`,
            layout: {
              'icon-image': SHIP_SELECTED_ICON,
              'icon-size': 1.0,
              'icon-rotate': ['get', 'heading'],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#ef4444',
              'text-halo-width': 2,
            }
          });
        }

        // Click handler
        map.on('click', SHIPS_LAYER_ID, (e) => {
          if (e.features && e.features[0]) {
            const mmsi = e.features[0].properties.mmsi;
            const ship = ships.find(s => s.mmsi === mmsi);
            if (ship && onShipClick) {
              onShipClick(ship);
            }
          }
        });

        // Cursor pointer
        map.on('mouseenter', SHIPS_LAYER_ID, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', SHIPS_LAYER_ID, () => {
          map.getCanvas().style.cursor = '';
        });

        initializedRef.current = true;
        console.log('✅ ShipLayer inicializado');
      } catch (error) {
        console.error('Error inicializando ShipLayer:', error);
      }
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once('load', init);
    }

    // Cleanup
    return () => {
      try {
        if (map.getLayer(SHIPS_LAYER_ID)) map.removeLayer(SHIPS_LAYER_ID);
        if (map.getLayer(SHIPS_SELECTED_LAYER_ID)) map.removeLayer(SHIPS_SELECTED_LAYER_ID);
        if (map.getSource(SHIPS_SOURCE_ID)) map.removeSource(SHIPS_SOURCE_ID);
        if (map.getSource(`${SHIPS_SOURCE_ID}-selected`)) map.removeSource(`${SHIPS_SOURCE_ID}-selected`);
      } catch (e) { /* ignore */ }
    };
  }, [map]);

  // Actualizar datos
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const source = map.getSource(SHIPS_SOURCE_ID);
      const selectedSource = map.getSource(`${SHIPS_SOURCE_ID}-selected`);
      
      if (source) {
        source.setData(getGeoJSON(false));
      }
      if (selectedSource) {
        selectedSource.setData(getGeoJSON(true));
      }
    } catch (e) {
      console.error('Error actualizando ships:', e);
    }
  }, [map, ships, selectedShip, getGeoJSON]);

  // Visibilidad
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const visibility = visible ? 'visible' : 'none';
      if (map.getLayer(SHIPS_LAYER_ID)) {
        map.setLayoutProperty(SHIPS_LAYER_ID, 'visibility', visibility);
      }
      if (map.getLayer(SHIPS_SELECTED_LAYER_ID)) {
        map.setLayoutProperty(SHIPS_SELECTED_LAYER_ID, 'visibility', visibility);
      }
    } catch (e) { /* ignore */ }
  }, [map, visible]);

  return null;
}
