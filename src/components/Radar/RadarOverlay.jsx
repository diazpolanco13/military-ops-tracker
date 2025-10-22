import { useEffect, useState } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { Activity, Target, Radar as RadarIcon } from 'lucide-react';

export default function RadarOverlay({ map, onDetection, compact = false }) {
  const { entities, loading } = useEntities();
  const [radarAngle, setRadarAngle] = useState(0);
  const [detectedEntities, setDetectedEntities] = useState([]);
  const [scanSpeed, setScanSpeed] = useState(2); // Grados por frame
  const [isActive, setIsActive] = useState(true);
  const [radarMode, setRadarMode] = useState('sweep'); // sweep, pulse
  const [mapCenter, setMapCenter] = useState({ lat: 18.4, lng: -66.1 });
  const [mapRadius, setMapRadius] = useState(300);
  const [visibleEntities, setVisibleEntities] = useState([]);
  const [showControls, setShowControls] = useState(!compact);

  // Sincronizar con el centro y zoom del mapa REAL
  useEffect(() => {
    if (!map) return;

    const updateMapData = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Calcular radio visible basado en zoom
      // Fórmula: Radio aproximado en km según nivel de zoom
      const radiusKm = calculateRadiusFromZoom(zoom, center.lat);
      
      setMapCenter({ lat: center.lat, lng: center.lng });
      setMapRadius(radiusKm);

      // Obtener bounds del mapa para filtrar entidades visibles
      const bounds = map.getBounds();
      const visible = entities.filter(entity => {
        if (!entity.is_visible) return false;
        return bounds.contains([entity.longitude, entity.latitude]);
      });
      
      setVisibleEntities(visible);
    };

    // Actualizar inmediatamente
    updateMapData();

    // Escuchar cambios de zoom y movimiento
    map.on('zoom', updateMapData);
    map.on('move', updateMapData);

    return () => {
      map.off('zoom', updateMapData);
      map.off('move', updateMapData);
    };
  }, [map, entities]);

  // Animación del barrido del radar
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + scanSpeed) % 360);
    }, 33); // ~60fps

    return () => clearInterval(interval);
  }, [isActive, scanSpeed]);

  // Detectar entidades cuando el radar pasa sobre ellas (solo visibles en pantalla)
  useEffect(() => {
    if (!visibleEntities || visibleEntities.length === 0 || !isActive) return;

    const tolerance = 15; // Ancho del haz en grados
    
    const detected = visibleEntities.filter(entity => {
      const entityBearing = calculateBearing(mapCenter, {
        lat: entity.latitude,
        lng: entity.longitude
      });
      
      const angleDiff = Math.abs(((entityBearing - radarAngle + 180) % 360) - 180);
      return angleDiff < tolerance;
    });

    setDetectedEntities(detected);

    // Callback cuando se detecta una entidad
    if (detected.length > 0 && onDetection) {
      onDetection(detected);
    }
  }, [radarAngle, visibleEntities, mapCenter, isActive, onDetection]);

  // Total de entidades activas (las que están visibles en el mapa)
  const totalActiveEntities = entities?.filter(e => e.is_visible).length || 0;

  if (loading) {
    return (
      <div className="fixed bottom-8 left-8 w-80 h-80 bg-slate-900/80 rounded-full border-2 border-green-500/30 flex items-center justify-center backdrop-blur-sm">
        <div className="text-green-400 text-sm">Iniciando radar...</div>
      </div>
    );
  }

  // Tamaños según modo
  const radarSize = compact ? 'w-48 h-48' : 'w-80 h-80';
  const position = compact ? 'bottom-4 left-4' : 'bottom-8 left-8';

  return (
    <div className={`fixed ${position} pointer-events-auto z-30`}>
      {/* Pantalla principal del radar */}
      <div className={`relative ${radarSize} select-none`}>
        <div className="relative w-full h-full rounded-full bg-slate-900/90 border-2 border-green-500 backdrop-blur-md overflow-hidden shadow-2xl shadow-green-500/20">
          
          {/* Grid circular - anillos concéntricos */}
          <div className="absolute inset-0 rounded-full border-2 border-green-500/30"></div>
          <div className="absolute inset-[16.66%] rounded-full border border-green-500/20"></div>
          <div className="absolute inset-[33.33%] rounded-full border border-green-500/20"></div>
          <div className="absolute inset-[50%] rounded-full border border-green-500/20"></div>
          <div className="absolute inset-[66.66%] rounded-full border border-green-500/20"></div>
          
          {/* Líneas cardinales */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-green-500/20"></div>
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-green-500/20"></div>
          <div className="absolute inset-0" style={{ transform: 'rotate(45deg)' }}>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-green-500/10"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-green-500/10"></div>
          </div>

          {/* Etiquetas cardinales */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold">N</div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold">S</div>
          <div className="absolute top-1/2 right-1 -translate-y-1/2 text-green-400 text-xs font-bold">E</div>
          <div className="absolute top-1/2 left-1 -translate-y-1/2 text-green-400 text-xs font-bold">W</div>

          {/* Haz del radar (barrido) */}
          {isActive && (
            <>
              <div 
                className="absolute top-1/2 left-1/2 w-1/2 h-[3px] origin-left transition-none"
                style={{ 
                  transform: `rotate(${radarAngle}deg)`,
                  background: 'linear-gradient(to right, #22c55e, transparent)',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)',
                }}
              />

              {/* Efecto de barrido (trail verde) */}
              <div 
                className="absolute inset-0 rounded-full transition-none pointer-events-none"
                style={{ 
                  background: `conic-gradient(
                    from ${radarAngle - 60}deg,
                    transparent 0deg,
                    rgba(34, 197, 94, 0.15) 20deg,
                    rgba(34, 197, 94, 0.05) 40deg,
                    transparent 60deg
                  )`,
                  mixBlendMode: 'screen'
                }}
              />
            </>
          )}

          {/* Puntos de entidades (solo las visibles en pantalla) */}
          {visibleEntities.map(entity => {
            const pos = entityToRadarCoords(entity, mapCenter, mapRadius);
            const isDetected = detectedEntities.find(e => e.id === entity.id);
            
            // Determinar color según tipo
            const getColorByType = (type) => {
              switch(type) {
                case 'destructor': return 'bg-red-500';
                case 'fragata': return 'bg-blue-500';
                case 'avion': return 'bg-yellow-500';
                case 'tropas': return 'bg-green-500';
                case 'submarino': return 'bg-purple-500';
                default: return 'bg-cyan-500';
              }
            };

            return (
              <div
                key={entity.id}
                className={`absolute transition-all duration-300 ${
                  isDetected 
                    ? 'w-3 h-3 animate-ping' 
                    : 'w-2 h-2'
                } rounded-full ${getColorByType(entity.type)}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: isDetected ? '0 0 10px currentColor' : 'none',
                  opacity: isDetected ? 1 : 0.6
                }}
                title={entity.name}
              />
            );
          })}

          {/* Centro del radar */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-green-400/50"></div>

          {/* Indicador de pausa */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-yellow-500 text-sm font-bold animate-pulse">RADAR EN PAUSA</div>
            </div>
          )}
        </div>

        {/* Alerta de detección - DESACTIVADA */}
      </div>

      {/* Botón para expandir/contraer (solo en modo compacto) */}
      {compact && (
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-green-500/20 hover:bg-green-500/40 border border-green-500 rounded-full flex items-center justify-center transition-all z-10"
          title={showControls ? 'Ocultar controles' : 'Mostrar controles'}
        >
          <RadarIcon className="w-4 h-4 text-green-400" />
        </button>
      )}

      {/* Panel de control y estadísticas */}
      {showControls && (
        <div className="mt-4 bg-slate-900/90 border border-green-500/40 rounded-lg backdrop-blur-md shadow-xl">
        {/* Controles */}
        <div className="p-3 border-b border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <RadarIcon className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-wider">
                Control de Radar
              </span>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {isActive ? 'ACTIVO' : 'PAUSADO'}
            </button>
          </div>

          {/* Control de velocidad */}
          <div className="space-y-1">
            <label className="text-green-400/80 text-xs flex items-center justify-between">
              <span>Velocidad de barrido</span>
              <span className="font-mono">{scanSpeed}°/frame</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={scanSpeed}
              onChange={(e) => setScanSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-green-500/20 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-green-400/70 uppercase text-[10px]">Radio Vista</div>
              <div className="text-green-400 font-bold font-mono">{Math.floor(mapRadius)} km</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-green-400/70 uppercase text-[10px]">Barrido</div>
              <div className="text-green-400 font-bold font-mono">{Math.floor(radarAngle)}°</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-green-400/70 uppercase text-[10px]">En Pantalla</div>
              <div className="text-green-400 font-bold font-mono">{visibleEntities.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-cyan-400/70 uppercase text-[10px]">Total Activas</div>
              <div className="text-cyan-400 font-bold font-mono">{totalActiveEntities}</div>
            </div>
          </div>

          {/* Lista de contactos en pantalla */}
          {visibleEntities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs font-bold">Contactos en Pantalla</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto modern-scrollbar">
                {visibleEntities.slice(0, 10).map(entity => {
                  const distance = getDistance(
                    mapCenter.lat, mapCenter.lng,
                    entity.latitude, entity.longitude
                  );
                  const bearing = Math.floor(calculateBearing(mapCenter, {
                    lat: entity.latitude,
                    lng: entity.longitude
                  }));

                  return (
                    <div 
                      key={entity.id}
                      className="text-xs bg-slate-800/30 rounded px-2 py-1 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-green-400/90 truncate flex-1">{entity.name}</span>
                      <div className="flex items-center space-x-2 text-[10px] text-green-400/60 font-mono">
                        <span>{Math.floor(distance)} km</span>
                        <span>{bearing}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Calcula el bearing (rumbo) desde un punto a otro
 * @returns Ángulo en grados (0-360, donde 0 es Norte)
 */
function calculateBearing(from, to) {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Convierte coordenadas geográficas a posición en el radar
 * @returns Objeto con coordenadas x, y en porcentaje (0-100)
 */
function entityToRadarCoords(entity, center, maxRadius) {
  const distance = getDistance(
    center.lat, center.lng,
    entity.latitude, entity.longitude
  );
  
  const bearing = calculateBearing(center, {
    lat: entity.latitude,
    lng: entity.longitude
  });

  // Normalizar distancia al radio del radar (0-100%)
  // 50% = centro, 100% = borde
  const normalizedDist = Math.min((distance / maxRadius) * 40, 40);
  
  // Convertir a coordenadas cartesianas (50% = centro del radar)
  const x = 50 + normalizedDist * Math.sin(bearing * Math.PI / 180);
  const y = 50 - normalizedDist * Math.cos(bearing * Math.PI / 180);

  return { x, y };
}

/**
 * Calcula distancia en kilómetros entre dos coordenadas (fórmula de Haversine)
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calcula el radio visible aproximado basado en el nivel de zoom
 * Fórmula basada en proyección Web Mercator de Mapbox
 * @param {number} zoom - Nivel de zoom del mapa (1-22)
 * @param {number} latitude - Latitud del centro (afecta la escala)
 * @returns {number} Radio aproximado en kilómetros
 */
function calculateRadiusFromZoom(zoom, latitude) {
  // Radio de la Tierra en km
  const EARTH_RADIUS = 6371;
  
  // Ancho del mundo en píxeles a zoom 0 (Mapbox usa 512x512)
  const WORLD_WIDTH = 512;
  
  // Factor de corrección por latitud (proyección Mercator)
  const latCorrection = Math.cos(latitude * Math.PI / 180);
  
  // Metros por pixel a este zoom
  const metersPerPixel = (EARTH_RADIUS * 2 * Math.PI * 1000 * latCorrection) / (WORLD_WIDTH * Math.pow(2, zoom));
  
  // Asumir viewport típico de ~400px de ancho del radar
  const viewportWidth = 400;
  
  // Radio en km
  const radiusKm = (metersPerPixel * viewportWidth / 2) / 1000;
  
  return Math.max(10, Math.min(radiusKm, 5000)); // Entre 10km y 5000km
}

