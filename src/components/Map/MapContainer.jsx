import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG, MAPBOX_TOKEN } from '../../lib/maplibre';
import EntityMarker from './EntityMarker';
import MaritimeBoundariesLayer from './MaritimeBoundariesLayer';
import EsequiboClaimLayer from './EsequiboClaimLayer';
import EsequiboPolygonEditor from './EsequiboPolygonEditor';
import { useEntities } from '../../hooks/useEntities';
import { useUpdateEntity } from '../../hooks/useUpdateEntity';
import { useMaritimeBoundariesLocal } from '../../hooks/useMaritimeBoundariesLocal';
import { useMaritimeSettings } from '../../hooks/useMaritimeSettings';
import { useLock } from '../../stores/LockContext';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import DeploymentStats from '../Dashboard/DeploymentStats';
import EntityQuickCard from '../Cards/EntityQuickCard';
import EntityDetailedModal from '../Cards/EntityDetailedModal';
import { useSelection } from '../../stores/SelectionContext';
import { useDrawingTools } from '../../stores/DrawingToolsContext';
import { supabase } from '../../lib/supabase';
import { toggleWeatherLayer, getActiveWeatherLayers } from '../Weather/WeatherLayers';
// Nota: `useFlightRadar` se usa como fallback si no se inyecta `flightRadar` desde App.
import { useFlightRadar } from '../../hooks/useFlightRadar';
import FlightLayer from '../FlightRadar/FlightLayer';
// FlightMarker removido - todos los vuelos ahora usan FlightLayer (Mapbox nativo)
import FlightTrailLayer from '../FlightRadar/FlightTrailLayer';
import FlightRadarPanel from '../FlightRadar/FlightRadarPanel';
import FlightDetailsPanel from '../FlightRadar/FlightDetailsPanel';
import FlightRadarBottomBar from '../FlightRadar/FlightRadarBottomBar';

// Sistema híbrido de helicópteros REMOVIDO - todos usan FlightLayer (Mapbox nativo)
// FlightRadar service ahora usado desde el hook

