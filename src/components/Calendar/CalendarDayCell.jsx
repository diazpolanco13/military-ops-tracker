import { format } from 'date-fns';

/**
 * Celda individual del calendario que muestra:
 * - Número del día
 * - Badge con cantidad de eventos [N]
 * - Heatmap de color según densidad
 * - Indicadores de prioridad (🔴 urgente, 🟡 importante)
 * - Preview del evento más importante del día
 * - Modo extendido para vista semanal
 */
export default function CalendarDayCell({ day, events, isCurrentMonth, isToday, onClick, isWeekView = false }) {
  const eventCount = events.length;
  const hasEvents = eventCount > 0;

  // Detectar si hay eventos urgentes o importantes
  const hasUrgent = events.some(e => e.priority_level === 'urgente');
  const hasImportant = events.some(e => e.priority_level === 'importante');

  // Obtener el evento más importante del día (prioridad: urgente > importante > normal)
  const getMostImportantEvent = () => {
    if (!events || events.length === 0) return null;
    
    const urgent = events.find(e => e.priority_level === 'urgente');
    if (urgent) return urgent;
    
    const important = events.find(e => e.priority_level === 'importante');
    if (important) return important;
    
    return events[0]; // Retornar el primero si no hay urgentes/importantes
  };

  const topEvent = getMostImportantEvent();

  // Obtener iconos de tipos de eventos del día
  const getEventTypeIcons = () => {
    const types = new Set(events.map(e => e.type));
    return Array.from(types).map(type => {
      switch (type) {
        case 'evento': return '🎯';
        case 'noticia': return '📰';
        case 'informe': return '📄';
        default: return '📌';
      }
    });
  };

  // Obtener iconos de entidades involucradas
  const getEntityIcons = () => {
    const entityTypes = new Set();
    events.forEach(event => {
      event.related_entities?.forEach(entity => {
        entityTypes.add(entity.type);
      });
    });
    
    return Array.from(entityTypes).slice(0, 3).map(type => {
      switch (type) {
        case 'destructor':
        case 'portaaviones':
        case 'fragata':
        case 'submarino':
          return '🚢';
        case 'avion':
          return '✈️';
        case 'tropas':
          return '👥';
        case 'lugar':
          return '🏢';
        default:
          return '📍';
      }
    });
  };

  const typeIcons = getEventTypeIcons();
  const entityIcons = getEntityIcons();

  // Calcular intensidad del heatmap según cantidad de eventos
  const getHeatmapColor = () => {
    if (!hasEvents) return 'bg-slate-800/50';
    if (eventCount <= 2) return 'bg-blue-600/30';
    if (eventCount <= 5) return 'bg-blue-600/60';
    return 'bg-blue-600';
  };

  // Estilos dinámicos - Sin aspect-square en vista semanal
  const cellClasses = `
    relative
    ${isWeekView ? 'min-h-full' : 'aspect-square'}
    rounded-lg
    border-2
    transition-all
    duration-200
    ${getHeatmapColor()}
    ${isCurrentMonth ? 'border-slate-700' : 'border-slate-800'}
    ${hasEvents ? 'cursor-pointer hover:border-blue-500 hover:scale-[1.02]' : 'cursor-default'}
    ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
    ${!isCurrentMonth ? 'opacity-40' : ''}
  `;

  return (
    <div
      className={cellClasses}
      onClick={hasEvents ? onClick : undefined}
    >
      {/* Número y nombre del día */}
      <div className="absolute top-1.5 left-2">
        {isWeekView ? (
          /* Vista de 3 días: Mostrar día de semana + número */
          <div className="flex flex-col">
            <span className={`text-xs font-bold uppercase ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
              {format(day, 'EEE')}
            </span>
            <span className={`text-2xl font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>
              {format(day, 'd')}
            </span>
          </div>
        ) : (
          /* Vista mensual: Solo número */
          <span className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
            {format(day, 'd')}
          </span>
        )}
      </div>

      {/* Badge con cantidad de eventos - Círculo bonito */}
      {hasEvents && (
        <div className="absolute top-1.5 right-1.5">
          <div className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full border-2 border-blue-400 shadow-lg flex items-center justify-center">
            {eventCount}
          </div>
        </div>
      )}

      {/* Lista de eventos - Adaptativa según vista */}
      {hasEvents && (
        <div className={`absolute inset-x-1 ${isWeekView ? 'top-16' : 'top-9'} bottom-9 overflow-y-auto custom-scrollbar-transparent px-1 space-y-1.5`}>
          {events.map((event, idx) => {
            // Color según prioridad
            const getBadgeColor = () => {
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
                className={`${getBadgeColor()} rounded-lg border shadow-sm hover:scale-105 transition-transform ${
                  isWeekView 
                    ? 'px-2 py-2 text-xs line-clamp-4' 
                    : 'px-1.5 py-0.5 text-[9px] line-clamp-2'
                } text-center leading-tight`}
              >
                {/* En vista semanal, mostrar hora + título con más detalle */}
                {isWeekView ? (
                  <>
                    <div className="text-[10px] opacity-75 mb-1">
                      {format(eventDate, 'HH:mm')} hrs
                    </div>
                    <div className="font-medium">
                      {event.title}
                    </div>
                  </>
                ) : (
                  /* En vista mensual, solo título compacto */
                  event.title
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Indicador de "Hoy" en esquina INFERIOR DERECHA */}
      {isToday && (
        <div className="absolute bottom-1 right-1">
          <div className="bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg">
            HOY
          </div>
        </div>
      )}
    </div>
  );
}

