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

    // 💓 NUEVO: Anillo de latido exterior (animado)
    const pulseLayerId = `${clusterLayerId}-pulse`;
    map.addLayer({
      id: pulseLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          'rgba(59, 130, 246, 0)', // Azul transparente
          5,
          'rgba(245, 158, 11, 0)', // Naranja transparente
          10,
          'rgba(239, 68, 68, 0)',  // Rojo transparente
          20,
          'rgba(220, 38, 38, 0)'   // Rojo oscuro transparente
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          22, // Mismo tamaño que el círculo principal
          5,
          28,
          10,
          34,
          20,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': [
          'step',
          ['get', 'point_count'],
          '#3b82f6',
          5,
          '#f59e0b',
          10,
          '#ef4444',
          20,
          '#dc2626'
        ],
        'circle-stroke-opacity': 0.6
      }
    });

    // 🎨 Layer principal de clusters (círculos sólidos)
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
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
        'circle-opacity': 0.95
      }
    });

    // 💓 Animación de latido (pulse effect)
    let pulseRadius = 0;
    let pulseOpacity = 0.6;
    let growing = true;

    const animatePulse = () => {
      if (!map.getLayer(pulseLayerId)) return;

      // Animación suave de crecimiento/reducción
      if (growing) {
        pulseRadius += 0.3;
        pulseOpacity -= 0.01;
        if (pulseRadius >= 8) { // Máximo crecimiento: +8px
          growing = false;
        }
      } else {
        pulseRadius -= 0.3;
        pulseOpacity += 0.01;
        if (pulseRadius <= 0) { // Volver al tamaño original
          growing = true;
          pulseOpacity = 0.6;
        }
      }

      // Aplicar la animación
      map.setPaintProperty(pulseLayerId, 'circle-radius', [
        'step',
        ['get', 'point_count'],
        22 + pulseRadius,
        5,
        28 + pulseRadius,
        10,
        34 + pulseRadius,
        20,
        40 + pulseRadius
      ]);

      map.setPaintProperty(pulseLayerId, 'circle-stroke-opacity', pulseOpacity);

      requestAnimationFrame(animatePulse);
    };

    // Iniciar animación
    animatePulse();

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
      if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
      if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
      if (map.getLayer(pulseLayerId)) map.removeLayer(pulseLayerId);
      if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, entities, isLocked, onEntityClick]);

  return null; // Este componente no renderiza nada en React DOM
}

