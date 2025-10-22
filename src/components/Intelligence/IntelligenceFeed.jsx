import { useState } from 'react';
import { X, RefreshCw, Filter, TrendingUp, Search, Play } from 'lucide-react';
import { useIntelligenceEvents } from '../../hooks/useIntelligenceEvents';
import IntelligenceEventCard from './IntelligenceEventCard';

/**
 * 📡 Intelligence Feed - Drawer lateral derecho
 * Panel completo de eventos de inteligencia detectados por Grok
 */
export default function IntelligenceFeed({ onClose, map }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCredibility, setFilterCredibility] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    runMonitor
  } = useIntelligenceEvents(filters);

  // Filtrar por búsqueda en el frontend
  const filteredEvents = searchQuery
    ? events.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.mentioned_entities?.some(ent => ent.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : events;

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

  // Ejecutar monitor manualmente
  const handleRunMonitor = async () => {
    const result = await runMonitor();
    if (result.success) {
      alert(`✅ Monitor ejecutado: ${result.stats.events_detected} eventos detectados`);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Drawer desde la derecha */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-slate-900/98 border-l-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 z-50 flex flex-col animate-slideInRight">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Intelligence Feed</h2>
                <p className="text-purple-300 text-xs">Powered by Grok AI</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-purple-400" />
            </button>
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
        <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800/30 space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Filtros */}
          <div className="flex space-x-2">
            {/* Estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="verified">Verificados</option>
              <option value="dismissed">Descartados</option>
              <option value="actioned">Accionados</option>
            </select>

            {/* Prioridad */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="all">Todas</option>
              <option value="urgent">🔴 Urgente</option>
              <option value="high">🟠 Alta</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🟢 Baja</option>
            </select>
          </div>

          {/* Botón ejecutar monitor */}
          <button
            onClick={handleRunMonitor}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 rounded-lg text-white text-sm font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Ejecutar Monitor Ahora</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </button>
        </div>

        {/* Lista de eventos */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 modern-scrollbar">
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
              <div className="text-slate-400 text-xs pb-2 border-b border-slate-700/30">
                Mostrando {filteredEvents.length} de {events.length} eventos
              </div>

              {/* Cards de eventos */}
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
            </>
          )}
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
    </>
  );
}

