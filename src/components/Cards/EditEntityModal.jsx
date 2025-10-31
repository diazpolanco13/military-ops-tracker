import { useState, useEffect } from 'react';
import { X, Ship, Plane, Users, Shield, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { useUpdateEntityFull } from '../../hooks/useUpdateEntityFull';
import Toast from '../Common/Toast';
import ImageUploader from '../ImageUploader';

/**
 * Modal para editar una entidad existente
 * Permite modificar todos los campos importantes
 */
export default function EditEntityModal({ entity, onClose, onSuccess }) {
  const { updateEntityFull, updating } = useUpdateEntityFull();
  const [toast, setToast] = useState(null); // { message, type }
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadType, setUploadType] = useState('icon'); // 'icon' o 'video'
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    status: 'activo',
    latitude: 0,
    longitude: 0,
    heading: 0,
    speed: 0,
    // Capacidades militares
    weapon_type: '',
    fire_range_km: null,
    radar_range_km: null,
    has_surface_to_surface: false,
    has_surface_to_air: false,
    has_torpedoes: false,
    has_cruise_missiles: false,
    defensive_systems: '',
    // Información histórica
    ship_type_description: '',
    country_origin: '',
    manufacturer: '',
    commissioned_year: null,
    homeport: '',
    // Especificaciones
    displacement_tons: null,
    length_meters: null,
    beam_meters: null,
    crew_count: null,
    range_km: null,
    max_speed_knots: null,
    quantity: 1, // Cantidad de unidades agrupadas
    // Multimedia
    icon_url: '', // PNG para icono del mapa
    image_url: '', // Imagen completa
    video_url: '', // WEBM para card
  });

  // Cargar datos de la entidad al abrir
  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        class: entity.class || '',
        status: entity.status || 'activo',
        latitude: entity.latitude || 0,
        longitude: entity.longitude || 0,
        heading: entity.heading || 0,
        speed: entity.speed || 0,
        weapon_type: entity.weapon_type || '',
        fire_range_km: entity.fire_range_km || null,
        radar_range_km: entity.radar_range_km || null,
        has_surface_to_surface: entity.has_surface_to_surface || false,
        has_surface_to_air: entity.has_surface_to_air || false,
        has_torpedoes: entity.has_torpedoes || false,
        has_cruise_missiles: entity.has_cruise_missiles || false,
        defensive_systems: entity.defensive_systems || '',
        ship_type_description: entity.ship_type_description || '',
        country_origin: entity.country_origin || '',
        manufacturer: entity.manufacturer || '',
        commissioned_year: entity.commissioned_year || null,
        homeport: entity.homeport || '',
        displacement_tons: entity.displacement_tons || null,
        length_meters: entity.length_meters || null,
        beam_meters: entity.beam_meters || null,
        crew_count: entity.crew_count || null,
        range_km: entity.range_km || null,
        max_speed_knots: entity.max_speed_knots || null,
        quantity: entity.quantity || 1,
        icon_url: entity.icon_url || '',
        image_url: entity.image_url || '',
        video_url: entity.video_url || '',
      });
    }
  }, [entity]);

  if (!entity) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name.trim()) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' });
      return;
    }

    // Actualizar entidad
    const result = await updateEntityFull(entity.id, formData);
    
    if (result.success) {
      // Mostrar toast de éxito
      setToast({ message: 'Entidad actualizada correctamente', type: 'success' });
      
      // Esperar 500ms para que se vea el toast
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refetch del mapa para actualizar marcadores
      if (window.refetchEntities) {
        await window.refetchEntities();
      }
      
      // Callback de éxito (actualiza la card)
      if (onSuccess) {
        onSuccess();
      }
      
      // Cerrar modal después de refetch
      onClose();
    } else {
      setToast({ message: `Error al actualizar: ${result.error}`, type: 'error' });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Iconos por tipo
  const ENTITY_ICONS = {
    destructor: Ship,
    fragata: Ship,
    avion: Plane,
    tropas: Users,
    tanque: Shield,
    submarino: Ship,
  };

  const Icon = ENTITY_ICONS[entity.type] || Ship;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-900/30">
                <Icon size={28} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Editar: {entity.name}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {entity.type} - {entity.class}
                </p>
                {entity.template_id && (
                  <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                    <Shield size={12} />
                    Al editar, sobrescribes los valores de la plantilla solo para este barco
                  </p>
                )}
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

        {/* Formulario con scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">

            {/* Sección: Información Básica */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide mb-4">Información Básica</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="USS Lake Erie"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Clase/Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => handleChange('class', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="CG-70 TICONDEROGA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="activo">Activo</option>
                    <option value="patrullando">Patrullando</option>
                    <option value="estacionado">Estacionado</option>
                    <option value="en_transito">En Tránsito</option>
                    <option value="en_vuelo">En Vuelo</option>
                    <option value="vigilancia">Vigilancia</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cantidad de Unidades
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                      className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-400">
                      💡 Agrupa múltiples unidades del mismo tipo en un solo marcador (ej: 3 helicópteros)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Posición */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-4">Posición</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Capacidades Militares */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-4">Capacidades Militares</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Armamento Principal
                  </label>
                  <input
                    type="text"
                    value={formData.weapon_type}
                    onChange={(e) => handleChange('weapon_type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Tomahawk BGM-109, SM-2/3, Harpoon"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Alcance de Fuego (km)
                    </label>
                    <input
                      type="number"
                      value={formData.fire_range_km || ''}
                      onChange={(e) => handleChange('fire_range_km', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="2500"
                    />
                  </div>

                  {/* Solo para barcos/aviones (no tropas) */}
                  {entity.type !== 'tropas' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Alcance de Radar (km)
                      </label>
                      <input
                        type="number"
                        value={formData.radar_range_km || ''}
                        onChange={(e) => handleChange('radar_range_km', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="320"
                      />
                    </div>
                  )}
                </div>

                {/* Checkboxes de capacidades */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_surface_to_surface}
                      onChange={(e) => handleChange('has_surface_to_surface', e.target.checked)}
                      className="w-4 h-4 accent-red-500"
                    />
                    <span className="text-sm text-slate-300">🎯 Ataque Mar-Mar</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_surface_to_air}
                      onChange={(e) => handleChange('has_surface_to_air', e.target.checked)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">🛡️ Antiaéreo</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_torpedoes}
                      onChange={(e) => handleChange('has_torpedoes', e.target.checked)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    <span className="text-sm text-slate-300">🐟 Torpedos</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.has_cruise_missiles}
                      onChange={(e) => handleChange('has_cruise_missiles', e.target.checked)}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <span className="text-sm text-slate-300">🚀 Misiles Crucero</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sistemas Defensivos
                  </label>
                  <textarea
                    value={formData.defensive_systems}
                    onChange={(e) => handleChange('defensive_systems', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Phalanx CIWS, SRBOC, AN/SLQ-32"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Información Histórica */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-4">Información Histórica</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción del Tipo de Plataforma
                  </label>
                  <textarea
                    value={formData.ship_type_description}
                    onChange={(e) => handleChange('ship_type_description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Crucero lanzamisiles guiados clase Ticonderoga equipado con sistema Aegis"
                    rows="2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      País de Origen
                    </label>
                    <input
                      type="text"
                      value={formData.country_origin}
                      onChange={(e) => handleChange('country_origin', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Estados Unidos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Astillero
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Bath Iron Works"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Año de Comisión
                    </label>
                    <input
                      type="number"
                      value={formData.commissioned_year || ''}
                      onChange={(e) => handleChange('commissioned_year', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="1993"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {entity.type === 'tropas' ? 'Base de Operaciones' : entity.type === 'avion' ? 'Base Aérea' : 'Puerto Base'}
                    </label>
                    <input
                      type="text"
                      value={formData.homeport}
                      onChange={(e) => handleChange('homeport', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder={
                        entity.type === 'tropas' ? 'Guantánamo Bay, Cuba' :
                        entity.type === 'avion' ? 'Homestead AFB, Florida' :
                        'Pearl Harbor, Hawái'
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Especificaciones Técnicas - CONDICIONAL por tipo */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide mb-4">
                {entity.type === 'tropas' ? 'Especificaciones Unidad' : 'Especificaciones Técnicas'}
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                {/* CAMPOS SOLO PARA BARCOS/AVIONES (no tropas) */}
                {entity.type !== 'tropas' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {entity.type === 'avion' ? 'Peso (tons)' : 'Desplazamiento (tons)'}
                      </label>
                      <input
                        type="number"
                        value={formData.displacement_tons || ''}
                        onChange={(e) => handleChange('displacement_tons', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder={entity.type === 'avion' ? '30' : '9800'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {entity.type === 'avion' ? 'Longitud (m)' : 'Eslora (m)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.length_meters || ''}
                        onChange={(e) => handleChange('length_meters', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder={entity.type === 'avion' ? '15.5' : '173'}
                      />
                    </div>

                    {entity.type !== 'avion' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Manga (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.beam_meters || ''}
                          onChange={(e) => handleChange('beam_meters', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="16.8"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Velocidad Máx. ({entity.type === 'avion' ? 'km/h' : 'nudos'})
                      </label>
                      <input
                        type="number"
                        value={formData.max_speed_knots || ''}
                        onChange={(e) => handleChange('max_speed_knots', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder={entity.type === 'avion' ? '2200' : '30'}
                      />
                    </div>
                  </>
                )}

                {/* CAMPO COMÚN: Tripulación/Efectivos */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {entity.type === 'tropas' ? 'Efectivos' : entity.type === 'avion' ? 'Tripulación' : 'Tripulación'}
                  </label>
                  <input
                    type="number"
                    value={formData.crew_count || ''}
                    onChange={(e) => handleChange('crew_count', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder={entity.type === 'tropas' ? '2700' : entity.type === 'avion' ? '2' : '330'}
                  />
                </div>

                {/* CAMPOS SOLO PARA BARCOS/AVIONES */}
                {entity.type !== 'tropas' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Alcance Op. (km)
                    </label>
                    <input
                      type="number"
                      value={formData.range_km || ''}
                      onChange={(e) => handleChange('range_km', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder={entity.type === 'avion' ? '5000' : '11000'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 🆕 SECCIÓN: Multimedia - MISMO ESTILO QUE PLANTILLAS */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Visualización</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Icono PNG (para mapa) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Icono PNG (mapa)
                  </label>
                  <div className="text-xs text-slate-500 mb-2">
                    PNG sin fondo, transparente
                  </div>
                  
                  {/* Buscar icono en: icon_url, image_thumbnail_url, image_url */}
                  {(formData.icon_url || entity.image_thumbnail_url || entity.icon_url) ? (
                    <div className="space-y-2">
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex items-center justify-center h-24 relative">
                        <img 
                          src={formData.icon_url || entity.image_thumbnail_url || entity.icon_url} 
                          alt="Icon preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                        {/* Indicador si es heredado de plantilla */}
                        {!formData.icon_url && !entity.icon_url && !entity.image_thumbnail_url && (
                          <div className="absolute top-1 right-1 text-xs bg-cyan-600/80 px-2 py-0.5 rounded">
                            Heredado
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate font-mono">
                        {(formData.icon_url || entity.image_thumbnail_url || entity.icon_url)?.split('/').pop()}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadType('icon');
                          setShowImageUploader(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border-2 border-dashed border-blue-500/50 hover:border-blue-500 text-blue-300 rounded-lg transition-all text-sm"
                      >
                        <ImageIcon size={16} />
                        Cambiar Icono
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadType('icon');
                        setShowImageUploader(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border-2 border-dashed border-blue-500/50 hover:border-blue-500 text-blue-300 rounded-lg transition-all text-sm"
                    >
                      <ImageIcon size={16} />
                      Subir Icono PNG
                    </button>
                  )}
                </div>

                {/* Video WEBM (para sidebar) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Video WEBM (sidebar)
                  </label>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    ⚡ Recomendado: 720p, ≤5 segundos, &lt;2MB para carga rápida
                  </div>
                  
                  {/* Buscar video en formData o entity */}
                  {(formData.video_url || entity.video_url) ? (
                    <div className="space-y-2">
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex items-center justify-center h-24 relative">
                        <video 
                          src={formData.video_url || entity.video_url} 
                          className="max-h-full max-w-full object-contain rounded"
                          muted
                          loop
                          autoPlay
                        />
                        {/* Indicador si es heredado */}
                        {!formData.video_url && !entity.video_url && (
                          <div className="absolute top-1 right-1 text-xs bg-cyan-600/80 px-2 py-0.5 rounded">
                            Heredado
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate font-mono">
                        {(formData.video_url || entity.video_url)?.split('/').pop()}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadType('video');
                          setShowImageUploader(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border-2 border-dashed border-purple-500/50 hover:border-purple-500 text-purple-300 rounded-lg transition-all text-sm"
                      >
                        <Upload size={16} />
                        Cambiar Video
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadType('video');
                        setShowImageUploader(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border-2 border-dashed border-purple-500/50 hover:border-purple-500 text-purple-300 rounded-lg transition-all text-sm"
                    >
                      <Upload size={16} />
                      Subir Video WEBM
                    </button>
                  )}
                </div>
              </div>

              {/* Hint informativo */}
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-900/50">
                <p className="text-xs text-slate-400">
                  💡 <strong>Icono PNG:</strong> usado en el mapa. <strong>Video WEBM:</strong> usado en sidebar y modal de detalles
                </p>
              </div>
            </div>

          </div>
        </form>

        {/* Footer con botones de acción */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={updating}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast de notificación */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Image/Video Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {uploadType === 'icon' ? '📌 Subir Icono PNG' : '🎬 Subir Video WEBM'}
              </h3>
              <button
                onClick={() => setShowImageUploader(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <ImageUploader
              entityId={entity.id}
              entityName={entity.name}
              allowTemplateUpload={false}
              onUploadComplete={(result) => {
                // Actualizar formData según el tipo de upload
                
                if (uploadType === 'icon') {
                  // Para icono: usar thumbnail (128×128)
                  if (result.thumbnailUrl) {
                    setFormData(prev => ({
                      ...prev,
                      icon_url: result.thumbnailUrl,
                    }));
                  }
                  setToast({ message: 'Icono subido y optimizado (128×128)', type: 'success' });
                  
                } else if (uploadType === 'video') {
                  // Para video: usar videoUrl
                  if (result.videoUrl) {
                    setFormData(prev => ({
                      ...prev,
                      video_url: result.videoUrl,
                    }));
                  }
                  setToast({ message: 'Video subido correctamente', type: 'success' });
                }
                
                // Cerrar uploader
                setShowImageUploader(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

