import { useEffect, useRef } from 'react';

/**
 * 🌊 Capa de Límites Marítimos para Mapbox GL JS
 * 
 * Renderiza límites marítimos (EEZ, Territorial, Contiguous) como capas de Mapbox
 * usando GeoJSON desde la API de ArcGIS
 * 
 * @param {object} map - Instancia de Mapbox GL JS map
 * @param {object} boundaries - GeoJSON de límites marítimos
 * @param {boolean} visible - Si la capa es visible
 */
export default function MaritimeBoundariesLayer({ map, boundaries, visible = true }) {
  const layersRef = useRef({
    source: 'maritime-boundaries',
    fillLayer: 'maritime-boundaries-fill',
    lineLayer: 'maritime-boundaries-line',
  });

  // 🎨 Estilos por tipo de límite (según campo en GeoJSON)
  const getLayerStyles = () => ({
    fill: {
      'fill-color': [
        'match',
        ['get', 'BOUNDARY_TYPE'], // Campo que identifica el tipo
        'EEZ', '#3b82f6',          // Azul para EEZ
        'Territorial', '#ef4444',  // Rojo para Territorial
        'Contiguous', '#f59e0b',   // Naranja para Contiguous
        '#10b981' // Verde por defecto
      ],
      'fill-opacity': 0.15,
    },
    line: {
      'line-color': [
        'match',
        ['get', 'BOUNDARY_TYPE'],
        'EEZ', '#3b82f6',
        'Territorial', '#ef4444',
        'Contiguous', '#f59e0b',
        '#10b981'
      ],
      'line-width': 2,
      'line-opacity': 0.6,
    },
  });

  // 🗺️ Agregar/actualizar capa cuando cambien los límites
  useEffect(() => {
    if (!map || !boundaries || !boundaries.features || boundaries.features.length === 0) {
      // Remover capas si no hay boundaries
      removeLayer();
      return;
    }

    const { source, fillLayer, lineLayer } = layersRef.current;

    // Esperar a que el mapa esté completamente cargado
    if (!map.isStyleLoaded()) {
      map.once('load', addLayer);
      return;
    }

    addLayer();

    function addLayer() {
      // Remover capas existentes primero
      if (map.getLayer(fillLayer)) map.removeLayer(fillLayer);
      if (map.getLayer(lineLayer)) map.removeLayer(lineLayer);
      if (map.getSource(source)) map.removeSource(source);

      // Agregar source
      map.addSource(source, {
        type: 'geojson',
        data: boundaries,
      });

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

      // 🖱️ Agregar popup al hacer hover
      map.on('mouseenter', fillLayer, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          
          // Crear popup con info del límite
          const popupContent = `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1e293b;">
                ${props.TERRITORY || props.COUNTRY || 'Límite Marítimo'}
              </h3>
              <div style="font-size: 12px; color: #475569;">
                <div><strong>Tipo:</strong> ${props.BOUNDARY_TYPE || 'N/A'}</div>
                ${props.ISO_SOV1 ? `<div><strong>País:</strong> ${props.ISO_SOV1}</div>` : ''}
                ${props.AREA_KM2 ? `<div><strong>Área:</strong> ${Number(props.AREA_KM2).toLocaleString()} km²</div>` : ''}
              </div>
            </div>
          `;

          // Mostrar popup (opcional, comentado por performance)
          // new mapboxgl.Popup()
          //   .setLngLat(e.lngLat)
          //   .setHTML(popupContent)
          //   .addTo(map);
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

    // Cleanup
    return () => {
      removeLayer();
    };
  }, [map, boundaries]);

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

