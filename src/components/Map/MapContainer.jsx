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

export default function MapContainer({ onRefetchNeeded }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // 📡 Obtener entidades desde Supabase con función de refetch
  const { entities, loading, error, refetch } = useEntities();

  // Exponer refetch al componente padre
  useEffect(() => {
    if (onRefetchNeeded && refetch) {
      window.refetchEntities = refetch;
    }
  }, [refetch, onRefetchNeeded]);

  
  // 🎯 Hook para actualizar posiciones
  const { updatePosition, updating } = useUpdateEntity();

  // Handler para cuando se arrastra una entidad
  const handlePositionChange = async (entityId, newPosition) => {
    try {
      await updatePosition(entityId, newPosition);
      console.log(`✅ ${entityId} movido a:`, newPosition);
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

    // Log cuando el mapa esté listo
    map.current.on('load', () => {
      console.log('✅ Mapa del Caribe cargado correctamente');
      console.log('📍 Centro:', MAP_CONFIG.center);
      console.log('🔍 Zoom:', MAP_CONFIG.zoom);
      setMapLoaded(true);
    });

    // Cleanup al desmontar
    return () => {
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

      {/* Indicador de actualización */}
      {updating && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-military-accent-warning/90 backdrop-blur-sm text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Actualizando posición...
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

