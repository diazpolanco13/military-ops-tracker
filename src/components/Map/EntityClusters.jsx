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

    // Layer para clusters (círculos con número)
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#3b82f6', // Azul para pocos
          5,
          '#f59e0b', // Naranja para medio
          10,
          '#ef4444'  // Rojo para muchos
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // Radio base
          5,
          25, // Más grande para 5+
          10,
          30  // Más grande para 10+
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Layer para contar entidades en cluster
    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
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

    // Cleanup
    return () => {
      if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
      if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, entities, isLocked, onEntityClick]);

  return null; // Este componente no renderiza nada en React DOM
}

