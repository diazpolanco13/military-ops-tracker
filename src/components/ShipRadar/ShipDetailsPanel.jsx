import { useState, useEffect } from 'react';
import { X, Anchor, Navigation, Gauge, MapPin, Flag, Ship, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { knotsToKmh, getShipDetails, getCountryFlag } from '../../services/shipRadarService';

/**
 * 🚢 PANEL DE DETALLES DE BUQUE - Bottom Sheet
 */

const getCategoryName = (category) => {
  const names = {
    military: 'Militar',
    tanker: 'Petrolero',
    cargo: 'Carguero',
    passenger: 'Pasajeros',
    fishing: 'Pesquero',
    tug: 'Remolcador',
    other: 'Otro',
  };
  return names[category] || 'Desconocido';
};

const getCategoryColor = (category) => {
  const colors = {
    military: '#ef4444',
    tanker: '#f59e0b',
    cargo: '#3b82f6',
    passenger: '#22c55e',
    fishing: '#8b5cf6',
    tug: '#6b7280',
    other: '#6b7280',
  };
  return colors[category] || colors.other;
};

export default function ShipDetailsPanel({ ship, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (ship?.mmsi) {
      setLoading(true);
      getShipDetails(ship.mmsi)
        .then(data => {
          setDetails(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [ship?.mmsi]);

  if (!ship) return null;

  const color = getCategoryColor(ship.category);
  const speedKmh = ship.speed ? knotsToKmh(ship.speed) : 0;
  const flag = ship.countryFlag || getCountryFlag(ship.flag_country);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[65] transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setExpanded(false)}
      />
      
      <div 
        className={`
          fixed z-[70] bg-slate-900/95 backdrop-blur-xl shadow-2xl border-t border-x border-slate-600 flex flex-col overflow-hidden transition-all duration-300 ease-out
          inset-x-0 bottom-0 rounded-t-2xl
          ${expanded ? 'max-h-[85vh]' : 'max-h-[180px] sm:max-h-[160px]'}
          sm:left-4 sm:right-4 sm:max-w-3xl sm:mx-auto
        `}
        style={{
          boxShadow: '0 -10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
          <div 
            className="flex-1 flex justify-center cursor-pointer py-1"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
              {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all p-1.5 hover:bg-white/10 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Header */}
        <div className="px-3 py-2 sm:px-4">
          <div className="flex items-center gap-3">
            {/* Icono */}
            <div 
              className="p-2 rounded-xl shrink-0"
              style={{ 
                backgroundColor: `${color}15`, 
                border: `2px solid ${color}`,
              }}
            >
              <Ship size={24} color={color} strokeWidth={2.5} />
            </div>
            
            {/* Nombre y tipo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {ship.ship_name || 'UNKNOWN'}
                </h1>
                {loading && <Loader2 size={14} className="animate-spin text-blue-400" />}
              </div>
              <p className="text-xs sm:text-sm text-cyan-400 font-medium">
                {ship.ship_type_name || getCategoryName(ship.category)}
              </p>
              <span 
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}50`
                }}
              >
                {ship.icon} {getCategoryName(ship.category)}
              </span>
            </div>

            {/* Stats rápidos */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-green-400 uppercase font-medium">Vel</p>
                <p className="text-sm font-bold text-white">{speedKmh} km/h</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-cyan-400 uppercase font-medium">País</p>
                <p className="text-lg">{flag}</p>
              </div>
            </div>
          </div>

          {/* Stats móvil */}
          <div className="sm:hidden grid grid-cols-4 gap-2 mt-2">
            <div className="bg-green-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-green-300 uppercase">Vel</p>
              <p className="text-xs font-bold text-white">{speedKmh}</p>
            </div>
            <div className="bg-blue-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-blue-300 uppercase">Rumbo</p>
              <p className="text-xs font-bold text-white">{ship.heading || ship.course || 0}°</p>
            </div>
            <div className="bg-purple-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-purple-300 uppercase">Tipo</p>
              <p className="text-[9px] font-bold text-white truncate">{ship.ship_type || '?'}</p>
            </div>
            <div className="bg-cyan-500/10 rounded-md p-1.5 text-center">
              <p className="text-[8px] text-cyan-300 uppercase">País</p>
              <p className="text-sm">{flag}</p>
            </div>
          </div>
        </div>

        {/* Expandir */}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Identificación */}
              <div className="bg-slate-800/40 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Anchor size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Identificación</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MMSI</span>
                  <span className="font-mono font-bold text-white">{ship.mmsi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IMO</span>
                  <span className="font-mono text-white">{ship.imo_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Callsign</span>
                  <span className="font-mono text-white">{ship.callsign || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Bandera</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-base">{flag}</span>
                    <span className="text-cyan-400">{ship.flag_country}</span>
                  </span>
                </div>
              </div>

              {/* Posición */}
              <div className="bg-slate-800/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-yellow-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Posición</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitud</span>
                    <span className="font-mono text-white">{ship.latitude?.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitud</span>
                    <span className="font-mono text-white">{ship.longitude?.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rumbo</span>
                    <span className="font-mono text-white">{ship.heading || ship.course || 0}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Velocidad</span>
                    <span className="font-mono text-white">{speedKmh} km/h ({ship.speed?.toFixed(1) || 0} kts)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destino */}
            {ship.destination && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Destino</span>
                </div>
                <p className="text-sm font-bold text-white">{ship.destination}</p>
                {ship.eta && (
                  <p className="text-xs text-slate-400 mt-1">ETA: {new Date(ship.eta).toLocaleString('es-ES')}</p>
                )}
              </div>
            )}

            {/* Dimensiones */}
            {(ship.length || ship.width || ship.draught) && (
              <div className="bg-slate-800/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Ship size={14} className="text-purple-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dimensiones</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {ship.length && (
                    <div className="text-center">
                      <p className="text-slate-400">Eslora</p>
                      <p className="font-bold text-white">{ship.length} m</p>
                    </div>
                  )}
                  {ship.width && (
                    <div className="text-center">
                      <p className="text-slate-400">Manga</p>
                      <p className="font-bold text-white">{ship.width} m</p>
                    </div>
                  )}
                  {ship.draught && (
                    <div className="text-center">
                      <p className="text-slate-400">Calado</p>
                      <p className="font-bold text-white">{ship.draught} m</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-slate-700/50">
              <div className="text-[10px] text-slate-500 text-center">
                Última actualización: {ship.last_update ? new Date(ship.last_update).toLocaleString('es-ES') : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
