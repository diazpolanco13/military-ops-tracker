import { X, MapPin, Navigation, Gauge, Crosshair, Shield, Swords, Calendar, Ship, Anchor, Plane, Users } from 'lucide-react';

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
 * 📊 Sidebar de detalles de entidad (estilo VesselFinder)
 * Panel lateral profesional que muestra información completa
 */
export default function EntityDetailsSidebar({ entity, onClose, isOpen = false }) {

  // Estado vacío cuando no hay entidad
  if (!entity) {
    return (
      <div
        className={`fixed top-0 h-screen w-[380px] bg-slate-900 shadow-2xl flex flex-col border-r border-slate-700 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ left: '64px', zIndex: 45 }}
      >
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-slate-400">
            <Ship className="w-16 h-16 mx-auto mb-4 opacity-30" strokeWidth={1} />
            <p className="text-sm">Selecciona una entidad del mapa</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div
      className={`fixed top-0 h-screen w-[380px] bg-slate-900 shadow-2xl flex flex-col border-r border-slate-700 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ left: '64px', zIndex: 45 }}
    >
      {/* Header con imagen/video de fondo */}
      <div className="relative h-64 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden flex-shrink-0">
        {/* Video de fondo (prioridad sobre imagen) */}
        {entity.video_url ? (
          <div className="relative z-10 h-full w-full">
            <video
              src={entity.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-lg"
              style={{
                filter: 'brightness(0.8) contrast(1.2) saturate(1.1)',
                transform: 'scale(1.05)' // Para evitar bordes negros
              }}
            />
            {/* Overlay sutil para mejor legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 rounded-lg" />
          </div>
        ) : entity.image_thumbnail_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-30"
              style={{ backgroundImage: `url(${entity.image_thumbnail_url})` }}
            />
            <div className="relative z-10 flex items-center justify-center h-full p-6">
              <img
                src={entity.image_thumbnail_url}
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
            {entity.type}
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

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Nombre y clase */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {entity.name}
            </h2>
            {entity.class && (
              <p className="text-sm text-slate-400 font-mono uppercase tracking-wide">
                {entity.class}
              </p>
            )}
          </div>

          {/* Información en tiempo real */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400 font-semibold">Posición</span>
              </div>
              <p className="text-white font-mono text-xs">
                {entity.latitude?.toFixed(4)}°
              </p>
              <p className="text-white font-mono text-xs">
                {entity.longitude?.toFixed(4)}°
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400 font-semibold">Rumbo</span>
              </div>
              <p className="text-white font-mono text-2xl font-bold">
                {entity.heading || 0}°
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400 font-semibold">Velocidad</span>
              </div>
              <p className="text-white font-mono text-lg font-bold">
                {entity.speed || 0} kn
              </p>
              <p className="text-slate-500 text-xs">
                máx: {entity.max_speed_knots || 'N/A'} kn
              </p>
            </div>

            {entity.altitude && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400 font-semibold">Altitud</span>
                </div>
                <p className="text-white font-mono text-lg font-bold">
                  {entity.altitude} m
                </p>
              </div>
            )}
          </div>

          {/* Especificaciones Técnicas */}
          {(entity.displacement_tons || entity.length_meters || entity.crew_count) && (
            <div className="bg-gradient-to-br from-blue-950/30 to-slate-800/30 rounded-lg p-4 border border-blue-900/30">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Especificaciones Técnicas
              </h3>
              
              <div className="space-y-3">
                {entity.displacement_tons && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Desplazamiento</span>
                    <span className="text-sm text-white font-bold">{entity.displacement_tons.toLocaleString()} tons</span>
                  </div>
                )}
                
                {entity.length_meters && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Longitud</span>
                    <span className="text-sm text-white font-bold">{entity.length_meters} m</span>
                  </div>
                )}
                
                {entity.beam_meters && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Manga</span>
                    <span className="text-sm text-white font-bold">{entity.beam_meters} m</span>
                  </div>
                )}
                
                {entity.crew_count && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Tripulación</span>
                    <span className="text-sm text-white font-bold">{entity.crew_count} miembros</span>
                  </div>
                )}
                
                {entity.range_km && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/30">
                    <span className="text-xs text-slate-400">Alcance</span>
                    <span className="text-sm text-white font-bold">{entity.range_km.toLocaleString()} km</span>
                  </div>
                )}
                
                {entity.commissioned_year && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">En servicio desde</span>
                    <span className="text-sm text-white font-bold">{entity.commissioned_year}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Armamento */}
          {entity.armamento && (
            <div className="bg-gradient-to-br from-red-950/30 to-slate-800/30 rounded-lg p-4 border border-red-900/30">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4" />
                Armamento
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {entity.armamento}
              </p>
            </div>
          )}

          {/* Footer con última actualización */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">
                Actualizado: {lastUpdate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

