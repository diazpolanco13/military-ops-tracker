import { Plane, Navigation, Gauge, ArrowUp, MapPin, Clock } from 'lucide-react';
import { feetToMeters, knotsToKmh, getCategoryColor } from '../../services/flightRadarService';

// Base de datos de tipos ICAO a nombres completos (aeronaves militares comunes)
const AIRCRAFT_MODELS = {
  // USAF Transport
  'C17': 'Boeing C-17A Globemaster III',
  'C5': 'Lockheed C-5 Galaxy',
  'C130': 'Lockheed C-130 Hercules',
  'C5M': 'Lockheed C-5M Super Galaxy',
  'KC135': 'Boeing KC-135 Stratotanker',
  'KC10': 'McDonnell Douglas KC-10 Extender',
  'KC46': 'Boeing KC-46 Pegasus',
  'C40': 'Boeing C-40 Clipper',
  'C32': 'Boeing C-32 (757)',
  'C37': 'Gulfstream C-37',
  // USAF Combat/Surveillance
  'F16': 'General Dynamics F-16 Fighting Falcon',
  'F15': 'McDonnell Douglas F-15 Eagle',
  'F18': 'Boeing F/A-18 Hornet',
  'F22': 'Lockheed Martin F-22 Raptor',
  'F35': 'Lockheed Martin F-35 Lightning II',
  'B52': 'Boeing B-52 Stratofortress',
  'B1': 'Rockwell B-1 Lancer',
  'B2': 'Northrop Grumman B-2 Spirit',
  'E3': 'Boeing E-3 Sentry AWACS',
  'E8': 'Northrop Grumman E-8 Joint STARS',
  'P8': 'Boeing P-8A Poseidon',
  'P3': 'Lockheed P-3 Orion',
  'RC135': 'Boeing RC-135 Rivet Joint',
  'U2': 'Lockheed U-2 Dragon Lady',
  'RQ4': 'Northrop Grumman RQ-4 Global Hawk',
  'MQ9': 'General Atomics MQ-9 Reaper',
  // USN
  'E2': 'Northrop Grumman E-2 Hawkeye',
  'C2': 'Grumman C-2 Greyhound',
  'EA18': 'Boeing EA-18G Growler',
  // Helicopters
  'H60': 'Sikorsky UH-60 Black Hawk',
  'UH60': 'Sikorsky UH-60 Black Hawk',
  'MH60': 'Sikorsky MH-60 Seahawk',
  'HH60': 'Sikorsky HH-60 Pave Hawk',
  'CH47': 'Boeing CH-47 Chinook',
  'H47': 'Boeing CH-47 Chinook',
  'AH64': 'Boeing AH-64 Apache',
  'V22': 'Bell Boeing V-22 Osprey',
  // UK RAF
  'A400': 'Airbus A400M Atlas',
  'C130J': 'Lockheed C-130J Super Hercules',
  'EUFI': 'Eurofighter Typhoon',
  // Comerciales
  'A330': 'Airbus A330',
  'B737': 'Boeing 737',
  'B747': 'Boeing 747',
  'B757': 'Boeing 757',
  'B767': 'Boeing 767',
  'B777': 'Boeing 777',
  'B787': 'Boeing 787 Dreamliner',
  'A320': 'Airbus A320',
  'A321': 'Airbus A321',
  'F185': 'Lockheed Martin F-35A Lightning II',
};

// Obtener nombre completo del modelo
const getAircraftModelName = (icaoType) => {
  if (!icaoType) return null;
  const type = icaoType.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (AIRCRAFT_MODELS[type]) return AIRCRAFT_MODELS[type];
  for (const [key, name] of Object.entries(AIRCRAFT_MODELS)) {
    if (type.includes(key) || key.includes(type)) return name;
  }
  return null;
};

/**
 * 🛩️ COMPONENTE FLIGHTPOPUP
 * 
 * Popup informativo para vuelos militares
 * Muestra información completa del vuelo en tiempo real
 */
