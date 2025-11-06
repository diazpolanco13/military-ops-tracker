import { X, MapPin, Navigation, Gauge, Ship, Users, Shield, Settings, Eye, EyeOff, Edit2, Archive, Trash2, Swords, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEntityActions } from '../../hooks/useEntityActions';
import { useUserRole } from '../../hooks/useUserRole';
import { supabase } from '../../lib/supabase';
import ConfirmDialog from '../Common/ConfirmDialog';
import EditEntityModal from './EditEntityModal';

const TYPE_ICONS = {
  destructor: Ship,
  fragata: Ship,
  avion: '✈️',
  tropas: Users,
  tanque: Shield,
  submarino: Ship,
};

const STATUS_CONFIG = {
  activo: {
    label: 'Activo',
    emoji: '🟢',
    color: '#22c55e',
  },
  patrullando: {
    label: 'Patrullando',
    emoji: '🟡',
    color: '#f59e0b',
  },
  estacionado: {
    label: 'Estacionado',
    emoji: '🔵',
    color: '#3b82f6',
  },
  en_transito: {
    label: 'En Tránsito',
    emoji: '🟣',
    color: '#a855f7',
  },
  en_vuelo: {
    label: 'En Vuelo',
    emoji: '🔵',
    color: '#06b6d4',
  },
  vigilancia: {
    label: 'Vigilancia',
    emoji: '🟠',
    color: '#f97316',
  },
};

/**
 * 🎴 Card flotante futurista para quick info de entidades
 * Diseño traslúcido estilo juego AAA / C2 System
 */
