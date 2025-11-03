import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Search, Filter, Plus } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths
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

  // Generar días del calendario (incluye días del mes anterior/siguiente para completar semanas)
  const calendarDays = useMemo(() => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } catch (error) {
      console.error('Error generating calendar days:', error);
      return [];
    }
  }, [currentMonth]);

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

  // Navegación de meses
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
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
        {/* Navegación de mes */}
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          title="Mes anterior"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h3 className="text-lg font-semibold text-white min-w-[140px] text-center capitalize">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          title="Mes siguiente"
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

      {/* Calendario Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header de días de la semana */}
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

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-2">
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
                />
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
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
        </div>
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

      {/* Botón flotante para crear evento */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50 border-2 border-blue-400"
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

