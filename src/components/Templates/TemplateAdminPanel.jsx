import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Copy, Save, Ship, Plane, Users, Shield, Search, Settings, Upload, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useEntityTemplates } from '../../hooks/useEntityTemplates';
import { getCategoryIcon, getTemplateIcon, getEntityIcon } from '../../config/i2Icons';
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
  const [expandedCategories, setExpandedCategories] = useState({
    'Buques de Guerra': true,
    'Aeronaves': true,
    'Vehículos Militares': true,
    'Personal y Tropas': true,
    'Fuerzas Irregulares': true,
  });

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
      // 🆕 NUEVOS CAMPOS - Capacidades Militares
      weapon_type: '',
      fire_range_km: '',
      radar_range_km: '',
      has_surface_to_surface: false,
      has_surface_to_air: false,
      has_torpedoes: false,
      has_cruise_missiles: false,
      defensive_systems: '',
      // 🆕 NUEVOS CAMPOS - Información Histórica
      ship_type_description: '',
      laid_down_date: '',
      launched_date: '',
      commissioned_date: '',
      homeport: '',
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
    // Actualizar formData según el tipo de upload
    if (uploadingForTemplate === 'icon') {
      // Subiendo icono PNG para el mapa
      setFormData({
        ...formData,
        icon_url: urls.thumbnail || urls.full // Usar thumbnail o full
      });
    } else if (uploadingForTemplate === 'video') {
      // Subiendo video WEBM para el sidebar
      setFormData({
        ...formData,
        image_url: urls.full // Video va en image_url
      });
    } else {
      // Fallback al comportamiento anterior
      setFormData({
        ...formData,
        image_url: urls.full,
        icon_url: urls.thumbnail
      });
    }
    
    setShowImageUploader(false);
    setUploadingForTemplate(null);
  };

  const filteredTemplates = templates.filter(t =>
    t.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Organización jerárquica (igual que EntityPalette)
  const ENTITY_ORGANIZATION = {
    'Buques de Guerra': {
      icon: '🚢',
      types: ['destructor', 'fragata', 'portaaviones', 'submarino'],
      color: '#ef4444'
    },
    'Aeronaves': {
      icon: '✈️',
      types: ['avion'],
      color: '#3b82f6',
      subgroups: {
        'Cazas': ['caza-general'],
        'Helicópteros': ['helicoptero-ataque-general', 'helicoptero-transporte-general'],
        'Drones': ['drone-general'],
        'Otros': ['bombardero-general', 'transporte-general', 'patrulla-maritima-general']
      }
    },
    'Vehículos Militares': {
      icon: '🚙',
      types: ['vehiculo', 'tanque'],
      color: '#6b7280',
      subgroups: {
        'Blindados': ['vehiculo-apc-general'],
        'Tanques': ['vehiculo-tanque-general'],
        'Artillería': ['vehiculo-mbrl-general'],
        'Ligeros': ['vehiculo-patrulla-general', 'vehiculo-utilitario-general']
      }
    },
    'Personal y Tropas': {
      icon: '👥',
      types: ['tropas'],
      color: '#10b981'
    },
    'Fuerzas Irregulares': {
      icon: '⚠️',
      types: ['insurgente'],
      color: '#f59e0b'
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const ENTITY_ICONS = {
    destructor: Ship,
    fragata: Ship,
    portaaviones: Ship,
    submarino: Ship,
    avion: Plane,
    tropas: Users,
    tanque: Shield,
  };

  // Componente interno para renderizar cada plantilla
  const TemplateCard = ({ template, onEdit, onClone, onDelete }) => {
    const iconPath = getTemplateIcon(template.code) || getEntityIcon(template.entity_type);
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-blue-500 transition-all group">
        {/* Header con icono i2 */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${template.icon_color}20` }}
          >
            {iconPath ? (
              <img 
                src={iconPath} 
                alt={template.display_name}
                className="w-5 h-5 object-contain"
                style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
              />
            ) : (
              <div className="w-5 h-5 flex items-center justify-center text-white font-bold text-xs">
                {template.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate text-xs">
              {template.display_name}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {template.code}
            </p>
          </div>
        </div>

        {/* Stats compactos */}
        <div className="flex items-center justify-between text-[10px] mb-2 text-slate-400">
          <span>
            <span className="text-slate-500">Tipo:</span>{' '}
            <span className="text-white">{template.entity_type}</span>
          </span>
          <span>
            <span className="text-slate-500">Usos:</span>{' '}
            <span className="text-white">{template.usage_count || 0}</span>
          </span>
        </div>

        {/* Acciones compactas */}
        <div className="flex gap-1.5 pt-2 border-t border-slate-700">
          <button
            onClick={() => onEdit(template)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] transition-colors"
            title="Editar"
          >
            <Edit2 size={11} />
            <span className="hidden lg:inline">Edit</span>
          </button>
          <button
            onClick={() => onClone(template)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] transition-colors"
            title="Clonar"
          >
            <Copy size={11} />
            <span className="hidden lg:inline">Clon</span>
          </button>
          <button
            onClick={() => onDelete(template)}
            className="flex items-center justify-center px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-[10px] transition-colors"
            title="Eliminar"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ paddingTop: '80px' }}>
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-7xl h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Administración de Plantillas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'list' && `${templates.length} plantillas disponibles`}
              {mode === 'create' && 'Crear nueva plantilla'}
              {mode === 'edit' && `Editando: ${selectedTemplate?.display_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista de plantillas (modo list) */}
          {mode === 'list' && (
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/50 flex gap-2">
                {/* Búsqueda */}
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar plantillas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Botón crear */}
                <button
                  onClick={() => setMode('create')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Nueva</span>
                </button>
              </div>

              {/* Lista organizada por categorías */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Si hay búsqueda, mostrar resultados planos */}
                {searchTerm ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredTemplates.map(template => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onEdit={handleEdit}
                        onClone={handleClone}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  /* Vista organizada por categorías */
                  Object.entries(ENTITY_ORGANIZATION).map(([groupName, groupData]) => {
                    const groupTemplates = templates.filter(t => 
                      groupData.types.includes(t.entity_type) ||
                      (groupData.subgroups && Object.values(groupData.subgroups).flat().includes(t.code))
                    );
                    
                    if (groupTemplates.length === 0) return null;
                    
                    const categoryIconPath = getCategoryIcon(groupName);
                    const isExpanded = expandedCategories[groupName];
                    
                    return (
                      <div key={groupName} className="border border-slate-700 rounded-lg overflow-hidden">
                        {/* Header de categoría */}
                        <button
                          onClick={() => toggleCategory(groupName)}
                          className="w-full px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            {categoryIconPath ? (
                              <img 
                                src={categoryIconPath} 
                                alt={groupName}
                                className="w-6 h-6 object-contain"
                                style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.6))' }}
                              />
                            ) : (
                              <span className="text-xl">{groupData.icon}</span>
                            )}
                            <div className="text-left">
                              <h3 className="text-sm font-semibold text-white">
                                {groupName}
                              </h3>
                              <p className="text-[10px] text-slate-400">
                                {groupTemplates.length} plantilla{groupTemplates.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="text-slate-400 group-hover:text-white transition-colors" size={18} />
                          ) : (
                            <ChevronRight className="text-slate-400 group-hover:text-white transition-colors" size={18} />
                          )}
                        </button>

                        {/* Contenido de la categoría */}
                        {isExpanded && (
                          <div className="p-3 bg-slate-900/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {groupTemplates.map(template => (
                                <TemplateCard
                                  key={template.id}
                                  template={template}
                                  onEdit={handleEdit}
                                  onClone={handleClone}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
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
                        <option value="helicoptero">🚁 Helicóptero</option>
                        <option value="drone">🛸 Drone</option>
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

                {/* Armamento Detallado */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Armamento Detallado</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Armamento Completo
                      </label>
                      <textarea
                        value={formData.armamento}
                        onChange={(e) => setFormData({...formData, armamento: e.target.value})}
                        placeholder="Lista completa de armamento..."
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        🆕 Armamento Principal (Resumen)
                      </label>
                      <input
                        type="text"
                        value={formData.weapon_type}
                        onChange={(e) => setFormData({...formData, weapon_type: e.target.value})}
                        placeholder="Tomahawk BGM-109, SM-2/3, Harpoon"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        🆕 Sistemas Defensivos
                      </label>
                      <textarea
                        value={formData.defensive_systems}
                        onChange={(e) => setFormData({...formData, defensive_systems: e.target.value})}
                        placeholder="Phalanx CIWS, SRBOC, AN/SLQ-32..."
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 🆕 NUEVA SECCIÓN: Capacidades Militares */}
                <div className="bg-gradient-to-br from-red-950/30 to-slate-800 rounded-lg p-6 border border-red-900/50">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">🎯 Capacidades Militares</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Alcance de Fuego (km)
                      </label>
                      <input
                        type="number"
                        value={formData.fire_range_km}
                        onChange={(e) => setFormData({...formData, fire_range_km: e.target.value})}
                        placeholder="2500"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Alcance de Radar (km)
                      </label>
                      <input
                        type="number"
                        value={formData.radar_range_km}
                        onChange={(e) => setFormData({...formData, radar_range_km: e.target.value})}
                        placeholder="320"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* Checkboxes de Capacidades */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.has_surface_to_surface}
                        onChange={(e) => setFormData({...formData, has_surface_to_surface: e.target.checked})}
                        className="w-5 h-5 accent-red-500"
                      />
                      <span className="text-sm text-slate-200">🎯 Ataque Mar-Mar</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.has_surface_to_air}
                        onChange={(e) => setFormData({...formData, has_surface_to_air: e.target.checked})}
                        className="w-5 h-5 accent-blue-500"
                      />
                      <span className="text-sm text-slate-200">🛡️ Defensa Antiaérea</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.has_torpedoes}
                        onChange={(e) => setFormData({...formData, has_torpedoes: e.target.checked})}
                        className="w-5 h-5 accent-cyan-500"
                      />
                      <span className="text-sm text-slate-200">🐟 Torpedos</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.has_cruise_missiles}
                        onChange={(e) => setFormData({...formData, has_cruise_missiles: e.target.checked})}
                        className="w-5 h-5 accent-purple-500"
                      />
                      <span className="text-sm text-slate-200">🚀 Misiles de Crucero</span>
                    </label>
                  </div>
                </div>

                {/* 🆕 NUEVA SECCIÓN: Descripción del Tipo */}
                <div className="bg-gradient-to-br from-cyan-950/30 to-slate-800 rounded-lg p-6 border border-cyan-900/50">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">📋 Descripción del Tipo</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Descripción de la Plataforma
                    </label>
                    <textarea
                      value={formData.ship_type_description}
                      onChange={(e) => setFormData({...formData, ship_type_description: e.target.value})}
                      placeholder="Destructor lanzamisiles guiados clase Arleigh Burke equipado con sistema Aegis..."
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
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

                    {/* Icono PNG (sin fondo para el mapa) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Icono PNG (mapa)
                      </label>
                      <p className="text-xs text-slate-500 mb-2">PNG sin fondo, transparente</p>
                      
                      {formData.icon_url ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-600 rounded-lg">
                          <img 
                            src={formData.icon_url} 
                            alt="Icono" 
                            className="w-12 h-12 object-contain rounded-lg bg-slate-800"
                          />
                          <div className="flex-1">
                            <p className="text-xs text-white">Icono PNG</p>
                            <p className="text-xs text-slate-400 truncate">{formData.icon_url.split('/').pop()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, icon_url: ''})}
                            className="p-1 hover:bg-slate-700 rounded text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingForTemplate('icon');
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
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Video WEBM (sidebar)
                      </label>
                      <p className="text-xs text-yellow-400 mb-2">⚡ Recomendado: 720p, &lt;5 segundos, &lt;2MB para carga rápida</p>
                      
                      {formData.image_url ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-600 rounded-lg">
                          {formData.image_url.match(/\.(webm|mp4)$/i) ? (
                            <video src={formData.image_url} className="w-12 h-12 object-cover rounded-lg" muted />
                          ) : (
                            <img src={formData.image_url} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-white">Video/Imagen</p>
                            <p className="text-xs text-slate-400 truncate">{formData.image_url.split('/').pop()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, image_url: ''})}
                            className="p-1 hover:bg-slate-700 rounded text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingForTemplate('video');
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

                  <p className="text-xs text-slate-500 col-span-2 -mt-2">
                    💡 Icono PNG: usado en el mapa. Video WEBM: usado en sidebar y modal de detalles
                  </p>
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
              entityId={null}
              entityName={formData.display_name || 'Plantilla'}
              onUploadComplete={handleImageUploadComplete}
              allowTemplateUpload={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

