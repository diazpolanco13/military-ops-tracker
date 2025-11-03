import { format } from 'date-fns';

/**
 * Celda individual del calendario que muestra:
 * - Número del día
 * - Badge con cantidad de eventos [N]
 * - Heatmap de color según densidad
 * - Indicadores de prioridad (🔴 urgente, 🟡 importante)
 */
export default function CalendarDayCell({ day, events, isCurrentMonth, isToday, onClick }) {
  const eventCount = events.length;
  const hasEvents = eventCount > 0;

  // Detectar si hay eventos urgentes o importantes
  const hasUrgent = events.some(e => e.priority_level === 'urgente');
  const hasImportant = events.some(e => e.priority_level === 'importante');

  // Calcular intensidad del heatmap según cantidad de eventos
  const getHeatmapColor = () => {
    if (!hasEvents) return 'bg-slate-800/50';
    if (eventCount <= 2) return 'bg-blue-600/30';
    if (eventCount <= 5) return 'bg-blue-600/60';
    return 'bg-blue-600';
  };

  // Estilos dinámicos
  const cellClasses = `
    relative
    aspect-square
    rounded-lg
    border-2
    transition-all
    duration-200
    ${getHeatmapColor()}
    ${isCurrentMonth ? 'border-slate-700' : 'border-slate-800'}
    ${hasEvents ? 'cursor-pointer hover:border-blue-500 hover:scale-105' : 'cursor-default'}
    ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
    ${!isCurrentMonth ? 'opacity-40' : ''}
  `;

  return (
    <div
      className={cellClasses}
      onClick={hasEvents ? onClick : undefined}
    >
      {/* Número del día */}
      <div className="absolute top-2 left-2">
        <span className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
          {format(day, 'd')}
        </span>
      </div>

      {/* Badge con cantidad de eventos */}
      {hasEvents && (
        <div className="absolute top-2 right-2">
          <div className="bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full border border-slate-600 shadow-lg">
            [{eventCount}]
          </div>
        </div>
      )}

      {/* Indicadores de prioridad */}
      {hasEvents && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {hasUrgent && (
            <div 
              className="w-2 h-2 rounded-full bg-red-600 shadow-lg"
              title="Tiene eventos urgentes"
            />
          )}
          {hasImportant && !hasUrgent && (
            <div 
              className="w-2 h-2 rounded-full bg-yellow-600 shadow-lg"
              title="Tiene eventos importantes"
            />
          )}
        </div>
      )}

      {/* Indicador de "Hoy" adicional */}
      {isToday && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            HOY
          </div>
        </div>
      )}
    </div>
  );
}

