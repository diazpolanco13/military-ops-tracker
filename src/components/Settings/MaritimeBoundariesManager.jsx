import { X, Waves, Search, Plus, Trash2, Eye, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import { useMaritimeSettings } from '../../hooks/useMaritimeSettings';
import { searchCountries } from '../../data/worldCountries';

/**
 * 🌊 Gestor Dinámico de Límites Marítimos
 * Sistema con búsqueda de países y persistencia en BD
 */
export default function MaritimeBoundariesManager({ onClose }) {
  const { 
    settings, 
    loading, 
    addCountry, 
    toggleVisibility, 
    updateColor, 
    removeCountry 
  } = useMaritimeSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [addSearchTerm, setAddSearchTerm] = useState(''); // Búsqueda para agregar
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newColor, setNewColor] = useState('#3b82f6');
  
  // Buscar países en la lista mundial
  const suggestions = searchCountries(addSearchTerm, 8);

  // Filtrar países según búsqueda
  const filteredSettings = settings.filter(s => 
    s.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.country_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('🔍 Search filter:', {
    searchTerm,
    totalSettings: settings.length,
    filtered: filteredSettings.length,
    settings,
    filteredSettings
  });

  const handleSelectSuggestion = (suggestion) => {
    addCountryFromSuggestion(suggestion);
  };

  const addCountryFromSuggestion = async (country) => {
    const result = await addCountry(country.code, country.name, newColor);
    
    if (result.success) {
      // Limpiar form
      setAddSearchTerm('');
      setShowSuggestions(false);
      setNewColor('#3b82f6');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const visibleCount = settings.filter(s => s.is_visible).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Waves className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Límites Marítimos - Gestor Dinámico</h2>
              <p className="text-xs text-slate-400">{visibleCount} de {settings.length} países visibles</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de búsqueda y agregar */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código ISO3..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Agregar nuevo país con autocompletado */}
          <div className="bg-slate-800/50 border border-cyan-900/30 rounded-lg p-3">
            <div className="text-xs text-cyan-400 font-semibold mb-2 uppercase tracking-wide">
              ➕ Buscar y Agregar País
            </div>
            <div className="flex gap-2 items-end">
              {/* Buscador de países con autocompletado */}
              <div className="flex-1 relative">
                <label className="text-xs text-slate-400 mb-1 block">Buscar país (ej: Canadá, Francia, China)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Escribe para buscar..."
                    value={addSearchTerm}
                    onChange={(e) => {
                      setAddSearchTerm(e.target.value);
                      setShowSuggestions(e.target.value.length >= 2);
                    }}
                    onFocus={() => addSearchTerm.length >= 2 && setShowSuggestions(true)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border-2 border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                
                {/* Dropdown de sugerencias */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-cyan-500 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => {
                      // Verificar si ya existe
                      const alreadyAdded = settings.some(s => s.country_code === suggestion.code);
                      
                      return (
                        <button
                          key={suggestion.code}
                          onClick={() => !alreadyAdded && handleSelectSuggestion(suggestion)}
                          disabled={alreadyAdded}
                          className={`w-full px-4 py-3 text-left transition-colors border-b border-slate-700 last:border-0 ${
                            alreadyAdded
                              ? 'bg-slate-700/50 cursor-not-allowed opacity-50'
                              : 'hover:bg-cyan-900/30 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium">{suggestion.name}</div>
                              <div className="text-xs text-slate-400">{suggestion.code} · {suggestion.region}</div>
                            </div>
                            {alreadyAdded ? (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Ya agregado
                              </span>
                            ) : (
                              <span className="text-xs text-cyan-400">Click para agregar</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Selector de color */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Color</label>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded border-2 border-white/20"
                    style={{ backgroundColor: newColor }}
                  />
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                    title="Seleccionar color"
                  />
                </div>
              </div>
            </div>
            
            {addSearchTerm.length > 0 && suggestions.length === 0 && (
              <div className="mt-2 text-xs text-slate-500 italic">
                No se encontraron países. Intenta con otro nombre.
              </div>
            )}
          </div>
        </div>

        {/* Lista de países */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Cargando países...</div>
          ) : filteredSettings.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              {searchTerm ? 'No se encontraron países' : 'No hay países configurados'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSettings.map((country) => (
                <div
                  key={country.country_code}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    country.is_visible
                      ? 'bg-slate-800/50 border-cyan-500/50'
                      : 'bg-slate-800/30 border-slate-700 opacity-60'
                  }`}
                >
                  {/* Header con nombre y acciones */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{country.country_name}</h3>
                      <p className="text-xs text-slate-400">{country.country_code}</p>
                    </div>
                    
                    <div className="flex gap-1">
                      {/* Toggle visibilidad */}
                      <button
                        onClick={() => toggleVisibility(country.country_code)}
                        className={`p-1.5 rounded transition-colors ${
                          country.is_visible
                            ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                        }`}
                        title={country.is_visible ? 'Ocultar' : 'Mostrar'}
                      >
                        {country.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      {/* Eliminar */}
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar ${country.country_name}?`)) {
                            removeCountry(country.country_code);
                          }
                        }}
                        className="p-1.5 rounded bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selector de color */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-full h-8 rounded border-2 border-white/20"
                      style={{ backgroundColor: country.color }}
                    />
                    <input
                      type="color"
                      value={country.color}
                      onChange={(e) => updateColor(country.country_code, e.target.value)}
                      className="w-12 h-8 rounded cursor-pointer"
                      title="Cambiar color"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con info */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            ℹ️ Los límites se cargan desde <a href="https://marineregions.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Marine Regions</a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

