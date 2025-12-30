import { useState, useMemo } from 'react';
import { 
  X, 
  RefreshCw, 
  Plane, 
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Flag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreVertical,
  Globe
} from 'lucide-react';
import { useAircraftRegistry, useMilitaryBases, useAircraftModels, useCountryPresence } from '../../hooks/useAircraftRegistry';
import AircraftDetailView from './AircraftDetailView';

/**
 * 🎖️ PANEL DE REGISTRO DE AERONAVES MILITARES
 * 
 * Panel principal para visualizar y gestionar el inventario de aeronaves
 * militares detectadas en el Caribe.
 */
export default function AircraftRegistryPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('registry');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [filters, setFilters] = useState({
    country: '',
    branch: '',
    type: '',
    hasIncursions: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { 
    aircraft, 
    loading, 
    stats,
    topIncursionAircraft,
    refetch,
    pagination,
    goToPage,
    nextPage,
    prevPage,
  } = useAircraftRegistry({
    enabled: isOpen,
    pageSize: 20, // 20 aeronaves por página
    filters: {
      ...filters,
      search: searchTerm || undefined,
    },
  });

  const { bases, basesByCountry } = useMilitaryBases({ enabled: isOpen });
  const { models, modelsByCategory } = useAircraftModels({ enabled: isOpen });
  const { deploymentSummary, countries, getAircraftInCountry } = useCountryPresence({ enabled: isOpen });

  // Filtrado local adicional
  const filteredAircraft = useMemo(() => {
    if (!searchTerm) return aircraft;
    const term = searchTerm.toLowerCase();
    return aircraft.filter(a => 
      a.icao24?.toLowerCase().includes(term) ||
      a.aircraft_model?.toLowerCase().includes(term) ||
      a.callsigns_used?.some(c => c.toLowerCase().includes(term)) ||
      a.probable_base_name?.toLowerCase().includes(term)
    );
  }, [aircraft, searchTerm]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'registry', label: 'Inventario', icon: Plane, count: stats?.totalAircraft },
    { id: 'countries', label: 'Por País', icon: Globe, count: deploymentSummary.length },
    { id: 'bases', label: 'Bases', icon: Building2, count: bases.length },
    { id: 'incursions', label: 'Top Incursiones', icon: AlertTriangle, count: topIncursionAircraft.length },
    { id: 'new', label: 'Nuevas Hoy', icon: TrendingUp, count: stats?.newToday },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-sky-500/20 flex-shrink-0">
            <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-white truncate">
              Registro de Aeronaves Militares
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">
              Inventario de aeronaves detectadas en el Caribe
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-700 hover:bg-red-500/50 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 px-3 sm:px-6 py-2 bg-slate-800/50 border-b border-slate-700 flex-shrink-0">
          <StatCard label="Total" value={stats.totalAircraft} color="text-sky-400" />
          <StatCard label="Nuevas Hoy" value={stats.newToday} color="text-green-400" />
          <StatCard label="Con Incursiones" value={stats.withIncursions} color="text-red-400" />
          <StatCard label="Bases" value={Object.keys(stats.byCountry || {}).length} color="text-amber-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-3 sm:px-6 py-2 sm:py-3 bg-slate-800/30 border-b border-slate-700 overflow-x-auto custom-scrollbar-horizontal flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id 
                ? 'bg-sky-500/20 text-sky-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-sky-500/30' : 'bg-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      {activeTab === 'registry' && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-slate-800/20 border-b border-slate-700 flex-shrink-0">
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ICAO24, modelo, callsign..."
                className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                showFilters ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-slate-700/50 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FilterSelect
                label="País"
                value={filters.country}
                onChange={(v) => setFilters(f => ({ ...f, country: v }))}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'PR', label: '🇵🇷 Puerto Rico' },
                  { value: 'CW', label: '🇨🇼 Curazao' },
                  { value: 'CO', label: '🇨🇴 Colombia' },
                  { value: 'HN', label: '🇭🇳 Honduras' },
                ]}
              />
              <FilterSelect
                label="Rama"
                value={filters.branch}
                onChange={(v) => setFilters(f => ({ ...f, branch: v }))}
                options={[
                  { value: '', label: 'Todas' },
                  { value: 'USAF', label: 'USAF' },
                  { value: 'Navy', label: 'Navy' },
                  { value: 'Marines', label: 'Marines' },
                  { value: 'Army', label: 'Army' },
                  { value: 'Coast Guard', label: 'Coast Guard' },
                ]}
              />
              <FilterSelect
                label="Tipo"
                value={filters.type}
                onChange={(v) => setFilters(f => ({ ...f, type: v }))}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'C17', label: 'C-17 Globemaster' },
                  { value: 'P8', label: 'P-8 Poseidon' },
                  { value: 'C130', label: 'C-130 Hercules' },
                  { value: 'KC135', label: 'KC-135 Tanker' },
                ]}
              />
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasIncursions}
                  onChange={(e) => setFilters(f => ({ ...f, hasIncursions: e.target.checked }))}
                  className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
                />
                Solo con incursiones
              </label>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar-transparent">
        {loading && aircraft.length === 0 ? (
          <LoadingState />
        ) : (
          <>
            {activeTab === 'registry' && (
              <>
                <RegistryTab 
                  aircraft={filteredAircraft} 
                  viewMode={viewMode}
                  onSelect={setSelectedAircraft}
                />
                
                {/* Paginador */}
                {pagination && pagination.totalPages > 1 && (
                  <Pagination 
                    pagination={pagination}
                    onGoToPage={goToPage}
                    onNextPage={nextPage}
                    onPrevPage={prevPage}
                    loading={loading}
                  />
                )}
              </>
            )}
            {activeTab === 'countries' && (
              <CountryDeploymentTab 
                deploymentSummary={deploymentSummary}
                getAircraftInCountry={getAircraftInCountry}
                onSelectAircraft={setSelectedAircraft}
              />
            )}
            {activeTab === 'bases' && (
              <BasesTab 
                basesByCountry={basesByCountry}
                aircraft={aircraft}
              />
            )}
            {activeTab === 'incursions' && (
              <IncursionsTab 
                aircraft={topIncursionAircraft}
                onSelect={setSelectedAircraft}
              />
            )}
            {activeTab === 'new' && (
              <NewTodayTab 
                aircraft={aircraft.filter(a => a.is_new_today)}
                onSelect={setSelectedAircraft}
              />
            )}
          </>
        )}
      </div>

      {/* Aircraft Detail View (Pantalla Completa) */}
      {selectedAircraft && (
        <AircraftDetailView
          aircraft={selectedAircraft}
          onClose={() => setSelectedAircraft(null)}
        />
      )}
    </div>
  );
}

