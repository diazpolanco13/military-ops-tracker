import { useState } from 'react';
import { X, Ship, Plane, Users, Shield, MapPin, Navigation, Gauge, Eye, Building2 } from 'lucide-react';

/**
 * Modal para instanciar una nueva entidad desde una plantilla
 * Estilo profesional militar, solo pide datos únicos
 * Adapta campos según el tipo de entidad (móvil vs fija)
 */
export default function InstantiateModal({ 
  template, 
  position, // { lat, lng } opcional
  onClose, 
  onConfirm 
}) {
  // Determinar si la entidad es estática (no se mueve)
  const isStaticEntity = template.entity_type === 'lugar' || template.entity_type === 'tropas';
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'activo',
    // Solo para entidades móviles
    heading: isStaticEntity ? null : 180,
    speed: isStaticEntity ? null : 0,
    commissioned_year: template?.commissioned_year || new Date().getFullYear(),
    // Posición inicial
    latitude: position?.lat || 18.4655,
    longitude: position?.lng || -66.1057,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!template) return null;

  // Iconos por tipo
  const ENTITY_ICONS = {
    destructor: Ship,
    fragata: Ship,
    portaaviones: Ship,
    submarino: Ship,
    avion: Plane,
    tropas: Users,
    tanque: Shield,
    lugar: Building2,
  };

  const Icon = ENTITY_ICONS[template.entity_type] || Ship;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    // Preparar datos finales
    const entityData = {
      ...formData,
      template_id: template.id,
      type: template.entity_type,
      // Los demás campos se heredan de la plantilla
    };

    // Limpiar campos que no aplican para entidades estáticas
    if (isStaticEntity) {
      delete entityData.heading;
      delete entityData.speed;
    }

    onConfirm(entityData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${template.icon_color}20` }}
              >
                <Icon size={28} style={{ color: template.icon_color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Crear {template.display_name}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Basado en plantilla: {template.class}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sección: Datos Personalizados */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Datos Únicos (Obligatorios)
            </h3>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nombre de la Entidad *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: USS Porter"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Código/Designación */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Código/Designación
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ej: DDG-78"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Estado Operacional */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Estado Operacional
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="activo">Activo</option>
                {!isStaticEntity && <option value="patrullando">Patrullando</option>}
                {!isStaticEntity && <option value="estacionado">Estacionado</option>}
                {!isStaticEntity && <option value="en_transito">En Tránsito</option>}
                {!isStaticEntity && <option value="en_vuelo">En Vuelo</option>}
                <option value="vigilancia">Vigilancia</option>
              </select>
            </div>

            {/* Campos específicos para entidades MÓVILES (barcos, aviones, vehículos) */}
            {!isStaticEntity && (
              <>
                {/* Grid 2 columnas - Rumbo y Velocidad */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Rumbo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center">
                      <Navigation size={14} className="mr-1" />
                      Rumbo Inicial (°)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="359"
                      value={formData.heading}
                      onChange={(e) => handleChange('heading', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Velocidad */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center">
                      <Gauge size={14} className="mr-1" />
                      Velocidad Actual (nudos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.speed}
                      onChange={(e) => handleChange('speed', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sección: Posición/Ubicación */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              {isStaticEntity ? 'Ubicación en el Mapa' : 'Posición Inicial'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center">
                  <MapPin size={14} className="mr-1" />
                  Latitud
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center">
                  <MapPin size={14} className="mr-1" />
                  Longitud
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Toggle Personalización Avanzada */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors text-slate-300"
          >
            <span className="text-sm font-medium">Personalización Avanzada (Opcional)</span>
            <Eye size={16} className={showAdvanced ? 'text-blue-400' : ''} />
          </button>

          {/* Personalización Avanzada */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">
                Por defecto, esta entidad heredará todas las especificaciones de la plantilla.
                Aquí puedes sobrescribir valores específicos si es necesario.
              </p>
              
              {!isStaticEntity && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Año de Comisionado
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.commissioned_year}
                    onChange={(e) => handleChange('commissioned_year', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {isStaticEntity && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Año de Construcción/Establecimiento
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.commissioned_year}
                    onChange={(e) => handleChange('commissioned_year', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Sección: Heredado de Plantilla */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-blue-950/30 to-slate-800/30 rounded-lg border border-blue-900/30">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Heredará de la Plantilla
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {template.displacement_tons && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Desplazamiento:</span>
                  <span className="text-white font-medium">{template.displacement_tons.toLocaleString()} tons</span>
                </div>
              )}
              {template.length_meters && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitud:</span>
                  <span className="text-white font-medium">{template.length_meters} m</span>
                </div>
              )}
              {template.max_speed_knots && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Vel. Máxima:</span>
                  <span className="text-white font-medium">{template.max_speed_knots} nudos</span>
                </div>
              )}
              {template.crew_count && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Tripulación:</span>
                  <span className="text-white font-medium">{template.crew_count} miembros</span>
                </div>
              )}
              {template.range_km && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Alcance:</span>
                  <span className="text-white font-medium">{template.range_km.toLocaleString()} km</span>
                </div>
              )}
              {template.country_origin && (
                <div className="flex justify-between">
                  <span className="text-slate-400">País:</span>
                  <span className="text-white font-medium">{template.country_origin}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver especificaciones completas →
            </button>
          </div>
        </form>

        {/* Footer con botones */}
        <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
          >
            <span>Añadir al Mapa</span>
            <span>✅</span>
          </button>
        </div>
      </div>
    </div>
  );
}

