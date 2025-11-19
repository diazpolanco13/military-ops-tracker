import { X, MapPin, Navigation, Gauge, Crosshair, Shield, Swords, Calendar, Ship, Anchor, Plane, Users, Target, Radar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TYPE_ICONS = {
  destructor: Ship,
  fragata: Anchor,
  avion: Plane,
  tropas: Users,
  tanque: Shield,
  submarino: Ship,
};

const STATUS_CONFIG = {
  activo: {
    label: 'Activo',
    color: 'bg-green-500',
    textColor: 'text-green-400',
  },
  patrullando: {
    label: 'Patrullando',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
  },
  estacionado: {
    label: 'Estacionado',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
  },
  en_transito: {
    label: 'En Tránsito',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
  },
  en_vuelo: {
    label: 'En Vuelo',
    color: 'bg-cyan-500',
    textColor: 'text-cyan-400',
  },
  vigilancia: {
    label: 'Vigilancia',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
  },
};

/**
 * 📊 Modal de detalles completos de entidad
 * Muestra todas las especificaciones técnicas, historial, armamento
 */
export default function EntityDetailedModal({ entity, onClose }) {
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, armamento, capacidades, specs

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

  if (!entity) return null;

  // Función helper para obtener valor (entidad o heredado de plantilla)
  const getValue = (field) => {
    return entity[field] ?? template?.[field] ?? null;
  };

  const Icon = TYPE_ICONS[entity.type] || Ship;
  const statusConfig = STATUS_CONFIG[entity.status] || STATUS_CONFIG.activo;

  const lastUpdate = entity.last_position_update 
    ? new Date(entity.last_position_update).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  // Obtener video/imagen (priorizar entidad, luego plantilla)
  // Obtener video/imagen (priorizar entidad, luego plantilla)
  const videoUrl = entity.video_url || template?.video_url || (template?.image_url?.match(/\.(webm|mp4)$/i) ? template?.image_url : null);
  const imageUrl = entity.image_url || entity.image_thumbnail_url || template?.image_url || template?.icon_url;

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal centrado con scroll */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90vw] max-w-[800px] max-h-[90vh] overflow-hidden animate-scaleIn">
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-cyan-500/30 flex flex-col" style={{ maxHeight: '90vh' }}>
          {/* Header con imagen/video de fondo */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden flex-shrink-0" style={{ aspectRatio: videoUrl ? '16/9' : 'auto', height: videoUrl ? 'auto' : '280px', maxHeight: '400px' }}>
            {/* Video de fondo (prioridad sobre imagen) */}
            {videoUrl ? (
              <div className="relative z-10 h-full w-full bg-black flex items-center justify-center">
                <video
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-auto object-contain"
                  style={{ maxWidth: '100%' }}
                />
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
              </div>
            ) : imageUrl ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-30"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <div className="relative z-10 flex items-center justify-center h-full p-6">
                  <img
                    src={imageUrl}
                    alt={entity.name}
                    className="max-h-full max-w-full object-contain drop-shadow-2xl"
                  />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-32 h-32 text-slate-700 opacity-30" strokeWidth={1} />
              </div>
            )}

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm rounded-lg transition-colors z-20 border border-slate-700"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Badge de tipo */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 z-20">
              <Icon className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {template?.sub_type === 'crucero' ? 'crucero' : entity.type}
              </span>
            </div>

            {/* Badge de estado */}
            <div className={`absolute bottom-4 left-4 flex items-center gap-2 ${statusConfig.color}/20 backdrop-blur-md px-3 py-2 rounded-full border ${statusConfig.color}/50 z-20`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse`} />
              <span className={`text-xs font-bold ${statusConfig.textColor}`}>
                {statusConfig.label.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Barra de TABS */}
          <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'general'
                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('armamento')}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'armamento'
                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                }`}
              >
                Armamento
              </button>
              <button
                onClick={() => setActiveTab('capacidades')}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'capacidades'
                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                }`}
              >
                Capacidades
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'specs'
                    ? 'bg-cyan-600/30 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                }`}
              >
                Specs
              </button>
            </div>
          </div>

          {/* Contenido scrolleable según tab activa */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              {/* Nombre y clase - SIEMPRE VISIBLE */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {entity.name}
                </h2>
                {entity.class && (
                  <p className="text-sm text-slate-400 font-mono uppercase tracking-wide">
                    {entity.class}
                  </p>
                )}
              </div>

              {/* TAB: GENERAL */}
              {activeTab === 'general' && (
                <>
                  {/* Tipo de Plataforma */}
                  <div className="bg-gradient-to-br from-cyan-950/30 to-slate-800/30 rounded-lg p-4 border border-cyan-900/30">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide mb-3">Tipo de Plataforma</h3>
                    <div className="text-2xl font-bold text-white mb-2">
                      {/* Detectar crucero por template */}
                      {template?.sub_type === 'crucero' ? 'CRUCERO' :
                       entity.type === 'destructor' ? 'DESTRUCTOR' :
                       entity.type === 'fragata' ? 'FRAGATA' :
                       entity.type === 'avion' ? 'AERONAVE' :
                       entity.type === 'submarino' ? 'SUBMARINO' :
                       entity.type === 'tropas' ? 'TROPAS' :
                       entity.type.toUpperCase()}
                    </div>
                    
                    {/* Descripción específica del tipo de barco */}
                    {getValue('ship_type_description') ? (
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {getValue('ship_type_description')}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-300">
                        {template?.sub_type === 'crucero' && 'Buque de guerra polivalente equipado con sistemas de combate avanzados para defensa de área y ataque multi-misión.'}
                        {entity.type === 'destructor' && 'Buque de guerra de superficie diseñado para escoltar flotas y proporcionar defensa antiaérea y antisubmarina.'}
                        {entity.type === 'fragata' && 'Buque de guerra versátil diseñado para operaciones de escolta y patrulla.'}
                        {entity.type === 'submarino' && 'Nave submarina de ataque diseñada para operaciones sigilosas y ataques de precisión.'}
                        {entity.type === 'avion' && 'Plataforma aérea para superioridad, ataque, reconocimiento o transporte.'}
                      </p>
                    )}
                  </div>

                  {/* Información de Fabricación - Adaptativa */}
                  <div className="grid grid-cols-2 gap-3">
                    {getValue('country_origin') && (
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1">País de Origen</div>
                        <div className="text-base text-white font-bold">{getValue('country_origin')}</div>
                      </div>
                    )}
                    
                    {getValue('manufacturer') && (
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1">
                          {entity.type === 'tropas' ? 'Organización' : entity.type === 'avion' ? 'Fabricante' : 'Astillero'}
                        </div>
                        <div className="text-base text-white font-bold">{getValue('manufacturer')}</div>
                      </div>
                    )}

                    {entity.commissioned_year && (
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1">En Servicio Desde</div>
                        <div className="text-base text-white font-bold">{entity.commissioned_year}</div>
                      </div>
                    )}

                    {getValue('cost_millions') && (
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <div className="text-xs text-slate-400 mb-1">Costo</div>
                        <div className="text-base text-white font-bold">${getValue('cost_millions')}M USD</div>
                      </div>
                    )}
                  </div>

                  {/* Historial de Servicio / Base de Operaciones - Adaptativo */}
                  {(getValue('laid_down_date') || getValue('launched_date') || getValue('commissioned_date') || getValue('homeport')) && (
                    <div className="bg-gradient-to-br from-blue-950/30 to-slate-800/30 rounded-lg p-4 border border-blue-900/30">
                      <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {entity.type === 'tropas' ? 'Base de Operaciones' : 'Historial de Servicio'}
                      </h3>
                      <div className="space-y-3">
                        {/* Fechas solo para barcos (no tropas) */}
                        {entity.type !== 'tropas' && getValue('laid_down_date') && (
                          <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                            <span className="text-xs text-slate-400">Quilla Colocada</span>
                            <span className="text-sm text-white font-semibold">
                              {new Date(getValue('laid_down_date')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        {entity.type !== 'tropas' && getValue('launched_date') && (
                          <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                            <span className="text-xs text-slate-400">Botadura</span>
                            <span className="text-sm text-white font-semibold">
                              {new Date(getValue('launched_date')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        {entity.type !== 'tropas' && getValue('commissioned_date') && (
                          <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                            <span className="text-xs text-slate-400">Puesta en Servicio</span>
                            <span className="text-sm text-white font-semibold">
                              {new Date(getValue('commissioned_date')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        {getValue('homeport') && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">
                              {entity.type === 'tropas' ? 'Base de Operaciones' : 
                               entity.type === 'avion' ? 'Base Aérea' : 
                               'Puerto Base'}
                            </span>
                            <span className="text-sm text-white font-semibold">{getValue('homeport')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Posición Actual */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300 font-semibold">Posición Actual</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Latitud</div>
                        <div className="text-sm font-mono text-white">{entity.latitude?.toFixed(4)}°</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Longitud</div>
                        <div className="text-sm font-mono text-white">{entity.longitude?.toFixed(4)}°</div>
                      </div>
                    </div>
                  </div>

                </>
              )}

              {/* TAB: ARMAMENTO */}
              {activeTab === 'armamento' && (
                <>
                  {/* Armamento Principal */}
                  {getValue('weapon_type') && (
                    <div className="bg-gradient-to-br from-red-950/30 to-slate-800/30 rounded-lg p-4 border border-red-900/30">
                      <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Swords className="w-4 h-4" />
                        Sistema Principal
                      </h3>
                      <p className="text-base text-white font-semibold">
                        {getValue('weapon_type')}
                      </p>
                    </div>
                  )}

                  {/* Armamento Detallado */}
                  {getValue('armamento') && (
                    <div className="bg-gradient-to-br from-orange-950/30 to-slate-800/30 rounded-lg p-4 border border-orange-900/30">
                      <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Arsenal Completo
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {getValue('armamento')}
                      </p>
                    </div>
                  )}

                  {/* Sistemas Defensivos */}
                  {getValue('defensive_systems') && (
                    <div className="bg-gradient-to-br from-blue-950/30 to-slate-800/30 rounded-lg p-4 border border-blue-900/30">
                      <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Sistemas Defensivos
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {getValue('defensive_systems')}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* TAB: CAPACIDADES */}
              {activeTab === 'capacidades' && (
                <>
                  {/* Capacidades Tácticas */}
                  <div className="bg-gradient-to-br from-purple-950/30 to-slate-800/30 rounded-lg p-4 border border-purple-900/30">
                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-4">Capacidades Tácticas</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg border ${getValue('has_surface_to_surface') ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-800/30 border-slate-600/30'}`}>
                        <div className="text-xs text-slate-400 mb-1">Ataque Mar-Mar</div>
                        <div className={`text-lg font-bold ${getValue('has_surface_to_surface') ? 'text-red-400' : 'text-slate-600'}`}>
                          {getValue('has_surface_to_surface') ? '✓ Activa' : '✗ No'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${getValue('has_surface_to_air') ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800/30 border-slate-600/30'}`}>
                        <div className="text-xs text-slate-400 mb-1">Defensa Antiaérea</div>
                        <div className={`text-lg font-bold ${getValue('has_surface_to_air') ? 'text-blue-400' : 'text-slate-600'}`}>
                          {getValue('has_surface_to_air') ? '✓ Activa' : '✗ No'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${getValue('has_torpedoes') ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-slate-800/30 border-slate-600/30'}`}>
                        <div className="text-xs text-slate-400 mb-1">Torpedos</div>
                        <div className={`text-lg font-bold ${getValue('has_torpedoes') ? 'text-cyan-400' : 'text-slate-600'}`}>
                          {getValue('has_torpedoes') ? '✓ Activa' : '✗ No'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${getValue('has_cruise_missiles') ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-800/30 border-slate-600/30'}`}>
                        <div className="text-xs text-slate-400 mb-1">Misiles Crucero</div>
                        <div className={`text-lg font-bold ${getValue('has_cruise_missiles') ? 'text-purple-400' : 'text-slate-600'}`}>
                          {getValue('has_cruise_missiles') ? '✓ Activa' : '✗ No'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alcances */}
                  <div className="grid grid-cols-2 gap-4">
                    {getValue('fire_range_km') && (
                      <div className="bg-gradient-to-br from-orange-950/30 to-slate-800/30 rounded-lg p-4 border border-orange-900/30">
                        <h3 className="text-xs text-orange-400 mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Alcance de Fuego
                        </h3>
                        <p className="text-3xl font-bold text-white">{getValue('fire_range_km').toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">kilómetros</p>
                      </div>
                    )}
                    {getValue('radar_range_km') && (
                      <div className="bg-gradient-to-br from-green-950/30 to-slate-800/30 rounded-lg p-4 border border-green-900/30">
                        <h3 className="text-xs text-green-400 mb-2 flex items-center gap-1">
                          <Radar className="w-3 h-3" /> Alcance de Radar
                        </h3>
                        <p className="text-3xl font-bold text-white">{getValue('radar_range_km')}</p>
                        <p className="text-xs text-slate-400 mt-1">kilómetros</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB: SPECS */}
              {activeTab === 'specs' && (
                <>
                  {/* Especificaciones Técnicas */}
                  <div className="bg-gradient-to-br from-blue-950/30 to-slate-800/30 rounded-lg p-4 border border-blue-900/30">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Especificaciones Técnicas
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* SOLO para barcos/aviones (no tropas) */}
                      {entity.type !== 'tropas' && getValue('displacement_tons') && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">
                            {entity.type === 'avion' ? 'Peso' : 'Desplazamiento'}
                          </div>
                          <div className="text-xl text-white font-bold">{getValue('displacement_tons').toLocaleString()} tons</div>
                        </div>
                      )}
                      
                      {entity.type !== 'tropas' && getValue('length_meters') && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">
                            {entity.type === 'avion' ? 'Longitud' : 'Eslora'}
                          </div>
                          <div className="text-xl text-white font-bold">{getValue('length_meters')} m</div>
                        </div>
                      )}
                      
                      {entity.type !== 'tropas' && entity.type !== 'avion' && getValue('beam_meters') && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Manga</div>
                          <div className="text-xl text-white font-bold">{getValue('beam_meters')} m</div>
                        </div>
                      )}
                      
                      {getValue('crew_count') && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">
                            {entity.type === 'tropas' ? 'Efectivos' : 'Tripulación'}
                          </div>
                          <div className="text-xl text-white font-bold">
                            {getValue('crew_count').toLocaleString()}
                            {entity.type === 'tropas' && ' personal'}
                          </div>
                        </div>
                      )}
                      
                      {/* Personal Embarcado (solo para embarcaciones) */}
                      {['portaaviones', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(entity.type) && getValue('embarked_personnel') && (
                        <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-900/30">
                          <div className="text-xs text-cyan-400 mb-1 flex items-center gap-1">
                            👥 Personal Embarcado
                          </div>
                          <div className="text-xl text-white font-bold">
                            {getValue('embarked_personnel').toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Marines, tropas, fuerzas especiales
                          </div>
                        </div>
                      )}
                      
                      {/* Aeronaves Embarcadas (solo para embarcaciones) */}
                      {['portaaviones', 'destructor', 'fragata'].includes(entity.type) && getValue('embarked_aircraft') && (
                        <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-900/30">
                          <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
                            ✈️ Aeronaves Embarcadas
                          </div>
                          <div className="text-xl text-white font-bold">
                            {getValue('embarked_aircraft')}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Aviones y helicópteros
                          </div>
                        </div>
                      )}
                      
                      {/* Efectivos Totales (Resumen para embarcaciones) */}
                      {['portaaviones', 'anfibio', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(entity.type) && 
                       (getValue('crew_count') || getValue('embarked_personnel')) && (
                        <div className="bg-green-900/20 rounded-lg p-3 border-2 border-green-900/40">
                          <div className="text-xs text-green-400 mb-1 font-semibold uppercase">
                            💪 Efectivos Totales
                          </div>
                          <div className="text-2xl text-white font-bold">
                            {((getValue('crew_count') || 0) + (getValue('embarked_personnel') || 0)).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {getValue('crew_count') ? `${getValue('crew_count').toLocaleString()} tripulación` : ''}
                            {getValue('crew_count') && getValue('embarked_personnel') ? ' + ' : ''}
                            {getValue('embarked_personnel') ? `${getValue('embarked_personnel').toLocaleString()} embarcados` : ''}
                          </div>
                        </div>
                      )}
                      
                      {/* Solo para barcos/aviones */}
                      {entity.type !== 'tropas' && getValue('range_km') && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Alcance Operativo</div>
                          <div className="text-xl text-white font-bold">{getValue('range_km').toLocaleString()} km</div>
                        </div>
                      )}
                      
                      {entity.commissioned_year && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">
                            {entity.type === 'tropas' ? 'Establecido' : 'En Servicio'}
                          </div>
                          <div className="text-xl text-white font-bold">{entity.commissioned_year}</div>
                        </div>
                      )}

                      {/* Solo para barcos/aviones */}
                      {entity.type !== 'tropas' && getValue('max_speed_knots') && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">
                            {entity.type === 'avion' ? 'Velocidad Máxima' : 'Velocidad Máxima'}
                          </div>
                          <div className="text-xl text-white font-bold">
                            {getValue('max_speed_knots')} {entity.type === 'avion' ? 'km/h' : 'nudos'}
                          </div>
                        </div>
                      )}

                      {/* Solo para barcos/aviones */}
                      {entity.type !== 'tropas' && getValue('propulsion') && (
                        <div className="col-span-2">
                          <div className="text-xs text-slate-400 mb-1">Propulsión</div>
                          <div className="text-sm text-white">{getValue('propulsion')}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Última actualización */}
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-700/50">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-500">
                      Actualizado: {lastUpdate}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer con botón cerrar */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