// =============================================
// SUB-COMPONENTES
// =============================================

function StatCard({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`text-lg sm:text-2xl font-bold ${color}`}>
        {value ?? '-'}
      </div>
      <div className="text-xs text-slate-400 truncate">{label}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:outline-none focus:border-sky-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 text-sky-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm sm:text-base">Cargando registro...</p>
      </div>
    </div>
  );
}

/**
 * 📄 Componente de Paginación
 */
function Pagination({ pagination, onGoToPage, onNextPage, onPrevPage, loading }) {
  const { currentPage, totalPages, totalCount, pageSize, hasNextPage, hasPrevPage } = pagination;
  
  // Calcular rango de elementos mostrados
  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajustar si estamos cerca del final
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-700">
      {/* Info de registros */}
      <div className="text-sm text-slate-400">
        Mostrando <span className="font-medium text-white">{startItem}-{endItem}</span> de{' '}
        <span className="font-medium text-white">{totalCount}</span> aeronaves
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1">
        {/* Primera página */}
        <button
          onClick={() => onGoToPage(1)}
          disabled={!hasPrevPage || loading}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        
        {/* Página anterior */}
        <button
          onClick={onPrevPage}
          disabled={!hasPrevPage || loading}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => onGoToPage(page)}
              disabled={loading}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Página siguiente */}
        <button
          onClick={onNextPage}
          disabled={!hasNextPage || loading}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última página */}
        <button
          onClick={() => onGoToPage(totalPages)}
          disabled={!hasNextPage || loading}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selector de página (opcional para pantallas grandes) */}
      <div className="hidden lg:flex items-center gap-2 text-sm">
        <span className="text-slate-400">Ir a:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              onGoToPage(page);
            }
          }}
          className="w-16 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-center text-white text-sm focus:outline-none focus:border-sky-500"
          disabled={loading}
        />
        <span className="text-slate-400">de {totalPages}</span>
      </div>
    </div>
  );
}

