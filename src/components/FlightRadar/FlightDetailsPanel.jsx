import { useState, useEffect, useRef } from 'react';
import { X, Plane, Navigation, Clock, Gauge, MapPin, Activity, Wind, Loader2, Flag, Shield, Route } from 'lucide-react';
import { 
  feetToMeters, 
  knotsToKmh, 
  getCategoryColor,
  getFlightDetails
} from '../../services/flightRadarService';

// Países comunes en la región (mismo que FlightRadarPanel)
const COUNTRIES = {
  US: { label: 'Estados Unidos', flag: '🇺🇸' },
  CO: { label: 'Colombia', flag: '🇨🇴' },
  VE: { label: 'Venezuela', flag: '🇻🇪' },
  BR: { label: 'Brasil', flag: '🇧🇷' },
  MX: { label: 'México', flag: '🇲🇽' },
  PA: { label: 'Panamá', flag: '🇵🇦' },
  NL: { label: 'Países Bajos', flag: '🇳🇱' },
  other: { label: 'Otro', flag: '🏳️' },
};

// Detectar país por registro o callsign (mismo que FlightRadarPanel)
const detectCountry = (flight) => {
  const reg = (flight.registration || flight.aircraft?.registration || '').toUpperCase();
  const callsign = (flight.callsign || '').toUpperCase();
  
  if (reg.startsWith('N') || callsign.startsWith('N')) return 'US';
  if (reg.startsWith('HK') || callsign.startsWith('AVA')) return 'CO';
  if (reg.startsWith('YV')) return 'VE';
  if (reg.startsWith('PT') || reg.startsWith('PR') || reg.startsWith('PP')) return 'BR';
  if (reg.startsWith('XA') || reg.startsWith('XB') || reg.startsWith('XC')) return 'MX';
  if (reg.startsWith('HP')) return 'PA';
  if (reg.startsWith('PH') || reg.startsWith('PJ')) return 'NL';
  
  return 'other';
};

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

/**
 * 🛩️ PANEL DE DETALLES DE VUELO - ESTILO FLIGHTRADAR24
 * 
 * - Desktop: Panel lateral izquierdo
 * - Móvil: Bottom sheet (panel inferior) con altura limitada
 */
