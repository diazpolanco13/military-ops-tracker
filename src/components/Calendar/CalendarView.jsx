import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Search, Filter, Plus, Grid3x3, Columns, LayoutGrid } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks
} from 'date-fns';
import CalendarDayCell from './CalendarDayCell';
import EventDayModal from './EventDayModal';
import AddEventModal from '../Timeline/AddEventModal';

/**
 * Vista de Calendario Mensual con análisis de eventos
 * Muestra densidad de eventos por día con heatmap
 * Click en día → Modal con Kanban de eventos
 */
export default function CalendarView({ events = [], loading, onClose, onEditEvent, onDeleteEvent, onCreateEvent }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); // all, urgente, importante, normal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'search-results'
  const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'semester'
  const [selectedEventFromSemester, setSelectedEventFromSemester] = useState(null);

  // Generar días/meses del calendario según el tipo de vista
  const calendarDays = useMemo(() => {
    try {
      if (calendarView === 'month') {
        // Vista mensual: 7×6 grid (días)
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      } else if (calendarView === 'week') {
        // Vista semanal: 7 días
        const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      } else {
        // Vista semestral: 6 meses
        return [];
      }
    } catch (error) {
      console.error('Error generating calendar days:', error);
      return [];
    }
  }, [currentMonth, calendarView]);

  // Generar meses para vista semestral
  const semesterMonths = useMemo(() => {
    if (calendarView !== 'semester') return [];
    
    try {
      // Obtener el semestre actual (Enero-Junio o Julio-Diciembre)
      const currentMonthNum = currentMonth.getMonth(); // 0-11
      const currentYear = currentMonth.getFullYear();
      
      // Primer semestre: Enero-Junio (meses 0-5)
      // Segundo semestre: Julio-Diciembre (meses 6-11)
      const isFirstSemester = currentMonthNum < 6;
      const startMonth = isFirstSemester ? 0 : 6;
      const endMonth = isFirstSemester ? 5 : 11;
      
      const semesterStart = new Date(currentYear, startMonth, 1);
      const semesterEnd = new Date(currentYear, endMonth, 1);
      
      return eachMonthOfInterval({ start: semesterStart, end: semesterEnd });
    } catch (error) {
      console.error('Error generating semester months:', error);
      return [];
    }
  }, [currentMonth, calendarView]);

  // Filtrar eventos según búsqueda y prioridad
  const filteredEvents = useMemo(() => {
    let filtered = events || [];
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term) ||
        event.tags?.some(tag => tag.toLowerCase().includes(term))
      );
      
      // Cambiar a vista de resultados si hay búsqueda activa
      if (filtered.length > 0) {
        setViewMode('search-results');
      }
    } else {
      setViewMode('calendar');
    }
    
    // Filtrar por prioridad
    if (filterPriority !== 'all') {
      filtered = filtered.filter(event => 
        event.priority_level === filterPriority || 
        (!event.priority_level && filterPriority === 'normal')
      );
    }
    
    return filtered;
  }, [events, searchTerm, filterPriority]);

  // Agrupar eventos filtrados por día
  const eventsByDay = useMemo(() => {
    const grouped = {};
    
    if (!filteredEvents || !Array.isArray(filteredEvents)) {
      return grouped;
    }
    
    filteredEvents.forEach(event => {
      if (!event || !event.event_date) return;
      
      try {
        const eventDate = new Date(event.event_date);
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      } catch (error) {
        console.error('Error processing event date:', error, event);
      }
    });

    return grouped;
  }, [filteredEvents]);

  // Obtener eventos de un día específico
  const getEventsForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsByDay[dateKey] || [];
  };

  // Agrupar eventos filtrados por mes y día (para vista de búsqueda)
  const eventsByMonthAndDay = useMemo(() => {
    const grouped = {};
    
    filteredEvents.forEach(event => {
      if (!event || !event.event_date) return;
      
      try {
        const eventDate = new Date(event.event_date);
        const monthKey = format(eventDate, 'yyyy-MM');
        const dayKey = format(eventDate, 'yyyy-MM-dd');
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = {};
        }
        if (!grouped[monthKey][dayKey]) {
          grouped[monthKey][dayKey] = [];
        }
        grouped[monthKey][dayKey].push(event);
      } catch (error) {
        console.error('Error grouping event:', error);
      }
    });
    
    return grouped;
  }, [filteredEvents]);

  // Navegación adaptativa según vista
  const goToPrevious = () => {
    if (calendarView === 'month') {
      setCurrentMonth(prev => subMonths(prev, 1));
    } else if (calendarView === 'week') {
      setCurrentMonth(prev => subWeeks(prev, 1));
    } else {
      // Vista semestral: retroceder 6 meses
      setCurrentMonth(prev => subMonths(prev, 6));
    }
    setViewMode('calendar');
  };

  const goToNext = () => {
    if (calendarView === 'month') {
      setCurrentMonth(prev => addMonths(prev, 1));
    } else if (calendarView === 'week') {
      setCurrentMonth(prev => addWeeks(prev, 1));
    } else {
      // Vista semestral: avanzar 6 meses
      setCurrentMonth(prev => addMonths(prev, 6));
    }
    setViewMode('calendar');
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setViewMode('calendar');
  };

  // Obtener el título según la vista
  const getViewTitle = () => {
    if (calendarView === 'month') {
      return format(currentMonth, 'MMMM yyyy');
    } else if (calendarView === 'week') {
      const weekStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
      return `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
    } else {
      // Vista semestral
      const currentMonthNum = currentMonth.getMonth();
      const isFirstSemester = currentMonthNum < 6;
      const year = currentMonth.getFullYear();
      return isFirstSemester 
        ? `Primer Semestre ${year} (Ene-Jun)` 
        : `Segundo Semestre ${year} (Jul-Dic)`;
    }
  };

  // Handler para click en día
  const handleDayClick = (day, dayEvents) => {
    if (dayEvents.length > 0) {
      setSelectedDate(day);
    }
  };

  // Días de la semana
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon size={24} className="text-blue-400" />
          <h2 className="text-xl font-bold text-white">
            Vista de Calendario
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navegación, búsqueda y filtros - TODO EN UNA FILA */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3 flex items-center gap-3">
        {/* Selector de tipo de vista */}
        <div className="flex gap-1 bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setCalendarView('semester')}
            className={`p-2 rounded transition-colors ${
              calendarView === 'semester' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Vista semestral (6 meses)"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setCalendarView('month')}
            className={`p-2 rounded transition-colors ${
              calendarView === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Vista mensual"
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => setCalendarView('week')}
            className={`p-2 rounded transition-colors ${
              calendarView === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
            title="Vista semanal"
          >
            <Columns size={16} />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-700"></div>

        {/* Navegación adaptativa */}
        <button
          onClick={goToPrevious}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          title={calendarView === 'month' ? 'Mes anterior' : calendarView === 'week' ? 'Semana anterior' : 'Semestre anterior'}
        >
          <ChevronLeft size={20} />
        </button>
        
        <h3 className="text-lg font-semibold text-white min-w-[280px] text-center capitalize">
          {getViewTitle()}
        </h3>
        
        <button
          onClick={goToNext}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          title={calendarView === 'month' ? 'Mes siguiente' : calendarView === 'week' ? 'Semana siguiente' : 'Semestre siguiente'}
        >
          <ChevronRight size={20} />
        </button>

        <div className="h-6 w-px bg-slate-700"></div>

        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar eventos..."
            className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtro por prioridad */}
        <div className="flex gap-1 bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setFilterPriority('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterPriority === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterPriority('urgente')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterPriority === 'urgente' 
                ? 'bg-red-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🚨 Urgentes
          </button>
          <button
            onClick={() => setFilterPriority('importante')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filterPriority === 'importante' 
                ? 'bg-yellow-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ⚠️ Importantes
          </button>
        </div>

        <div className="h-6 w-px bg-slate-700"></div>

        {/* Contador de resultados */}
        <div className="text-xs text-slate-400 min-w-[120px] text-right">
          {(searchTerm || filterPriority !== 'all') ? (
            <>
              {filteredEvents.length} encontrado{filteredEvents.length !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              {events.length} total{events.length !== 1 ? 'es' : ''}
            </>
          )}
        </div>

        {/* Botón Hoy */}
        <button
          onClick={goToToday}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium whitespace-nowrap"
        >
          📅 Ir a Hoy
        </button>
      </div>

      {/* Vista condicional: Calendario o Resultados de Búsqueda */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar-transparent">
        {viewMode === 'search-results' ? (
          /* VISTA DE RESULTADOS DE BÚSQUEDA */
          <div className="max-w-5xl mx-auto space-y-6">
            {Object.entries(eventsByMonthAndDay)
              .sort(([a], [b]) => b.localeCompare(a)) // Orden descendente (más reciente primero)
              .map(([monthKey, days]) => {
                // Parsear correctamente el mes (formato: yyyy-MM)
                const [year, month] = monthKey.split('-');
                const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                const totalEvents = Object.values(days).flat().length;
                
                return (
                  <div key={monthKey} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                    {/* Header del mes */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-slate-800 px-5 py-3 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white capitalize">
                          {format(monthDate, 'MMMM yyyy')}
                        </h3>
                        <span className="text-sm text-slate-400">
                          {totalEvents} evento{totalEvents !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* Días con eventos */}
                    <div className="p-4 space-y-4">
                      {Object.entries(days)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([dayKey, dayEvents]) => {
                          // Parsear correctamente la fecha (formato: yyyy-MM-dd)
                          const [year, month, day] = dayKey.split('-');
                          const dayDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          
                          return (
                            <div key={dayKey} className="space-y-2">
                              {/* Header del día */}
                              <div 
                                className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/30 p-2 rounded-lg transition-colors"
                                onClick={() => setSelectedDate(dayDate)}
                              >
                                <div className="text-slate-400 text-sm font-medium min-w-[140px] capitalize">
                                  {format(dayDate, "EEEE d")}
                                </div>
                                <div className="flex-1 h-px bg-slate-700"></div>
                                <div className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                  {dayEvents.length}
                                </div>
                              </div>
                              
                              {/* Lista de eventos del día */}
                              <div className="pl-4 space-y-2">
                                {dayEvents.map(event => {
                                  const getPriorityColor = () => {
                                    switch (event.priority_level) {
                                      case 'urgente': return 'border-l-red-500 bg-red-950/20';
                                      case 'importante': return 'border-l-yellow-500 bg-yellow-950/20';
                                      default: return 'border-l-slate-600 bg-slate-800/30';
                                    }
                                  };
                                  
                                  return (
                                    <div
                                      key={event.id}
                                      onClick={() => {
                                        setSelectedDate(dayDate);
                                        // El EventDayModal se abrirá y desde ahí pueden ver detalles
                                      }}
                                      className={`border-l-4 ${getPriorityColor()} p-3 rounded-r-lg cursor-pointer hover:bg-slate-700/50 transition-colors`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className="text-lg">
                                          {event.type === 'evento' ? '🎯' : event.type === 'noticia' ? '📰' : '📄'}
                                        </span>
                                        <div className="flex-1">
                                          <h4 className="text-sm font-semibold text-white mb-1">{event.title}</h4>
                                          {event.description && (
                                            <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                                              {event.description}
                                            </p>
                                          )}
                                          <div className="flex gap-2 text-xs text-slate-500">
                                            <span>🕐 {format(new Date(event.event_date), 'HH:mm')}</span>
                                            {event.location && <span>📍 {event.location}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* VISTA DE CALENDARIO NORMAL */
          <div className="max-w-7xl mx-auto h-full flex flex-col">
          {/* Header de días de la semana - Solo en vista mensual y semanal */}
          {(calendarView === 'month' || calendarView === 'week') && (
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Grid adaptativo según vista */}
          {calendarView === 'semester' ? (
            /* VISTA SEMESTRAL: Grid 3×2 con meses extendidos verticalmente */
            <div className="grid grid-cols-3 gap-4 flex-1">
              {semesterMonths.map(monthDate => {
                // Contar eventos de todo el mes
                const monthKey = format(monthDate, 'yyyy-MM');
                const monthEvents = filteredEvents.filter(e => {
                  const eventMonth = format(new Date(e.event_date), 'yyyy-MM');
                  return eventMonth === monthKey;
                });

                return (
                  <div
                    key={monthKey}
                    onClick={() => {
                      setCurrentMonth(monthDate);
                      setCalendarView('month');
                    }}
                    className="bg-slate-800/50 border-2 border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:scale-105 transition-all flex flex-col"
                  >
                    {/* Header del mes */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-bold text-white capitalize">
                        {format(monthDate, 'MMMM')}
                      </h4>
                      {monthEvents.length > 0 && (
                        <div className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-400">
                          {monthEvents.length}
                        </div>
                      )}
                    </div>

                    {/* Lista de eventos del mes */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar-transparent space-y-2">
                      {monthEvents.map(event => {
                        const getPriorityColor = () => {
                          switch (event.priority_level) {
                            case 'urgente': return 'bg-red-600/90 text-white border-red-500';
                            case 'importante': return 'bg-yellow-600/90 text-white border-yellow-500';
                            default: return 'bg-slate-700/90 text-slate-200 border-slate-600';
                          }
                        };

                        const eventDate = new Date(event.event_date);

                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que se active el click del mes
                              setSelectedDate(eventDate);
                            }}
                            className={`${getPriorityColor()} px-3 py-2 rounded-lg border text-left line-clamp-3 leading-relaxed cursor-pointer hover:scale-105 transition-transform shadow-sm hover:shadow-md`}
                          >
                            {/* Fecha destacada */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold bg-black/30 px-2 py-0.5 rounded">
                                {format(eventDate, 'd')}
                              </span>
                              <span className="text-[10px] opacity-75">
                                {format(eventDate, 'HH:mm')} hrs
                              </span>
                            </div>
                            {/* Título del evento */}
                            <div className="text-xs font-medium leading-tight">
                              {event.title}
                            </div>
                          </div>
                        );
                      })}
                      {monthEvents.length === 0 && (
                        <div className="text-sm text-slate-500 text-center py-8">
                          Sin eventos este mes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA MENSUAL Y SEMANAL: Grid de días */
            <div className={`grid gap-2 ${
              calendarView === 'week' 
                ? 'grid-cols-7 grid-rows-1 h-full' 
                : 'grid-cols-7'
            }`}>
            {calendarDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <CalendarDayCell
                  key={day.toISOString()}
                  day={day}
                  events={dayEvents}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isTodayDate}
                  onClick={() => handleDayClick(day, dayEvents)}
                  isWeekView={calendarView === 'week'}
                />
              );
            })}
          </div>
          )}

          {/* Leyenda - Solo en vista mensual */}
          {calendarView === 'month' && (
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span>Eventos urgentes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <span>Eventos importantes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600/30 rounded"></div>
                <span>Baja actividad (1-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600/60 rounded"></div>
                <span>Media actividad (3-5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Alta actividad (6+)</span>
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Modal de eventos del día */}
      {selectedDate && (
        <EventDayModal
          date={selectedDate}
          events={getEventsForDay(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onEditEvent={onEditEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}

      {/* Botón flotante para crear evento - Esquina inferior IZQUIERDA */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 left-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50 border-2 border-blue-400"
        title="Crear nuevo evento"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Modal de creación de evento */}
      {showCreateModal && (
        <AddEventModal
          event={null}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (_, data) => {
            if (onCreateEvent) {
              const result = await onCreateEvent(_, data);
              if (result.success) {
                setShowCreateModal(false);
              }
              return result;
            }
            return { success: false, error: 'No handler provided' };
          }}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
}

