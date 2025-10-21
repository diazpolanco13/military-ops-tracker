import { useEffect, useRef } from 'react';
import { COUNTRY_COLORS } from '../../hooks/useMaritimeBoundaries';

/**
 * 🌊 Capa de Límites Marítimos para Mapbox GL JS
 * 
 * Renderiza límites marítimos (EEZ) como capas de Mapbox con colores por país
 * usando GeoJSON desde Marine Regions API
 * 
 * @param {object} map - Instancia de Mapbox GL JS map
 * @param {object} boundaries - GeoJSON de límites marítimos
 * @param {boolean} visible - Si la capa es visible
 */
export default function MaritimeBoundariesLayer({ map, boundaries, visible = true, colorMap = COUNTRY_COLORS }) {
  const layersRef = useRef({
    source: 'maritime-boundaries',
    fillLayer: 'maritime-boundaries-fill',
    lineLayer: 'maritime-boundaries-line',
  });

  // 🎨 Estilos por país (usando colorMap dinámico desde BD)
  const getLayerStyles = () => {
    const colors = colorMap || COUNTRY_COLORS;
    
    // Crear array de match para Mapbox expression
    const colorMatches = [];
    Object.entries(colors).forEach(([iso3, color]) => {
      colorMatches.push(iso3, color);
    });

    return {
      fill: {
        'fill-color': [
          'match',
          ['get', 'iso_sov1'], // Campo que identifica el país (ISO3)
          ...colorMatches,
          '#64748b' // Gris por defecto
        ],
        'fill-opacity': 0.2,
      },
      line: {
        'line-color': [
          'match',
          ['get', 'iso_sov1'],
          ...colorMatches,
          '#64748b'
        ],
        'line-width': 2,
        'line-opacity': 0.7,
      },
    };
  };

  // 🎨 Escuchar cambios de color
  useEffect(() => {
    const handleColorChange = () => {
      if (!map) return;
      
      const { fillLayer, lineLayer } = layersRef.current;
      const styles = getLayerStyles();
      
      // Actualizar paint properties
      if (map.getLayer(fillLayer)) {
        map.setPaintProperty(fillLayer, 'fill-color', styles.fill['fill-color']);
      }
      if (map.getLayer(lineLayer)) {
        map.setPaintProperty(lineLayer, 'line-color', styles.line['line-color']);
      }
      
      console.log('🎨 Maritime colors updated');
    };

    window.addEventListener('maritimeColorsChanged', handleColorChange);
    return () => window.removeEventListener('maritimeColorsChanged', handleColorChange);
  }, [map]);

  // 🗺️ Agregar/actualizar capa cuando cambien los límites
  useEffect(() => {
    console.log('🌊 MaritimeBoundariesLayer effect:', { 
      hasMap: !!map, 
      hasBoundaries: !!boundaries,
      featuresCount: boundaries?.features?.length,
      visible
    });

    if (!map || !boundaries || !boundaries.features || boundaries.features.length === 0) {
      // Remover capas si no hay boundaries
      console.log('⚠️ No boundaries to display, removing layers');
      removeLayer();
      return;
    }

    const { source, fillLayer, lineLayer } = layersRef.current;

    // 🔄 CRUCIAL: Re-agregar capas cuando el mapa cambia de estilo
    // Mapbox elimina todas las sources/layers al hacer setStyle()
    const handleStyleLoad = () => {
      console.log('🗺️ Style loaded, re-adding maritime layers');
      addLayer();
    };

    // Esperar a que el mapa esté completamente cargado
    if (!map.isStyleLoaded()) {
      map.once('load', addLayer);
      return;
    }

    // Agregar capa inicial
    addLayer();

    // ⚡ IMPORTANTE: Escuchar cambios de estilo de mapa
    map.on('style.load', handleStyleLoad);

    // Cleanup
    return () => {
      map.off('style.load', handleStyleLoad);
    };

    function addLayer() {
      console.log('🗺️ Adding maritime boundaries layer...', {
        sourceId: source,
        featuresCount: boundaries.features.length
      });

      // Remover capas existentes primero
      if (map.getLayer(fillLayer)) map.removeLayer(fillLayer);
      if (map.getLayer(lineLayer)) map.removeLayer(lineLayer);
      if (map.getSource(source)) map.removeSource(source);

      // Agregar source
      map.addSource(source, {
        type: 'geojson',
        data: boundaries,
      });

      console.log('✅ Source added:', source);

      const styles = getLayerStyles();

      // Agregar capa de relleno (polígonos)
      map.addLayer({
        id: fillLayer,
        type: 'fill',
        source: source,
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        paint: styles.fill,
      });

      // Agregar capa de líneas (bordes)
      map.addLayer({
        id: lineLayer,
        type: 'line',
        source: source,
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        paint: styles.line,
      });

      console.log('✅ Layers added:', { fillLayer, lineLayer, visible });

      // 🖱️ Agregar interacción al hacer hover
      map.on('mouseenter', fillLayer, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          const countryColor = COUNTRY_COLORS[props.iso_sov1] || '#64748b';
          
          console.log('🖱️ Hover on maritime boundary:', {
            country: props.geoname || props.territory,
            iso3: props.iso_sov1,
            color: countryColor,
            area: props.area_km2
          });
        }
      });

      map.on('mouseleave', fillLayer, () => {
        map.getCanvas().style.cursor = '';
      });
    }

    function removeLayer() {
      const { source, fillLayer, lineLayer } = layersRef.current;
      
      if (map && map.getLayer(fillLayer)) {
        map.removeLayer(fillLayer);
      }
      if (map && map.getLayer(lineLayer)) {
        map.removeLayer(lineLayer);
      }
      if (map && map.getSource(source)) {
        map.removeSource(source);
      }
    }

    // Cleanup: remover layers y event listeners
    return () => {
      map.off('style.load', handleStyleLoad);
      removeLayer();
    };
  }, [map, boundaries, colorMap]);

  // 👁️ Toggle visibilidad cuando cambia el prop
  useEffect(() => {
    if (!map) return;

    const { fillLayer, lineLayer } = layersRef.current;

    if (map.getLayer(fillLayer)) {
      map.setLayoutProperty(fillLayer, 'visibility', visible ? 'visible' : 'none');
    }
    if (map.getLayer(lineLayer)) {
      map.setLayoutProperty(lineLayer, 'visibility', visible ? 'visible' : 'none');
    }
  }, [map, visible]);

  return null; // Este componente no renderiza nada en React
}

