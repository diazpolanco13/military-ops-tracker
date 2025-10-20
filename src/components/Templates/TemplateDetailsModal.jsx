import { X, Ship, Anchor, Plane, Users, Zap, Info } from 'lucide-react';
import { useState } from 'react';

/**
 * 📋 Modal de Detalles de Plantilla
 * Muestra especificaciones técnicas completas antes de instanciar
 */
export default function TemplateDetailsModal({ template, onClose, onUseTemplate }) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!template) return null;

  const getTypeIcon = () => {
    switch (template.entity_type) {
      case 'destructor':
        return Ship;
      case 'fragata':
        return Anchor;
      case 'avion':
        return Plane;
      case 'tropas':
        return Users;
      default:
        return Ship;
    }
  };

  const TypeIcon = getTypeIcon();

  // Agrupar especificaciones técnicas
  const specs = [
    template.displacement_tons && { label: 'Desplazamiento', value: `${template.displacement_tons.toLocaleString()} tons` },
    template.length_meters && { label: 'Longitud', value: `${template.length_meters} m` },
    template.beam_meters && { label: 'Manga', value: `${template.beam_meters} m` },
    template.max_speed_knots && { label: 'Velocidad Máx', value: `${template.max_speed_knots} kn` },
    template.crew_count && { label: 'Tripulación', value: `${template.crew_count.toLocaleString()} personas` },
    template.range_km && { label: 'Alcance', value: `${template.range_km.toLocaleString()} km` },
    template.thrust_hp && { label: 'Empuje', value: `${template.thrust_hp.toLocaleString()} HP` },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center" style={{ borderColor: template.icon_color, borderWidth: '2px' }}>
              <TypeIcon className="w-7 h-7" style={{ color: template.icon_color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{template.display_name || template.name}</h2>
              <p className="text-sm text-slate-400">{template.class}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            
            {/* Imagen/Video si existe */}
            {(template.image_url || template.video_url) && (
              <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                {template.video_url && !videoError ? (
                  <video 
                    src={template.video_url}
                    className="w-full h-64 object-cover"
                    controls
                    loop
                    muted
                    onError={() => setVideoError(true)}
                  />
                ) : template.image_url && !imageError ? (
                  <img 
                    src={template.image_url}
                    alt={template.name}
                    className="w-full h-64 object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-64 bg-slate-700 flex items-center justify-center">
                    <TypeIcon className="w-20 h-20 text-slate-500" />
                  </div>
                )}
              </div>
            )}

            {/* Descripción */}
            {template.description && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  DESCRIPCIÓN
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{template.description}</p>
              </div>
            )}

            {/* Especificaciones Técnicas */}
            {specs.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  ESPECIFICACIONES TÉCNICAS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-xs text-slate-500">{spec.label}</span>
                      <span className="text-sm text-white font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información Adicional */}
            <div className="grid grid-cols-2 gap-3">
              {template.country_origin && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <span className="text-xs text-slate-500">País de Origen</span>
                  <p className="text-sm text-white font-medium mt-1">{template.country_origin}</p>
                </div>
              )}
              {template.manufacturer && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <span className="text-xs text-slate-500">Fabricante</span>
                  <p className="text-sm text-white font-medium mt-1">{template.manufacturer}</p>
                </div>
              )}
              {template.era && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <span className="text-xs text-slate-500">Era/Año</span>
                  <p className="text-sm text-white font-medium mt-1">{template.era}</p>
                </div>
              )}
            </div>

            {/* Propulsión */}
            {template.propulsion && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 mb-2">PROPULSIÓN</h3>
                <p className="text-sm text-slate-300">{template.propulsion}</p>
              </div>
            )}

            {/* Armamento */}
            {template.armamento && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 mb-2">ARMAMENTO</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{template.armamento}</p>
              </div>
            )}

            {/* Capacidades (JSON) */}
            {template.capabilities && Object.keys(template.capabilities).length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 mb-3">CAPACIDADES</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(template.capabilities).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-slate-300">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parque Aéreo */}
            {template.air_wing && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-xs font-semibold text-slate-400 mb-2">PARQUE AÉREO</h3>
                <p className="text-sm text-slate-300">{template.air_wing}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span className="capitalize">{template.entity_type}</span> • {template.category}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onUseTemplate(template);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
            >
              📍 Usar Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

