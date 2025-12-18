import { useState, useMemo } from 'react';
import { 
  Ship, 
  X, 
  RefreshCw, 
  Search, 
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Gauge,
  Navigation,
  Anchor,
  Fuel
} from 'lucide-react';
import { getCountryFlag } from '../../services/shipRadarService';

/**
 * 🚢 PANEL DE RADAR MARÍTIMO - SAE MONITOR
 * 
 * Panel lateral para monitoreo de buques militares y petroleros
 * Diseño idéntico a FlightRadarPanel
 */

// Tipos de buque
const SHIP_TYPES = {
  all: { label: 'Todos', color: '#06b6d4' },
  military: { label: 'Militar', color: '#ef4444' },
  tanker: { label: 'Petrolero', color: '#f59e0b' },
};

// Países comunes
const COUNTRIES = {
  all: { label: 'Todos', flag: '🌎' },
  US: { label: 'Estados Unidos', flag: '🇺🇸' },
  CO: { label: 'Colombia', flag: '🇨🇴' },
  VE: { label: 'Venezuela', flag: '🇻🇪' },
  PA: { label: 'Panamá', flag: '🇵🇦' },
  LR: { label: 'Liberia', flag: '🇱🇷' },
  MH: { label: 'Islas Marshall', flag: '🇲🇭' },
  MT: { label: 'Malta', flag: '🇲🇹' },
  BS: { label: 'Bahamas', flag: '🇧🇸' },
  other: { label: 'Otros', flag: '🏳️' },
};

export default function ShipRadarPanel({ 
  ships = [],
  loading,
  lastUpdate,
  onRefresh,
  onShipClick,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, speed

  // Solo buques de interés (militares y petroleros)
  const interestingShips = useMemo(() => {
    return ships.filter(s => s.is_military || s.is_tanker);
  }, [ships]);

  // Estadísticas
  const stats = useMemo(() => {
    const byType = {
      all: interestingShips.length,
      military: ships.filter(s => s.is_military).length,
      tanker: ships.filter(s => s.is_tanker && !s.is_military).length,
    };
    const byCountry = {};
    
    interestingShips.forEach(s => {
      const country = s.flag_country || 'other';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });
    
    return { byType, byCountry };
  }, [ships, interestingShips]);

  // Filtrar y ordenar buques
  const filteredShips = useMemo(() => {
    let result = interestingShips.filter(ship => {
      // Búsqueda
      const matchesSearch = searchTerm === '' || 
        (ship.ship_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ship.mmsi || '').includes(searchTerm);

      // Tipo
      const matchesType = selectedType === 'all' || 
        (selectedType === 'military' && ship.is_military) ||
        (selectedType === 'tanker' && ship.is_tanker && !ship.is_military);
      
      // País
      const matchesCountry = selectedCountry === 'all' || 
        ship.flag_country === selectedCountry ||
        (selectedCountry === 'other' && !COUNTRIES[ship.flag_country]);

      return matchesSearch && matchesType && matchesCountry;
    });

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === 'speed') return (parseFloat(b.speed) || 0) - (parseFloat(a.speed) || 0);
      return (a.ship_name || '').localeCompare(b.ship_name || '');
    });

    return result;
  }, [interestingShips, searchTerm, selectedType, selectedCountry, sortBy]);

  const activeFiltersCount = (selectedType !== 'all' ? 1 : 0) + (selectedCountry !== 'all' ? 1 : 0);

  return (
    <div className="fixed right-4 top-20 bottom-6 w-[360px] bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-700 rounded-2xl z-40 flex flex-col overflow-hidden">
      
      {/* Header - Estilo SAE */}
      <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Ship size={22} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Radar Marítimo</h2>
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
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-md transition-colors text-xs font-medium"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        
        {lastUpdate && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock size={10} />
            {new Date(lastUpdate).toLocaleTimeString('es-ES')}
          </div>
        )}
      </div>

      {/* Búsqueda */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o MMSI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-xs"
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
              <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded">
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
                Tipo de Buque
              </label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(SHIP_TYPES).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      selectedType === key 
                        ? 'text-white' 
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
                Bandera
              </label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(COUNTRIES).map(([key, { label, flag }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCountry(key)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      selectedCountry === key 
                        ? 'bg-cyan-500 text-white' 
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
        <span className="text-slate-500">{filteredShips.length} buques de interés</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-600">Ordenar:</span>
          {['name', 'speed'].map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-1.5 py-0.5 rounded ${sortBy === opt ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              {opt === 'name' ? 'Nombre' : 'Velocidad'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de buques */}
      <div className="flex-1 overflow-y-auto">
        {loading && interestingShips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <RefreshCw size={24} className="animate-spin mb-2" />
            <p className="text-xs">Cargando buques...</p>
          </div>
        ) : filteredShips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Ship size={24} className="mb-2 opacity-30" />
            <p className="text-xs">No hay buques con estos filtros</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredShips.map(ship => {
              const country = COUNTRIES[ship.flag_country] || COUNTRIES.other;
              const typeInfo = ship.is_military ? SHIP_TYPES.military : SHIP_TYPES.tanker;
              const flag = getCountryFlag(ship.flag_country);
              const speedKmh = Math.round((parseFloat(ship.speed) || 0) * 1.852);
              
              return (
                <button
                  key={ship.mmsi}
                  onClick={() => onShipClick && onShipClick(ship)}
                  className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-left group"
                >
                  {/* Header del buque */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{flag}</span>
                      <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate max-w-[180px]">
                        {ship.ship_name || 'UNKNOWN'}
                      </span>
                    </div>
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                      style={{ 
                        backgroundColor: typeInfo.color + '25',
                        color: typeInfo.color 
                      }}
                    >
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Info del buque */}
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Anchor size={10} className="text-blue-400" />
                      <span>{ship.mmsi}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Gauge size={10} className="text-green-400" />
                      <span>{speedKmh} km/h</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Navigation size={10} className="text-purple-400" />
                      <span>{ship.heading || ship.course || 0}°</span>
                    </div>
                  </div>

                  {/* Tipo de buque */}
                  {ship.ship_type_name && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <div className="flex items-center gap-1.5">
                        {ship.is_military ? (
                          <Ship size={12} className="text-red-400" />
                        ) : (
                          <Fuel size={12} className="text-orange-400" />
                        )}
                        <span className="text-[10px] text-cyan-400">
                          {ship.ship_type_name}
                        </span>
                      </div>
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
          <span className="font-bold text-white">{ships.length} buques</span>
        </div>
      </div>
    </div>
  );
}
