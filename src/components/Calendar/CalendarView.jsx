import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
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

/**
 * Vista de Calendario Mensual con análisis de eventos
 * Muestra densidad de eventos por día con heatmap
 * Click en día → Modal con Kanban de eventos
 */
export default function CalendarView({ events = [], loading, onClose, onEditEvent, onDeleteEvent }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

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

  // Agrupar eventos por día
  const eventsByDay = useMemo(() => {
    const grouped = {};
    
    if (!events || !Array.isArray(events)) {
      return grouped;
    }
    
    events.forEach(event => {
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
  }, [events]);

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

      {/* Controles de navegación */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h3 className="text-lg font-semibold text-white min-w-[200px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Hoy
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
    </div>
  );
}

