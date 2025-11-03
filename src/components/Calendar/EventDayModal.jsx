import { useState } from 'react';
import { X, Calendar, AlertTriangle, AlertCircle, FileText, Newspaper, Target, MapPin, ExternalLink, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import EventDetailsModal from './EventDetailsModal';

/**
 * Modal que muestra todos los eventos de un día específico
 * Organizado en formato Kanban por prioridad
 */
export default function EventDayModal({ date, events = [], onClose, onEditEvent, onDeleteEvent }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Agrupar eventos por prioridad
  const eventsByPriority = {
    urgente: events.filter(e => e && e.priority_level === 'urgente'),
    importante: events.filter(e => e && e.priority_level === 'importante'),
    normal: events.filter(e => e && (!e.priority_level || e.priority_level === 'normal'))
  };

  // Icono según tipo de evento
  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'evento': return <Target size={16} className="text-blue-400" />;
      case 'noticia': return <Newspaper size={16} className="text-amber-400" />;
      case 'informe': return <FileText size={16} className="text-purple-400" />;
      default: return <Calendar size={16} className="text-slate-400" />;
    }
  };

  // Badge de clasificación
  const ClassificationBadge = ({ source, credibility }) => {
    if (!source || !credibility) return null;
    
    const getColor = () => {
      if (source === 'A' && credibility === '1') return 'bg-green-600';
      if (['A', 'B'].includes(source) && ['1', '2'].includes(credibility)) return 'bg-blue-600';
      if (['C', 'D'].includes(source)) return 'bg-yellow-600';
      return 'bg-slate-600';
    };

    return (
      <span className={`${getColor()} text-white text-xs font-bold px-2 py-0.5 rounded`}>
        {source}{credibility}
      </span>
    );
  };

  // Componente de evento enriquecido para el Kanban
  const EventCompactCard = ({ event }) => (
    <div
      onClick={() => setSelectedEvent(event)}
      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Preview de imagen si existe */}
      {event.image_url && (
        <div className="relative h-32 bg-slate-900 overflow-hidden">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <ClassificationBadge 
              source={event.source_reliability} 
              credibility={event.info_credibility} 
            />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        {/* Header con título y clasificación */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 flex-1">
            {getEventTypeIcon(event.type)}
            <h4 className="text-base font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
              {event.title}
            </h4>
          </div>
          {!event.image_url && (
            <ClassificationBadge 
              source={event.source_reliability} 
              credibility={event.info_credibility} 
            />
          )}
        </div>

        {/* Fecha y Hora */}
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
          <Clock size={12} />
          <span>{format(new Date(event.event_date), "HH:mm")} hrs</span>
          {event.location && (
            <>
              <span className="mx-1">•</span>
              <MapPin size={12} />
              <span className="line-clamp-1">{event.location}</span>
            </>
          )}
        </div>

        {/* Descripción expandida */}
        {event.description && (
          <p className="text-sm text-slate-400 line-clamp-3 mb-3 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Etiquetas (Tags) */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded border border-slate-600/50"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="text-xs text-slate-500 px-2 py-0.5">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Entidades relacionadas */}
        {event.related_entities && event.related_entities.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wider">
              <span>Entidades Vinculadas:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {event.related_entities.map((entity) => (
                <span
                  key={entity.id}
                  className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-md border border-blue-600/30 hover:bg-blue-600/30 transition-colors"
                >
                  {entity.type === 'destructor' || entity.type === 'portaaviones' ? '🚢' :
                   entity.type === 'avion' ? '✈️' :
                   entity.type === 'tropas' ? '👥' :
                   entity.type === 'lugar' ? '🏢' : '📍'}
                  {entity.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Indicadores de contenido multimedia */}
        {(event.link_url || event.file_url) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
            {event.link_url && (
              <div className="text-xs text-blue-400 flex items-center gap-1">
                <ExternalLink size={12} />
                Link externo
              </div>
            )}
            {event.file_url && (
              <div className="text-xs text-purple-400 flex items-center gap-1">
                <FileText size={12} />
                {event.file_name || 'PDF adjunto'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Vista de pantalla completa - Respeta navbar */}
      <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col" style={{ top: '56px' }}>
        {/* Header compacto */}
        <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
            >
              ← Calendario
            </button>
            <div className="h-4 w-px bg-slate-700"></div>
            <Calendar size={18} className="text-blue-400" />
            <h2 className="text-base font-semibold text-white capitalize">
              {format(date, "EEEE d 'de' MMMM, yyyy")}
            </h2>
            <span className="text-xs text-slate-400">
              • {events.length} evento{events.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido: Kanban por prioridad */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Columna: Urgente */}
              <div className="flex flex-col bg-slate-900/50 rounded-xl border-2 border-red-900/30 p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-red-900/50">
                  <AlertTriangle size={20} className="text-red-500" />
                  <h3 className="text-base font-bold text-red-400 uppercase tracking-wider">
                    Urgente
                  </h3>
                  <span className="ml-auto bg-red-600/30 text-red-300 text-sm font-bold px-3 py-1 rounded-full">
                    {eventsByPriority.urgente.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {eventsByPriority.urgente.length > 0 ? (
                    eventsByPriority.urgente.map(event => (
                      <EventCompactCard key={event.id} event={event} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Sin eventos urgentes
                    </p>
                  )}
                </div>
              </div>

              {/* Columna: Importante */}
              <div className="flex flex-col bg-slate-900/50 rounded-xl border-2 border-yellow-900/30 p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-yellow-900/50">
                  <AlertCircle size={20} className="text-yellow-500" />
                  <h3 className="text-base font-bold text-yellow-400 uppercase tracking-wider">
                    Importante
                  </h3>
                  <span className="ml-auto bg-yellow-600/30 text-yellow-300 text-sm font-bold px-3 py-1 rounded-full">
                    {eventsByPriority.importante.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {eventsByPriority.importante.length > 0 ? (
                    eventsByPriority.importante.map(event => (
                      <EventCompactCard key={event.id} event={event} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Sin eventos importantes
                    </p>
                  )}
                </div>
              </div>

              {/* Columna: Normal */}
              <div className="flex flex-col bg-slate-900/50 rounded-xl border-2 border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-700">
                  <Calendar size={20} className="text-slate-400" />
                  <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider">
                    Normal
                  </h3>
                  <span className="ml-auto bg-slate-700 text-slate-300 text-sm font-bold px-3 py-1 rounded-full">
                    {eventsByPriority.normal.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {eventsByPriority.normal.length > 0 ? (
                    eventsByPriority.normal.map(event => (
                      <EventCompactCard key={event.id} event={event} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Sin eventos normales
                    </p>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Modal de detalles completos del evento */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(event) => {
            setSelectedEvent(null);
            if (onEditEvent) {
              onEditEvent(event);
            }
          }}
          onDelete={(eventId) => {
            setSelectedEvent(null);
            if (onDeleteEvent) {
              onDeleteEvent(eventId);
            }
          }}
        />
      )}
    </>
  );
}