// =============================================
// TAB: REGISTRO / INVENTARIO
// =============================================
function RegistryTab({ aircraft, viewMode, onSelect }) {
  if (aircraft.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Sin aeronaves registradas</h3>
        <p className="text-slate-400 text-sm">
          Las aeronaves se registrarán automáticamente al ser detectadas.
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {aircraft.map(a => (
          <AircraftGridCard key={a.icao24} aircraft={a} onClick={() => onSelect(a)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aircraft.map(a => (
        <AircraftListItem key={a.icao24} aircraft={a} onClick={() => onSelect(a)} />
      ))}
    </div>
  );
}

function AircraftGridCard({ aircraft, onClick }) {
  const a = aircraft;
  const lastCallsign = a.callsigns_used?.length > 0 ? a.callsigns_used[a.callsigns_used.length - 1] : null;
  
  return (
    <div 
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-sky-500/50 hover:bg-slate-800 transition-all group"
    >
      {/* Imagen o icono */}
      <div className="aspect-video bg-slate-700/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
        {a.model?.thumbnail_url ? (
          <img 
            src={a.model.thumbnail_url} 
            alt={a.aircraft_model}
            className="w-full h-full object-cover"
          />
        ) : (
          <Plane className="w-10 h-10 text-slate-500" />
        )}
        {/* Callsign badge sobre la imagen */}
        {lastCallsign && (
          <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 font-mono font-bold text-xs px-2 py-1 rounded shadow-lg">
            {lastCallsign}
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-sky-400">{a.icao24}</span>
          {a.total_incursions > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
              {a.total_incursions}
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium text-white truncate group-hover:text-sky-300 transition-colors">
          {a.aircraft_model || a.aircraft_type || 'Desconocido'}
        </h4>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{a.probable_base_name || 'Base desconocida'}</span>
        </div>
      </div>
    </div>
  );
}

function AircraftListItem({ aircraft, onClick }) {
  const a = aircraft;
  const lastSeen = a.last_seen ? new Date(a.last_seen) : null;
  const isRecent = lastSeen && (Date.now() - lastSeen.getTime()) < 3600000; // 1 hora
  
  // Obtener el último callsign usado (el más reciente/importante)
  const lastCallsign = a.callsigns_used?.length > 0 ? a.callsigns_used[a.callsigns_used.length - 1] : null;
  const lastCountryLabel = a.last_country_code === 'PR'
    ? 'Puerto Rico (Territorio de USA)'
    : (a.last_country_name || a.last_country_code);
  const lastCountryFlag = a.last_country_code === 'PR' ? '🇵🇷' : a.last_country_flag;
  const lastSeenInCountry = a.last_seen_in_country ? new Date(a.last_seen_in_country) : null;
  const detectionDate = lastSeenInCountry || lastSeen;

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:border-sky-500/50 hover:bg-slate-800 transition-all group overflow-hidden"
    >
      {/* Icono/Imagen */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-slate-700/50 rounded-lg flex items-center justify-center overflow-hidden">
          {a.model?.thumbnail_url ? (
            <img 
              src={a.model.thumbnail_url} 
              alt={a.aircraft_model}
              className="w-full h-full object-cover"
            />
          ) : (
            <Plane className="w-6 h-6 text-slate-500" />
          )}
        </div>
        {/* Apodo (CALLSIGN) debajo de la imagen - pequeño para ahorrar espacio */}
        {lastCallsign && (
          <div className="mt-1 font-mono text-[11px] text-amber-300 truncate max-w-[56px]">
            {lastCallsign}
          </div>
        )}
      </div>

      {/* Info Principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs text-sky-400">{a.icao24}</span>
          {a.military_branch && (
            <span className="text-[10px] bg-slate-600 px-1.5 py-0.5 rounded text-slate-300">
              {a.military_branch}
            </span>
          )}
          {isRecent && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Visto recientemente" />
          )}
        </div>
        <h4 className="text-sm font-medium text-white truncate group-hover:text-sky-300 transition-colors">
          {a.aircraft_model || a.aircraft_type || 'Modelo desconocido'}
        </h4>

        {/* Última ubicación (país) + Base probable + Fecha */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
          {(a.last_country_code || a.last_country_name) && (
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              <span className="text-base leading-none">{lastCountryFlag || '🏳️'}</span>
              <span className="truncate max-w-[140px] sm:max-w-[220px]">{lastCountryLabel}</span>
            </span>
          )}
          {a.probable_base_icao && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="font-mono text-slate-300">{a.probable_base_icao}</span>
              <span className="truncate max-w-[160px] sm:max-w-[260px]">{a.probable_base_name}</span>
            </span>
          )}
          {detectionDate && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>
                {detectionDate.toLocaleString('es-VE', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          )}
        </div>

        {a.callsigns_used?.length > 1 && (
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            También: {a.callsigns_used.slice(0, -1).slice(-2).join(', ')}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        <div className="text-xs text-slate-400">Detecciones</div>
        <div className="text-sm font-medium text-white">{a.total_detections}</div>
      </div>
      {a.total_incursions > 0 && (
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-red-400">Incursiones</div>
          <div className="text-sm font-bold text-red-400">{a.total_incursions}</div>
        </div>
      )}

      {/* Action */}
      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-sky-400 transition-colors" />
    </div>
  );
}

// =============================================
// TAB: BASES
// =============================================
function BasesTab({ basesByCountry, aircraft }) {
  const [expandedCountry, setExpandedCountry] = useState(null);

  // Calcular aeronaves por base
  const aircraftByBase = useMemo(() => {
    return aircraft.reduce((acc, a) => {
      if (a.probable_base_icao) {
        acc[a.probable_base_icao] = (acc[a.probable_base_icao] || 0) + 1;
      }
      return acc;
    }, {});
  }, [aircraft]);

  return (
    <div className="space-y-3">
      {Object.entries(basesByCountry).map(([country, bases]) => (
        <div key={country} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedCountry(expandedCountry === country ? null : country)}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-white">{country}</span>
              <span className="text-xs bg-slate-600 px-2 py-0.5 rounded text-slate-300">
                {bases.length} bases
              </span>
            </div>
            {expandedCountry === country ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          
          {expandedCountry === country && (
            <div className="border-t border-slate-700 divide-y divide-slate-700/50">
              {bases.map(base => (
                <div key={base.icao_code} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-sky-400">{base.icao_code}</span>
                      {base.military_presence && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full" title="Presencia militar" />
                      )}
                    </div>
                    <div className="text-sm text-white">{base.name}</div>
                    <div className="text-xs text-slate-400">{base.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sky-400">
                      {aircraftByBase[base.icao_code] || 0}
                    </div>
                    <div className="text-xs text-slate-400">aeronaves</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================
// TAB: TOP INCURSIONES
// =============================================
function IncursionsTab({ aircraft, onSelect }) {
  if (aircraft.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Sin incursiones registradas</h3>
        <p className="text-slate-400 text-sm">
          Las aeronaves con incursiones aparecerán aquí ordenadas por cantidad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aircraft.map((a, idx) => (
        <div 
          key={a.icao24}
          onClick={() => onSelect(a)}
          className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:border-red-500/50 hover:bg-slate-800 transition-all"
        >
          {/* Ranking */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            idx === 0 ? 'bg-amber-500 text-slate-900' :
            idx === 1 ? 'bg-slate-400 text-slate-900' :
            idx === 2 ? 'bg-amber-700 text-white' :
            'bg-slate-700 text-slate-300'
          }`}>
            {idx + 1}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-sky-400">{a.icao24}</span>
              <span className="text-xs bg-slate-600 px-1.5 py-0.5 rounded text-slate-300">
                {a.military_branch || 'Unknown'}
              </span>
            </div>
            <h4 className="text-sm font-medium text-white truncate">
              {a.aircraft_model || a.aircraft_type || 'Desconocido'}
            </h4>
          </div>

          {/* Incursiones */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-red-400">{a.total_incursions}</div>
            <div className="text-xs text-slate-400">incursiones</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================
// TAB: NUEVAS HOY
// =============================================
function NewTodayTab({ aircraft, onSelect }) {
  if (aircraft.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Sin nuevas aeronaves hoy</h3>
        <p className="text-slate-400 text-sm">
          Las aeronaves detectadas por primera vez hoy aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-400 mb-3">
        {aircraft.length} aeronave{aircraft.length !== 1 ? 's' : ''} nueva{aircraft.length !== 1 ? 's' : ''} detectada{aircraft.length !== 1 ? 's' : ''} hoy
      </div>
      {aircraft.map(a => (
        <div 
          key={a.icao24}
          onClick={() => onSelect(a)}
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-slate-800/50 border border-green-500/30 rounded-lg cursor-pointer hover:border-green-500/50 transition-all"
        >
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-sky-400">{a.icao24}</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                NUEVA
              </span>
            </div>
            <h4 className="text-sm font-medium text-white truncate">
              {a.aircraft_model || a.aircraft_type || 'Desconocido'}
            </h4>
            <div className="text-xs text-slate-400">
              Primera detección: {new Date(a.first_seen).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      ))}
    </div>
  );
}

// =============================================
// TAB: DESPLIEGUE POR PAÍS
// =============================================
function CountryDeploymentTab({ deploymentSummary, getAircraftInCountry, onSelectAircraft }) {
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [countryAircraft, setCountryAircraft] = useState([]);
  const [loadingCountry, setLoadingCountry] = useState(false);

  const handleExpandCountry = async (countryCode) => {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null);
      setCountryAircraft([]);
      return;
    }
    
    setExpandedCountry(countryCode);
    setLoadingCountry(true);
    
    try {
      const aircraft = await getAircraftInCountry(countryCode);
      setCountryAircraft(aircraft);
    } catch (err) {
      console.error('Error loading country aircraft:', err);
    } finally {
      setLoadingCountry(false);
    }
  };

  if (deploymentSummary.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Sin datos de despliegue</h3>
        <p className="text-slate-400 text-sm">
          Los datos de presencia por país se poblarán automáticamente.
        </p>
      </div>
    );
  }

  // Calcular totales
  const totalAircraft = deploymentSummary.reduce((sum, c) => sum + (c.total_aircraft || 0), 0);
  const totalCurrentlyPresent = deploymentSummary.reduce((sum, c) => sum + (c.currently_present || 0), 0);

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-sky-400">{deploymentSummary.length}</div>
          <div className="text-xs text-slate-400">Países con presencia</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-green-400">{totalAircraft}</div>
          <div className="text-xs text-slate-400">Aeronaves únicas</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-amber-400">{totalCurrentlyPresent}</div>
          <div className="text-xs text-slate-400">Activas ahora</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-2xl font-bold text-purple-400">
            {deploymentSummary.reduce((sum, c) => sum + (c.total_sightings || 0), 0)}
          </div>
          <div className="text-xs text-slate-400">Avistamientos totales</div>
        </div>
      </div>

      {/* Lista de países */}
      <div className="space-y-2">
        {deploymentSummary.map((country) => (
          <div key={country.country_code} className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => handleExpandCountry(country.country_code)}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-700/30 transition-colors"
            >
              <div className="text-3xl">{country.country_flag || '🏳️'}</div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="font-medium text-white">{country.country_name}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Plane className="w-3 h-3" />
                    {country.total_aircraft} aeronaves
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {country.total_sightings} avistamientos
                  </span>
                  {country.currently_present > 0 && (
                    <span className="flex items-center gap-1 text-green-400">
                      <Clock className="w-3 h-3" />
                      {country.currently_present} activas
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-lg font-bold text-sky-400">{country.total_aircraft}</div>
                  <div className="text-xs text-slate-500">aeronaves</div>
                </div>
                {expandedCountry === country.country_code ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Lista de aeronaves del país */}
            {expandedCountry === country.country_code && (
              <div className="border-t border-slate-700 bg-slate-900/50">
                {loadingCountry ? (
                  <div className="p-4 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Cargando aeronaves...
                  </div>
                ) : countryAircraft.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Sin aeronaves registradas en este país
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {countryAircraft.map((presence) => (
                      <div
                        key={presence.id}
                        onClick={() => presence.aircraft && onSelectAircraft(presence.aircraft)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Plane className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-sky-400">
                              {presence.icao24}
                            </span>
                            {presence.is_currently_present && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white truncate">
                            {presence.aircraft?.aircraft_model || presence.aircraft?.aircraft_type || 'Tipo desconocido'}
                          </div>
                          <div className="text-xs text-slate-400">
                            Visto {presence.total_sightings}x · Último: {new Date(presence.last_seen_in_country).toLocaleDateString('es-VE')}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

