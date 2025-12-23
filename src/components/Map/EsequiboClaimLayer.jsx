import { useEffect, useRef } from 'react';
import { ESEQUIBO_CLAIM_ZONE } from '../../data/esequiboClaimZone';

/**
 * 🗺️ Capa de Zona en Reclamación - Guayana Esequiba
 * 
 * Muestra el territorio reclamado por Venezuela con estilo similar
 * al sombreado de Venezuela (relleno rojo semitransparente + borde)
 * 
 * ⚠️ IMPORTANTE: Esta capa es SOLO para visualización.
 * NO interfiere con el sistema de detección de incursiones que usa
 * los límites marítimos oficiales (EEZ) de Venezuela.
 * 
 * @param {object} map - Instancia de Mapbox GL JS
 * @param {boolean} visible - Si la capa es visible
 */
export default function EsequiboClaimLayer({ map, visible = true }) {
  const layersRef = useRef({
    source: 'esequibo-claim-zone',
    fillLayer: 'esequibo-claim-fill',
    lineLayer: 'esequibo-claim-line',
    labelLayer: 'esequibo-claim-label',
  });

  // 🗺️ Agregar capa cuando el mapa esté listo
  useEffect(() => {
    if (!map) return;

    const { source, fillLayer, lineLayer, labelLayer } = layersRef.current;

    const addLayers = () => {
      console.log('🗺️ Adding Esequibo claim zone layer...');

      // Remover capas existentes primero
      removeLayers();

      // Agregar source
      map.addSource(source, {
        type: 'geojson',
        data: ESEQUIBO_CLAIM_ZONE,
      });

      console.log('✅ Esequibo source added');

      // Capa de relleno (estilo similar a Venezuela - rojo semitransparente)
      map.addLayer({
        id: fillLayer,
        type: 'fill',
        source: source,
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'fill-color': '#ef4444', // Rojo (mismo que Venezuela)
          'fill-opacity': 0.25,    // Semitransparente
        },
      });

      // Capa de borde (línea roja)
      map.addLayer({
        id: lineLayer,
        type: 'line',
        source: source,
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#ef4444', // Rojo
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // Capa de etiqueta - DESHABILITADA por solicitud del usuario
      // map.addLayer({
      //   id: labelLayer,
      //   type: 'symbol',
      //   source: source,
      //   layout: {
      //     visibility: visible ? 'visible' : 'none',
      //     'text-field': 'Zona en Reclamación',
      //     'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      //     'text-size': 12,
      //     'text-max-width': 10,
      //   },
      //   paint: {
      //     'text-color': '#fbbf24',
      //     'text-halo-color': '#1e293b',
      //     'text-halo-width': 2,
      //     'text-opacity': 0.9,
      //   },
      // });

      console.log('✅ Esequibo claim zone layers added:', {
        fillLayer,
        lineLayer,
        labelLayer,
        visible
      });

      // 🖱️ Interacción hover
      map.on('mouseenter', fillLayer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', fillLayer, () => {
        map.getCanvas().style.cursor = '';
      });

      // 📍 Click para mostrar info
      map.on('click', fillLayer, (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          console.log('📍 Clicked Esequibo zone:', props);
        }
      });
    };

    const removeLayers = () => {
      const { source, fillLayer, lineLayer, labelLayer } = layersRef.current;
      
      [labelLayer, lineLayer, fillLayer].forEach(layer => {
        if (map.getLayer(layer)) map.removeLayer(layer);
      });
      
      if (map.getSource(source)) map.removeSource(source);
    };

    // Manejar cambios de estilo del mapa
    const handleStyleLoad = () => {
      console.log('🗺️ Style loaded, re-adding Esequibo layer');
      addLayers();
    };

    // Esperar a que el mapa esté cargado
    if (!map.isStyleLoaded()) {
      map.once('load', addLayers);
      return;
    }

    addLayers();
    map.on('style.load', handleStyleLoad);

    return () => {
      map.off('style.load', handleStyleLoad);
      removeLayers();
    };
  }, [map]);

  // 👁️ Toggle visibilidad
  useEffect(() => {
    if (!map) return;

    const { fillLayer, lineLayer, labelLayer } = layersRef.current;
    const visibility = visible ? 'visible' : 'none';

    [fillLayer, lineLayer, labelLayer].forEach(layer => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', visibility);
      }
    });

    console.log('👁️ Esequibo layer visibility:', visible);
  }, [map, visible]);

  return null; // Componente no renderiza nada en React
}