// 📊 Analytics - Panel de estadísticas de incursiones
import IncursionStatsPanel from '../Analytics/IncursionStatsPanel';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapContainer({ 
  onRefetchNeeded, 
  onTemplateDrop, 
  showPalette, 
  onMapReady, 
  onViewTimeline,
  timelineVisible = false,
  onToggleTimeline,
  calendarVisible = false,
  onToggleCalendar,
  // FlightRadar deduplicado (hoisted en App)
  flightRadar = null,
  isFlightRadarEnabled: isFlightRadarEnabledProp,
  setIsFlightRadarEnabled: setIsFlightRadarEnabledProp,
}) {
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
  const { isDrawingToolActive } = useDrawingTools(); // 🔒 Detectar herramientas activas
  
  // 🎴 Vista de entidad: siempre card futurista
  const viewMode = 'card'; // Siempre card futurista
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  // ✈️ FlightRadar24 Integration
  const [showFlightRadarPanel, setShowFlightRadarPanel] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const isFlightRadarEnabled = isFlightRadarEnabledProp ?? true;
  const setIsFlightRadarEnabled = setIsFlightRadarEnabledProp ?? (() => {});
  
  // 📊 Panel de estadísticas de incursiones
  const [showIncursionStats, setShowIncursionStats] = useState(false);
  // ✅ Preferir instancia deduplicada desde App; fallback al hook local si no se pasa.
  const flightRadarInternal = useFlightRadar({
    autoUpdate: true,
    updateInterval: 30000, // 30 segundos
    enabled: isFlightRadarEnabled,
    militaryOnly: false,
  });
  const {
    flights,
    loading: flightsLoading,
    error: flightsError,
    isActive: flightsActive,
    lastUpdate: flightsLastUpdate,
    startTracking: startFlightTracking,
    pauseTracking: pauseFlightTracking,
    refetch: refetchFlights,
    categoryFilters,
    setFilters,
    totalFlights,
  } = flightRadar || flightRadarInternal;

  // Alias para compatibilidad con FlightRadarBottomBar
  const flightFilters = categoryFilters;
  const setFlightFilters = setFilters;

  // Memoizar vuelos con categoría y aplicar filtros
  // Los vuelos ya vienen filtrados desde el hook
  // Solo limitamos a 100 para performance
  const flightsWithCategory = useMemo(() => {
    // El hook ya filtra por categoryFilters, solo limitamos
    const limited = flights.slice(0, 100);
    console.log(`✅ FlightRadar: ${flights.length} vuelos filtrados, mostrando ${limited.length}`);
    return limited;
  }, [flights]);

  // 🖼️ Estado para usar imágenes de plantillas
  const [useImages, setUseImages] = useState(() => {
    return localStorage.getItem('useImages') === 'true';
  });

  // 🚢 Estado para ocultar/mostrar embarcaciones
  const [shipsVisible, setShipsVisible] = useState(() => {
    return localStorage.getItem('shipsVisible') !== 'false';
  });

  // ✈️ Estado para ocultar/mostrar aeronaves
  const [aircraftVisible, setAircraftVisible] = useState(() => {
    return localStorage.getItem('aircraftVisible') !== 'false';
  });

  // 👥 Estado para ocultar/mostrar tropas
  const [troopsVisible, setTroopsVisible] = useState(() => {
    return localStorage.getItem('troopsVisible') !== 'false';
  });

  // 🚙 Estado para ocultar/mostrar vehículos
  const [vehiclesVisible, setVehiclesVisible] = useState(() => {
    return localStorage.getItem('vehiclesVisible') !== 'false';
  });

  // 📍 Estado para ocultar/mostrar lugares (bases, aeropuertos, instalaciones)
  const [placesVisible, setPlacesVisible] = useState(() => {
    return localStorage.getItem('placesVisible') !== 'false';
  });

  // 🌊 Obtener configuración de límites marítimos desde BD
  // 🗺️ Estados de visibilidad de límites (marítimos, terrestres, Esequibo)
  const { 
    showMaritime, 
    showTerrestrial, 
    showEsequiboClaim, 
    isEsequiboEditing, 
    toggleEsequiboEditing 
  } = useMaritimeBoundariesContext();
  
  // Compatibilidad: showBoundaries es true si cualquiera está activo
  const showBoundaries = showMaritime || showTerrestrial;
  const { settings, loading: loadingMaritime, updateTrigger, refetch: refetchSettings } = useMaritimeSettings();

  // Escuchar cambios en maritime settings para refrescar
  useEffect(() => {
    const handleSettingsChange = (e) => {
      console.log('🔔 Maritime settings changed event:', e.detail);
      refetchSettings(); // Forzar refetch
    };

    window.addEventListener('maritimeSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('maritimeSettingsChanged', handleSettingsChange);
  }, [refetchSettings]);

  // 🚢 Escuchar evento para toggle de embarcaciones
  useEffect(() => {
    const handleToggleShips = (e) => {
      console.log('🚢 Toggle ships visibility:', e.detail);
      setShipsVisible(e.detail.visible);
    };

    window.addEventListener('toggleShipsVisibility', handleToggleShips);
    return () => window.removeEventListener('toggleShipsVisibility', handleToggleShips);
  }, []);

  // ✈️ Escuchar evento para toggle de aeronaves
  useEffect(() => {
    const handleToggleAircraft = (e) => {
      console.log('✈️ Toggle aircraft visibility:', e.detail);
      setAircraftVisible(e.detail.visible);
    };

    window.addEventListener('toggleAircraftVisibility', handleToggleAircraft);
    return () => window.removeEventListener('toggleAircraftVisibility', handleToggleAircraft);
  }, []);

  // 👥 Escuchar evento para toggle de tropas
  useEffect(() => {
    const handleToggleTroops = (e) => {
      console.log('👥 Toggle troops visibility:', e.detail);
      setTroopsVisible(e.detail.visible);
    };

    window.addEventListener('toggleTroopsVisibility', handleToggleTroops);
    return () => window.removeEventListener('toggleTroopsVisibility', handleToggleTroops);
  }, []);

  // 🚙 Escuchar evento para toggle de vehículos
  useEffect(() => {
    const handleToggleVehicles = (e) => {
      console.log('🚙 Toggle vehicles visibility:', e.detail);
      setVehiclesVisible(e.detail.visible);
    };

    window.addEventListener('toggleVehiclesVisibility', handleToggleVehicles);
    return () => window.removeEventListener('toggleVehiclesVisibility', handleToggleVehicles);
  }, []);

  // 📍 Escuchar evento para toggle de lugares
  useEffect(() => {
    const handleTogglePlaces = (e) => {
      console.log('📍 Toggle places visibility:', e.detail);
      setPlacesVisible(e.detail.visible);
    };

    window.addEventListener('togglePlacesVisibility', handleTogglePlaces);
    return () => window.removeEventListener('togglePlacesVisibility', handleTogglePlaces);
  }, []);
  
  // 🎯 Memorizar códigos de países visibles (recalcular cuando cambien settings o updateTrigger)
  // ⚡ MEJORA: Ya no depende de loadingMaritime porque settings tiene defaults locales
  const visibleCountryCodes = useMemo(() => {
    if (!settings || settings.length === 0) return [];
    const codes = settings.filter(s => s.is_visible).map(s => s.country_code);
    console.log('🗺️ Países visibles solicitados:', {
      total: codes.length,
      codes: codes,
      updateTrigger: updateTrigger,
      fromDefaults: loadingMaritime ? '(defaults)' : '(Supabase)'
    });
    return codes;
  }, [settings, updateTrigger, loadingMaritime]);
  
  // 🎨 Memorizar mapa de colores (recalcular cuando cambien settings o updateTrigger)
  const colorMap = useMemo(() => {
    if (!settings || settings.length === 0) return {};
    const colors = {};
    settings.forEach(s => {
      colors[s.country_code] = s.color;
    });
    return colors;
  }, [settings, updateTrigger]);

  // 🎨 Memorizar mapa de opacidades
  const opacityMap = useMemo(() => {
    if (!settings || settings.length === 0) return {};
    const opacities = {};
    settings.forEach(s => {
      opacities[s.country_code] = s.opacity || 0.2;
    });
    return opacities;
  }, [settings, updateTrigger]);

  // 🌊 Hook para obtener límites desde archivos LOCALES (INSTANTÁNEO)
  const { boundaries, loading: boundariesLoading, cacheHit } = useMaritimeBoundariesLocal(
    visibleCountryCodes, 
    showBoundaries,
    { includeMaritime: showMaritime, includeTerrestrial: showTerrestrial }
  );
  
  // Log de rendimiento del caché
  useEffect(() => {
    if (boundaries && cacheHit) {
      console.log('⚡ CACHE HIT - Límites marítimos cargados desde Supabase (instantáneo)');
    }
  }, [boundaries, cacheHit]);

  // 📡 Obtener entidades desde Supabase
  const { entities, loading, error, refetch, addEntity, removeEntity } = useEntities();
  const [templatesCache, setTemplatesCache] = useState({});
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Cachear plantillas para evitar recargas constantes
  useEffect(() => {
    async function loadTemplates() {
      setTemplatesLoaded(false); // Marcar como cargando
      
      // Si useImages está desactivado, limpiar el caché
      if (!useImages) {
        setTemplatesCache({});
        setTemplatesLoaded(true); // Sin templates = loaded
        return;
      }
      
      if (!entities || entities.length === 0) {
        setTemplatesLoaded(true);
        return;
      }

      // Obtener IDs únicos de plantillas
      const templateIds = [...new Set(entities.map(e => e.template_id).filter(Boolean))];
      
      if (templateIds.length === 0) {
        setTemplatesLoaded(true);
        return;
      }

      try {
        const { data } = await supabase
          .from('entity_templates')
          .select('id, name, code, sub_type, icon_url, image_url')  // ✅ INCLUIR sub_type
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
      } finally {
        setTemplatesLoaded(true); // ✅ Marcar como cargado
      }
    }

    loadTemplates();
  }, [entities, useImages]); // ✅ Agregado useImages como dependencia

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
      // entityViewMode siempre es 'card', no necesita actualización
      // ✅ NUEVO: Escuchar cambios en useImages
      if (e.detail.useImages !== undefined) {
        console.log('🔄 Cambio detectado en useImages:', e.detail.useImages);
        setUseImages(e.detail.useImages);
      }
      
      // 🌦️ NUEVO: Actualizar capas de clima
      if (e.detail.weatherLayers !== undefined && map.current) {
        console.log('🌦️ Actualizando capas de clima:', e.detail.weatherLayers);
        Object.keys(e.detail.weatherLayers).forEach(layerType => {
          toggleWeatherLayer(map.current, layerType, e.detail.weatherLayers[layerType]);
        });
      }

      // 🎥 NUEVO: Actualizar pitch y bearing
      if (e.detail.mapPitch !== undefined && map.current) {
        map.current.setPitch(e.detail.mapPitch);
      }
      if (e.detail.mapBearing !== undefined && map.current) {
        map.current.setBearing(e.detail.mapBearing);
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

    // 🔒 DESHABILITAR ROTACIÓN E INCLINACIÓN (estilo FlightRadar24 - mapa estático)
    map.current.dragRotate.disable(); // No rotar con click derecho
    map.current.touchZoomRotate.disableRotation(); // No rotar en touch
    map.current.touchPitch.disable(); // No inclinar en touch
    map.current.keyboard.disableRotation(); // No rotar con teclado

    // Agregar controles de navegación (sin pitch)
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false, // Ocultar control de inclinación
        showCompass: false,    // Ocultar brújula (no hay rotación)
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
      
      // 🌦️ Cargar capas de clima activas desde localStorage
      // ⚠️ SOLO cargar si están explícitamente activadas
      const activeWeatherLayers = getActiveWeatherLayers();
      console.log('🌦️ Capas de clima guardadas:', activeWeatherLayers);
      
      Object.keys(activeWeatherLayers).forEach(layerType => {
        if (activeWeatherLayers[layerType] === true) {
          console.log(`🌦️ Cargando capa: ${layerType}`);
          toggleWeatherLayer(map.current, layerType, true);
        }
      });
      
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
        .filter(e => {
          // Validar coordenadas y visibilidad
          if (!e.latitude || !e.longitude || e.is_visible === false) return false;
          
          // 🚢 Filtrar embarcaciones si están ocultas
          if (!shipsVisible) {
            const shipTypes = ['destructor', 'fragata', 'portaaviones', 'anfibio', 'submarino', 'patrullero'];
            if (shipTypes.includes(e.type)) return false;
          }

          // ✈️ Filtrar aeronaves si están ocultas
          if (!aircraftVisible) {
            const aircraftTypes = ['avion', 'caza', 'helicoptero', 'drone'];
            if (aircraftTypes.includes(e.type)) return false;
          }

          // 👥 Filtrar tropas si están ocultas
          if (!troopsVisible) {
            const troopTypes = ['tropas', 'insurgente'];
            if (troopTypes.includes(e.type)) return false;
          }

          // 🚙 Filtrar vehículos si están ocultos
          if (!vehiclesVisible) {
            const vehicleTypes = ['vehiculo', 'tanque'];
            if (vehicleTypes.includes(e.type)) return false;
          }

          // 📍 Filtrar lugares si están ocultos
          if (!placesVisible) {
            if (e.type === 'lugar') return false;
          }
          
          return true;
        })
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

    // 🎨 Layer principal de clusters (estático, sin animación)
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
          '#ef4444', // Rojo: 10-19 entidades
          20,
          '#dc2626'  // Rojo oscuro: 20+ entidades
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          25, // Radio base
          5,
          30, // 5-9 entidades
          10,
          35, // 10-19 entidades
          20,
          42  // 20+ entidades
        ],
        'circle-opacity': 0.85 // Semi-transparente
      }
    });

    // 🔢 Layer para el número de entidades en el cluster (mejorado)
    map.current.addLayer({
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
        'text-halo-color': 'rgba(0, 0, 0, 0.7)',
        'text-halo-width': 2,
        'text-halo-blur': 1
      }
    });

    // Layer para marcadores individuales (sin borde blanco)
    map.current.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ef4444',
        'circle-radius': 14,
        'circle-opacity': 0.95
        // ❌ Sin borde blanco para diseño limpio
      }
    });

    // Click en cluster → hacer zoom
    map.current.on('click', clusterLayerId, (e) => {
      // 🔒 Bloquear si hay herramienta de dibujo activa
      if (isDrawingToolActive) return;
      
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

    // Click en marcador individual → abrir card futurista
    map.current.on('click', unclusteredLayerId, (e) => {
      // 🔒 Bloquear si hay herramienta de dibujo activa
      if (isDrawingToolActive) return;
      
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
        if (map.current.getLayer(clusterCountLayerId)) map.current.removeLayer(clusterCountLayerId);
        if (map.current.getLayer(clusterLayerId)) map.current.removeLayer(clusterLayerId);
        if (map.current.getLayer(unclusteredLayerId)) map.current.removeLayer(unclusteredLayerId);
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      }
    };
  }, [mapLoaded, entities, loading, selectEntity, clusterZoomThreshold, clusterRadius, isDrawingToolActive, shipsVisible, aircraftVisible, troopsVisible, vehiclesVisible, placesVisible]);

  return (
    <div id="main-map-container" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Vista de entidad: Card Futurista */}
      {selectedEntity && (
        <EntityQuickCard
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          onOpenDetails={() => setShowDetailedModal(true)}
          onViewTimeline={onViewTimeline}
        />
      )}

      {/* Modal de detalles completos */}
      {showDetailedModal && selectedEntity && (
        <EntityDetailedModal
          entity={selectedEntity}
          onClose={() => setShowDetailedModal(false)}
        />
      )}

      {/* Contenedor del mapa - Empieza después de navbar */}
      <div
        id="mapbox-container"
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
          opacityMap={opacityMap}
        />
      )}

      {/* 🗺️ Capa de Zona en Reclamación - Guayana Esequiba */}
      {mapLoaded && !isEsequiboEditing && (
        <EsequiboClaimLayer
          map={map.current}
          visible={showEsequiboClaim}
        />
      )}

      {/* ✏️ Editor de Polígono del Esequibo (modo edición manual) */}
      {mapLoaded && isEsequiboEditing && (
        <EsequiboPolygonEditor
          map={map.current}
          visible={isEsequiboEditing}
          onClose={toggleEsequiboEditing}
        />
      )}

      {/* Selector de estilos de mapa - MOVIDO A TopNavigationBar */}
      {/* {mapLoaded && <MapStyleSelector map={map.current} />} */}

      {/* Marcadores de Entidades (cuando zoom >= umbral) */}
      {mapLoaded && !loading && templatesLoaded && currentZoom >= clusterZoomThreshold && 
        entities
          .filter(e => {
            // Filtrar entidades ocultas
            if (e.is_visible === false) return false;
            
            // 🚢 Filtrar embarcaciones si están ocultas
            if (!shipsVisible) {
              const shipTypes = ['destructor', 'fragata', 'portaaviones', 'anfibio', 'submarino', 'patrullero'];
              if (shipTypes.includes(e.type)) return false;
            }

            // ✈️ Filtrar aeronaves si están ocultas
            if (!aircraftVisible) {
              const aircraftTypes = ['avion', 'caza', 'helicoptero', 'drone'];
              if (aircraftTypes.includes(e.type)) return false;
            }

            // 👥 Filtrar tropas si están ocultas
            if (!troopsVisible) {
              const troopTypes = ['tropas', 'insurgente'];
              if (troopTypes.includes(e.type)) return false;
            }

            // 🚙 Filtrar vehículos si están ocultos
            if (!vehiclesVisible) {
              const vehicleTypes = ['vehiculo', 'tanque'];
              if (vehicleTypes.includes(e.type)) return false;
            }

            // 📍 Filtrar lugares si están ocultos
            if (!placesVisible) {
              if (e.type === 'lugar') return false;
            }
            
            return true;
          })
          .map((entity) => {
            // ⚠️ CRÍTICO: Incluir template_id en la key para forzar recreación cuando cambia
            const template = templatesCache[entity.template_id];
            const markerKey = `${entity.id}-${entity.template_id || 'no-template'}-${template?.sub_type || ''}`;
            
            return (
              <EntityMarker 
                key={markerKey} 
                entity={entity} 
                template={template}
                map={map.current}
                onPositionChange={handlePositionChange}
                onEntityClick={() => setSelectedEntity(entity)}
              />
            );
          })
      }

      {/* ✈️ VUELOS EN TIEMPO REAL - FlightRadar24 (Mapbox nativo) */}
      {mapLoaded && isFlightRadarEnabled && (
        <>
          {/* Capa nativa Mapbox para TODOS los vuelos (performante, posición correcta) */}
          <FlightLayer
            map={map.current}
            flights={flightsWithCategory}
            selectedFlight={selectedFlight}
            onFlightClick={setSelectedFlight}
          />
          
          {/* Capa de trayectoria del vuelo seleccionado (se inserta debajo de flights) */}
          <FlightTrailLayer
            map={map.current}
            selectedFlight={selectedFlight}
            showTrail={true}
          />
        </>
      )}

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

      {/* Dashboard de estadísticas (reemplaza contador simple) */}
      {mapLoaded && !loading && <DeploymentStats />}

      {/* ✈️ Panel de FlightRadar24 */}
      {showFlightRadarPanel && (
        <FlightRadarPanel
          flights={flightsWithCategory}
          loading={flightsLoading}
          error={flightsError}
          isActive={flightsActive}
          lastUpdate={flightsLastUpdate}
          onStart={startFlightTracking}
          onPause={pauseFlightTracking}
          onRefresh={refetchFlights}
          onFlightClick={(flight) => {
            setSelectedFlight(flight);
            // Centrar mapa en el vuelo (zoom reducido para vista amplia)
            if (map.current) {
              map.current.easeTo({
                center: [flight.longitude, flight.latitude],
                zoom: 7, // Zoom más alejado para ver contexto
                duration: 1000, // Transición más rápida
                essential: true
              });
            }
            // NO cerrar el sidebar - mantener ambos paneles abiertos
          }}
          onClose={() => setShowFlightRadarPanel(false)}
        />
      )}

      {/* Panel de detalles de vuelo seleccionado */}
      {selectedFlight && (
        <FlightDetailsPanel
          flight={flightsWithCategory.find(f => f.id === selectedFlight?.id) || selectedFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}

      {/* Botón azul eliminado - funcionalidad integrada en el contador circular */}

      {/* Barra inferior estilo FlightRadar24 */}
      <FlightRadarBottomBar
        activeFilters={flightFilters}
        onFilterChange={setFlightFilters}
        flightCount={flightsWithCategory.length}
        isFlightRadarEnabled={isFlightRadarEnabled}
        onToggleFlightRadar={() => setIsFlightRadarEnabled(!isFlightRadarEnabled)}
        updateInterval={30000}
        onOpenPanel={() => setShowFlightRadarPanel(true)}
        isPanelOpen={showFlightRadarPanel}
        onOpenStats={() => setShowIncursionStats(true)}
        timelineVisible={timelineVisible}
        onToggleTimeline={onToggleTimeline}
        calendarVisible={calendarVisible}
        onToggleCalendar={onToggleCalendar}
      />

      {/* 📊 Panel de estadísticas de incursiones */}
      <IncursionStatsPanel
        isOpen={showIncursionStats}
        onClose={() => setShowIncursionStats(false)}
      />

      {/* Botón de subida de imágenes - ELIMINADO, ahora integrado en plantillas y formularios */}
    </div>
  );
}

