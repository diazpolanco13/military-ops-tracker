import { Edit2, Trash2, ExternalLink, MapPin, Clock, Shield, Ship } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserRole } from '../../hooks/useUserRole';
import { supabase } from '../../lib/supabase';
import { getClassificationCode, getClassificationColor, PRIORITY_LEVELS } from '../../config/intelligenceClassification';

/**
 * Tarjeta individual de evento en el timeline
 */
export default function EventCard({ event, onEdit, onDelete, isLast }) {
  const { canEditEvents, canDeleteEvents } = useUserRole();
  const [relatedEntities, setRelatedEntities] = useState([]);

  useEffect(() => {
    loadRelatedEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const loadRelatedEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('event_entities')
        .select(`
          entities:entity_id (
            id,
            name,
            type
          )
        `)
        .eq('event_id', event.id);

      if (error) throw error;
      if (data) {
        const entities = data.map(rel => rel.entities).filter(Boolean);
        console.log(`Entidades relacionadas para evento "${event.title}":`, entities);
        setRelatedEntities(entities);
      }
    } catch (error) {
      console.error('Error cargando entidades relacionadas:', error);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'evento':
        return '🎯';
      case 'noticia':
        return '📰';
      case 'informe':
        return '📄';
      default:
        return '📌';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'evento':
        return 'bg-blue-500';
      case 'noticia':
        return 'bg-amber-500';
      case 'informe':
        return 'bg-purple-500';
      default:
        return 'bg-slate-500';
    }
  };

  const formatTime = (dateString) => {
    // Tratar la fecha como local sin conversión de zona horaria
    // Extraer hora y minuto directamente del string sin crear Date
    const date = dateString.includes('T') 
      ? dateString.split('T')[1]?.slice(0, 5) 
      : dateString.slice(11, 16);
    return date || '00:00';
  };

  return (
    <div className="relative group">
      {/* Punto del timeline */}
      <div className={`absolute -left-4 sm:-left-6 top-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-slate-900 ${getEventColor(event.type)} z-10`}></div>

      {/* Card del evento */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500 transition-all">
        {/* Imagen principal si existe */}
        {event.image_url && (
          <div className="relative h-32 sm:h-40 bg-slate-900 overflow-hidden">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-black/60 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs text-white font-medium">
              {getEventIcon(event.type)} {event.type}
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="p-2.5 sm:p-3">
          {/* Header con hora */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                {!event.image_url && <span className="mr-1">{getEventIcon(event.type)}</span>}
                {event.title}
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock size={10} className="sm:w-3 sm:h-3" />
                  {formatTime(event.event_date)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                    <MapPin size={10} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}
                
                {/* Badge de Clasificación de Inteligencia */}
                {event.source_reliability && event.info_credibility && (
                  <span 
                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 sm:gap-1 border ${
                      getClassificationColor(event.source_reliability, event.info_credibility).bg
                    } ${
                      getClassificationColor(event.source_reliability, event.info_credibility).border
                    } ${
                      getClassificationColor(event.source_reliability, event.info_credibility).text
                    }`}
                  >
                    <Shield size={8} className="sm:w-2.5 sm:h-2.5" />
                    {getClassificationCode(event.source_reliability, event.info_credibility)}
                  </span>
                )}

                {/* Badge de Prioridad */}
                {event.priority_level && event.priority_level !== 'normal' && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                    PRIORITY_LEVELS[event.priority_level]?.badgeClass || ''
                  }`}>
                    {PRIORITY_LEVELS[event.priority_level]?.icon} {PRIORITY_LEVELS[event.priority_level]?.label.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Acciones - Visible en móvil, con hover en desktop */}
            {(canEditEvents() || canDeleteEvents()) && (
              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {canEditEvents() && (
                  <button
                    onClick={() => onEdit(event)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={13} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
                {canDeleteEvents() && (
                  <button
                    onClick={() => onDelete(event.id)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Descripción */}
          {event.description && (
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-2 line-clamp-3">
              {event.description}
            </p>
          )}

          {/* Link externo (Noticias) */}
          {event.link_url && (
            <a
              href={event.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2 p-1.5 sm:p-2 bg-slate-900/50 rounded hover:bg-slate-900"
            >
              <ExternalLink size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
              <span className="truncate flex-1">
                {event.link_title || 'Ver fuente'}
              </span>
            </a>
          )}

          {/* Archivo PDF (Informes) */}
          {event.file_url && (
            <a
              href={event.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 transition-colors mt-2 p-1.5 sm:p-2 bg-purple-900/20 border border-purple-500/30 rounded hover:bg-purple-900/30"
            >
              <span className="text-base sm:text-lg">📄</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{event.file_name || 'Documento.pdf'}</div>
                {event.file_size && (
                  <div className="text-[9px] sm:text-[10px] text-purple-300/70">
                    {(event.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
              <ExternalLink size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
            </a>
          )}

          {/* Tags si existen */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-[9px] sm:text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Entidades relacionadas */}
          {relatedEntities.length > 0 && (
            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-700">
              <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                <Ship size={11} className="sm:w-3 sm:h-3 text-blue-400 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-slate-400">Entidades relacionadas:</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {relatedEntities.map(entity => (
                  <span
                    key={entity.id}
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-900/30 border border-blue-500/40 text-blue-300 rounded text-[9px] sm:text-[10px] font-medium flex items-center gap-1"
                    title={entity.type}
                  >
                    {entity.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

