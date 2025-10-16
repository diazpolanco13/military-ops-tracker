import { Ship, Anchor, Plane, Activity, Navigation, Zap, Shield } from 'lucide-react';

/**
 * 🎯 Componente de Popup para mostrar información de entidades militares
 * Diseño militar oscuro con información detallada
 */

// Función para obtener el icono según el tipo
function getEntityIcon(type) {
  switch (type) {
    case 'destructor':
      return Ship;
    case 'fragata':
      return Anchor;
    case 'avion':
      return Plane;
    default:
      return Ship;
  }
}

// Función para obtener el color según el tipo
function getEntityColor(type) {
  switch (type) {
    case 'destructor':
      return '#ef4444'; // Rojo
    case 'fragata':
      return '#3b82f6'; // Azul
    case 'avion':
      return '#6b7280'; // Gris
    default:
      return '#10b981'; // Verde
  }
}

// Función para obtener el badge de estado
function getStatusBadge(status) {
  const statusConfig = {
    activo: { color: '#10b981', label: 'Activo', icon: '🟢' },
    patrullando: { color: '#f59e0b', label: 'Patrullando', icon: '🟡' },
    estacionado: { color: '#6b7280', label: 'Estacionado', icon: '⚪' },
    en_transito: { color: '#3b82f6', label: 'En Tránsito', icon: '🔵' },
    en_vuelo: { color: '#8b5cf6', label: 'En Vuelo', icon: '🟣' },
    vigilancia: { color: '#f97316', label: 'Vigilancia', icon: '🟠' },
  };

  const config = statusConfig[status] || statusConfig.activo;
  return config;
}

export default function EntityPopup({ entity }) {
  const Icon = getEntityIcon(entity.type);
  const color = getEntityColor(entity.type);
  const statusBadge = getStatusBadge(entity.status);

  return (
    <div className="bg-military-bg-primary text-military-text-primary rounded-lg shadow-2xl border border-slate-700 overflow-hidden min-w-[320px]">
      {/* Header con icono y nombre */}
      <div 
        className="px-4 py-3 border-b border-slate-700 flex items-center gap-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <div 
          className="p-2 rounded-full"
          style={{ backgroundColor: `${color}30`, borderColor: color, borderWidth: '2px' }}
        >
          <Icon size={24} color={color} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{entity.name}</h3>
          <p className="text-xs text-military-text-secondary uppercase tracking-wide">
            {entity.class}
          </p>
        </div>
      </div>

      {/* Información detallada */}
      <div className="p-4 space-y-3">
        {/* Estado */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-military-text-secondary flex items-center gap-2">
            <Activity size={16} />
            Estado
          </span>
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            style={{ backgroundColor: `${statusBadge.color}20`, color: statusBadge.color }}
          >
            {statusBadge.icon} {statusBadge.label}
          </span>
        </div>

        {/* Coordenadas */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-military-text-secondary">📍 Posición</span>
          <span className="font-mono text-white">
            {entity.latitude?.toFixed(4)}°, {entity.longitude?.toFixed(4)}°
          </span>
        </div>

        {/* Rumbo */}
        {entity.heading !== null && entity.heading !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-military-text-secondary flex items-center gap-2">
              <Navigation size={16} />
              Rumbo
            </span>
            <span className="font-mono text-white">{entity.heading}°</span>
          </div>
        )}

        {/* Velocidad */}
        {entity.speed !== null && entity.speed !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-military-text-secondary flex items-center gap-2">
              <Zap size={16} />
              Velocidad
            </span>
            <span className="font-mono text-white">
              {entity.speed} {entity.type === 'avion' ? 'km/h' : 'nudos'}
            </span>
          </div>
        )}

        {/* Altitud (solo aviones) */}
        {entity.altitude && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-military-text-secondary">✈️ Altitud</span>
            <span className="font-mono text-white">{entity.altitude} m</span>
          </div>
        )}

        {/* Armamento */}
        {entity.armamento && (
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-start gap-2">
              <Shield size={16} className="mt-1 text-military-text-secondary flex-shrink-0" />
              <div>
                <p className="text-xs text-military-text-secondary mb-1">Armamento</p>
                <p className="text-xs text-white leading-relaxed">
                  {entity.armamento}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="pt-2 border-t border-slate-700 text-xs text-military-text-secondary">
          Última actualización: {new Date(entity.updated_at).toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short'
          })}
        </div>
      </div>
    </div>
  );
}