export default function FlightDetailsPanel({ flight, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false); // Para móvil: expandir/colapsar
  const panelRef = useRef(null);

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

  // Cerrar al hacer clic fuera del panel (solo en desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Solo en desktop (>= 640px)
      if (window.innerWidth >= 640 && panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!flight) return null;

  const color = getCategoryColor(flight.category || 'otros');
  const altitudeM = feetToMeters(flight.altitude);
  const speedKmh = knotsToKmh(flight.speed);
  
  // Datos combinados
  const aircraftType = flight.aircraft?.type || '';
  const aircraftModel = details?.aircraft?.modelName || aircraftType || 'Unknown';
  const airlineName = details?.airline?.name || flight.aircraft?.airline || '';
  const registration = details?.aircraft?.registration || flight.registration || 'N/A';
  const aircraftAge = details?.aircraft?.age;
  const aircraftMSN = details?.aircraft?.msn;
  
  // Detectar país automáticamente por registro/callsign
  const detectedCountryCode = detectCountry(flight);
  const countryInfo = COUNTRIES[detectedCountryCode] || COUNTRIES.other;
  
  const isHeli = isHelicopter(aircraftType);

  return (
    <>
      {/* Overlay oscuro solo en móvil cuando está expandido */}
      <div 
        className={`sm:hidden fixed inset-0 bg-black/50 z-[65] transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setExpanded(false)}
      />
      
      <div 
        ref={panelRef}
        className={`
          fixed z-[70] bg-slate-900 backdrop-blur-xl shadow-2xl border border-slate-600 flex flex-col overflow-hidden transition-all duration-300
          inset-x-0 bottom-0 rounded-t-2xl
          ${expanded ? 'max-h-[80vh]' : 'max-h-[32vh]'}
          sm:inset-auto sm:left-4 sm:top-20 sm:bottom-auto sm:w-[340px] sm:max-h-[88vh] sm:rounded-xl
        `}
        style={{
          boxShadow: '0 -10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        }}
      >
        {/* Handle de arrastre - Solo móvil */}
        <div 
          className="sm:hidden flex justify-center py-1.5 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header compacto */}
        <div className="relative px-3 py-2 sm:p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-600">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-1.5 sm:top-3 right-2 sm:right-3 text-slate-400 hover:text-white transition-all p-1 hover:bg-white/10 rounded-lg"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          {/* Callsign y tipo - muy compacto en móvil */}
          <div className="flex items-center gap-2 sm:gap-3 pr-6">
            <div 
              className="p-1.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0"
              style={{ 
                backgroundColor: `${color}15`, 
                border: `1.5px solid ${color}`,
                boxShadow: `0 0 10px ${color}20`
              }}
            >
              {isHeli ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-7 sm:h-7">
                  <path d="M12 2v4M12 14v8M4 8h16M7 14h10M9 18h6"/>
                  <circle cx="12" cy="11" r="3"/>
                </svg>
              ) : (
                <Plane size={20} className="sm:w-7 sm:h-7" color={color} strokeWidth={2.5} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
                  {flight.callsign || 'UNKNOWN'}
                </h1>
                {loading && <Loader2 size={12} className="animate-spin text-blue-400 shrink-0" />}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{aircraftType}</p>
            </div>
            
            {/* Badge operador inline en móvil */}
            {(airlineName || flight.aircraft?.airline) && (
              <span 
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ 
                  backgroundColor: `${color}25`,
                  color: color,
                  border: `1px solid ${color}`
                }}
              >
                🎖️ {airlineName || flight.aircraft.airline}
              </span>
            )}
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 sm:p-3 space-y-1.5 sm:space-y-3">
          
          {/* Grid 2x2 de estadísticas - Muy compacto en móvil */}
          <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {/* Altitud */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-md sm:rounded-lg p-1.5 sm:p-3">
              <div className="flex items-center gap-1 mb-0.5">
                <Activity size={10} className="sm:w-3.5 sm:h-3.5 text-blue-400" />
                <span className="text-[8px] sm:text-[10px] font-medium text-blue-300 uppercase">Alt</span>
              </div>
              <p className="text-xs sm:text-lg font-bold text-white">{Math.round(flight.altitude / 1000)}k</p>
            </div>

            {/* Velocidad */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-md sm:rounded-lg p-1.5 sm:p-3">
              <div className="flex items-center gap-1 mb-0.5">
                <Gauge size={10} className="sm:w-3.5 sm:h-3.5 text-green-400" />
                <span className="text-[8px] sm:text-[10px] font-medium text-green-300 uppercase">Vel</span>
              </div>
              <p className="text-xs sm:text-lg font-bold text-white">{speedKmh}</p>
            </div>

            {/* País */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-md sm:rounded-lg p-1.5 sm:p-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 mb-0.5">
                <Flag size={10} className="sm:w-3 sm:h-3 text-cyan-400" />
                <span className="text-[8px] sm:text-[10px] font-medium text-cyan-300 uppercase">País</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-lg">{countryInfo.flag}</span>
                <span className="text-[9px] sm:text-xs font-bold text-white">{countryInfo.label}</span>
              </div>
            </div>
          </div>
          
          {/* Nombre completo de aeronave - Siempre visible */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-md sm:rounded-lg p-1.5 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Plane size={10} className="sm:w-3.5 sm:h-3.5 text-purple-400" />
                <span className="text-[8px] sm:text-[10px] font-medium text-purple-300 uppercase">Aeronave</span>
              </div>
              <p className="text-[10px] sm:text-sm font-bold text-white leading-tight truncate max-w-[65%]">{aircraftModel}</p>
            </div>
          </div>

          {/* Indicador "toca para expandir" - Solo móvil, cuando NO está expandido */}
          {!expanded && (
            <div 
              className="sm:hidden text-center py-1 text-[9px] text-slate-500 cursor-pointer"
              onClick={() => setExpanded(true)}
            >
              ↑ Más detalles
            </div>
          )}

          {/* El resto solo se muestra expandido en móvil */}
          <div className={`space-y-2 sm:space-y-3 ${expanded ? '' : 'hidden sm:block'}`}>
            
            {/* Velocidad vertical (si existe) */}
            {flight.verticalSpeed !== 0 && (
              <div className={`rounded-lg p-2 sm:p-2.5 border ${flight.verticalSpeed > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wind size={14} className={flight.verticalSpeed > 0 ? 'text-green-400' : 'text-red-400'} />
                    <span className="text-xs text-slate-300">Vel. Vertical</span>
                  </div>
                  <span className={`text-sm font-bold ${flight.verticalSpeed > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {flight.verticalSpeed > 0 ? '↑' : '↓'} {Math.abs(flight.verticalSpeed)} ft/min
                  </span>
                </div>
              </div>
            )}
            
            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            {/* Posición */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={12} className="text-yellow-500" />
                Posición
              </h3>
              <div className="bg-slate-800/30 rounded-lg p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Latitud</span>
                  <span className="font-mono font-semibold text-white">{flight.latitude.toFixed(5)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitud</span>
                  <span className="font-mono font-semibold text-white">{flight.longitude.toFixed(5)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rumbo</span>
                  <span className="font-mono font-semibold text-white">{flight.heading}°</span>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            {/* Aeronave detalles */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plane size={12} className="text-blue-500" />
                Aeronave
              </h3>
              <div className="bg-slate-800/30 rounded-lg p-2.5 space-y-1.5 text-xs">
                {/* Registro */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Registro</span>
                  <span className="font-mono font-bold text-white">{registration}</span>
                </div>
                
                {/* País de registro */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flag size={10} className="text-blue-400" /> País
                  </span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-lg">{countryInfo.flag}</span> 
                    <span className="text-cyan-400">{countryInfo.label}</span>
                  </span>
                </div>
                
                {/* Categoría de aeronave */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Categoría</span>
                  <span className="font-semibold flex items-center gap-1" style={{ color }}>
                    <Shield size={10} /> {getCategoryName(flight.flightCategory || flight.category)}
                  </span>
                </div>
                
                {/* Tipo ICAO */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipo ICAO</span>
                  <span className="font-mono font-semibold text-cyan-400">{aircraftType || 'N/A'}</span>
                </div>
                
                {/* Edad */}
                {aircraftAge && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Edad</span>
                    <span className="font-semibold text-white">{aircraftAge} años</span>
                  </div>
                )}
                
                {/* Serial Number */}
                {aircraftMSN && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Serial (MSN)</span>
                    <span className="font-mono font-semibold text-white">{aircraftMSN}</span>
                  </div>
                )}
                
                {/* ICAO24 */}
                {flight.icao24 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ICAO24</span>
                    <span className="font-mono font-semibold text-slate-300">{flight.icao24.toUpperCase()}</span>
                  </div>
                )}
                
                {/* Squawk */}
                {flight.aircraft?.squawk && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Squawk</span>
                    <span className="font-mono font-bold text-green-400">{flight.aircraft.squawk}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ruta */}
            {(flight.origin || flight.destination || details?.origin || details?.destination) && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation size={12} className="text-purple-500" />
                    Ruta
                  </h3>
                  <div className="bg-slate-800/30 rounded-lg p-2.5">
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
                </div>
              </>
            )}

            {/* Trayectoria - Si hay trail disponible */}
            {details?.trail && details.trail.length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Route size={12} className="text-red-400" />
                    Trayectoria
                  </h3>
                  <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-300">Puntos registrados</span>
                      <span className="text-sm font-bold text-white">{details.trail.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
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
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      La línea en el mapa muestra el recorrido del vuelo
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Footer con última actualización */}
            <div className="pt-2 mt-2 border-t border-slate-700/50">
              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <Clock size={10} className="text-slate-600" />
                <span>{new Date(flight.lastUpdate).toLocaleTimeString('es-ES')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
