import { X, Plane, Navigation, Clock, Gauge, TrendingUp, Radio } from 'lucide-react';
import { 
  feetToMeters, 
  knotsToKmh, 
  getCategoryColor 
} from '../../services/flightRadarService';

/**
 * 🛩️ PANEL DE DETALLES DE VUELO
 * 
 * Panel lateral estilo FlightRadar24 que se abre al hacer click en un avión
 */
export default function FlightDetailsPanel({ flight, onClose }) {
  if (!flight) return null;

  const color = getCategoryColor(flight.category || 'otros');
  const altitudeM = feetToMeters(flight.altitude);
  const speedKmh = knotsToKmh(flight.speed);

  return (
    <div className="fixed right-0 top-[64px] h-[calc(100vh-64px)] w-96 bg-slate-900/95 backdrop-blur-md shadow-2xl border-l border-slate-700 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Plane size={20} color={color} />
            <h2 className="text-lg font-bold text-white">
              {flight.callsign || 'UNKNOWN'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-sm text-slate-400">
          {flight.aircraft?.type || 'Unknown Type'}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Posición */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Navigation size={16} />
            Posición
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Latitud:</span>
              <span className="text-white font-mono">{flight.latitude.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Longitud:</span>
              <span className="text-white font-mono">{flight.longitude.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rumbo:</span>
              <span className="text-white font-mono">{flight.heading}°</span>
            </div>
          </div>
        </div>

        {/* Altitud y Velocidad */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Gauge size={16} />
            Vuelo
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Altitud:</span>
              <span className="text-white font-mono">
                {Math.round(altitudeM / 1000)}k ft
                <span className="text-slate-500 ml-1">
                  ({(altitudeM / 1000).toFixed(1)}km)
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Velocidad:</span>
              <span className="text-white font-mono">
                {speedKmh} km/h
                <span className="text-slate-500 ml-1">
                  ({flight.speed} kts)
                </span>
              </span>
            </div>
            {flight.verticalSpeed && (
              <div className="flex justify-between">
                <span className="text-slate-400">Velocidad vertical:</span>
                <span className="text-white font-mono">
                  {flight.verticalSpeed > 0 ? '↑' : '↓'} {Math.abs(flight.verticalSpeed)} ft/min
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Aeronave */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Plane size={16} />
            Aeronave
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Tipo:</span>
              <span className="text-white">{flight.aircraft?.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registro:</span>
              <span className="text-white font-mono">{flight.registration || flight.aircraft?.registration || 'N/A'}</span>
            </div>
            {flight.aircraft?.squawk && (
              <div className="flex justify-between">
                <span className="text-slate-400">Squawk:</span>
                <span className="text-white font-mono">{flight.aircraft.squawk}</span>
              </div>
            )}
            {flight.icao24 && (
              <div className="flex justify-between">
                <span className="text-slate-400">ICAO24:</span>
                <span className="text-white font-mono">{flight.icao24}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ruta */}
        {(flight.origin || flight.destination) && (
          <div className="bg-slate-800/50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Navigation size={16} />
              Ruta
            </h3>
            <div className="space-y-1 text-sm">
              {flight.origin && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Origen:</span>
                  <span className="text-white font-mono">{flight.origin}</span>
                </div>
              )}
              {flight.destination && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Destino:</span>
                  <span className="text-white font-mono">{flight.destination}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categoría */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Radio size={16} />
            Clasificación
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Categoría:</span>
              <span 
                className="px-2 py-1 rounded text-xs font-semibold"
                style={{ 
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}`
                }}
              >
                {flight.category || 'Otros'}
              </span>
            </div>
          </div>
        </div>

        {/* Última actualización */}
        <div className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
          <Clock size={12} />
          Actualizado: {new Date(flight.lastUpdate).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

