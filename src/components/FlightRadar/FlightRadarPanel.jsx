import { useState, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  MapPin,
  Gauge,
  Navigation,
  Flag,
  Layers
} from 'lucide-react';
import { getCategoryColor, getFlightCategory } from '../../services/flightRadarService';

/**
 * 🛩️ PANEL DE RADAR AÉREO - SAE MONITOR
 * 
 * Panel lateral integrado para monitoreo de vuelos
 * Filtros por tipo de aeronave y país de origen
 */

// Tipos de aeronave para filtros
const AIRCRAFT_TYPES = {
  all: { label: 'Todos', color: '#64748b' },
  military: { label: 'Militar', color: '#eab308' },
  passenger: { label: 'Pasajeros', color: '#3b82f6' },
  cargo: { label: 'Carga', color: '#f59e0b' },
  helicopter: { label: 'Helicópteros', color: '#06b6d4' },
  business: { label: 'Privados', color: '#a855f7' },
  general: { label: 'General', color: '#22c55e' },
};

// Países comunes en la región
const COUNTRIES = {
  all: { label: 'Todos', flag: '🌎' },
  US: { label: 'Estados Unidos', flag: '🇺🇸' },
  CO: { label: 'Colombia', flag: '🇨🇴' },
  VE: { label: 'Venezuela', flag: '🇻🇪' },
  BR: { label: 'Brasil', flag: '🇧🇷' },
  MX: { label: 'México', flag: '🇲🇽' },
  PA: { label: 'Panamá', flag: '🇵🇦' },
  NL: { label: 'Países Bajos', flag: '🇳🇱' },
  other: { label: 'Otros', flag: '🏳️' },
};

// Detectar país por registro o callsign
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
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('callsign'); // callsign, altitude, speed

  // Procesar vuelos con país detectado
  const processedFlights = useMemo(() => {
    return flights.map(flight => ({
      ...flight,
      detectedCountry: detectCountry(flight),
      flightType: flight.flightCategory || getFlightCategory(flight),
    }));
  }, [flights]);

  // Estadísticas
  const stats = useMemo(() => {
    const byType = {};
    const byCountry = {};
    
    processedFlights.forEach(f => {
      // Por tipo
      const type = f.flightType || 'other';
      byType[type] = (byType[type] || 0) + 1;
      
      // Por país
      const country = f.detectedCountry;
      byCountry[country] = (byCountry[country] || 0) + 1;
    });
    
    return { byType, byCountry };
  }, [processedFlights]);

  // Filtrar y ordenar vuelos
  const filteredFlights = useMemo(() => {
    let result = processedFlights.filter(flight => {
      // Búsqueda
      const matchesSearch = searchTerm === '' || 
        (flight.callsign || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (flight.registration || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (flight.aircraft?.type || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Tipo
      const matchesType = selectedType === 'all' || flight.flightType === selectedType;
      
      // País
      const matchesCountry = selectedCountry === 'all' || flight.detectedCountry === selectedCountry;

      return matchesSearch && matchesType && matchesCountry;
    });

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === 'altitude') return (b.altitude || 0) - (a.altitude || 0);
      if (sortBy === 'speed') return (b.speed || 0) - (a.speed || 0);
      return (a.callsign || '').localeCompare(b.callsign || '');
    });

    return result;
  }, [processedFlights, searchTerm, selectedType, selectedCountry, sortBy]);

  const activeFiltersCount = (selectedType !== 'all' ? 1 : 0) + (selectedCountry !== 'all' ? 1 : 0);

  return (
    <div className="fixed right-4 top-20 bottom-6 w-[360px] bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-700 rounded-2xl z-30 flex flex-col overflow-hidden">
      
      {/* Header - Estilo SAE */}
      <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Plane size={22} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Radar Aéreo</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Monitoreo en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-500 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/30">
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors text-xs font-medium"
            >
              <Pause size={14} /> Pausar
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-xs font-medium"
            >
              <Play size={14} /> Iniciar
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {lastUpdate && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock size={10} />
            {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
        )}
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar callsign, registro o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 transition-colors text-xs"
          />
        </div>
      </div>

      {/* Filtros colapsables */}
      <div className="border-b border-slate-700">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs font-medium text-slate-400">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </button>

        {showFilters && (
          <div className="px-4 pb-3 space-y-3">
            {/* Filtro por tipo */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">
                <Layers size={10} className="inline mr-1" />Tipo de Aeronave
              </label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(AIRCRAFT_TYPES).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      selectedType === key 
                        ? 'text-black' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    style={selectedType === key ? { backgroundColor: color } : {}}
                  >
                    {label}
                    {stats.byType[key] > 0 && ` (${stats.byType[key]})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por país */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">
                <Flag size={10} className="inline mr-1" />País de Origen
              </label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(COUNTRIES).map(([key, { label, flag }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCountry(key)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedCountry === key 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>{flag}</span>
                    {key === 'all' ? label : key}
                    {stats.byCountry[key] > 0 && ` (${stats.byCountry[key]})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Limpiar filtros */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setSelectedType('all'); setSelectedCountry('all'); }}
                className="text-[10px] text-slate-500 hover:text-white transition-colors"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ordenar */}
      <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between text-[10px]">
        <span className="text-slate-500">{filteredFlights.length} vuelos</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-600">Ordenar:</span>
          {['callsign', 'altitude', 'speed'].map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-1.5 py-0.5 rounded ${sortBy === opt ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              {opt === 'callsign' ? 'Nombre' : opt === 'altitude' ? 'Altitud' : 'Velocidad'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Lista de vuelos */}
      <div className="flex-1 overflow-y-auto">
        {loading && flights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <RefreshCw size={24} className="animate-spin mb-2" />
            <p className="text-xs">Cargando vuelos...</p>
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Plane size={24} className="mb-2 opacity-30" />
            <p className="text-xs">No hay vuelos con estos filtros</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredFlights.map(flight => {
              const country = COUNTRIES[flight.detectedCountry] || COUNTRIES.other;
              const typeInfo = AIRCRAFT_TYPES[flight.flightType] || AIRCRAFT_TYPES.military;
              
              return (
                <button
                  key={flight.id}
                  onClick={() => onFlightClick && onFlightClick(flight)}
                  className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-left group"
                >
                  {/* Header del vuelo */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{country.flag}</span>
                      <span className="font-mono font-bold text-white text-sm group-hover:text-yellow-400 transition-colors">
                        {flight.callsign || 'UNKNOWN'}
                      </span>
                    </div>
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ 
                        backgroundColor: typeInfo.color + '25',
                        color: typeInfo.color 
                      }}
                    >
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Info del vuelo */}
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Gauge size={10} className="text-blue-400" />
                      <span>{Math.round(flight.altitude / 1000)}k ft</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Navigation size={10} className="text-green-400" />
                      <span>{Math.round(flight.speed * 1.852)} km/h</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin size={10} className="text-purple-400" />
                      <span>{flight.heading || 0}°</span>
                    </div>
                  </div>

                  {/* Tipo de aeronave */}
                  {flight.aircraft?.type && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-500">
                      <Plane size={10} className="inline mr-1" />
                      {flight.aircraft.type}
                      {flight.registration && <span className="ml-2 text-slate-600">• {flight.registration}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Total monitoreado</span>
          <span className="font-bold text-white">{flights.length} vuelos</span>
        </div>
      </div>
    </div>
  );
}
