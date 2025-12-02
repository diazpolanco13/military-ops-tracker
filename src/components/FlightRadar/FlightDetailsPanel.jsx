import { useState, useEffect } from 'react';
import { X, Plane, Navigation, Clock, Gauge, MapPin, Radio, Activity, Wind, Loader2, Flag, Shield } from 'lucide-react';
import { 
  feetToMeters, 
  knotsToKmh, 
  getCategoryColor,
  getFlightDetails
} from '../../services/flightRadarService';

// Mapa de países por countryId de FlightRadar24
const COUNTRY_MAP = {
  // América del Norte
  236: { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  39: { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  143: { code: 'MX', name: 'México', flag: '🇲🇽' },
  
  // Caribe y Centroamérica
  60: { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  66: { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴' },
  182: { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  108: { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  95: { code: 'HT', name: 'Haití', flag: '🇭🇹' },
  229: { code: 'TT', name: 'Trinidad y Tobago', flag: '🇹🇹' },
  17: { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  12: { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
  59: { code: 'CW', name: 'Curazao', flag: '🇨🇼' },
  175: { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  56: { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  94: { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  97: { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  169: { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  
  // Sudamérica
  241: { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  49: { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  32: { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  11: { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  46: { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  178: { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  69: { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  26: { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  
  // Europa
  235: { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  77: { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  83: { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  107: { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  72: { code: 'ES', name: 'España', flag: '🇪🇸' },
  166: { code: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
  183: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  188: { code: 'RU', name: 'Rusia', flag: '🇷🇺' },
  
  // Otros
  105: { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  47: { code: 'CN', name: 'China', flag: '🇨🇳' },
  109: { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  13: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
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
 * Panel flotante compacto con información detallada del vuelo
 */
export default function FlightDetailsPanel({ flight, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

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
  const aircraftType = flight.aircraft?.type || '';
  const aircraftModel = details?.aircraft?.modelName || aircraftType || 'Unknown';
  const airlineName = details?.airline?.name || flight.aircraft?.airline || '';
  const registration = details?.aircraft?.registration || flight.registration || 'N/A';
  const aircraftAge = details?.aircraft?.age;
  const aircraftMSN = details?.aircraft?.msn;
  // País: primero del avión, si no del aeropuerto de origen
  const countryId = details?.aircraft?.countryId;
  const countryInfo = countryId ? COUNTRY_MAP[countryId] : null;
  const originCountry = details?.origin?.country; // Fallback
  const isHeli = isHelicopter(aircraftType);

  return (
    <div 
      className="fixed left-4 top-20 w-[340px] max-h-[88vh] bg-slate-900 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-600 z-50 flex flex-col overflow-hidden"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}
    >
      {/* Header compacto - MÁS OPACO */}
      <div className="relative p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-600">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-lg"
        >
          <X size={18} />
        </button>

        {/* Callsign y tipo */}
        <div className="flex items-start gap-3">
          <div 
            className="p-3 rounded-xl"
            style={{ 
              backgroundColor: `${color}15`, 
              border: `2px solid ${color}`,
              boxShadow: `0 0 15px ${color}30`
            }}
          >
            {/* Icono de helicóptero o avión */}
            {isHeli ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 14v8M4 8h16M7 14h10M9 18h6"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
            ) : (
              <Plane size={28} color={color} strokeWidth={2.5} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {flight.callsign || 'UNKNOWN'}
              </h1>
              {loading && <Loader2 size={14} className="animate-spin text-blue-400" />}
            </div>
            <p className="text-xs text-slate-400 font-medium">{aircraftType}</p>
            
            {/* Badge operador */}
            {(airlineName || flight.aircraft?.airline) && (
              <span 
                className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
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
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        
        {/* Grid de estadísticas principales - MÁS COMPACTO */}
        <div className="grid grid-cols-2 gap-2">
          {/* Altitud */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={14} className="text-blue-400" />
              <span className="text-[10px] font-medium text-blue-300 uppercase">Altitud</span>
            </div>
            <p className="text-lg font-bold text-white">{Math.round(flight.altitude / 1000)}k ft</p>
            <p className="text-[10px] text-slate-400">{(altitudeM / 1000).toFixed(1)} km</p>
          </div>

          {/* Velocidad */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge size={14} className="text-green-400" />
              <span className="text-[10px] font-medium text-green-300 uppercase">Velocidad</span>
            </div>
            <p className="text-lg font-bold text-white">{speedKmh} km/h</p>
            <p className="text-[10px] text-slate-400">{flight.speed} kts</p>
          </div>
        </div>

        {/* Velocidad vertical (si existe) - COMPACTO */}
        {flight.verticalSpeed !== 0 && (
          <div className={`rounded-lg p-2.5 border ${flight.verticalSpeed > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
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

        {/* TIPO DE AERONAVE - NUEVO Y DESTACADO */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            {isHeli ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <path d="M12 2v4M12 14v8M4 8h16M7 14h10"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
            ) : (
              <Plane size={14} className="text-purple-400" />
            )}
            <span className="text-[10px] font-medium text-purple-300 uppercase">Tipo de Aeronave</span>
          </div>
          <p className="text-sm font-bold text-white leading-tight">{aircraftModel}</p>
        </div>

        {/* Posición - COMPACTO */}
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

        {/* Aeronave - COMPACTO */}
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
            {countryInfo ? (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flag size={10} className="text-blue-400" /> País
                </span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-lg">{countryInfo.flag}</span> 
                  <span className="text-cyan-400">{countryInfo.name}</span>
                </span>
              </div>
            ) : originCountry ? (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flag size={10} className="text-blue-400" /> País (origen)
                </span>
                <span className="font-semibold text-slate-300">{originCountry}</span>
              </div>
            ) : countryId && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flag size={10} className="text-blue-400" /> País ID
                </span>
                <span className="font-mono text-slate-300">{countryId}</span>
              </div>
            )}
            
            {/* Categoría de aeronave - DINÁMICA */}
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

        {/* Ruta - COMPACTA */}
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

        {/* Footer con última actualización */}
        <div className="pt-2 mt-2 border-t border-slate-700/50">
          <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <Clock size={10} className="text-slate-600" />
            <span>{new Date(flight.lastUpdate).toLocaleTimeString('es-ES')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

