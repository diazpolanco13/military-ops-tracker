import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG, MAPBOX_TOKEN } from '../../lib/maplibre';
import MapStyleSelector from './MapStyleSelector';
import EntityMarker from './EntityMarker';
import { useEntities } from '../../hooks/useEntities';
import { useUpdateEntity } from '../../hooks/useUpdateEntity';
import ImageUploadDemo from '../ImageUploadDemo';
import EntityDetailsSidebar from '../Sidebar/EntityDetailsSidebar';
import NavigationBar from '../Sidebar/NavigationBar';
import { Upload } from 'lucide-react';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapContainer({ onRefetchNeeded, onTemplateDrop }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dragPreview, setDragPreview] = useState(null); // Para mostrar preview al arrastrar

  // 📡 Obtener entidades desde Supabase con función de refetch
  const { entities, loading, error, refetch, addEntity, removeEntity } = useEntities();

  // Exponer funciones al componente padre
  useEffect(() => {
    if (onRefetchNeeded) {
      window.refetchEntities = refetch;
      window.addEntityDirectly = addEntity;
      window.removeEntityDirectly = removeEntity;
    }
  }, [refetch, addEntity, removeEntity, onRefetchNeeded]);

  
  // 🎯 Hook para actualizar posiciones
  const { updatePosition, updating } = useUpdateEntity();

  // Handler para cuando se arrastra una entidad
  const handlePositionChange = async (entityId, newPosition) => {
    try {
      await updatePosition(entityId, newPosition);
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

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 🧭 Barra de navegación lateral izquierda - Fixed, fuera del flujo */}
      <NavigationBar />
      
      {/* Sidebar de detalles - Fixed, fuera del flujo */}
      <EntityDetailsSidebar
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        isOpen={!!selectedEntity}
      />

      {/* Contenedor del mapa - Ocupa todo el espacio, compensando la NavigationBar */}
      <div
        ref={mapContainer}
        className={dragPreview ? 'map-drop-active' : ''}
        style={{
          width: '100%',
          height: '100%',
          paddingLeft: '64px' // Espacio para la NavigationBar
        }}
      />

      {/* Selector de estilos de mapa */}
      {mapLoaded && <MapStyleSelector map={map.current} />}

      {/* Marcadores de entidades militares */}
      {mapLoaded && !loading && entities.map((entity) => (
        <EntityMarker 
          key={entity.id} 
          entity={entity} 
          map={map.current}
          onPositionChange={handlePositionChange}
          onEntityClick={() => setSelectedEntity(entity)}
        />
      ))}

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

      {/* Contador de entidades */}
      {mapLoaded && !loading && (
        <div className="absolute bottom-4 right-4 bg-military-bg-secondary/90 backdrop-blur-sm text-military-text-primary px-3 py-2 rounded-md shadow-lg text-sm">
          🚢 {entities.length} entidades activas
        </div>
      )}

      {/* Botón para abrir el uploader de imágenes */}
      {mapLoaded && (
        <button
          onClick={() => setShowImageUploader(true)}
          className="absolute top-20 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          Subir Imágenes
        </button>
      )}

      {/* Modal de subida de imágenes */}
      {showImageUploader && (
        <ImageUploadDemo onClose={() => setShowImageUploader(false)} />
      )}
    </div>
  );
}

