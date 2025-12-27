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
    let mounted = true;

    const addLayers = () => {
      if (!mounted) return;
      
      // Verificar nuevamente que el estilo esté cargado
      if (!map.isStyleLoaded()) {
        console.log('⏳ Esequibo: Esperando estilo del mapa...');
        return;
      }
      
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
          'fill-opacity': 0.2,     // Igual que los límites marítimos
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
      
      try {
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
      // Pequeño delay para asegurar que el estilo está completamente listo
      setTimeout(addLayers, 50);
    };

    // 🔧 FIX: Usar idle como respaldo para asegurar que el mapa está listo
    const handleIdle = () => {
      if (!map.getSource(source)) {
        addLayers();
      }
    };

    // Intentar agregar inmediatamente si el estilo está cargado
    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      // Si no, esperar al evento load
      map.once('load', addLayers);
    }
    
    // 🔧 FIX: También escuchar idle como respaldo
    map.once('idle', handleIdle);
    map.on('style.load', handleStyleLoad);

    return () => {
      mounted = false;
      map.off('style.load', handleStyleLoad);
      map.off('idle', handleIdle);
      removeLayers();
    };
  }, [map, visible]);

  // 👁️ Toggle visibilidad (efecto separado para cambios de visible sin recrear capas)
  useEffect(() => {
    if (!map) return;
    
    // Solo actualizar visibilidad si las capas existen
    const { fillLayer, lineLayer, labelLayer } = layersRef.current;
    const visibility = visible ? 'visible' : 'none';

    // Pequeño delay para asegurar que las capas se han creado
    const updateVisibility = () => {
      [fillLayer, lineLayer, labelLayer].forEach(layer => {
        try {
          if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'visibility', visibility);
          }
        } catch (e) {
          // Ignorar errores si la capa no existe aún
        }
      });
      console.log('👁️ Esequibo layer visibility:', visible);
    };

    // Ejecutar después de un frame para asegurar sincronización
    requestAnimationFrame(updateVisibility);
  }, [map, visible]);

  return null; // Componente no renderiza nada en React
}