export default function EntityQuickCard({ entity, onClose, onOpenDetails, onViewTimeline }) {
  const { toggleVisibility, archiveEntity, deleteEntity, processing } = useEntityActions();
  const { canEdit, canDelete } = useUserRole();
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  // Cargar plantilla si existe template_id
  useEffect(() => {
    async function loadTemplate() {
      if (entity?.template_id) {
        setLoadingTemplate(true);
        try {
          const { data, error } = await supabase
            .from('entity_templates')
            .select('*')
            .eq('id', entity.template_id)
            .single();

          if (!error && data) {
            setTemplate(data);
          }
        } catch (err) {
          console.error('Error loading template:', err);
        } finally {
          setLoadingTemplate(false);
        }
      } else {
        setTemplate(null);
      }
    }

    loadTemplate();
  }, [entity?.template_id]);

  // Cargar contador de eventos para esta entidad
  useEffect(() => {
    async function loadEventCount() {
      if (!entity?.id) return;

      try {
        const { count, error } = await supabase
          .from('event_entities')
          .select('*', { count: 'exact', head: true })
          .eq('entity_id', entity.id);

        if (!error) {
          setEventCount(count || 0);
        }
      } catch (err) {
        console.error('Error loading event count:', err);
      }
    }

    loadEventCount();
  }, [entity?.id]);

  // Handlers para las acciones
  const handleToggleVisibility = async () => {
    const result = await toggleVisibility(entity.id, entity.is_visible);
    if (result.success) {
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(entity.id);
      }
      onClose();
    }
  };

  const handleArchive = async () => {
    const result = await archiveEntity(entity.id);
    if (result.success) {
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(entity.id);
      }
      onClose();
    }
  };

  const handleDelete = async () => {
    const result = await deleteEntity(entity.id);
    if (result.success) {
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(entity.id);
      }
      onClose();
    }
  };

  if (!entity) return null;

  // Función helper para obtener valor (entidad o heredado de plantilla)
  const getValue = (field) => {
    return entity[field] ?? template?.[field] ?? null;
  };

  const Icon = TYPE_ICONS[entity.type] || Ship;
  const statusConfig = STATUS_CONFIG[entity.status] || STATUS_CONFIG.activo;

  // Obtener video/imagen (priorizar entidad, luego plantilla)
  const videoUrl = entity.video_url || template?.video_url || (template?.image_url?.match(/\.(webm|mp4)$/i) ? template?.image_url : null);
  // Priorizar image_url (alta calidad) sobre thumbnail para el card
  const imageUrl = entity.image_url || template?.image_url || entity.image_thumbnail_url || template?.icon_url;

  // Imágenes disponibles (para carrusel) - SOLO si no hay video
  const images = [];
  if (!videoUrl) {
    if (imageUrl) {
      images.push(imageUrl);
    }
    if (entity.image_thumbnail_url && entity.image_url && entity.image_thumbnail_url !== entity.image_url) {
      images.push(entity.image_url);
    }
  }

  // Navegación del carrusel
  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <>
      {/* Card flotante en esquina superior izquierda - MÁS COMPACTA */}
      <div
        className="fixed top-20 left-4 z-50 animate-slideInFromLeft flex flex-col"
        style={{ width: '340px', maxHeight: 'calc(100vh - 100px)' }}
      >
        <div
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden"
          style={{
            borderColor: statusConfig.color,
            boxShadow: `0 0 30px ${statusConfig.color}30, 0 20px 60px rgba(0,0,0,0.5)`,
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          {/* Header con botones - FIXED */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: statusConfig.color }}
              />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider truncate max-w-[200px]">
                {entity.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Configuración en desarrollo')}
                className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Configuración"
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Ilustración/Imagen/Video - Adaptado para imágenes horizontales */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center" style={{ width: '100%', aspectRatio: '16/9' }}>
            {videoUrl ? (
              // Video de fondo (prioridad sobre imagen)
              <div className="relative z-10 h-full w-full bg-black flex items-center justify-center">
                <video
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
                {/* Overlay sutil para mejor contraste */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
              </div>
            ) : images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex]}
                  alt={entity.name}
                  className="w-full h-full object-contain p-3"
                />
                {/* Controles del carrusel */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? 'bg-white scale-125'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {typeof Icon === 'string' ? (
                  <span className="text-7xl opacity-30">{Icon}</span>
                ) : (
                  <Icon className="w-24 h-24 text-slate-700 opacity-30" strokeWidth={1} />
                )}
              </div>
            )}

            {/* Dimensiones del buque - overlay */}
            {(getValue('length_meters') || getValue('beam_meters')) && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/90 backdrop-blur-sm rounded text-xs text-slate-300 font-mono">
                {getValue('length_meters')}m × {getValue('beam_meters')}m
              </div>
            )}
          </div>

          {/* Tipo de Entidad y Clase - COMPACTO */}
          <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700/30">
            <div className="text-center">
              <div className="text-base font-bold text-cyan-400 uppercase">
                {template?.sub_type === 'crucero' ? 'CRUCERO' :
                 entity.type === 'destructor' ? 'DESTRUCTOR' :
                 entity.type === 'fragata' ? 'FRAGATA' :
                 entity.type === 'avion' ? 'AERONAVE' :
                 entity.type === 'submarino' ? 'SUBMARINO' :
                 entity.type === 'tropas' ? 'TROPAS' :
                 entity.type.toUpperCase()}
              </div>
              {entity.class && (
                <div className="text-xs text-slate-400 mt-0.5">{entity.class}</div>
              )}
            </div>
          </div>

          {/* Capacidades Militares - COMPACTO */}
          {(getValue('has_surface_to_surface') || getValue('has_surface_to_air') || getValue('has_torpedoes') || getValue('has_cruise_missiles')) && (
            <div className="px-4 py-2 border-b border-slate-700/30">
              <div className="flex flex-wrap justify-center gap-1.5">
                {getValue('has_surface_to_surface') && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-500/50 rounded text-xs text-red-300">
                    <span>🎯</span> Mar-Mar
                  </div>
                )}
                {getValue('has_surface_to_air') && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 border border-blue-500/50 rounded text-xs text-blue-300">
                    <span>🛡️</span> Antiaéreo
                  </div>
                )}
                {getValue('has_torpedoes') && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-cyan-900/30 border border-cyan-500/50 rounded text-xs text-cyan-300">
                    <span>🐟</span> Torpedos
                  </div>
                )}
                {getValue('has_cruise_missiles') && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 border border-purple-500/50 rounded text-xs text-purple-300">
                    <span>🚀</span> Crucero
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Armamento Principal - COMPACTO */}
          {getValue('weapon_type') && (
            <div className="px-4 py-2 bg-red-950/20 border-b border-slate-700/30">
              <div className="text-xs text-red-400 flex items-center gap-1 mb-1">
                <Swords className="w-3 h-3" /> <span className="uppercase tracking-wider">Armamento</span>
              </div>
              <div className="text-xs text-white leading-tight">{getValue('weapon_type')}</div>
            </div>
          )}

          {/* Alcances - Solo mostrar si hay datos VÁLIDOS (> 0) */}
          {((getValue('fire_range_km') && getValue('fire_range_km') >= 0) || 
            (getValue('radar_range_km') && entity.type !== 'tropas' && getValue('radar_range_km') > 0)) && (
            <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-slate-700/30">
              {getValue('fire_range_km') && getValue('fire_range_km') >= 0 && (
                <div className={`text-center p-2 bg-orange-900/20 rounded border border-orange-500/30 ${
                  getValue('radar_range_km') && entity.type !== 'tropas' && getValue('radar_range_km') >= 0 ? '' : 'col-span-2'
                }`}>
                  <div className="text-xs text-orange-400 mb-1">🔥 Alcance Fuego</div>
                  <div className="text-lg font-bold text-white">{getValue('fire_range_km').toLocaleString()} km</div>
                </div>
              )}
              {/* Solo mostrar radar si NO es tropa Y tiene valor > 0 */}
              {getValue('radar_range_km') && entity.type !== 'tropas' && getValue('radar_range_km') >= 0 && (
                <div className="text-center p-2 bg-green-900/20 rounded border border-green-500/30">
                  <div className="text-xs text-green-400 mb-1">📡 Alcance Radar</div>
                  <div className="text-lg font-bold text-white">{getValue('radar_range_km')} km</div>
                </div>
              )}
            </div>
          )}

          {/* Personal y Aeronaves Embarcadas (solo para embarcaciones) */}
          {['portaaviones', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(entity.type) && 
           (getValue('crew_count') || getValue('embarked_personnel') || getValue('embarked_aircraft')) && (
            <div className="px-4 py-3 space-y-2 border-b border-slate-700/30 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
              {/* Tripulación */}
              {getValue('crew_count') && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">⚓ Tripulación</div>
                  <div className="text-sm font-bold text-white">{getValue('crew_count').toLocaleString()}</div>
                </div>
              )}
              
              {/* Personal Embarcado */}
              {getValue('embarked_personnel') && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-cyan-400">👥 Personal Embarcado</div>
                  <div className="text-sm font-bold text-cyan-300">{getValue('embarked_personnel').toLocaleString()}</div>
                </div>
              )}
              
              {/* Aeronaves */}
              {getValue('embarked_aircraft') && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-amber-400">✈️ Aeronaves</div>
                  <div className="text-sm font-bold text-amber-300">{getValue('embarked_aircraft')}</div>
                </div>
              )}
              
              {/* Total Efectivos (solo si hay tripulación o personal embarcado) */}
              {(getValue('crew_count') || getValue('embarked_personnel')) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <div className="text-xs text-green-400 font-semibold uppercase">💪 Total Efectivos</div>
                  <div className="text-base font-bold text-green-300">
                    {((getValue('crew_count') || 0) + (getValue('embarked_personnel') || 0)).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botón VER DETALLES - COMPACTO */}
          <div className="px-3 py-2">
            <button
              onClick={onOpenDetails}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3" />
              VER DETALLES
            </button>
          </div>

          {/* Acciones rápidas - MINI */}
          <div className="px-3 py-1.5 flex items-center justify-center gap-1 bg-slate-900/50 border-t border-slate-700/30">
            {/* Botón Timeline - Solo si hay eventos */}
            {eventCount > 0 && (
              <button
                onClick={() => onViewTimeline?.(entity.id)}
                className="p-1.5 hover:bg-cyan-700/50 rounded transition-colors relative"
                title={`Ver Timeline (${eventCount} eventos)`}
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                {/* Badge de contador */}
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {eventCount}
                </span>
              </button>
            )}
            {canEdit() && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={handleToggleVisibility}
                  disabled={processing}
                  className="p-1.5 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                  title={entity.is_visible ? 'Ocultar' : 'Mostrar'}
                >
                  {entity.is_visible ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-400" />
                  )}
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(true)}
                  disabled={processing}
                  className="p-1.5 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                  title="Archivar"
                >
                  <Archive className="w-4 h-4 text-yellow-400" />
                </button>
              </>
            )}
            {canDelete() && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={processing}
                className="p-1.5 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
          
          </div>
          {/* FIN contenido scrolleable */}

          {/* Indicador de procesamiento - FIXED en bottom */}
          {processing && (
            <div className="px-4 py-2 flex items-center justify-center gap-2 text-cyan-400 text-sm bg-slate-900/50 border-t border-slate-700/50 flex-shrink-0">
              <div className="animate-spin h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
              Procesando...
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación de archivo */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="¿Archivar esta entidad?"
        message={`La entidad "${entity.name}" se archivará y podrá ser restaurada más tarde.`}
        confirmText="Archivar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="⚠️ ¿Eliminar permanentemente?"
        message={`La entidad "${entity.name}" será eliminada PERMANENTEMENTE.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de Edición */}
      {showEditModal && (
        <EditEntityModal
          entity={entity}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            // Cerrar el modal de edición primero
            setShowEditModal(false);
            
            // Mostrar que está cargando
            if (window.refetchEntities) {
              // Refrescar el mapa completo para actualizar marcadores Y datos de entidades
              await window.refetchEntities();
            }
            
            // NOTA: La card se actualiza automáticamente porque entity 
            // viene del hook useEntities que acaba de hacer refetch
            // El nuevo video_url ya estará en entity.video_url
          }}
        />
      )}
    </>
  );
}

