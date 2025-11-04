import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronRight, Star, Clock, FolderOpen, Plus, Settings, Grid3x3, List, X } from 'lucide-react';
import { useEntityTemplates } from '../../hooks/useEntityTemplates';
import { getCategoryIcon } from '../../config/i2Icons';
import TemplateCard from './TemplateCard';
import TemplateGridItem from './TemplateGridItem';
import TemplateAdminPanel from './TemplateAdminPanel';
import TemplateDetailsModal from './TemplateDetailsModal';

/**
 * Panel lateral de paleta de plantillas tipo IBM Analyst's Notebook
 * Organiza plantillas en jerarquía de categorías y tipos
 */
export default function EntityPalette({ onSelectTemplate, onDragTemplate, onClose }) {
  const { templates, loading, getTemplatesHierarchy, getTopTemplates, searchTemplates } = useEntityTemplates();
  const sidebarRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, favorites, recent
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'grid'
  const [expandedCategories, setExpandedCategories] = useState({}); // TODO colapsado por defecto
  const [expandedTypes, setExpandedTypes] = useState({}); // TODO colapsado por defecto
  const [favorites, setFavorites] = useState(() => {
    // ✅ Cargar favoritos desde localStorage
    const saved = localStorage.getItem('templateFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [topTemplates, setTopTemplates] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedTemplateForDetails, setSelectedTemplateForDetails] = useState(null);

  // Guardar favoritos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('templateFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Cargar plantillas más usadas
  useEffect(() => {
    async function loadTopTemplates() {
      const top = await getTopTemplates(5);
      setTopTemplates(top);
    }
    if (!loading) {
      loadTopTemplates();
    }
  }, [loading, getTopTemplates]);

  // Búsqueda en tiempo real (lado del cliente)
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const results = searchTemplates(searchTerm);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // ✅ Solo depender de searchTerm para evitar loops

  // 🖱️ Cerrar al hacer click fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && onClose) {
        onClose();
      }
    };

    // Agregar listener después de un pequeño delay para evitar que se cierre inmediatamente al abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Obtener jerarquía de plantillas
  const hierarchy = getTemplatesHierarchy();

  // Expandir/colapsar categoría
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Expandir/colapsar tipo
  const toggleType = (category, type) => {
    const key = `${category}-${type}`;
    setExpandedTypes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle favorito
  const toggleFavorite = (templateId) => {
    setFavorites(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  // Mostrar detalles de plantilla
  const handleShowDetails = (template) => {
    setSelectedTemplateForDetails(template);
  };

  // Usar plantilla desde el modal de detalles
  const handleUseTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Filtrar plantillas según tab activa
  const getFilteredTemplates = () => {
    if (activeTab === 'favorites') {
      return templates.filter(t => favorites.includes(t.id));
    } else if (activeTab === 'recent') {
      return topTemplates;
    }
    return templates;
  };

  // Nombres legibles para categorías y tipos - Estilo IBM i2
  const CATEGORY_NAMES = {
    'Militar': { icon: '🎖️', name: 'Militar', color: '#ef4444' },
    'Civil': { icon: '🏢', name: 'Civil', color: '#3b82f6' },
    'Comercial': { icon: '🏭', name: 'Comercial', color: '#10b981' },
  };

  const TYPE_NAMES = {
    destructor: { icon: '🚢', name: 'Destructores', emoji: '⚓' },
    fragata: { icon: '⚓', name: 'Fragatas', emoji: '⛵' },
    portaaviones: { icon: '🛳️', name: 'Portaaviones', emoji: '🚢' },
    submarino: { icon: '🔱', name: 'Submarinos', emoji: '🐟' },
    avion: { icon: '✈️', name: 'Aviones', emoji: '🛩️' },
    tropas: { icon: '👤', name: 'Personal', emoji: '👥' },
    tanque: { icon: '🛡️', name: 'Vehículos', emoji: '🚜' },
  };

  // Organización tipo IBM i2: por categoria de entidad
  const ENTITY_ORGANIZATION = {
    'Buques de Guerra': {
      icon: '🚢',
      types: ['destructor', 'fragata', 'portaaviones', 'submarino'],
      color: '#ef4444',
      subgroups: {
        'Destructores': ['destructor-general'],
        'Cruceros': ['crucero-ticonderoga'],
        'Fragatas': ['fragata-general'],
        'Portaaviones': ['portaaviones-general', 'portaaviones-anfibio-general'],
        'Submarinos': ['submarino-general']
      }
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
    'Instalaciones y Lugares': {
      icon: '🏢',
      types: ['lugar'],
      color: '#8b5cf6',
      subgroups: {
        'Militares': ['base-militar-general', 'centro-comunicaciones-general', 'radar-general'],
        'Civiles': ['aeropuerto-general']
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

  // NO bloquear con loading - mostrar la UI vacía mientras carga

  return (
    <div 
      ref={sidebarRef}
      className="fixed left-0 w-80 bg-slate-900 border-r border-slate-700 flex flex-col palette-enter shadow-2xl" 
      style={{ 
        zIndex: 50, // ✅ Mayor que SearchBar (z-40) para evitar superposición en mobile
        top: '56px', // Después de TopNavbar
        height: 'calc(100vh - 56px)'
      }}
    >
      {/* Header - Siempre visible desde el inicio */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">
            🎨 Paleta de Entidades
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
              aria-label="Cerrar paleta"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Tabs */}
        <div className="space-y-2 mt-3">
          {/* Tabs de filtros */}
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${activeTab === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <FolderOpen size={14} />
              <span>Todas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${activeTab === 'favorites' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <Star size={14} />
              <span>Favoritas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${activeTab === 'recent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <Clock size={14} />
              <span>Usadas</span>
            </button>
          </div>

          {/* Toggle Vista Lista/Grid */}
          <div className="flex items-center justify-between bg-slate-700/50 rounded p-1">
            <span className="text-xs text-slate-400 px-2">Vista:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-600'
                }`}
                title="Vista de lista"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-600'
                }`}
                title="Vista de cuadrícula"
              >
                <Grid3x3 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-900">
        {/* Indicador de carga con skeleton */}
        {loading && (
          <div className="space-y-3">
            {/* Skeleton placeholders */}
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-slate-700 rounded-lg overflow-hidden animate-pulse">
                <div className="p-3 bg-slate-800">
                  <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenido normal */}
        {!loading && (
          <>
        {/* Mensaje cuando no hay favoritas/usadas */}
        {!searchTerm && getFilteredTemplates().length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              {activeTab === 'favorites' ? (
                <Star size={32} className="text-slate-600" />
              ) : (
                <Clock size={32} className="text-slate-600" />
              )}
            </div>
            <h3 className="text-slate-400 font-semibold mb-2">
              {activeTab === 'favorites' ? 'Sin favoritas' : 'Sin plantillas usadas'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {activeTab === 'favorites' 
                ? 'Marca plantillas como favoritas haciendo clic en la estrella ⭐' 
                : 'Las plantillas que uses aparecerán aquí ordenadas por frecuencia'}
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Ver todas las plantillas
            </button>
          </div>
        )}

        {/* Resultados de búsqueda - Vista dinámica */}
        {searchTerm && (
          <div>
            <p className="text-xs text-slate-400 mb-3">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchTerm}"
            </p>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-3 gap-2' 
              : 'space-y-2'
            }>
              {searchResults.map(template => (
                viewMode === 'grid' ? (
                  <TemplateGridItem
                    key={template.id}
                    template={template}
                    onDragStart={onDragTemplate}
                    onClick={onSelectTemplate}
                    isFavorite={favorites.includes(template.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ) : (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onDragStart={onDragTemplate}
                    onClick={onSelectTemplate}
                    isFavorite={favorites.includes(template.id)}
                    onToggleFavorite={toggleFavorite}
                    onShowDetails={handleShowDetails}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {/* Vista de jerarquía tipo IBM i2 (cuando no hay búsqueda) */}
        {!searchTerm && Object.entries(ENTITY_ORGANIZATION).map(([groupName, groupData]) => {
          // ✅ Usar plantillas filtradas por tab (Todas/Favoritas/Usadas)
          const filteredTemplates = getFilteredTemplates();
          const groupTemplates = filteredTemplates.filter(t => 
            groupData.types.includes(t.entity_type) ||
            (groupData.subgroups && Object.values(groupData.subgroups).flat().includes(t.code))
          );
          
          if (groupTemplates.length === 0) return null;
          
          return (
          <div key={groupName} className="border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            {/* Header de grupo - Estilo IBM i2 con iconos profesionales */}
            <button
              onClick={() => toggleCategory(groupName)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-800 to-slate-750 hover:from-slate-750 hover:to-slate-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                {expandedCategories[groupName] ? (
                  <ChevronDown size={18} className="text-slate-300" />
                ) : (
                  <ChevronRight size={18} className="text-slate-300" />
                )}
                {/* Icono i2 profesional */}
                {getCategoryIcon(groupName) ? (
                  <img 
                    src={getCategoryIcon(groupName)} 
                    alt={groupName}
                    className="w-10 h-10 object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                  />
                ) : (
                  <span className="text-3xl">{groupData.icon}</span>
                )}
                <div>
                  <span className="text-sm font-bold text-white">
                    {groupName}
                  </span>
                  <div className="text-xs text-slate-400">
                    {groupTemplates.length} plantilla{groupTemplates.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div 
                className="w-2 h-8 rounded-full"
                style={{ backgroundColor: groupData.color }}
              />
            </button>

            {/* Plantillas del grupo - Estilo IBM i2 */}
            {expandedCategories[groupName] && (
              <div className="bg-slate-900/50 p-3 space-y-2">
                {/* Mostrar plantillas organizadas por subgrupo si existen */}
                {groupData.subgroups ? (
                  Object.entries(groupData.subgroups).map(([subgroupName, codes]) => {
                    const subgroupTemplates = groupTemplates.filter(t => codes.includes(t.code));
                    if (subgroupTemplates.length === 0) return null;
                    
                    return (
                      <div key={subgroupName} className="space-y-2">
                        {/* Subgrupo header */}
                        <div className="flex items-center space-x-2 px-2 py-1 bg-slate-800/50 rounded">
                          <div 
                            className="w-1.5 h-4 rounded"
                            style={{ backgroundColor: groupData.color }}
                          />
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            {subgroupName}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({subgroupTemplates.length})
                          </span>
                        </div>
                        
                        {/* Plantillas del subgrupo - Vista dinámica */}
                        <div className={viewMode === 'grid' 
                          ? 'grid grid-cols-3 gap-2 pl-3' 
                          : 'space-y-2 pl-3'
                        }>
                          {subgroupTemplates.map(template => (
                            viewMode === 'grid' ? (
                              <TemplateGridItem
                                key={template.id}
                                template={template}
                                onDragStart={onDragTemplate}
                                onClick={onSelectTemplate}
                                isFavorite={favorites.includes(template.id)}
                                onToggleFavorite={toggleFavorite}
                              />
                            ) : (
                              <TemplateCard
                                key={template.id}
                                template={template}
                                onDragStart={onDragTemplate}
                                onClick={onSelectTemplate}
                                isFavorite={favorites.includes(template.id)}
                                onToggleFavorite={toggleFavorite}
                                onShowDetails={handleShowDetails}
                              />
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Sin subgrupos, mostrar todas las plantillas - Vista dinámica */
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-3 gap-2' 
                    : 'space-y-2'
                  }>
                    {groupTemplates.map(template => (
                      viewMode === 'grid' ? (
                        <TemplateGridItem
                          key={template.id}
                          template={template}
                          onDragStart={onDragTemplate}
                          onClick={onSelectTemplate}
                          isFavorite={favorites.includes(template.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      ) : (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onDragStart={onDragTemplate}
                          onClick={onSelectTemplate}
                          isFavorite={favorites.includes(template.id)}
                          onToggleFavorite={toggleFavorite}
                          onShowDetails={handleShowDetails}
                        />
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
        </>
        )}
      </div>

      {/* Footer con botones de acción */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 space-y-2">
        <button 
          onClick={() => setShowAdminPanel(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Crear Plantilla</span>
        </button>
        
        <button 
          onClick={() => setShowAdminPanel(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
          <Settings size={16} />
          <span className="text-sm font-medium">Administrar Plantillas</span>
        </button>
      </div>

      {/* Panel de Administración */}
      {showAdminPanel && (
        <TemplateAdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Modal de Detalles de Plantilla */}
      {selectedTemplateForDetails && (
        <TemplateDetailsModal
          template={selectedTemplateForDetails}
          onClose={() => setSelectedTemplateForDetails(null)}
          onUseTemplate={handleUseTemplate}
        />
      )}
    </div>
  );
}

