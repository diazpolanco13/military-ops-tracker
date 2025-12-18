import { useEffect, useRef, useCallback } from 'react';

/**
 * 🚢 CAPA DE BUQUES - Solo militares y petroleros
 * 
 * - Militares: Rojo (#ef4444)
 * - Petroleros: Naranja (#f59e0b)
 */

const SOURCE_ID = 'ships-data-source';
const LAYER_ID = 'ships-symbols-layer';

// Colores por tipo
const COLORS = {
  military: '#ef4444',  // Rojo
  tanker: '#f59e0b',    // Naranja
  selected: '#22c55e',  // Verde
};

// SVG de buque simple
const createShipSVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
  <path d="M12 2L8 8v4l-4 2v4l4 2v2h8v-2l4-2v-4l-4-2V8l-4-6z" fill="${color}" stroke="#000" stroke-width="0.5"/>
  <path d="M12 4l2 3h-4l2-3z" fill="#fff" fill-opacity="0.3"/>
</svg>`;

// Convertir SVG a imagen
const svgToImage = (svgString) => {
  return new Promise((resolve, reject) => {
    const img = new Image(32, 32);
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
  const shipsRef = useRef(ships);
  
  // Actualizar ref cuando cambien los ships
  shipsRef.current = ships;

  // Filtrar SOLO militares y petroleros
  const interestingShips = ships.filter(s => s.is_military || s.is_tanker);

  // Convertir a GeoJSON
  const createGeoJSON = useCallback((shipList, selected) => {
    const filtered = shipList.filter(s => s.is_military || s.is_tanker);
    return {
      type: 'FeatureCollection',
      features: filtered.map(ship => ({
        type: 'Feature',
        properties: {
          mmsi: ship.mmsi,
          name: ship.ship_name || 'UNKNOWN',
          heading: parseFloat(ship.heading) || parseFloat(ship.course) || 0,
          is_military: ship.is_military || false,
          is_tanker: ship.is_tanker || false,
          is_selected: ship.mmsi === selected?.mmsi,
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(ship.longitude), parseFloat(ship.latitude)]
        }
      }))
    };
  }, []);

  // Inicializar capa
  useEffect(() => {
    if (!map) return;

    const init = async () => {
      try {
        // Cargar iconos si no existen
        if (!map.hasImage('ship-military')) {
          const militaryImg = await svgToImage(createShipSVG(COLORS.military));
          map.addImage('ship-military', militaryImg);
        }
        if (!map.hasImage('ship-tanker')) {
          const tankerImg = await svgToImage(createShipSVG(COLORS.tanker));
          map.addImage('ship-tanker', tankerImg);
        }
        if (!map.hasImage('ship-selected')) {
          const selectedImg = await svgToImage(createShipSVG(COLORS.selected));
          map.addImage('ship-selected', selectedImg);
        }

        // Limpiar si ya existe
        if (map.getLayer(LAYER_ID)) {
          map.removeLayer(LAYER_ID);
        }
        if (map.getSource(SOURCE_ID)) {
          map.removeSource(SOURCE_ID);
        }

        // Agregar source
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: createGeoJSON(shipsRef.current, selectedShip)
        });

        // Agregar layer
        map.addLayer({
          id: LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          layout: {
            'icon-image': [
              'case',
              ['get', 'is_selected'], 'ship-selected',
              ['get', 'is_military'], 'ship-military',
              'ship-tanker'
            ],
            'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 0.9, 15, 1.2],
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['step', ['zoom'], '', 9, ['get', 'name']],
            'text-size': 10,
            'text-offset': [0, 1.8],
            'text-anchor': 'top',
            'text-optional': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': [
              'case',
              ['get', 'is_selected'], COLORS.selected,
              ['get', 'is_military'], COLORS.military,
              COLORS.tanker
            ],
            'text-halo-width': 1.5,
          }
        });

        // Click handler
        const handleClick = (e) => {
          if (e.features?.[0]) {
            const mmsi = e.features[0].properties.mmsi;
            const ship = shipsRef.current.find(s => s.mmsi === mmsi);
            if (ship && onShipClick) onShipClick(ship);
          }
        };

        map.on('click', LAYER_ID, handleClick);
        map.on('mouseenter', LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', LAYER_ID, () => { map.getCanvas().style.cursor = ''; });

        initializedRef.current = true;
        console.log(`✅ ShipLayer inicializado: ${interestingShips.length} buques de interés`);
      } catch (error) {
        console.error('Error inicializando ShipLayer:', error);
      }
    };

    if (map.isStyleLoaded()) {
      init();
    } else {
      map.once('load', init);
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        initializedRef.current = false;
      } catch (e) { /* ignore */ }
    };
  }, [map, createGeoJSON, onShipClick]);

  // Actualizar datos cuando cambien los buques
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      const source = map.getSource(SOURCE_ID);
      if (source) {
        source.setData(createGeoJSON(ships, selectedShip));
      }
    } catch (e) {
      console.error('Error actualizando ships:', e);
    }
  }, [map, ships, selectedShip, createGeoJSON]);

  // Control de visibilidad
  useEffect(() => {
    if (!map) return;

    try {
      if (map.getLayer(LAYER_ID)) {
        map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none');
      }
    } catch (e) { /* ignore */ }
  }, [map, visible]);

  return null;
}
