import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X, Clock, MapPin, ExternalLink, FileText, Tag, Shield, Activity } from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEventsContext } from '../../stores/EventsContext';
import { useUserRole } from '../../hooks/useUserRole';
import EventDetailsModal from './EventDetailsModal';
import AddEventModal from '../Timeline/AddEventModal';

/**
 * Vista Diaria - Panel superpuesto fullscreen (como Timeline)
 * Split 50/50: Mapa se ve a la izquierda (sin mover), Eventos a la derecha
 */
export default function DailyView({ onClose, mapInstance }) {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEventsContext();
  const { canEditEvents, canDeleteEvents } = useUserRole();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(10);
  const eventsContainerRef = useRef(null);

  // Filtrar eventos del día actual
  const todayEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    return events.filter(event => {
      if (!event || !event.event_date) return false;
      const eventDateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      return eventDateKey === dateKey;
    }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }, [events, currentDate]);

  // Estadísticas
  const eventStats = useMemo(() => {
    const stats = { total: todayEvents.length, urgente: 0, importante: 0, normal: 0 };
    todayEvents.forEach(event => {
      const priority = event.priority_level || 'normal';
      stats[priority]++;
    });
    return stats;
  }, [todayEvents]);

  // Paginación
  const totalPages = Math.ceil(todayEvents.length / eventsPerPage);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return todayEvents.slice(startIndex, startIndex + eventsPerPage);
  }, [todayEvents, currentPage, eventsPerPage]);

  // Reset página al cambiar día
  useEffect(() => {
    setCurrentPage(1);
  }, [currentDate]);

  // Calcular eventos por página dinámicamente basado en altura real
  useEffect(() => {
    // Refs para almacenar timeoutIds y evitar memory leaks
    const timeoutIds = new Set();
    
    const calculateEventsPerPage = () => {
      if (!eventsContainerRef.current) return;
      
      const container = eventsContainerRef.current;
      const containerHeight = container.clientHeight;
      
      // Obtener altura real de las tarjetas si existen
      const eventCards = container.querySelectorAll('.event-card');
      let avgEventHeight = 200; // Altura base estimada más realista
      
      if (eventCards.length > 0) {
        // Calcular promedio de altura real de las tarjetas existentes
        const heights = Array.from(eventCards).map(card => card.offsetHeight);
        avgEventHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
      }
      
      // Agregar margen entre tarjetas (gap-3 = 12px)
      const cardWithGap = avgEventHeight + 12;
      
      // Calcular cuántas tarjetas caben
      const canFit = Math.floor(containerHeight / cardWithGap);
      
      // Si caben todos los eventos, no paginar
      const newEventsPerPage = todayEvents.length <= canFit 
        ? todayEvents.length || 50  // Mostrar todos si caben
        : Math.max(3, canFit); // Sino, calcular cuántos caben
      
      if (newEventsPerPage !== eventsPerPage) {
        setEventsPerPage(newEventsPerPage);
        setCurrentPage(1);
      }
    };

    // Handler estable para ResizeObserver que trackea timeouts
    const handleResize = () => {
      const timeoutId = setTimeout(() => {
        calculateEventsPerPage();
        timeoutIds.delete(timeoutId);
      }, 100);
      timeoutIds.add(timeoutId);
    };

    // Esperar un tick para que el DOM se actualice
    const initialTimeoutId = setTimeout(calculateEventsPerPage, 100);
    timeoutIds.add(initialTimeoutId);
    
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (eventsContainerRef.current) {
      resizeObserver.observe(eventsContainerRef.current);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      // Cancelar TODOS los timeouts pendientes
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.clear();
      
      // Desconectar observer
      resizeObserver.disconnect();
      
      // Remover listener con la MISMA referencia de función
      window.removeEventListener('resize', handleResize);
    };
  }, [eventsPerPage, todayEvents.length]);

  // Navegación
  const goToPreviousDay = () => setCurrentDate(prev => subDays(prev, 1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Ver evento en mapa
  const handleViewOnMap = (event) => {
    if (!mapInstance || !event.latitude || !event.longitude) return;
    mapInstance.flyTo({
      center: [event.longitude, event.latitude],
      zoom: 12,
      duration: 1500
    });
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (eventId) => {
    await deleteEvent(eventId);
    setSelectedEvent(null);
  };

  // Componente de tarjeta de evento - PROFESIONAL PARA CAPTURA
  const EventCard = ({ event }) => {
    const priorityConfig = {
      urgente: { bg: 'bg-red-600', text: 'text-white', icon: '🚨', label: 'URGENTE' },
      importante: { bg: 'bg-yellow-600', text: 'text-white', icon: '⚠️', label: 'IMPORTANTE' },
      normal: { bg: 'bg-slate-600', text: 'text-white', icon: '📋', label: 'NORMAL' }
    };
    const config = priorityConfig[event.priority_level || 'normal'];

    const typeConfig = {
      evento: { icon: '🎯', color: 'text-blue-400', label: 'Evento' },
      noticia: { icon: '📰', color: 'text-amber-400', label: 'Noticia' },
      informe: { icon: '📄', color: 'text-purple-400', label: 'Informe' }
    };
    const typeInfo = typeConfig[event.event_type] || typeConfig.evento;

    return (
      <div
        onClick={() => setSelectedEvent(event)}
        className="event-card bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-slate-700 hover:border-blue-500/70 transition-all cursor-pointer shadow-xl hover:shadow-blue-500/30 overflow-hidden"
      >
        <div className="p-4">
          {/* Header con badges - SIEMPRE ARRIBA */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* Tipo */}
            <span className={`bg-slate-700 px-2 py-0.5 rounded text-xs font-bold ${typeInfo.color} border border-slate-600`}>
              {typeInfo.icon} {typeInfo.label.toUpperCase()}
            </span>
            
            {/* Prioridad */}
            <span className={`${config.bg} ${config.text} px-2 py-0.5 rounded text-xs font-bold`}>
              {config.icon} {config.label}
            </span>
            
            {/* Confiabilidad */}
            {event.reliability_level && (
              <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/50">
                <Shield size={11} className="inline mr-0.5" />
                {event.reliability_level.toUpperCase()}
              </span>
            )}
          </div>

          {/* Contenido principal: Imagen + Texto en fila responsive */}
          <div className="flex gap-3">
            {/* Imagen - Tamaño fijo responsivo */}
            {event.image_url && (
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-slate-600">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Contenido de texto */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Título */}
              <h3 className="text-white font-bold text-sm mb-2 uppercase leading-tight">{event.title}</h3>

              {/* Metadata compacta */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-blue-400" />
                  <span>{format(new Date(event.event_date), "d MMM yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-green-400" />
                  <span>{format(new Date(event.event_date), "HH:mm")}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-red-400" />
                    <span className="truncate max-w-[120px]">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Descripción - completa sin recortar */}
              {event.description && (
                <p className="text-slate-300 text-xs leading-relaxed text-justify">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Link externo si existe */}
          {event.link && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <a 
                href={event.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={11} />
                Ver fuente
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Panel principal - Split 50/50 */}
      <div className="fixed inset-0 top-14 z-[50] flex daily-view-active pointer-events-none">
        {/* Panel Izquierdo - Transparente (el mapa interactivo) */}
        <div className="w-1/2" />

        {/* Panel Derecho - Eventos */}
        <div className="w-1/2 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col pointer-events-auto border-l border-slate-700">
          {/* Header - Solo Fecha y Estadísticas */}
          <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b-2 border-blue-500/30 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-2xl">
            {/* Navegación de Fecha */}
            <div className="flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-600">
              <button onClick={goToPreviousDay} className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-300 hover:text-white">
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-3 px-2">
                <Calendar size={18} className="text-blue-400" />
                <h2 className="text-base font-bold text-white capitalize whitespace-nowrap">
                  {format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </h2>
                {isToday(currentDate) && <span className="text-xs text-blue-400 font-semibold">• Hoy</span>}
              </div>
              
              <button onClick={goToNextDay} className="p-1 hover:bg-slate-600 rounded transition-colors text-slate-300 hover:text-white">
                <ChevronRight size={18} />
              </button>
              
              <button onClick={goToToday} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold ml-2 border border-blue-500">
                Hoy
              </button>
            </div>

            {/* Estadísticas + Cerrar */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-700/50 px-3 py-1.5 rounded border border-slate-600 flex items-center gap-1.5">
                <span className="text-slate-400 text-xs">Total:</span>
                <span className="font-bold text-white text-base">{eventStats.total}</span>
              </div>
              
              {eventStats.urgente > 0 && (
                <div className="bg-red-900/30 px-2.5 py-1.5 rounded border border-red-600/50 flex items-center gap-1">
                  <span className="text-red-400 font-bold text-sm">{eventStats.urgente}</span>
                  <span className="text-xs">🚨</span>
                </div>
              )}
              
              {eventStats.importante > 0 && (
                <div className="bg-yellow-900/30 px-2.5 py-1.5 rounded border border-yellow-600/50 flex items-center gap-1">
                  <span className="text-yellow-400 font-bold text-sm">{eventStats.importante}</span>
                  <span className="text-xs">⚠️</span>
                </div>
              )}
              
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-600/20 rounded transition-colors text-slate-400 hover:text-red-400 border border-transparent hover:border-red-600/50"
                title="Cerrar Vista Diaria"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lista de eventos */}
          <div ref={eventsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : paginatedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Calendar size={48} className="mb-3 opacity-50" />
                <p className="text-sm">Sin eventos este día</p>
              </div>
            ) : (
              paginatedEvents.map(event => <EventCard key={event.id} event={event} />)
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="border-t border-slate-700 px-4 py-3 flex items-center justify-between bg-slate-900/50">
              <span className="text-xs text-slate-400">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {eventToEdit && (
        <AddEventModal
          event={eventToEdit}
          onClose={() => setEventToEdit(null)}
          onCreate={createEvent}
          onUpdate={updateEvent}
        />
      )}
    </>
  );
}

