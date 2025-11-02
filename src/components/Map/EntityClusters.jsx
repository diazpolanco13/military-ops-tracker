import { useEffect, useRef } from 'react';
import { useSelection } from '../../stores/SelectionContext';
import { useLock } from '../../stores/LockContext';

/**
 * 🗺️ Sistema de Clustering de Entidades
 * Agrupa marcadores cuando hay zoom out para evitar amontonamiento
 */
export default function EntityClusters({ map, entities, onEntityClick, onPositionChange }) {
  const markersRef = useRef({});
  const { isSelected, selectEntity, addToSelection } = useSelection();
  const { isLocked } = useLock();

  useEffect(() => {
    if (!map || !entities || entities.length === 0) return;

    const sourceId = 'entities-source';
    const clusterLayerId = 'clusters';
    const clusterCountLayerId = 'cluster-count';
    const unclusteredLayerId = 'unclustered-point';

    // Convertir entidades a GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: entities
        .filter(e => e.latitude && e.longitude && e.is_visible !== false)
        .map(entity => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [entity.longitude, entity.latitude]
          },
          properties: {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            class: entity.class,
            status: entity.status,
            speed: entity.speed,
            heading: entity.heading,
          }
        }))
    };

    // Limpiar source anterior si existe
    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(geojson);
      return; // Solo actualizar datos
    }

    // Agregar source con clustering
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 10, // Clustering hasta zoom 10
      clusterRadius: 50 // Radio en píxeles para agrupar
    });

    // 🎨 Layer para anillo exterior (glow effect)
    map.addLayer({
      id: `${clusterLayerId}-glow`,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          'rgba(59, 130, 246, 0.2)', // Azul con transparencia
          5,
          'rgba(245, 158, 11, 0.2)', // Naranja con transparencia
          10,
          'rgba(239, 68, 68, 0.2)'   // Rojo con transparencia
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          28, // Radio exterior base
          5,
          35, // Más grande para 5+
          10,
          42, // Más grande para 10+
          20,
          50  // Extra grande para 20+
        ],
        'circle-opacity': 0.4,
        'circle-blur': 0.8
      }
    });

    // 🎨 Layer principal de clusters (círculos con gradiente)
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#3b82f6', // Azul para 2-4 entidades
          5,
          '#f59e0b', // Naranja para 5-9 entidades
          10,
          '#ef4444', // Rojo para 10-19 entidades
          20,
          '#dc2626'  // Rojo oscuro para 20+ entidades
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          22, // Radio base (2-4)
          5,
          28, // 5-9 entidades
          10,
          34, // 10-19 entidades
          20,
          40  // 20+ entidades
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // 🎨 Layer para borde interior (profesional)
    map.addLayer({
      id: `${clusterLayerId}-inner`,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': 'transparent',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18, // Radio interior base
          5,
          23,
          10,
          28,
          20,
          34
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': [
          'step',
          ['get', 'point_count'],
          'rgba(255, 255, 255, 0.3)',
          5,
          'rgba(255, 255, 255, 0.3)',
          10,
          'rgba(255, 255, 255, 0.3)',
          20,
          'rgba(255, 255, 255, 0.3)'
        ]
      }
    });

    // 🔢 Layer para contar entidades en cluster (texto mejorado)
    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': [
          'step',
          ['get', 'point_count'],
          16, // Tamaño base
          5,
          18, // Más grande para 5+
          10,
          20, // Más grande para 10+
          20,
          22  // Extra grande para 20+
        ]
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0, 0, 0, 0.5)',
        'text-halo-width': 1.5,
        'text-halo-blur': 1
      }
    });

    // Layer para marcadores individuales (sin cluster)
    map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ef4444',
        'circle-radius': 12,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Click en cluster → zoom
    map.on('click', clusterLayerId, (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId]
      });
      const clusterId = features[0].properties.cluster_id;
      map.getSource(sourceId).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom + 1
        });
      });
    });

    // Click en marcador individual → seleccionar entidad
    map.on('click', unclusteredLayerId, (e) => {
      const feature = e.features[0];
      const entityId = feature.properties.id;
      
      // Buscar entidad completa
      const entity = entities.find(e => e.id === entityId);
      if (entity && onEntityClick) {
        onEntityClick(entity);
      }
    });

    // Cursor pointer en clusters y marcadores
    map.on('mouseenter', clusterLayerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', clusterLayerId, () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', unclusteredLayerId, () => {
      map.getCanvas().style.cursor = isLocked ? 'not-allowed' : 'pointer';
    });
    map.on('mouseleave', unclusteredLayerId, () => {
      map.getCanvas().style.cursor = '';
    });

    // Cleanup (importante limpiar todas las capas)
    return () => {
      if (map.getLayer(`${clusterLayerId}-inner`)) map.removeLayer(`${clusterLayerId}-inner`);
      if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
      if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
      if (map.getLayer(`${clusterLayerId}-glow`)) map.removeLayer(`${clusterLayerId}-glow`);
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, entities, isLocked, onEntityClick]);

  return null; // Este componente no renderiza nada en React DOM
}

