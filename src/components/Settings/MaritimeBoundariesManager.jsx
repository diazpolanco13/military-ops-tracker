import { X, Waves, Search, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useMaritimeSettings } from '../../hooks/useMaritimeSettings';

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
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  // Filtrar países según búsqueda
  const filteredSettings = settings.filter(s => 
    s.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.country_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCountry = async () => {
    if (!newCountryCode || !newCountryName) {
      alert('Por favor, completa código y nombre del país');
      return;
    }

    const result = await addCountry(newCountryCode.toUpperCase(), newCountryName, newColor);
    
    if (result.success) {
      // Limpiar form
      setNewCountryCode('');
      setNewCountryName('');
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

          {/* Agregar nuevo país */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código ISO3 (ej: FRA)"
              value={newCountryCode}
              onChange={(e) => setNewCountryCode(e.target.value)}
              maxLength={3}
              className="w-32 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 uppercase"
            />
            <input
              type="text"
              placeholder="Nombre del país (ej: Francia)"
              value={newCountryName}
              onChange={(e) => setNewCountryName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
              title="Color del límite"
            />
            <button
              onClick={handleAddCountry}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
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

