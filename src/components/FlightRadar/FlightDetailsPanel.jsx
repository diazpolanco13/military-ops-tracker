import { useState, useEffect, useRef } from 'react';
import { X, Plane, Navigation, Clock, Gauge, MapPin, Activity, Wind, Loader2, Flag, Shield, Route, ChevronUp, ChevronDown, Radio, WifiOff } from 'lucide-react';
import { 
  feetToMeters, 
  knotsToKmh, 
  getCategoryColor,
  getFlightDetails,
  getCountryByICAO24,
  getAircraftModel,
  SIGNAL_TYPES,
} from '../../services/flightRadarService';
import { useAircraftModelImage } from '../../hooks/useAircraftImages';

// Determinar si es helicóptero basado en el tipo
const isHelicopter = (type) => {
  const heliTypes = ['H60', 'H47', 'H64', 'H53', 'UH60', 'CH47', 'AH64', 'MH60', 'HH60', 'S76', 'S92', 'EC', 'AS', 'HELI'];
  return heliTypes.some(h => (type || '').toUpperCase().includes(h));
};

// Nombres de categorías en español
const getCategoryName = (category) => {
  const names = {
    military: 'Militar/Gobierno',
    passenger: 'Pasajeros',
    cargo: 'Carga',
    business: 'Jet Privado',
    general: 'Aviación General',
    helicopter: 'Helicóptero',
    drones: 'Drone',
    gliders: 'Planeador',
    other: 'Otro',
    uncategorized: 'Sin categorizar',
    // Categorías militares específicas
    combat: 'Combate',
    transport: 'Transporte Militar',
    tanker: 'Cisterna',
    surveillance: 'Vigilancia',
    bomber: 'Bombardero',
    vip: 'VIP/Gobierno',
  };
  return names[category] || category || 'Desconocido';
};

// Obtener nombre completo del modelo (usa el servicio centralizado)
const getAircraftModelName = (icaoType) => {
  const modelInfo = getAircraftModel(icaoType);
  return modelInfo?.name || null;
};

// Normalizar para que coincida con aircraft_model_catalog / aircraft_model_images
// Ej: "C17A" -> "C17"
const normalizeTypeForCatalog = (type) => {
  const t = String(type || '').trim().toUpperCase();
  if (!t) return '';
  if (t.length >= 4 && /[A-Z]/.test(t[t.length - 1]) && /\d/.test(t)) {
    return t.slice(0, -1);
  }
  return t;
};

/**
 * 🛩️ PANEL DE DETALLES DE VUELO - BOTTOM SHEET UNIVERSAL
 * 
 * Diseño consistente en móvil y desktop:
 * - Panel inferior compacto que muestra lo esencial
 * - Expandible para ver más detalles
 * - Prioriza la visibilidad del mapa
 */
