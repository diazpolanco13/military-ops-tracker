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
 * ⚡ OPTIMIZADO: Carga instantánea sin delays, mismo patrón que MaritimeBoundariesLayer
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

  // 🗺️ Agregar capa cuando el mapa esté listo (solo depende de map, no de visible)
  useEffect(() => {
    if (!map) return;

    const { source, fillLayer, lineLayer } = layersRef.current;
    let mounted = true;

    const addLayers = () => {
      if (!mounted) return;
      
      // Verificar que el estilo esté cargado
      if (!map.isStyleLoaded()) {
        console.log('⏳ Esequibo: mapa no listo, esperando...');
        // Reintentar después de un pequeño delay
        setTimeout(addLayers, 100);
        return;
      }
      
      // Verificar si ya existe para evitar duplicados
      if (map.getSource(source)) {
        console.log('ℹ️ Esequibo source ya existe');
        return;
      }
      
      console.log('🗺️ Adding Esequibo claim zone layer...');

      try {
        // Agregar source con datos locales (instantáneo)
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
            visibility: 'visible',
          },
          paint: {
            'fill-color': '#f87171', // Rojo claro (igual que Venezuela local)
            'fill-opacity': 0.25,    // Igual que Venezuela local
          },
        });

        // Capa de borde (línea roja)
        map.addLayer({
          id: lineLayer,
          type: 'line',
          source: source,
          layout: {
            visibility: 'visible',
          },
          paint: {
            'line-color': '#f87171', // Rojo claro
            'line-width': 2,
            'line-opacity': 0.7,
          },
        });

        console.log('✅ Esequibo claim zone layers added');

        // 🖱️ Interacción hover
        map.on('mouseenter', fillLayer, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', fillLayer, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (error) {
        console.error('❌ Error agregando capa Esequibo:', error);
      }
    };

    const removeLayers = () => {
      try {
        const { source, fillLayer, lineLayer, labelLayer } = layersRef.current;
        [labelLayer, lineLayer, fillLayer].forEach(layer => {
          if (map.getLayer(layer)) map.removeLayer(layer);
        });
        if (map.getSource(source)) map.removeSource(source);
      } catch (e) {
        // Ignorar errores durante limpieza
      }
    };

    // Manejar cambios de estilo del mapa
    const handleStyleLoad = () => {
      console.log('🗺️ Style loaded, re-adding Esequibo layer');
      addLayers();
    };

    // ⚡ Agregar inmediatamente
    addLayers();
    
    // Escuchar cambios de estilo para re-agregar
    map.on('style.load', handleStyleLoad);

    return () => {
      mounted = false;
      map.off('style.load', handleStyleLoad);
      removeLayers();
    };
  }, [map]); // Solo depende de map, NO de visible

  // 👁️ Toggle visibilidad (sin delay)
  useEffect(() => {
    if (!map) return;
    
    const { fillLayer, lineLayer } = layersRef.current;
    const visibility = visible ? 'visible' : 'none';

    // Actualizar inmediatamente si las capas existen
    [fillLayer, lineLayer].forEach(layer => {
      try {
        if (map.getLayer(layer)) {
          map.setLayoutProperty(layer, 'visibility', visibility);
        }
      } catch (e) {
        // Ignorar errores si la capa no existe aún
      }
    });
    console.log('👁️ Esequibo layer visibility:', visible);
  }, [map, visible]);

  return null; // Componente no renderiza nada en React
}
