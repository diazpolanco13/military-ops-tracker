import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG, MAPBOX_TOKEN } from '../../lib/maplibre';
import { Lock } from 'lucide-react';
import EntityMarker from './EntityMarker';
import MaritimeBoundariesLayer from './MaritimeBoundariesLayer';
import { useEntities } from '../../hooks/useEntities';
import { useUpdateEntity } from '../../hooks/useUpdateEntity';
import { useMaritimeBoundaries } from '../../hooks/useMaritimeBoundaries';
import { useMaritimeSettings } from '../../hooks/useMaritimeSettings';
import { useLock } from '../../stores/LockContext';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import EntityDetailsSidebar from '../Sidebar/EntityDetailsSidebar';
import DeploymentStats from '../Dashboard/DeploymentStats';
import EntityQuickCard from '../Cards/EntityQuickCard';
import EntityDetailedModal from '../Cards/EntityDetailedModal';
import { useSelection } from '../../stores/SelectionContext';
import { supabase } from '../../lib/supabase';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapContainer({ onRefetchNeeded, onTemplateDrop, showPalette, onMapReady }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dragPreview, setDragPreview] = useState(null); // Para mostrar preview al arrastrar
  const [currentZoom, setCurrentZoom] = useState(6);
  const [clusterZoomThreshold, setClusterZoomThreshold] = useState(() => {
    return parseInt(localStorage.getItem('clusterZoomThreshold') || '8');
  });
  const [clusterRadius, setClusterRadius] = useState(() => {
    return parseInt(localStorage.getItem('clusterRadius') || '60');
  });
  const { isLocked } = useLock();
  const { selectEntity } = useSelection();
  
  // 🎴 Estado para vista de entidad: 'sidebar' o 'card'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('entityViewMode') || 'card'; // Default: card futurista
  });
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  // 🌊 Obtener configuración de límites marítimos desde BD
  const { showBoundaries } = useMaritimeBoundariesContext();
  const { settings, loading: loadingMaritime } = useMaritimeSettings();
  
  // 🎯 Memorizar códigos de países visibles (solo recalcular cuando cambien settings)
  const visibleCountryCodes = useMemo(() => {
    if (!settings || loadingMaritime) return [];
    return settings.filter(s => s.is_visible).map(s => s.country_code);
  }, [settings, loadingMaritime]);
  
  // 🎨 Memorizar mapa de colores (solo recalcular cuando cambien settings)
  const colorMap = useMemo(() => {
    if (!settings || loadingMaritime) return {};
    const colors = {};
    settings.forEach(s => {
      colors[s.country_code] = s.color;
    });
    return colors;
  }, [settings, loadingMaritime]);

  // 🌊 Hook para obtener límites marítimos (solo cuando cambien los códigos)
  const { boundaries } = useMaritimeBoundaries(visibleCountryCodes, showBoundaries);

  // 📡 Obtener entidades desde Supabase
  const { entities, loading, error, refetch, addEntity, removeEntity } = useEntities();
  const [templatesCache, setTemplatesCache] = useState({});

  // Cachear plantillas para evitar recargas constantes
  useEffect(() => {
    async function loadTemplates() {
      const useImages = localStorage.getItem('useImages') === 'true';
      if (!useImages || !entities || entities.length === 0) return;

      // Obtener IDs únicos de plantillas
      const templateIds = [...new Set(entities.map(e => e.template_id).filter(Boolean))];
      
      if (templateIds.length === 0) return;

      try {
        const { data } = await supabase
          .from('entity_templates')
          .select('id, icon_url, image_url')
          .in('id', templateIds);

        if (data) {
          const cache = {};
          data.forEach(t => {
            cache[t.id] = t;
          });
          setTemplatesCache(cache);
        }
      } catch (err) {
        console.error('Error caching templates:', err);
      }
    }

    loadTemplates();
  }, [entities]);

  // Exponer funciones al componente padre
  useEffect(() => {
    if (onRefetchNeeded) {
      window.refetchEntities = refetch;
      window.addEntityDirectly = addEntity;
      window.removeEntityDirectly = removeEntity;
    }
  }, [refetch, addEntity, removeEntity, onRefetchNeeded]);

  // Escuchar cambios de configuración
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail.clusterZoomThreshold !== undefined) {
        setClusterZoomThreshold(e.detail.clusterZoomThreshold);
      }
      if (e.detail.clusterRadius !== undefined) {
        setClusterRadius(e.detail.clusterRadius);
      }
      if (e.detail.entityViewMode !== undefined) {
        setViewMode(e.detail.entityViewMode);
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  
  // 🎯 Hook para actualizar posiciones
  const { updatePosition, updating } = useUpdateEntity();

  // Handler para cuando se arrastra una entidad
  const handlePositionChange = async (entityId, newPosition) => {
    try {
      await updatePosition(entityId, newPosition);
      
      // 🔄 Refetch para actualizar clusters
      // Sí, causa un pequeño parpadeo, pero FUNCIONA correctamente
      // Los clusters se actualizan con las posiciones reales
      await refetch();
      
    } catch (err) {
      console.error('❌ Error al mover entidad:', err);
      alert('Error al actualizar posición. Por favor, intenta de nuevo.');
    }
  };

  useEffect(() => {
    // Evitar inicializar el mapa más de una vez
    if (map.current) return;

    // Inicializar el mapa con Mapbox GL JS
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      ...MAP_CONFIG.options,
    });

    // Agregar controles de navegación
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
      }),
      'top-right'
    );

    // Agregar control de escala
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 200,
        unit: 'metric',
      }),
      'bottom-left'
    );

    // Cuando el mapa esté listo
    map.current.on('load', () => {
      setMapLoaded(true);
      // Exponer mapa al componente padre
      if (onMapReady) {
        onMapReady(map.current);
      }
    });

    // 🎯 EVENT HANDLERS PARA DRAG & DROP DE PLANTILLAS
    const mapElement = mapContainer.current;

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      
      // Obtener coordenadas del mapa en la posición del mouse
      if (map.current) {
        const rect = mapElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const lngLat = map.current.unproject([x, y]);
        
        setDragPreview({
          x: e.clientX,
          y: e.clientY,
          lat: lngLat.lat,
          lng: lngLat.lng
        });
      }
    };

    const handleDragLeave = () => {
      setDragPreview(null);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setDragPreview(null);

      try {
        const templateData = JSON.parse(e.dataTransfer.getData('application/json'));
        
        if (templateData && map.current) {
          // Obtener coordenadas exactas donde se soltó
          const rect = mapElement.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const lngLat = map.current.unproject([x, y]);
          
          // Notificar al componente padre
          if (onTemplateDrop) {
            onTemplateDrop(templateData, { lat: lngLat.lat, lng: lngLat.lng });
          }
        }
      } catch (err) {
        console.error('Error al procesar drop:', err);
      }
    };

    // Agregar event listeners
    mapElement.addEventListener('dragover', handleDragOver);
    mapElement.addEventListener('dragleave', handleDragLeave);
    mapElement.addEventListener('drop', handleDrop);

    // Cleanup al desmontar
    return () => {
      // Remover event listeners
      mapElement.removeEventListener('dragover', handleDragOver);
      mapElement.removeEventListener('dragleave', handleDragLeave);
      mapElement.removeEventListener('drop', handleDrop);
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 🗺️ Sistema Híbrido: Clustering en zoom out, Marcadores en zoom in
  useEffect(() => {
    if (!map.current || !mapLoaded || loading || !entities || entities.length === 0) return;

    const sourceId = 'entities-source';
    const clusterLayerId = 'clusters';
    const clusterCountLayerId = 'cluster-count';
    const unclusteredLayerId = 'unclustered-point';

    // Convertir entidades visibles a GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: entities
        .filter(e => e.latitude && e.longitude && e.is_visible !== false)
        .map(entity => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(entity.longitude), parseFloat(entity.latitude)]
          },
          properties: {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            class: entity.class || '',
            status: entity.status || 'activo'
          }
        }))
    };

    // Si el source ya existe, solo actualizar datos
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(geojson);
      return;
    }

    // Agregar source con clustering habilitado (usando configuración)
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: clusterZoomThreshold - 1, // Clustering hasta umbral - 1
      clusterRadius: clusterRadius // Radio configurable
    });

    // Layer para clusters (círculos grandes con gradiente)
    map.current.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#3b82f6', // Azul: 1-4 entidades
          5,
          '#f59e0b', // Naranja: 5-9 entidades
          10,
          '#ef4444'  // Rojo: 10+ entidades
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          25, // Radio base
          5,
          30, // 5-9 entidades
          10,
          35  // 10+ entidades
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Layer para el número de entidades en el cluster
    map.current.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 16
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Layer para marcadores individuales
    map.current.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ef4444',
        'circle-radius': 14,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Click en cluster → hacer zoom
    map.current.on('click', clusterLayerId, (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId]
      });
      
      if (features.length > 0) {
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource(sourceId).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom + 0.5,
            duration: 500
          });
        });
      }
    });

    // Click en marcador individual → abrir sidebar
    map.current.on('click', unclusteredLayerId, (e) => {
      const feature = e.features[0];
      const entityId = feature.properties.id;
      
      // Buscar entidad completa
      const entity = entities.find(e => e.id === entityId);
      if (entity) {
        setSelectedEntity(entity);
        selectEntity(entity.id);
      }
    });

    // Cursores
    map.current.on('mouseenter', clusterLayerId, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', clusterLayerId, () => {
      map.current.getCanvas().style.cursor = '';
    });
    map.current.on('mouseenter', unclusteredLayerId, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', unclusteredLayerId, () => {
      map.current.getCanvas().style.cursor = '';
    });

    // Detectar cambios de zoom y alternar entre clustering y marcadores
    const handleZoomChange = () => {
      const zoom = map.current.getZoom();
      setCurrentZoom(zoom);
      
      // Mostrar/ocultar layers según zoom (usando configuración)
      const showClustering = zoom < clusterZoomThreshold;
      
      if (map.current.getLayer(clusterLayerId)) {
        map.current.setLayoutProperty(clusterLayerId, 'visibility', showClustering ? 'visible' : 'none');
      }
      if (map.current.getLayer(clusterCountLayerId)) {
        map.current.setLayoutProperty(clusterCountLayerId, 'visibility', showClustering ? 'visible' : 'none');
      }
      if (map.current.getLayer(unclusteredLayerId)) {
        map.current.setLayoutProperty(unclusteredLayerId, 'visibility', showClustering ? 'visible' : 'none');
      }
    };
    
    map.current.on('zoom', handleZoomChange);
    handleZoomChange(); // Ejecutar inmediatamente

    // Cleanup
    return () => {
      if (map.current) {
        if (map.current.getLayer(clusterLayerId)) map.current.removeLayer(clusterLayerId);
        if (map.current.getLayer(clusterCountLayerId)) map.current.removeLayer(clusterCountLayerId);
        if (map.current.getLayer(unclusteredLayerId)) map.current.removeLayer(unclusteredLayerId);
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      }
    };
  }, [mapLoaded, entities, loading, selectEntity, clusterZoomThreshold, clusterRadius]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Vista de entidad: Sidebar o Card según configuración */}
      {viewMode === 'sidebar' ? (
        <EntityDetailsSidebar
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          isOpen={!!selectedEntity}
        />
      ) : (
        selectedEntity && (
          <EntityQuickCard
            entity={selectedEntity}
            onClose={() => setSelectedEntity(null)}
            onOpenDetails={() => setShowDetailedModal(true)}
          />
        )
      )}

      {/* Modal de detalles completos (solo con card) */}
      {viewMode === 'card' && showDetailedModal && selectedEntity && (
        <EntityDetailedModal
          entity={selectedEntity}
          onClose={() => setShowDetailedModal(false)}
        />
      )}

      {/* Contenedor del mapa - Empieza después de navbar */}
      <div
        ref={mapContainer}
        className={dragPreview ? 'map-drop-active' : ''}
        style={{
          position: 'absolute',
          top: '56px', // Empieza después de TopNavbar
          left: 0,
          right: 0,
          bottom: 0
        }}
      />

      {/* 🌊 Capa de Límites Marítimos */}
      {mapLoaded && (
        <MaritimeBoundariesLayer
          map={map.current}
          boundaries={boundaries}
          visible={showBoundaries}
          colorMap={colorMap}
        />
      )}

      {/* Selector de estilos de mapa - MOVIDO A TopNavigationBar */}
      {/* {mapLoaded && <MapStyleSelector map={map.current} />} */}

      {/* Marcadores de Entidades (cuando zoom >= umbral) */}
      {mapLoaded && !loading && currentZoom >= clusterZoomThreshold && 
        entities
          .filter(e => e.is_visible !== false)
          .map((entity) => (
            <EntityMarker 
              key={entity.id} 
              entity={entity} 
              template={templatesCache[entity.template_id]}
              map={map.current}
              onPositionChange={handlePositionChange}
              onEntityClick={() => setSelectedEntity(entity)}
            />
          ))
      }

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-military-bg-secondary/90 backdrop-blur-sm text-military-text-primary px-4 py-2 rounded-md shadow-lg">
          🔄 Cargando entidades desde Supabase...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-military-accent-danger/90 backdrop-blur-sm text-white px-4 py-2 rounded-md shadow-lg">
          ❌ Error: {error}
        </div>
      )}

      {/* Indicador de actualización - ELIMINADO (no necesario, la actualización es instantánea) */}

      {/* Preview de coordenadas al arrastrar plantilla */}
      {dragPreview && (
        <div 
          className="fixed pointer-events-none bg-blue-600/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl text-sm font-mono border border-blue-400"
          style={{
            left: dragPreview.x + 20,
            top: dragPreview.y + 20,
            zIndex: 9999 // Por encima de todo
          }}
        >
          📍 {dragPreview.lat.toFixed(4)}°, {dragPreview.lng.toFixed(4)}°
        </div>
      )}

      {/* Indicador de bloqueo */}
      {isLocked && (
        <div className="absolute top-20 right-4 bg-orange-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-md shadow-lg text-sm flex items-center gap-2 animate-pulse">
          <Lock className="w-4 h-4" />
          <span className="font-semibold">Movimiento Bloqueado</span>
        </div>
      )}

      {/* Dashboard de estadísticas (reemplaza contador simple) */}
      {mapLoaded && !loading && <DeploymentStats />}

      {/* Botón de subida de imágenes - ELIMINADO, ahora integrado en plantillas y formularios */}
    </div>
  );
}

