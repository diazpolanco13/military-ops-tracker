import { Plane, Navigation, Gauge, ArrowUp, MapPin, Clock } from 'lucide-react';
import { feetToMeters, knotsToKmh, getCategoryColor } from '../../services/flightRadarService';

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

      {/* Información de la aeronave */}
      <div className="space-y-2 text-sm mb-4">
        {flight.aircraft?.type && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tipo:</span>
            <span className="font-mono font-semibold">{flight.aircraft.type}</span>
          </div>
        )}

        {flight.registration && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Registro:</span>
            <span className="font-mono">{flight.registration}</span>
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

