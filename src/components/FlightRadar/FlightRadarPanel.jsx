import { useState } from 'react';
import { 
  Plane, 
  X, 
  Play, 
  Pause, 
  RefreshCw, 
  Search, 
  Filter,
  AlertCircle,
  Clock,
  Radar
} from 'lucide-react';
import { getCategoryColor } from '../../services/flightRadarService';

/**
 * 🛩️ COMPONENTE FLIGHTRADAR PANEL
 * 
 * Panel de control lateral para gestión de vuelos militares
 * - Lista de vuelos activos
 * - Filtros por categoría
 * - Búsqueda por callsign
 * - Control de tracking (play/pause)
 * - Estadísticas en tiempo real
 */
export default function FlightRadarPanel({ 
  flights = [],
  loading,
  error,
  isActive,
  lastUpdate,
  onStart,
  onPause,
  onRefresh,
  onFlightClick,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filtrar vuelos
  const filteredFlights = flights.filter(flight => {
    const matchesSearch = searchTerm === '' || 
      (flight.callsign || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flight.registration || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || flight.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Estadísticas por categoría
  const stats = {
    combat: flights.filter(f => f.category === 'combat').length,
    transport: flights.filter(f => f.category === 'transport').length,
    tanker: flights.filter(f => f.category === 'tanker').length,
    surveillance: flights.filter(f => f.category === 'surveillance').length,
    bomber: flights.filter(f => f.category === 'bomber').length,
    other: flights.filter(f => f.category === 'other').length,
  };

  const categoryLabels = {
    combat: 'Combate',
    transport: 'Transporte',
    tanker: 'Tanque',
    surveillance: 'Vigilancia',
    bomber: 'Bombardero',
    other: 'Otros',
  };

  return (
    <div className="fixed right-0 top-[64px] h-[calc(100vh-64px)] w-96 bg-slate-900/95 backdrop-blur-md shadow-2xl border-l border-slate-700 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Radar size={24} className="text-blue-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">FlightRadar24</h2>
            <p className="text-xs text-slate-400">Vuelos militares en tiempo real</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="Cerrar panel"
        >
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Controles */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/30">
        <div className="flex items-center gap-2 mb-3">
          {/* Play/Pause */}
          {isActive ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold text-sm"
            >
              <Pause size={16} />
              Pausar
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold text-sm"
            >
              <Play size={16} />
              Iniciar
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refrescar
          </button>
        </div>

        {/* Última actualización */}
        {lastUpdate && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={12} />
            <span>Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}</span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase">Categorías</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={`p-2 rounded-lg border-2 transition-all ${
                selectedCategory === category
                  ? 'border-white bg-white/10'
                  : 'border-transparent bg-slate-800/50 hover:bg-slate-700/50'
              }`}
              style={{
                borderColor: selectedCategory === category ? getCategoryColor(category) : 'transparent'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{categoryLabels[category]}</span>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getCategoryColor(category) }}
                >
                  {count}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por callsign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5" />
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      {/* Lista de vuelos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && flights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <RefreshCw size={32} className="animate-spin mb-2" />
            <p className="text-sm">Cargando vuelos...</p>
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Plane size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No hay vuelos {selectedCategory ? 'en esta categoría' : 'disponibles'}</p>
          </div>
        ) : (
          filteredFlights.map(flight => (
            <button
              key={flight.id}
              onClick={() => onFlightClick && onFlightClick(flight)}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 hover:border-blue-500 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Plane 
                    size={16} 
                    style={{ 
                      color: getCategoryColor(flight.category),
                      transform: `rotate(${flight.heading || 0}deg)`
                    }} 
                  />
                  <span className="font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                    {flight.callsign || 'UNKNOWN'}
                  </span>
                </div>
                <div 
                  className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ 
                    backgroundColor: getCategoryColor(flight.category) + '30',
                    color: getCategoryColor(flight.category)
                  }}
                >
                  {categoryLabels[flight.category] || 'Militar'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Alt:</span> {Math.round(flight.altitude / 1000)}k ft
                </div>
                <div>
                  <span className="text-slate-500">Vel:</span> {Math.round(flight.speed * 1.852)} km/h
                </div>
                {flight.aircraft?.type && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Tipo:</span> {flight.aircraft.type}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer con total */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total de vuelos:</span>
          <span className="font-bold text-white">{flights.length}</span>
        </div>
        {filteredFlights.length < flights.length && (
          <div className="text-xs text-slate-500 mt-1">
            Mostrando {filteredFlights.length} de {flights.length}
          </div>
        )}
      </div>
    </div>
  );
}

