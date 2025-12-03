import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, ExternalLink, FileText, Tag, Shield, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUserRole } from '../../hooks/useUserRole';
import MarkdownRenderer from '../Common/MarkdownRenderer';
import ConfirmDialog from '../Common/ConfirmDialog';

/**
 * Modal de detalles COMPLETOS de un evento
 * Muestra toda la información sin truncar
 */
export default function EventDetailsModal({ event, onClose, onEdit, onDelete }) {
  const { canEditEvents, canDeleteEvents } = useUserRole();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Notificar que el modal está abierto (para ocultar botones flotantes en móvil)
  useEffect(() => {
    // Dispatch evento cuando el modal se monta
    window.dispatchEvent(new CustomEvent('detailsModalOpen'));
    
    // Cleanup cuando se desmonta
    return () => {
      window.dispatchEvent(new CustomEvent('detailsModalClose'));
    };
  }, []);
  
  if (!event) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
    onClose();
  };

  // Icono y color según tipo
  const getEventTypeConfig = (type) => {
    switch (type) {
      case 'evento':
        return { icon: '🎯', color: 'blue', label: 'Evento' };
      case 'noticia':
        return { icon: '📰', color: 'amber', label: 'Noticia' };
      case 'informe':
        return { icon: '📄', color: 'purple', label: 'Informe' };
      default:
        return { icon: '📌', color: 'slate', label: 'Evento' };
    }
  };

  const typeConfig = getEventTypeConfig(event.type);

  // Badge de clasificación
  const ClassificationBadge = ({ source, credibility }) => {
    if (!source || !credibility) return null;
    
    const getColor = () => {
      if (source === 'A' && credibility === '1') return 'bg-green-600';
      if (['A', 'B'].includes(source) && ['1', '2'].includes(credibility)) return 'bg-blue-600';
      if (['C', 'D'].includes(source)) return 'bg-yellow-600';
      return 'bg-slate-600';
    };

    const getLabel = () => {
      const reliability = {
        'A': 'Completamente confiable',
        'B': 'Usualmente confiable',
        'C': 'Regularmente confiable',
        'D': 'No usualmente confiable',
        'E': 'No confiable',
        'F': 'No se puede juzgar'
      };
      const credibilityLabels = {
        '1': 'Confirmada',
        '2': 'Probablemente cierta',
        '3': 'Posiblemente cierta',
        '4': 'Dudosa',
        '5': 'Improbable',
        '6': 'No se puede juzgar'
      };
      return `${reliability[source]} • ${credibilityLabels[credibility]}`;
    };

    return (
      <div className="flex items-center gap-2">
        <span className={`${getColor()} text-white text-lg font-bold px-3 py-1.5 rounded`}>
          {source}{credibility}
        </span>
        <span className="text-sm text-slate-400">{getLabel()}</span>
      </div>
    );
  };

  // Badge de prioridad
  const PriorityBadge = ({ level }) => {
    const configs = {
      urgente: { bg: 'bg-red-600', text: 'text-white', icon: '🚨', label: 'URGENTE' },
      importante: { bg: 'bg-yellow-600', text: 'text-white', icon: '⚠️', label: 'IMPORTANTE' },
      normal: { bg: 'bg-slate-600', text: 'text-white', icon: '📋', label: 'NORMAL' }
    };
    const config = configs[level] || configs.normal;

    return (
      <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pt-16 sm:pt-6">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl mt-2 sm:my-8 mb-24 sm:mb-8 relative z-10">
        {/* Header con imagen de fondo si existe */}
        <div className="relative z-10">
          {event.image_url ? (
            <div className="relative h-64 overflow-hidden rounded-t-xl">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
              
              {/* Info sobre la imagen */}
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`bg-${typeConfig.color}-600 text-white px-3 py-1 rounded text-sm font-semibold`}>
                    {typeConfig.icon} {typeConfig.label}
                  </span>
                  <PriorityBadge level={event.priority_level || 'normal'} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                  {event.title}
                </h2>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-900/30 to-slate-800 p-6 border-b border-slate-700 rounded-t-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className={`bg-${typeConfig.color}-600 text-white px-3 py-1 rounded text-sm font-semibold`}>
                  {typeConfig.icon} {typeConfig.label}
                </span>
                <PriorityBadge level={event.priority_level || 'normal'} />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {event.title}
              </h2>
            </div>
          )}

          {/* Botón cerrar - Mejorado para móvil */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white border border-slate-700 z-10"
            title="Cerrar"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar-transparent">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar size={18} className="text-blue-400" />
              <div>
                <div className="text-xs text-slate-500 uppercase">Fecha y Hora</div>
                <div className="font-medium">
                  {format(new Date(event.event_date), "EEEE d 'de' MMMM, yyyy")} • {format(new Date(event.event_date), "HH:mm")} hrs
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={18} className="text-green-400" />
                <div>
                  <div className="text-xs text-slate-500 uppercase">Ubicación</div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>
            )}
          </div>

          {/* Clasificación de Inteligencia */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                Clasificación de Inteligencia
              </h3>
            </div>
            <ClassificationBadge 
              source={event.source_reliability} 
              credibility={event.info_credibility} 
            />
          </div>

          {/* Descripción completa */}
          {event.description && (
            <div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">
                📋 Descripción Completa
              </h3>
              <div className="bg-blue-950/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <MarkdownRenderer 
                  content={event.description}
                  className="text-base text-slate-200 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Análisis del Analista */}
          {event.analyst_analysis && (
            <div>
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                📊 Análisis del Analista de Inteligencia
              </h3>
              <div className="bg-cyan-950/30 border-l-4 border-cyan-500 p-4 rounded-r-lg">
                <MarkdownRenderer 
                  content={event.analyst_analysis}
                  className="text-base text-slate-200 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Recomendaciones del Analista */}
          {event.analyst_recommendations && (
            <div>
              <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                💡 Recomendaciones
              </h3>
              <div className="bg-green-950/30 border-l-4 border-green-500 p-4 rounded-r-lg space-y-3">
                {event.analyst_recommendations.split('\n').filter(r => r.trim()).map((rec, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-600/30 rounded-full text-green-300 font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <MarkdownRenderer 
                        content={rec.replace(/^\d+\.\s*/, '')}
                        className="text-base text-slate-200 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etiquetas */}
          {event.tags && event.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag size={14} />
                Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-700/50 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entidades Relacionadas */}
          {event.related_entities && event.related_entities.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Entidades Relacionadas ({event.related_entities.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {event.related_entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="text-2xl">
                      {entity.type === 'destructor' || entity.type === 'portaaviones' ? '🚢' :
                       entity.type === 'avion' ? '✈️' :
                       entity.type === 'tropas' ? '👥' :
                       entity.type === 'lugar' ? '🏢' : '📍'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{entity.name}</div>
                      <div className="text-xs text-slate-500 capitalize">{entity.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recursos Multimedia */}
          {(event.link_url || event.file_url) && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Recursos Adjuntos
              </h3>
              <div className="space-y-2">
                {event.link_url && (
                  <a
                    href={event.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 transition-colors group"
                  >
                    <ExternalLink size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-blue-300 group-hover:text-blue-200 break-words">
                        {event.link_title || 'Link externo'}
                      </div>
                      <div className="text-xs text-slate-500 break-all leading-relaxed">{event.link_url}</div>
                    </div>
                  </a>
                )}

                {event.file_url && (
                  <a
                    href={event.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/30 rounded-lg p-3 transition-colors group"
                  >
                    <FileText size={20} className="text-purple-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-purple-300 group-hover:text-purple-200">
                        {event.file_name || 'Archivo PDF'}
                      </div>
                      {event.file_size && (
                        <div className="text-xs text-slate-500">
                          {(event.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones - Responsive mejorado */}
        <div className="bg-slate-800/50 border-t border-slate-700 p-2.5 sm:p-4 pb-safe">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Botón Editar - Solo visible si tiene permiso */}
            {canEditEvents() && (
              <button
                onClick={handleEdit}
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-base"
              >
                <Edit2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span>Editar</span>
              </button>
            )}

            {/* Botón Borrar - Solo visible si tiene permiso */}
            {canDeleteEvents() && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-base"
              >
                <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span>Eliminar</span>
              </button>
            )}

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className={`w-full ${!(canEditEvents() || canDeleteEvents()) ? 'sm:flex-1' : 'sm:w-auto'} flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-xs sm:text-base`}
            >
              <X size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="¿Eliminar este evento?"
        message="Esta acción no se puede deshacer. Se perderán todos los datos del evento, incluyendo entidades asociadas, archivos y multimedia."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}