export default function FlightPopup({ flight, category }) {
  const color = getCategoryColor(category);
  const altitudeM = feetToMeters(flight.altitude);
  const speedKmh = knotsToKmh(flight.speed);
  const modelName = getAircraftModelName(flight.aircraft?.type);

  // Categorías en español
  const categoryLabels = {
    combat: 'Caza de Combate',
    transport: 'Transporte/Carga',
    tanker: 'Reabastecimiento',
    surveillance: 'Vigilancia/Patrulla',
    bomber: 'Bombardero',
    other: 'Aeronave Militar',
  };

  return (
    <div className="flight-popup-content w-80 bg-slate-900 text-white p-4 rounded-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Plane size={18} style={{ color }} />
            <h3 className="text-lg font-bold">{flight.callsign || 'UNKNOWN'}</h3>
          </div>
          <div 
            className="inline-block px-2 py-1 rounded text-xs font-semibold"
            style={{ backgroundColor: color + '20', color }}
          >
            {categoryLabels[category] || 'Militar'}
          </div>
        </div>
      </div>

      {/* Modelo de aeronave - DESTACADO */}
      {(modelName || flight.aircraft?.type) && (
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/20 border border-cyan-700/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Plane size={14} className="text-cyan-400" />
            <span className="text-[10px] text-cyan-400/80 uppercase tracking-wider font-semibold">Aeronave</span>
          </div>
          {modelName ? (
            <>
              <p className="text-base font-bold text-white">{modelName}</p>
              <p className="text-xs text-slate-400 font-mono">{flight.aircraft?.type}</p>
            </>
          ) : (
            <p className="text-base font-bold text-white font-mono">{flight.aircraft?.type}</p>
          )}
        </div>
      )}

      {/* Información adicional de la aeronave */}
      <div className="space-y-2 text-sm mb-4">
        {flight.registration && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Registro:</span>
            <span className="font-mono font-semibold">{flight.registration}</span>
          </div>
        )}

        {flight.aircraft?.squawk && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Squawk:</span>
            <span className="font-mono">{flight.aircraft.squawk}</span>
          </div>
        )}
      </div>

      {/* Parámetros de vuelo */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Altitud */}
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp size={14} className="text-blue-400" />
            <span className="text-xs text-slate-400">Altitud</span>
          </div>
          <div className="font-bold text-lg">{Math.round(altitudeM / 1000)}k ft</div>
          <div className="text-xs text-slate-500">{altitudeM.toLocaleString()} m</div>
        </div>

        {/* Velocidad */}
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={14} className="text-green-400" />
            <span className="text-xs text-slate-400">Velocidad</span>
          </div>
          <div className="font-bold text-lg">{speedKmh}</div>
          <div className="text-xs text-slate-500">km/h</div>
        </div>

        {/* Rumbo */}
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={14} className="text-purple-400" />
            <span className="text-xs text-slate-400">Rumbo</span>
          </div>
          <div className="font-bold text-lg">{flight.heading}°</div>
          <div className="text-xs text-slate-500">{getCardinalDirection(flight.heading)}</div>
        </div>

        {/* Velocidad Vertical */}
        <div className="bg-slate-800/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp 
              size={14} 
              className={flight.verticalSpeed > 0 ? 'text-green-400' : flight.verticalSpeed < 0 ? 'text-red-400' : 'text-slate-400'}
              style={
                {
                  transform: flight.verticalSpeed < 0 ? 'rotate(180deg)' : 'none'
                }
              }
            />
            <span className="text-xs text-slate-400">V. Vertical</span>
          </div>
          <div className="font-bold text-lg">
            {flight.verticalSpeed > 0 ? '+' : ''}{flight.verticalSpeed || 0}
          </div>
          <div className="text-xs text-slate-500">ft/min</div>
        </div>
      </div>

      {/* Ruta (si disponible) */}
      {(flight.origin || flight.destination) && (
        <div className="bg-slate-800/30 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-semibold">Ruta</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono font-bold">{flight.origin || '???'}</span>
            <span className="text-slate-500">→</span>
            <span className="font-mono font-bold">{flight.destination || '???'}</span>
          </div>
        </div>
      )}

      {/* Última actualización */}
      <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700 pt-3">
        <Clock size={12} />
        <span>Actualizado: {new Date(flight.lastUpdate).toLocaleTimeString('es-ES')}</span>
      </div>

      {/* Estado */}
      <div className="mt-2">
        {flight.onGround ? (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            En tierra
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            En vuelo
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Convertir heading a dirección cardinal
 * @param {Number} heading - Rumbo en grados (0-360)
 * @returns {String} - Dirección cardinal (N, NE, E, SE, S, SW, W, NW)
 */
function getCardinalDirection(heading) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((heading % 360) / 45)) % 8;
  return directions[index];
}

