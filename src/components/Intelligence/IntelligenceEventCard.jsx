import { Check, X, MapPin, ExternalLink, AlertTriangle, Shield, Clock, User, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

/**
 * 📰 Card de Evento de Inteligencia Tipo X/Twitter
 * Card visual grande con soporte para imágenes de noticias
 */
export default function IntelligenceEventCard({ 
  event, 
  onVerify, 
  onDismiss, 
  onViewOnMap, 
  onAction,
  compact = false 
}) {
  const [imageError, setImageError] = useState(false);
  // Colores según credibilidad
  const credibilityColors = {
    official: { bg: 'bg-green-900/20', border: 'border-green-500', text: 'text-green-400', icon: Shield },
    verified: { bg: 'bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-400', icon: Check },
    unverified: { bg: 'bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: AlertTriangle },
    questionable: { bg: 'bg-red-900/20', border: 'border-red-500', text: 'text-red-400', icon: X }
  };

  const credStyle = credibilityColors[event.source_credibility] || credibilityColors.unverified;
  const CredIcon = credStyle.icon;

  // Colores según prioridad
  const priorityColors = {
    urgent: 'border-l-4 border-l-red-500 bg-red-900/10',
    high: 'border-l-4 border-l-orange-500 bg-orange-900/10',
    medium: 'border-l-4 border-l-yellow-500 bg-yellow-900/10',
    low: 'border-l-4 border-l-green-500 bg-green-900/10'
  };

  // Estado badge
  const statusBadges = {
    pending: { text: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
    verified: { text: 'Verificado', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
    dismissed: { text: 'Descartado', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
    actioned: { text: 'Accionado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' }
  };

  const statusBadge = statusBadges[event.status] || statusBadges.pending;

  // Tiempo relativo
  const timeAgo = formatDistanceToNow(new Date(event.detected_at), { 
    addSuffix: true, 
    locale: es 
  });

  // Extraer URL de imagen si existe en el contenido o grok_analysis
  const imageUrl = event.grok_analysis?.image_url || null;

  // Formatear fecha completa
  const eventDate = format(new Date(event.event_date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });

  return (
    <div className={`
      ${priorityColors[event.priority] || priorityColors.medium}
      bg-slate-800/70 rounded-xl border border-slate-700/50 
      hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 
      transition-all duration-200 overflow-hidden
      ${compact ? 'p-3' : 'p-5'}
    `}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* Título */}
          <h4 className="text-white font-bold text-sm mb-1 leading-tight">
            {event.title}
          </h4>

          {/* Fecha completa del evento */}
          <div className="text-slate-400 text-xs mb-2">
            📅 {eventDate}
          </div>

          {/* Meta información */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Tiempo relativo */}
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>

            {/* Credibilidad */}
            <div className={`flex items-center space-x-1 px-2 py-0.5 ${credStyle.bg} border ${credStyle.border} rounded-full ${credStyle.text}`}>
              <CredIcon className="w-3 h-3" />
              <span className="font-bold capitalize">{event.source_credibility}</span>
            </div>

            {/* Estado */}
            <div className={`px-2 py-0.5 border rounded-full ${statusBadge.color} text-xs font-bold`}>
              {statusBadge.text}
            </div>

            {/* Confidence score */}
            <div className="flex items-center space-x-1">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    event.confidence_score >= 80 ? 'bg-green-500' :
                    event.confidence_score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${event.confidence_score}%` }}
                ></div>
              </div>
              <span className="text-slate-400 text-xs">{event.confidence_score}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-slate-300 text-sm mb-3 leading-relaxed">
        {event.summary}
      </p>

      {/* Imagen de la noticia (si existe) - Tipo X */}
      {imageUrl && !imageError && (
        <div className="mb-3 rounded-xl overflow-hidden border border-slate-700/50">
          <img
            src={imageUrl}
            alt={event.title}
            onError={() => setImageError(true)}
            className="w-full h-auto object-cover max-h-96"
          />
        </div>
      )}

      {/* Entidades mencionadas */}
      {event.mentioned_entities && event.mentioned_entities.length > 0 && (
        <div className="mb-3 flex items-center flex-wrap gap-1.5">
          <span className="text-xs text-slate-400">🎯 Menciona:</span>
          {event.mentioned_entities.slice(0, 3).map((entity, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-300 font-mono"
            >
              {entity}
            </span>
          ))}
          {event.mentioned_entities.length > 3 && (
            <span className="text-xs text-slate-500">+{event.mentioned_entities.length - 3} más</span>
          )}
        </div>
      )}

      {/* Ubicación */}
      {event.location_description && (
        <div className="mb-3 flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400">{event.location_description}</span>
          {event.location_confidence && (
            <span className="text-slate-500 text-xs">({event.location_confidence}%)</span>
          )}
        </div>
      )}

      {/* Fuente */}
      {event.source_author && (
        <div className="mb-3 flex items-center space-x-2 text-xs text-slate-400">
          <User className="w-3 h-3" />
          <span>{event.source_author}</span>
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver fuente</span>
            </a>
          )}
        </div>
      )}

      {/* Acciones - Solo si está pending */}
      {event.status === 'pending' && !compact && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/50">
          <button
            onClick={() => onVerify(event.id)}
            className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg text-green-400 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Verificar</span>
          </button>

          <button
            onClick={() => onDismiss(event.id)}
            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-red-400 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Descartar</span>
          </button>

          {event.suggested_location && (
            <button
              onClick={() => onViewOnMap(event)}
              className="col-span-2 px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 rounded-lg text-cyan-400 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
            >
              <MapPin className="w-4 h-4" />
              <span>Ver en Mapa</span>
            </button>
          )}
        </div>
      )}

      {/* Acción tomada - Si ya fue accionado */}
      {event.status === 'actioned' && event.action_taken && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2">
            <span className="font-bold">✅ Acción:</span> {event.action_taken}
          </div>
        </div>
      )}

      {/* Notas del usuario */}
      {event.notes && (
        <div className="mt-2 text-xs text-slate-400 italic bg-slate-900/50 rounded px-3 py-2">
          📝 {event.notes}
        </div>
      )}
    </div>
  );
}