export default function FlightDetailsPanel({ flight, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef(null);

  // Datos combinados (necesario arriba para el hook de imagen)
  const aircraftTypeRaw = details?.aircraft?.type || flight?.aircraft?.type || '';
  // Priorizar el tipo exacto (ej: DH8B) y usar fallback (ej: C17A->C17) si no hay imagen.
  const aircraftTypeExact = String(aircraftTypeRaw || '').trim().toUpperCase();
  const aircraftTypeFallback = normalizeTypeForCatalog(aircraftTypeRaw);
  const { imageUrl: modelImageUrlExact } = useAircraftModelImage(aircraftTypeExact);
  const { imageUrl: modelImageUrlFallback } = useAircraftModelImage(aircraftTypeFallback);
  const modelImageUrl = modelImageUrlExact || modelImageUrlFallback;
  const aircraftType = aircraftTypeExact || aircraftTypeFallback || aircraftTypeRaw || '';

  useEffect(() => {
    if (flight?.id) {
      setLoading(true);
      getFlightDetails(flight.id)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [flight?.id]);

  if (!flight) return null;

  const color = getCategoryColor(flight.category || 'otros');
  const altitudeM = feetToMeters(flight.altitude);
  const speedKmh = knotsToKmh(flight.speed);
  
  // Datos combinados
  const aircraftModel =
    flight.aircraft?.modelName ||
    details?.aircraft?.modelName ||
    getAircraftModelName(aircraftTypeExact) ||
    getAircraftModelName(aircraftTypeFallback) ||
    getAircraftModelName(aircraftTypeRaw) ||
    aircraftTypeRaw ||
    aircraftType ||
    'Unknown';
  const airlineName = details?.airline?.name || flight.aircraft?.airline || '';
  const registration = details?.aircraft?.registration || flight.registration || 'N/A';
  const aircraftAge = details?.aircraft?.age;
  const aircraftMSN = details?.aircraft?.msn;
  
  // 🌍 DETECTAR PAÍS - Prioridad: datos del vuelo > ICAO24
  // El vuelo ya viene con información de país desde parseFlightData
  const countryInfo = flight.country || getCountryByICAO24(flight.icao24);
  
  const isHeli = isHelicopter(aircraftType);

  return (
    <>
      {/* Overlay oscuro cuando está expandido */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[65] transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setExpanded(false)}
      />
      
      <div 
        ref={panelRef}
        className={`
          fixed z-[70] bg-slate-900/95 backdrop-blur-xl shadow-2xl border-t border-x border-slate-600 flex flex-col overflow-hidden transition-all duration-300 ease-out
          inset-x-0 bottom-0 rounded-t-2xl
          ${expanded ? 'max-h-[85vh]' : 'max-h-[180px] sm:max-h-[160px]'}
          sm:left-4 sm:right-4 sm:max-w-3xl sm:mx-auto
        `}
        style={{
          boxShadow: '0 -10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
        }}
      >
        {/* Handle de arrastre y botones de control */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
          {/* Handle clickeable para expandir/colapsar */}
          <div 
            className="flex-1 flex justify-center cursor-pointer py-1"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
              {expanded ? (
                <ChevronDown size={16} className="text-slate-500" />
              ) : (
                <ChevronUp size={16} className="text-slate-500" />
              )}
            </div>
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Header con info principal - SIEMPRE VISIBLE */}
        <div className="px-3 py-2 sm:px-4">
          <div className="flex items-center gap-3">
            {/* Imagen del modelo (si existe en catálogo) o ícono fallback */}
            <div
              className="rounded-xl shrink-0 overflow-hidden"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: `${color}15`,
                border: `2px solid ${color}`,
                boxShadow: `0 0 15px ${color}30`,
              }}
            >
              {modelImageUrl ? (
                <img
                  src={modelImageUrl}
                  alt={aircraftModel}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : isHeli ? (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 14v8M4 8h16M7 14h10M9 18h6"/>
                    <circle cx="12" cy="11" r="3"/>
                  </svg>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plane size={26} color={color} strokeWidth={2.5} />
                </div>
              )}
            </div>
            
            {/* Callsign, modelo y operador */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {flight.callsign || 'UNKNOWN'}
                </h1>
                {loading && <Loader2 size={14} className="animate-spin text-blue-400" />}
              </div>
              {/* Nombre completo del modelo de aeronave */}
              {(aircraftTypeRaw || aircraftType) && (
                <p className="text-xs sm:text-sm text-cyan-400 font-medium truncate">
                  {getAircraftModelName(aircraftTypeRaw) || getAircraftModelName(aircraftType) || details?.aircraft?.modelName || aircraftTypeRaw || aircraftType}
                </p>
              )}
              {/* Operador */}
              {(airlineName || flight.aircraft?.airline) && (
                <span 
                  className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                  style={{ 
                    backgroundColor: `${color}20`,
                    color: color,
                    border: `1px solid ${color}50`
                  }}
                >
                  🎖️ {airlineName || flight.aircraft.airline}
                </span>
              )}
            </div>

            {/* 🛫 RUTA COMPACTA - CENTRADA (Desktop) */}
            {(flight.origin || flight.destination || details?.origin || details?.destination) && (
              <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
                <Route size={14} className="text-amber-400 shrink-0" />
                <div className="text-center">
                  <p className="text-sm font-bold text-white font-mono">
                    {details?.origin?.code || flight.origin || '???'}
                  </p>
                  <p className="text-[8px] text-slate-400 truncate max-w-[60px]">
                    {details?.origin?.city || ''}
                  </p>
                </div>
                <span className="text-amber-400">→</span>
                <div className="text-center">
                  <p className="text-sm font-bold text-white font-mono">
                    {details?.destination?.code || flight.destination || '???'}
                  </p>
                  <p className="text-[8px] text-slate-400 truncate max-w-[60px]">
                    {details?.destination?.city || ''}
                  </p>
                </div>
              </div>
            )}

            {/* Stats rápidos en horizontal (Desktop) */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Altitud */}
              <div className="text-center">
                <p className="text-[10px] text-blue-400 uppercase font-medium">Alt</p>
                <p className="text-sm font-bold text-white">{Math.round(flight.altitude / 1000)}k ft</p>
              </div>
              {/* Velocidad */}
              <div className="text-center">
                <p className="text-[10px] text-green-400 uppercase font-medium">Vel</p>
                <p className="text-sm font-bold text-white">{speedKmh} km/h</p>
              </div>
              {/* País (del avión) */}
              <div className="text-center">
                <p className="text-[10px] text-cyan-400 uppercase font-medium">País (avión)</p>
                <p className="text-lg">{countryInfo.flag}</p>
              </div>
            </div>

            {/* 📡 INDICADOR DE TRANSPONDER - Desktop */}
            {flight.signal && (
              <div 
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                style={{
                  backgroundColor: `${flight.signal.color}15`,
                  borderColor: `${flight.signal.color}50`
                }}
                title={flight.signal.description}
              >
                {flight.signal.isTransponderActive ? (
                  <Radio size={14} style={{ color: flight.signal.color }} className="animate-pulse" />
                ) : (
                  <WifiOff size={14} style={{ color: flight.signal.color }} />
                )}
                <span 
                  className="text-[10px] font-bold uppercase"
                  style={{ color: flight.signal.color }}
                >
                  {flight.signal.label}
                </span>
              </div>
            )}
          </div>

          {/* 🛫 RUTA COMPACTA - CENTRADA (Móvil) */}
          {(flight.origin || flight.destination || details?.origin || details?.destination) && (
            <div className="sm:hidden flex items-center justify-center gap-3 mt-1 mx-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
              <Route size={14} className="text-amber-400 shrink-0" />
              <div className="text-center">
                <p className="text-sm font-bold text-white font-mono">
                  {details?.origin?.code || flight.origin || '???'}
                </p>
                <p className="text-[8px] text-slate-400 truncate max-w-[70px]">
                  {details?.origin?.city || ''}
                </p>
              </div>
              <span className="text-amber-400 text-lg">→</span>
              <div className="text-center">
                <p className="text-sm font-bold text-white font-mono">
                  {details?.destination?.code || flight.destination || '???'}
                </p>
                <p className="text-[8px] text-slate-400 truncate max-w-[70px]">
                  {details?.destination?.city || ''}
                </p>
              </div>
            </div>
          )}

          {/* Stats en móvil - grid compacto */}
          <div className="sm:hidden grid grid-cols-5 gap-1.5 mt-1.5">
            <div className="bg-blue-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-blue-300 uppercase">Alt</p>
              <p className="text-xs font-bold text-white">{Math.round(flight.altitude / 1000)}k</p>
            </div>
            <div className="bg-green-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-green-300 uppercase">Vel</p>
              <p className="text-xs font-bold text-white">{speedKmh}</p>
            </div>
            <div className="bg-purple-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-purple-300 uppercase">Tipo</p>
              <p className="text-[9px] font-bold text-white truncate">{aircraftType || '?'}</p>
            </div>
            <div className="bg-cyan-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-cyan-300 uppercase">Avión</p>
              <p className="text-sm">{countryInfo.flag}</p>
            </div>
            {/* 📡 INDICADOR DE TRANSPONDER - Móvil */}
            {flight.signal && (
              <div 
                className="rounded-md p-1.5 text-center"
                style={{ backgroundColor: `${flight.signal.color}15` }}
                title={flight.signal.description}
              >
                <p className="text-[8px] uppercase" style={{ color: flight.signal.color }}>
                  {flight.signal.isTransponderActive ? '📡' : '📵'}
                </p>
                <p className="text-[9px] font-bold" style={{ color: flight.signal.color }}>
                  {flight.signal.label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Indicador para expandir - cuando está colapsado */}
        {!expanded && (
          <div 
            className="text-center py-1.5 text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 transition-colors border-t border-slate-700/30"
            onClick={() => setExpanded(true)}
          >
            <span className="flex items-center justify-center gap-1">
              <ChevronUp size={14} />
              Ver más detalles
            </span>
          </div>
        )}

        {/* Contenido expandido */}
        {expanded && (
          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 space-y-3">

            {/* Imagen grande del modelo (solo cuando está expandido) */}
            {modelImageUrl && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="w-full h-[160px] sm:h-[220px] bg-black/30 flex items-center justify-center">
                  <img
                    src={modelImageUrl}
                    alt={aircraftModel}
                    className="w-full h-full object-contain p-3"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            
            {/* Grid de info detallada - 2 columnas en desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Columna 1: Aeronave */}
              <div className="space-y-3">
                {/* Modelo de aeronave */}
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane size={14} className="text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-300 uppercase">Aeronave</span>
                  </div>
                  <p className="text-sm font-bold text-white">{aircraftModel}</p>
                </div>

                {/* Detalles de aeronave */}
                <div className="bg-slate-800/40 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registro</span>
                    <span className="font-mono font-bold text-white">{registration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">País (avión)</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-base">{countryInfo.flag}</span>
                      <span className="text-cyan-400">{countryInfo.name}</span>
                      {countryInfo.military && <span className="ml-1 text-[8px] text-red-400">(MIL)</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Categoría</span>
                    <span className="font-semibold flex items-center gap-1" style={{ color }}>
                      <Shield size={10} /> {getCategoryName(flight.flightCategory || flight.category)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo ICAO</span>
                    <span className="font-mono text-cyan-400">{aircraftType || 'N/A'}</span>
                  </div>
                  {aircraftAge && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Edad</span>
                      <span className="text-white">{aircraftAge} años</span>
                    </div>
                  )}
                  {aircraftMSN && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Serial</span>
                      <span className="font-mono text-white">{aircraftMSN}</span>
                    </div>
                  )}
                  {flight.icao24 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ICAO24</span>
                      <span className="font-mono text-slate-300">{flight.icao24.toUpperCase()}</span>
                    </div>
                  )}
                  {flight.aircraft?.squawk && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Squawk</span>
                      <span className="font-mono font-bold text-green-400">{flight.aircraft.squawk}</span>
                    </div>
                  )}
                  {/* 📡 Estado del Transponder */}
                  {flight.signal && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-700/50 mt-1">
                      <span className="text-slate-400">Transponder</span>
                      <span 
                        className="flex items-center gap-1.5 font-bold"
                        style={{ color: flight.signal.color }}
                      >
                        {flight.signal.isTransponderActive ? (
                          <Radio size={12} className="animate-pulse" />
                        ) : (
                          <WifiOff size={12} />
                        )}
                        {flight.signal.label}
                        {flight.signal.type === SIGNAL_TYPES.ESTIMATED && (
                          <span className="text-[9px] text-slate-500 ml-1">(posición estimada)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna 2: Posición y Vuelo */}
              <div className="space-y-3">
                {/* Posición */}
                <div className="bg-slate-800/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className="text-yellow-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Posición</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latitud</span>
                      <span className="font-mono text-white">{flight.latitude.toFixed(5)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Longitud</span>
                      <span className="font-mono text-white">{flight.longitude.toFixed(5)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rumbo</span>
                      <span className="font-mono text-white">{flight.heading}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Altitud</span>
                      <span className="font-mono text-white">{flight.altitude.toLocaleString()} ft ({(altitudeM / 1000).toFixed(1)} km)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Velocidad</span>
                      <span className="font-mono text-white">{speedKmh} km/h ({flight.speed} kts)</span>
                    </div>
                  </div>
                </div>

                {/* Velocidad vertical */}
                {flight.verticalSpeed !== 0 && (
                  <div className={`rounded-lg p-3 border ${flight.verticalSpeed > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wind size={14} className={flight.verticalSpeed > 0 ? 'text-green-400' : 'text-red-400'} />
                        <span className="text-xs text-slate-300">Vel. Vertical</span>
                      </div>
                      <span className={`text-sm font-bold ${flight.verticalSpeed > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {flight.verticalSpeed > 0 ? '↑' : '↓'} {Math.abs(flight.verticalSpeed)} ft/min
                      </span>
                    </div>
                  </div>
                )}

                {/* Ruta */}
                {(flight.origin || flight.destination || details?.origin || details?.destination) && (
                  <div className="bg-slate-800/40 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation size={14} className="text-purple-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ruta</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-[10px] text-slate-400">Origen</p>
                        <p className="text-base font-bold text-white font-mono">
                          {details?.origin?.code || flight.origin || 'N/A'}
                        </p>
                        {details?.origin?.city && (
                          <p className="text-[10px] text-slate-500 truncate">{details.origin.city}</p>
                        )}
                      </div>
                      <Plane size={14} className="text-slate-500 rotate-90 mx-2" />
                      <div className="text-center flex-1">
                        <p className="text-[10px] text-slate-400">Destino</p>
                        <p className="text-base font-bold text-white font-mono">
                          {details?.destination?.code || flight.destination || 'N/A'}
                        </p>
                        {details?.destination?.city && (
                          <p className="text-[10px] text-slate-500 truncate">{details.destination.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trayectoria - Ancho completo */}
            {details?.trail && details.trail.length > 0 && (
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Route size={14} className="text-red-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trayectoria</span>
                  <span className="ml-auto text-sm font-bold text-white">{details.trail.length} puntos</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Baja alt.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Media</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Alta alt.</span>
                  </div>
                  <span className="ml-auto italic">La línea en el mapa muestra el recorrido</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-slate-700/50">
              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <Clock size={10} />
                <span>Actualizado: {new Date(flight.lastUpdate).toLocaleTimeString('es-ES')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
