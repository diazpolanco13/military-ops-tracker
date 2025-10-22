import { useState, useMemo } from 'react';
import { X, RefreshCw, Filter, TrendingUp, Search, Play, Calendar, AlertCircle, Plus } from 'lucide-react';
import { useIntelligenceEvents } from '../../hooks/useIntelligenceEvents';
import IntelligenceEventCard from './IntelligenceEventCard';
import AddManualEvent from './AddManualEvent';

/**
 * 📡 Intelligence Feed - Modal Central Tipo X
 * Feed visual de eventos de inteligencia con filtros temporales
 */
export default function IntelligenceFeed({ onClose, map }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCredibility, setFilterCredibility] = useState('all');
  const [timeRange, setTimeRange] = useState('all'); // all, 7d, 30d, 90d
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);

  // Construir filtros para el hook
  const filters = {};
  if (filterStatus !== 'all') filters.status = filterStatus;
  if (filterPriority !== 'all') filters.priority = filterPriority;
  if (filterCredibility !== 'all') filters.source_credibility = filterCredibility;

  const {
    events,
    loading,
    error,
    unreadCount,
    refetch,
    verifyEvent,
    dismissEvent,
    markAsActioned,
    runMonitor,
    runRSSMonitor
  } = useIntelligenceEvents(filters);

  // Filtrar por tiempo y búsqueda
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filtro temporal
    if (timeRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeRange) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter(e => new Date(e.event_date) >= cutoffDate);
    }

    // Filtro de búsqueda
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.mentioned_entities?.some(ent => ent.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [events, timeRange, searchQuery]);

  // Manejar verificación
  const handleVerify = async (eventId) => {
    await verifyEvent(eventId);
  };

  // Manejar descarte
  const handleDismiss = async (eventId) => {
    await dismissEvent(eventId);
  };

  // Ver en mapa
  const handleViewOnMap = (event) => {
    if (event.suggested_location && map) {
      const { lat, lng } = event.suggested_location;
      
      // Fly to location
      map.flyTo({
        center: [lng, lat],
        zoom: 10,
        duration: 2000
      });

      // Crear marcador temporal
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-purple-500 rounded-full animate-ping';
      
      // TODO: Agregar marcador temporal en el mapa
      
      onClose(); // Cerrar el drawer para ver el mapa
    }
  };

  // Ejecutar monitor RSS de noticias
  const handleRunMonitor = async () => {
    const result = await runRSSMonitor();
    if (result.success) {
      alert(`✅ Monitor RSS ejecutado!\n\n📰 Feeds revisados: ${result.stats.feeds_checked}\n📋 Noticias encontradas: ${result.stats.news_found}\n✅ Eventos guardados: ${result.stats.events_saved}`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
        onClick={onClose}
      ></div>

      {/* Modal Central Grande Tipo X - Con margen para navbar */}
      <div className="fixed w-[95vw] max-w-[1200px] bg-slate-900/98 border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/30 z-50 flex flex-col overflow-hidden"
           style={{ 
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%)',
             maxHeight: 'calc(100vh - 80px)',
             marginTop: '8px',
             animation: 'scaleIn 0.2s ease-out'
           }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Intelligence Feed</h2>
                <p className="text-purple-300 text-xs">Powered by Grok AI • RSS Feeds + Manual</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botón Agregar Manual */}
              <button
                onClick={() => setShowAddManual(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-sm transition-colors flex items-center space-x-2"
                title="Agregar evento manual"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-purple-400" />
              </button>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
              <div className="text-slate-400 text-xs">Total</div>
              <div className="text-white font-bold text-lg">{events.length}</div>
            </div>
            <div className="bg-yellow-900/20 rounded-lg px-3 py-2 border border-yellow-500/30">
              <div className="text-yellow-400/70 text-xs">Pendientes</div>
              <div className="text-yellow-400 font-bold text-lg">{unreadCount}</div>
            </div>
            <div className="bg-green-900/20 rounded-lg px-3 py-2 border border-green-500/30">
              <div className="text-green-400/70 text-xs">Verificados</div>
              <div className="text-green-400 font-bold text-lg">
                {events.filter(e => e.status === 'verified').length}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar de búsqueda y filtros */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
          {/* Filtros de Tiempo - Prominentes tipo tabs */}
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <div className="flex space-x-2 flex-1">
              {[
                { value: 'all', label: 'Todo el tiempo' },
                { value: '7d', label: 'Últimos 7 días' },
                { value: '30d', label: 'Últimos 30 días' },
                { value: '90d', label: 'Últimos 90 días' }
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    timeRange === range.value
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Búsqueda y filtros secundarios */}
          <div className="grid grid-cols-4 gap-3">
            {/* Búsqueda */}
            <div className="col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, entidad..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all">📊 Todos los estados</option>
              <option value="pending">🟡 Pendientes</option>
              <option value="verified">✅ Verificados</option>
              <option value="dismissed">❌ Descartados</option>
              <option value="actioned">🎯 Accionados</option>
            </select>

            {/* Prioridad */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all">⚡ Todas</option>
              <option value="urgent">🔴 Urgente</option>
              <option value="high">🟠 Alta</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🟢 Baja</option>
            </select>
          </div>

          {/* Botón ejecutar monitor RSS */}
          <button
            onClick={handleRunMonitor}
            disabled={loading}
            className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-lg text-white text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-lg disabled:shadow-none"
          >
            <Play className="w-4 h-4" />
            <span>📰 Buscar Noticias Militares (RSS + Grok)</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </button>
          <p className="text-center text-slate-500 text-xs mt-2">
            Parsea Defense News, USNI, Reuters y analiza con Grok AI
          </p>
        </div>

        {/* Feed de eventos tipo X - Layout de columnas */}
        <div className="flex-1 overflow-y-auto px-6 py-4 modern-scrollbar">
          <div className="max-w-5xl mx-auto">
          {loading && events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <RefreshCw className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-slate-400 text-sm">Cargando eventos de inteligencia...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <X className="w-12 h-12 text-red-400" />
              <p className="text-red-400 text-sm">Error: {error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-red-600/20 border border-red-500 rounded-lg text-red-400 text-sm hover:bg-red-600/30"
              >
                Reintentar
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Filter className="w-12 h-12 text-slate-600" />
              <p className="text-slate-400 text-sm">No hay eventos {filterStatus !== 'all' ? `con estado "${filterStatus}"` : ''}</p>
              <p className="text-slate-500 text-xs">El monitor se ejecuta cada 6 horas automáticamente</p>
              <button
                onClick={handleRunMonitor}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-bold transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Ejecutar Ahora</span>
              </button>
            </div>
          ) : (
            <>
              {/* Contador de resultados */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/30">
                <div className="text-slate-400 text-sm">
                  Mostrando <span className="text-white font-bold">{filteredEvents.length}</span> de {events.length} eventos
                  {timeRange !== 'all' && (
                    <span className="ml-2 text-purple-400">
                      ({timeRange === '7d' ? 'última semana' : timeRange === '30d' ? 'último mes' : 'últimos 3 meses'})
                    </span>
                  )}
                </div>
                <button
                  onClick={refetch}
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm"
                  title="Refrescar"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualizar</span>
                </button>
              </div>

              {/* Grid de eventos tipo feed */}
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <IntelligenceEventCard
                    key={event.id}
                    event={event}
                    onVerify={handleVerify}
                    onDismiss={handleDismiss}
                    onViewOnMap={handleViewOnMap}
                    onAction={(action) => markAsActioned(event.id, action)}
                  />
                ))}
              </div>
            </>
          )}
          </div>
        </div>

        {/* Footer con info */}
        <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/50">
          <div className="text-slate-400 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span>🔄 Actualización automática cada 6 horas</span>
              <button
                onClick={refetch}
                className="text-purple-400 hover:text-purple-300 transition-colors"
                title="Refrescar ahora"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>💡 Los eventos se detectan automáticamente de X (Twitter) y noticias</div>
          </div>
        </div>
      </div>

      {/* Modal de Agregar Evento Manual */}
      {showAddManual && (
        <AddManualEvent 
          onClose={() => setShowAddManual(false)}
          onEventAdded={() => {
            setShowAddManual(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

