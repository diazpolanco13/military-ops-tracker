import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Copy, Save, Ship, Plane, Users, Shield, Search, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import { useEntityTemplates } from '../../hooks/useEntityTemplates';
import ImageUploader from '../ImageUploader';

/**
 * Panel de Administración de Plantillas
 * CRUD completo para gestionar plantillas de entidades
 */
export default function TemplateAdminPanel({ onClose }) {
  const { 
    templates, 
    loading, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useEntityTemplates();

  const [mode, setMode] = useState('list'); // list, create, edit
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(getEmptyForm());
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadingForTemplate, setUploadingForTemplate] = useState(null); // ID temporal para upload

  // Formulario vacío por defecto
  function getEmptyForm() {
    return {
      name: '',
      code: '',
      display_name: '',
      description: '',
      category: 'militar',
      entity_type: 'destructor',
      sub_type: '',
      class: '',
      displacement_tons: '',
      length_meters: '',
      beam_meters: '',
      max_speed_knots: '',
      crew_count: '',
      range_km: '',
      air_wing: '',
      propulsion: '',
      thrust_hp: '',
      country_origin: '',
      manufacturer: '',
      era: 'moderno',
      armamento: '',
      icon_color: '#3b82f6',
      image_url: '',
    };
  }

  // Cargar datos en formulario al editar
  useEffect(() => {
    if (mode === 'edit' && selectedTemplate) {
      setFormData(selectedTemplate);
    } else if (mode === 'create') {
      setFormData(getEmptyForm());
    }
  }, [mode, selectedTemplate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.name || !formData.display_name) {
      alert('Nombre y Nombre de Visualización son obligatorios');
      return;
    }

    let result;
    if (mode === 'edit') {
      result = await updateTemplate(selectedTemplate.id, formData);
    } else {
      result = await createTemplate(formData);
    }

    if (result.success) {
      setMode('list');
      setSelectedTemplate(null);
      setFormData(getEmptyForm());
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`¿Eliminar la plantilla "${template.display_name}"?`)) return;

    const result = await deleteTemplate(template.id);
    if (result.success) {
      console.log('✅ Plantilla eliminada');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleClone = (template) => {
    setMode('create');
    setFormData({
      ...template,
      id: undefined,
      code: `${template.code}-copy`,
      name: `${template.name} (Copia)`,
      display_name: `${template.display_name} (Copia)`,
      usage_count: 0,
    });
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setMode('edit');
  };

  const handleImageUploadComplete = (urls) => {
    // Actualizar formData con las URLs de las imágenes subidas
    setFormData({
      ...formData,
      image_url: urls.full,
      icon_url: urls.thumbnail // Para icono pequeño
    });
    setShowImageUploader(false);
  };

  const filteredTemplates = templates.filter(t =>
    t.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ENTITY_ICONS = {
    destructor: Ship,
    fragata: Ship,
    portaaviones: Ship,
    submarino: Ship,
    avion: Plane,
    tropas: Users,
    tanque: Shield,
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Administración de Plantillas
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {mode === 'list' && `${templates.length} plantillas disponibles`}
              {mode === 'create' && 'Crear nueva plantilla'}
              {mode === 'edit' && `Editando: ${selectedTemplate?.display_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista de plantillas (modo list) */}
          {mode === 'list' && (
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex gap-3">
                {/* Búsqueda */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar plantillas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Botón crear */}
                <button
                  onClick={() => setMode('create')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  <span>Nueva Plantilla</span>
                </button>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => {
                    const Icon = ENTITY_ICONS[template.entity_type] || Ship;
                    
                    return (
                      <div
                        key={template.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-all group"
                      >
                        {/* Header con icono */}
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${template.icon_color}20` }}
                          >
                            <Icon size={24} style={{ color: template.icon_color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                              {template.display_name}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">
                              {template.code}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="text-slate-400">
                            <span className="text-slate-500">Categoría:</span>{' '}
                            <span className="text-white">{template.category}</span>
                          </div>
                          <div className="text-slate-400">
                            <span className="text-slate-500">Tipo:</span>{' '}
                            <span className="text-white">{template.entity_type}</span>
                          </div>
                          <div className="text-slate-400">
                            <span className="text-slate-500">Usos:</span>{' '}
                            <span className="text-white">{template.usage_count}</span>
                          </div>
                          {template.country_origin && (
                            <div className="text-slate-400">
                              <span className="text-slate-500">País:</span>{' '}
                              <span className="text-white">{template.country_origin}</span>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-3 border-t border-slate-700">
                          <button
                            onClick={() => handleEdit(template)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                          >
                            <Edit2 size={12} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleClone(template)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                          >
                            <Copy size={12} />
                            Clonar
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Formulario de crear/editar */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Información Básica */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Información Básica</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Nombre Interno (código) *
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        placeholder="destroyer-arleigh-burke"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">Formato: tipo-nombre (sin espacios)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Nombre de Visualización *
                      </label>
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                        placeholder="Destructor Arleigh Burke"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Nombre Corto
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Arleigh Burke"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Clase
                      </label>
                      <input
                        type="text"
                        value={formData.class}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        placeholder="Arleigh Burke Class Flight IIA"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Descripción detallada de la plantilla..."
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Clasificación */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Clasificación</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Categoría
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="militar">🎖️ Militar</option>
                        <option value="civil">🏢 Civil</option>
                        <option value="comercial">🏭 Comercial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Tipo de Entidad
                      </label>
                      <select
                        value={formData.entity_type}
                        onChange={(e) => setFormData({...formData, entity_type: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="destructor">🚢 Destructor</option>
                        <option value="fragata">⚓ Fragata</option>
                        <option value="portaaviones">🛳️ Portaaviones</option>
                        <option value="submarino">🔱 Submarino</option>
                        <option value="avion">✈️ Avión</option>
                        <option value="tropas">👤 Personal</option>
                        <option value="tanque">🛡️ Vehículo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Subtipo
                      </label>
                      <input
                        type="text"
                        value={formData.sub_type}
                        onChange={(e) => setFormData({...formData, sub_type: e.target.value})}
                        placeholder="guiado-misiles, caza, etc."
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Especificaciones Técnicas</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Desplazamiento (tons)
                      </label>
                      <input
                        type="number"
                        value={formData.displacement_tons}
                        onChange={(e) => setFormData({...formData, displacement_tons: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Longitud (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.length_meters}
                        onChange={(e) => setFormData({...formData, length_meters: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Manga (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.beam_meters}
                        onChange={(e) => setFormData({...formData, beam_meters: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Velocidad Máx (nudos)
                      </label>
                      <input
                        type="number"
                        value={formData.max_speed_knots}
                        onChange={(e) => setFormData({...formData, max_speed_knots: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Tripulación
                      </label>
                      <input
                        type="number"
                        value={formData.crew_count}
                        onChange={(e) => setFormData({...formData, crew_count: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Alcance (km)
                      </label>
                      <input
                        type="number"
                        value={formData.range_km}
                        onChange={(e) => setFormData({...formData, range_km: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Propulsión
                      </label>
                      <input
                        type="text"
                        value={formData.propulsion}
                        onChange={(e) => setFormData({...formData, propulsion: e.target.value})}
                        placeholder="4 turbinas GE LM 2500"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Empuje (hp)
                      </label>
                      <input
                        type="number"
                        value={formData.thrust_hp}
                        onChange={(e) => setFormData({...formData, thrust_hp: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        País de Origen
                      </label>
                      <input
                        type="text"
                        value={formData.country_origin}
                        onChange={(e) => setFormData({...formData, country_origin: e.target.value})}
                        placeholder="Estados Unidos"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Fabricante
                      </label>
                      <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                        placeholder="Bath Iron Works"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Parque Aéreo
                      </label>
                      <input
                        type="text"
                        value={formData.air_wing}
                        onChange={(e) => setFormData({...formData, air_wing: e.target.value})}
                        placeholder="2 helicópteros SH-60 Seahawk"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Armamento */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Armamento y Capacidades</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Armamento
                    </label>
                    <textarea
                      value={formData.armamento}
                      onChange={(e) => setFormData({...formData, armamento: e.target.value})}
                      placeholder="Lista completa de armamento..."
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Visualización */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Visualización</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Color del Icono
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.icon_color}
                          onChange={(e) => setFormData({...formData, icon_color: e.target.value})}
                          className="w-16 h-10 bg-slate-900 border border-slate-600 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.icon_color}
                          onChange={(e) => setFormData({...formData, icon_color: e.target.value})}
                          placeholder="#3b82f6"
                          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Era
                      </label>
                      <select
                        value={formData.era}
                        onChange={(e) => setFormData({...formData, era: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="moderno">Moderno (2000+)</option>
                        <option value="guerra-fria">Guerra Fría (1945-1991)</option>
                        <option value="ww2">Segunda Guerra Mundial</option>
                        <option value="ww1">Primera Guerra Mundial</option>
                        <option value="clasico">Clásico</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Imagen de la Plantilla
                      </label>
                      
                      {formData.image_url ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-600 rounded-lg">
                          <img 
                            src={formData.image_url} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-white">Imagen cargada</p>
                            <p className="text-xs text-slate-400 truncate">{formData.image_url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, image_url: '', icon_url: ''})}
                            className="p-2 hover:bg-slate-700 rounded-lg text-red-400 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingForTemplate('temp');
                            setShowImageUploader(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border-2 border-dashed border-blue-500/50 hover:border-blue-500 text-blue-300 rounded-lg transition-all"
                        >
                          <Upload size={20} />
                          <span>Subir Imagen a Supabase Storage</span>
                        </button>
                      )}
                      
                      <p className="text-xs text-slate-500 mt-1.5">
                        💡 Esta imagen será heredada por todas las entidades creadas desde esta plantilla
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-900 pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('list');
                      setSelectedTemplate(null);
                      setFormData(getEmptyForm());
                    }}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Save size={18} />
                    {mode === 'edit' ? 'Guardar Cambios' : 'Crear Plantilla'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal de subida de imagen */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[300]">
          <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon size={20} />
                Subir Imagen de Plantilla
              </h3>
              <button
                onClick={() => setShowImageUploader(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <ImageUploader
              entityId="template-temp"
              entityName={formData.display_name || 'Plantilla'}
              onUploadComplete={handleImageUploadComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}

