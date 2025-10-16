import { Ship, Anchor, Plane, Users, Shield, Navigation, Gauge, Crosshair, Swords, Calendar, MapPin } from 'lucide-react';

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
    emoji: '🟢',
  },
  patrullando: {
    label: 'Patrullando',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    emoji: '🟡',
  },
  estacionado: {
    label: 'Estacionado',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    emoji: '🔵',
  },
  en_transito: {
    label: 'En Tránsito',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    emoji: '🟣',
  },
  en_vuelo: {
    label: 'En Vuelo',
    color: 'bg-cyan-500',
    textColor: 'text-cyan-400',
    emoji: '✈️',
  },
  vigilancia: {
    label: 'Vigilancia',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    emoji: '👁️',
  },
};

/**
 * 🎖️ Popup Ultra Profesional Estilo Militar Táctico
 * - Imagen de la entidad con overlay
 * - Información detallada con iconos
 * - Animaciones suaves
 * - Diseño oscuro tipo comando militar
 */
export default function EnhancedEntityPopup({ entity }) {
  const Icon = TYPE_ICONS[entity.type] || Ship;
  const statusConfig = STATUS_CONFIG[entity.status] || STATUS_CONFIG.activo;

  // Formatear fecha de última actualización
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
    <div className="w-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm">
      {/* 📸 IMAGEN DE LA ENTIDAD */}
      <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {entity.image_thumbnail_url ? (
          <>
            {/* Imagen de fondo con blur */}
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-md opacity-40"
              style={{ backgroundImage: `url(${entity.image_thumbnail_url})` }}
            />
            
            {/* Imagen principal */}
            <img
              src={entity.image_thumbnail_url}
              alt={entity.name}
              className="relative w-full h-full object-contain z-10 p-2"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />

            {/* Gradient overlay inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent z-20" />
          </>
        ) : (
          // Fallback: Ícono grande
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-24 h-24 text-slate-600 opacity-30" strokeWidth={1} />
          </div>
        )}

        {/* Badge de tipo en la esquina superior izquierda */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 z-30">
          <Icon className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {entity.type}
          </span>
        </div>

        {/* Badge de estado en la esquina superior derecha */}
        <div className={`absolute top-3 right-3 flex items-center gap-2 ${statusConfig.color}/20 backdrop-blur-md px-3 py-1.5 rounded-full border ${statusConfig.color}/50 z-30`}>
          <div className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse`} />
          <span className={`text-xs font-bold ${statusConfig.textColor}`}>
            {statusConfig.label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 📋 INFORMACIÓN DETALLADA */}
      <div className="p-5 space-y-3">
        {/* Nombre y Clase */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            {entity.name}
          </h3>
          {entity.class && (
            <p className="text-sm text-slate-400 font-mono uppercase tracking-wide">
              {entity.class}
            </p>
          )}
        </div>

        {/* Grid de Información Principal */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {/* Coordenadas */}
          <div className="bg-slate-800/50 rounded-md p-2.5 flex items-start gap-2 border border-slate-700/30">
            <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-semibold mb-0.5">Coordenadas</p>
              <p className="text-white font-mono text-[10px]">
                {entity.latitude?.toFixed(4)}°, {entity.longitude?.toFixed(4)}°
              </p>
            </div>
          </div>

          {/* Rumbo */}
          <div className="bg-slate-800/50 rounded-md p-2.5 flex items-start gap-2 border border-slate-700/30">
            <Navigation className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-semibold mb-0.5">Rumbo</p>
              <p className="text-white font-mono">
                {entity.heading || 0}°
              </p>
            </div>
          </div>

          {/* Velocidad */}
          <div className="bg-slate-800/50 rounded-md p-2.5 flex items-start gap-2 border border-slate-700/30">
            <Gauge className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-semibold mb-0.5">Velocidad</p>
              <p className="text-white font-mono">
                {entity.speed || 0} / {entity.max_speed_knots || 'N/A'} nudos
              </p>
            </div>
          </div>

          {/* Altitud (si aplica) */}
          {entity.altitude ? (
            <div className="bg-slate-800/50 rounded-md p-2.5 flex items-start gap-2 border border-slate-700/30">
              <Crosshair className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-400 font-semibold mb-0.5">Altitud</p>
                <p className="text-white font-mono">
                  {entity.altitude} m
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Especificaciones Técnicas */}
        {(entity.displacement_tons || entity.length_meters || entity.crew_count) && (
          <div className="bg-gradient-to-r from-blue-950/30 to-slate-800/30 rounded-lg p-4 border border-blue-900/30 mb-3">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Especificaciones Técnicas
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {entity.displacement_tons && (
                <div>
                  <span className="text-slate-500">Desplazamiento:</span>
                  <p className="text-white font-semibold">{entity.displacement_tons.toLocaleString()} tons</p>
                </div>
              )}
              {entity.length_meters && (
                <div>
                  <span className="text-slate-500">Longitud:</span>
                  <p className="text-white font-semibold">{entity.length_meters} m</p>
                </div>
              )}
              {entity.beam_meters && (
                <div>
                  <span className="text-slate-500">Manga:</span>
                  <p className="text-white font-semibold">{entity.beam_meters} m</p>
                </div>
              )}
              {entity.crew_count && (
                <div>
                  <span className="text-slate-500">Tripulación:</span>
                  <p className="text-white font-semibold">{entity.crew_count} miembros</p>
                </div>
              )}
              {entity.range_km && (
                <div>
                  <span className="text-slate-500">Alcance:</span>
                  <p className="text-white font-semibold">{entity.range_km.toLocaleString()} km</p>
                </div>
              )}
              {entity.commissioned_year && (
                <div>
                  <span className="text-slate-500">En servicio:</span>
                  <p className="text-white font-semibold">{entity.commissioned_year}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Armamento */}
        {entity.armamento && (
          <div className="bg-gradient-to-r from-red-950/30 to-slate-800/30 rounded-lg p-4 border border-red-900/30">
            <div className="flex items-start gap-2 mb-2">
              <Swords className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                Armamento
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {entity.armamento}
            </p>
          </div>
        )}

        {/* Última Actualización */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-mono">
              Actualizado: {lastUpdate}
            </span>
          </div>
          
          {/* Indicador arrastrable */}
          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="text-slate-500">⇄</span>
            Arrastrable
          </div>
        </div>
      </div>
    </div>
  );
}

