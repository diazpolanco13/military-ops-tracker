import { useState, useMemo } from 'react';
import { X, RefreshCw, Filter, TrendingUp, Search, Play, Calendar, AlertCircle, Plus, ChevronDown, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useIntelligenceEvents } from '../../hooks/useIntelligenceEvents';
import IntelligenceEventCard from './IntelligenceEventCard';
import AddManualEvent from './AddManualEvent';

/**
 * 📡 Intelligence Feed - Panel Lateral Deslizante
 * Diseño moderno y compacto que no ocupa toda la pantalla
 */
export default function IntelligenceFeedPanel({ onClose, map }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');
  const [filterSource, setFilterSource] = useState('all'); // 🆕 Filtro por fuente (all, twitter, manual)
  const [timeRange, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorResult, setMonitorResult] = useState(null);

  const filters = {};
  if (filterStatus !== 'all') filters.status = filterStatus;
  if (filterPriority !== 'all') filters.priority = filterPriority;
  if (filterEventType !== 'all') filters.event_type = filterEventType;

  const {
    events,
    loading,
    error,
    unreadCount,
    refetch,
    verifyEvent,
    dismissEvent,
    markAsActioned,
    runRSSMonitor,
    runXMonitor
  } = useIntelligenceEvents(filters);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // 🆕 Filtro por fuente (all, twitter_auto, twitter_manual)
    if (filterSource === 'twitter_auto') {
      // Eventos automáticos de X (source_type: twitter y source_author NO es "Manual")
      filtered = filtered.filter(e => e.source_type === 'twitter' && !e.source_author?.includes('Manual'));
    } else if (filterSource === 'twitter_manual') {
      // Eventos manuales de X (source_type: twitter y source_author incluye "Manual")
      filtered = filtered.filter(e => e.source_type === 'twitter' && e.source_author?.includes('Manual'));
    }

    if (timeRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      switch (timeRange) {
        case '7d': cutoffDate.setDate(now.getDate() - 7); break;
        case '30d': cutoffDate.setDate(now.getDate() - 30); break;
        case '90d': cutoffDate.setDate(now.getDate() - 90); break;
      }
      filtered = filtered.filter(e => new Date(e.event_date) >= cutoffDate);
    }

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.mentioned_entities?.some(ent => ent.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [events, timeRange, searchQuery, filterSource]);

  const handleVerify = async (eventId) => await verifyEvent(eventId);
  const handleDismiss = async (eventId) => await dismissEvent(eventId);

  const handleViewOnMap = (event) => {
    if (event.suggested_location && map) {
      const { lat, lng } = event.suggested_location;
      // Zoom 7 = ~100-150km (más razonable que zoom 10)
      map.flyTo({ center: [lng, lat], zoom: 7, duration: 2000 });
      onClose();
    }
  };

  const handleRunRSSMonitor = async () => {
    setMonitorLoading(true);
    setMonitorResult(null);
    try {
      const result = await runRSSMonitor();
      setMonitorResult({
        type: 'rss',
        success: result.success,
        stats: result.stats,
        error: result.error
      });
      // Auto-refrescar eventos después de 2 segundos
      if (result.success) {
        setTimeout(() => refetch(), 2000);
      }
    } catch (err) {
      setMonitorResult({
        type: 'rss',
        success: false,
        error: err.message
      });
    } finally {
      setMonitorLoading(false);
    }
  };

  const handleRunXMonitor = async () => {
    setMonitorLoading(true);
    setMonitorResult(null);
    try {
      const result = await runXMonitor();
      setMonitorResult({
        type: 'twitter',
        success: result.success,
        stats: result.stats,
        error: result.error,
        message: result.message
      });
      // Auto-refrescar eventos después de 2 segundos
      if (result.success) {
        setTimeout(() => refetch(), 2000);
      }
    } catch (err) {
      setMonitorResult({
        type: 'twitter',
        success: false,
        error: err.message
      });
    } finally {
      setMonitorLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Panel Lateral - Slide desde derecha */}
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-l border-red-500/30 flex flex-col animate-slide-in-right">
        
        {/* Header Compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/20 bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-sm">
          <div className="flex items-center space-x-2 flex-1">
            <div className="p-1.5 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-red-300">SAE - Feed de Inteligencia</h2>
              <p className="text-[10px] text-slate-400">🌐 Traducción automática • Cache inteligente</p>
            </div>
          </div>

          {/* Stats Inline - Mostrando filtrados */}
          <div className="flex items-center space-x-3 mr-3">
            <div className="text-center">
              <div className="text-xs text-slate-400">
                {filterSource === 'all' ? 'Total' : filterSource === 'twitter_auto' ? '🤖 X Auto' : '✍️ Manual'}
              </div>
              <div className="text-sm font-bold text-white">{filteredEvents.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-yellow-400">Pendientes</div>
              <div className="text-sm font-bold text-yellow-400">
                {filteredEvents.filter(e => e.status === 'pending').length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-green-400">Verificados</div>
              <div className="text-sm font-bold text-green-400">
                {filteredEvents.filter(e => e.status === 'verified').length}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Compacto */}
        <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
          {/* 🆕 Tabs de Fuente (Todos / X Automático / X Manual) */}
          <div className="flex items-center space-x-2 mb-3">
            {[
              { value: 'all', label: '📊 Todos' },
              { value: 'twitter_auto', label: '🤖 X Auto' },
              { value: 'twitter_manual', label: '✍️ Manual' }
            ].map(source => (
              <button
                key={source.value}
                onClick={() => setFilterSource(source.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterSource === source.value
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {source.label}
              </button>
            ))}
          </div>

          {/* Tabs de Tiempo - Filtrado LOCAL (no API) */}
          <div className="flex items-center space-x-1 mb-2">
            {[
              { value: 'all', label: 'Todos', icon: '∞' },
              { value: '7d', label: 'Últimos 7d' },
              { value: '30d', label: 'Últimos 30d' },
              { value: '90d', label: 'Últimos 90d' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  timeRange === range.value
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {range.icon || ''} {range.label}
              </button>
            ))}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                showFilters ? 'bg-red-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Filtros</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filtros Colapsables */}
          {showFilters && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="verified">Verificados</option>
                <option value="dismissed">Descartados</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
              >
                <option value="all">Todas</option>
                <option value="urgent">🔴 Urgente</option>
                <option value="high">🟠 Alta</option>
                <option value="medium">🟡 Media</option>
                <option value="low">🟢 Baja</option>
              </select>

              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
              >
                <option value="all">Todos</option>
                <option value="military_strike">⚔️ Ataques</option>
                <option value="counter_narcotics">💊 Anti-Narco</option>
                <option value="deployment">🚢 Despliegues</option>
                <option value="exercise">🎖️ Ejercicios</option>
              </select>
            </div>
          )}

          {/* Búsqueda */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 text-xs"
            />
          </div>

          {/* Botón de Monitor X - Solo visible en tab X Auto */}
          {filterSource === 'twitter_auto' && (
            <div className="mb-2">
              <button
                onClick={handleRunXMonitor}
                disabled={monitorLoading}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 rounded-lg text-white text-sm font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg relative overflow-hidden"
              >
                {monitorLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Ejecutando Monitor...</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>🐦 Ejecutar Monitor de X (Twitter)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                🌐 Traducción automática al español • Cuentas oficiales del DoD
              </p>
            </div>
          )}

          {/* Botón Agregar Manual - Solo visible en tab Manual */}
          {filterSource === 'twitter_manual' && (
            <div className="mb-2">
              <button
                onClick={() => setShowAddManual(true)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>✍️ Agregar Evento Manual</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Ingresa eventos de inteligencia manualmente
              </p>
            </div>
          )}
        </div>

        {/* Lista de Eventos */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 modern-scrollbar">
          {loading && events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-slate-400 text-sm">Cargando...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Filter className="w-8 h-8 text-slate-600" />
              <p className="text-slate-400 text-sm">No hay eventos</p>
            </div>
          ) : (
            <>
              <div className="text-slate-400 text-xs mb-2">
                Mostrando <span className="text-white font-bold">{filteredEvents.length}</span> de {events.length}
              </div>
              {filteredEvents.map((event) => (
                <IntelligenceEventCard
                  key={event.id}
                  event={event}
                  onVerify={handleVerify}
                  onDismiss={handleDismiss}
                  onViewOnMap={handleViewOnMap}
                  onAction={(action) => markAsActioned(event.id, action)}
                  compact={false}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/50 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>🔄 Actualización automática cada 6h</span>
            <button
              onClick={refetch}
              className="text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Agregar Manual */}
      {showAddManual && (
        <AddManualEvent 
          onClose={() => setShowAddManual(false)}
          onEventAdded={() => {
            setShowAddManual(false);
            refetch();
          }}
        />
      )}

      {/* Modal de Resultados del Monitor */}
      {monitorResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMonitorResult(null)}
          ></div>

          {/* Modal */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 max-w-md w-full mx-4 overflow-hidden animate-scale-in"
               style={{ borderColor: monitorResult.success ? '#10b981' : '#ef4444' }}>
            
            {/* Header con resultado */}
            <div className={`px-6 py-4 flex items-center gap-4 ${
              monitorResult.success 
                ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30' 
                : 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30'
            }`}>
              {monitorResult.success ? (
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {monitorResult.success ? '✅ Monitor Ejecutado' : '❌ Error en Monitor'}
                </h3>
                <p className="text-sm text-slate-400">
                  {monitorResult.type === 'twitter' ? '🐦 X (Twitter)' : '📰 RSS Feeds'}
                </p>
              </div>
              <button
                onClick={() => setMonitorResult(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="px-6 py-6">
              {monitorResult.success ? (
                <div className="space-y-4">
                  {/* Estadísticas */}
                  {monitorResult.type === 'twitter' && monitorResult.stats && (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-2xl font-bold text-cyan-400">
                          {monitorResult.stats.tweets_found || 0}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Tweets</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-2xl font-bold text-green-400">
                          {monitorResult.stats.tweets_new || 0}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Nuevos</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-2xl font-bold text-purple-400">
                          {monitorResult.stats.events_created || 0}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Eventos</div>
                      </div>
                      {monitorResult.stats.events_duplicate > 0 && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-yellow-700/50">
                          <div className="text-2xl font-bold text-yellow-400">
                            {monitorResult.stats.events_duplicate}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Duplicados</div>
                        </div>
                      )}
                    </div>
                  )}

                  {monitorResult.type === 'rss' && monitorResult.stats && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-2xl font-bold text-orange-400">
                          {monitorResult.stats.articles_processed || 0}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Artículos</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="text-2xl font-bold text-green-400">
                          {monitorResult.stats.events_created || 0}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Eventos</div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje adicional */}
                  {monitorResult.message && (
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700">
                      <p className="text-sm text-slate-300">{monitorResult.message}</p>
                    </div>
                  )}

                  {/* Indicador de actualización */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Actualizando lista de eventos...</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{monitorResult.error || 'Error desconocido'}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setMonitorResult(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

