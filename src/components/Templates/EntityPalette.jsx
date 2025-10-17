import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Star, Clock, FolderOpen, Plus, Settings } from 'lucide-react';
import { useEntityTemplates } from '../../hooks/useEntityTemplates';
import TemplateCard from './TemplateCard';

/**
 * Panel lateral de paleta de plantillas tipo IBM Analyst's Notebook
 * Organiza plantillas en jerarquía de categorías y tipos
 */
export default function EntityPalette({ onSelectTemplate, onDragTemplate }) {
  const { templates, loading, getTemplatesHierarchy, getTopTemplates, searchTemplates } = useEntityTemplates();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, favorites, recent
  const [expandedCategories, setExpandedCategories] = useState({ militar: true }); // Militar expandido por defecto
  const [expandedTypes, setExpandedTypes] = useState({ 
    'militar-destructor': true,
    'militar-avion': true
  }); // Algunos tipos expandidos por defecto
  const [favorites, setFavorites] = useState([]);
  const [topTemplates, setTopTemplates] = useState([]);

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

  // Búsqueda en tiempo real
  useEffect(() => {
    async function performSearch() {
      if (searchTerm.trim().length > 0) {
        const results = await searchTemplates(searchTerm);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, searchTemplates]);

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

  // Filtrar plantillas según tab activa
  const getFilteredTemplates = () => {
    if (activeTab === 'favorites') {
      return templates.filter(t => favorites.includes(t.id));
    } else if (activeTab === 'recent') {
      return topTemplates;
    }
    return templates;
  };

  // Nombres legibles para categorías y tipos
  const CATEGORY_NAMES = {
    militar: '🎖️ Militar',
    civil: '🏢 Civil',
    comercial: '🏭 Comercial',
  };

  const TYPE_NAMES = {
    destructor: '🚢 Destructores',
    fragata: '⚓ Fragatas',
    portaaviones: '🛳️ Portaaviones',
    submarino: '🔱 Submarinos',
    avion: '✈️ Aviones',
    tropas: '👤 Personal',
    tanque: '🛡️ Vehículos',
  };

  if (loading) {
    return (
      <div className="w-80 bg-slate-900 border-r border-slate-700 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col h-screen relative" style={{ zIndex: 40, marginLeft: '64px' }}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-lg font-bold text-white mb-3">
          🎨 Paleta de Entidades
        </h2>

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
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-3">
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
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchTerm}"
            </p>
            {searchResults.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onDragStart={onDragTemplate}
                onClick={onSelectTemplate}
                isFavorite={favorites.includes(template.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Vista de jerarquía (cuando no hay búsqueda) */}
        {!searchTerm && Object.keys(hierarchy).map(category => (
          <div key={category} className="border border-slate-700 rounded-lg overflow-hidden">
            {/* Header de categoría */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {expandedCategories[category] ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
                <span className="text-sm font-semibold text-white">
                  {CATEGORY_NAMES[category] || category}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {Object.values(hierarchy[category]).reduce((acc, types) => acc + types.length, 0)} plantillas
              </span>
            </button>

            {/* Tipos dentro de la categoría */}
            {expandedCategories[category] && (
              <div className="bg-slate-850 p-2 space-y-2">
                {Object.keys(hierarchy[category]).map(type => {
                  const typeKey = `${category}-${type}`;
                  const templatesInType = hierarchy[category][type];

                  return (
                    <div key={typeKey} className="space-y-2">
                      {/* Header de tipo */}
                      <button
                        onClick={() => toggleType(category, type)}
                        className="w-full flex items-center justify-between p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {expandedTypes[typeKey] ? (
                            <ChevronDown size={14} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                          )}
                          <span className="text-xs font-medium text-slate-200">
                            {TYPE_NAMES[type] || type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {templatesInType.length}
                        </span>
                      </button>

                      {/* Plantillas del tipo */}
                      {expandedTypes[typeKey] && (
                        <div className="space-y-2 pl-2">
                          {templatesInType.map(template => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onDragStart={onDragTemplate}
                              onClick={onSelectTemplate}
                              isFavorite={favorites.includes(template.id)}
                              onToggleFavorite={toggleFavorite}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer con botones de acción */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 space-y-2">
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={16} />
          <span className="text-sm font-medium">Crear Plantilla</span>
        </button>
        
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
          <Settings size={16} />
          <span className="text-sm font-medium">Administrar Plantillas</span>
        </button>
      </div>
    </div>
  );
}

