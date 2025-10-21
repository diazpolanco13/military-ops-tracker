import { X, Waves, Check, Palette } from 'lucide-react';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import { CARIBBEAN_COUNTRIES, COUNTRY_COLORS } from '../../hooks/useMaritimeBoundaries';
import { useState } from 'react';

/**
 * 🌊 Panel para seleccionar países cuyos límites marítimos mostrar
 */
export default function MaritimeCountriesPanel({ onClose }) {
  const { selectedCountries, toggleCountry, updateCountries } = useMaritimeBoundariesContext();

  const [countryColors, setCountryColors] = useState(() => {
    const saved = localStorage.getItem('maritimeCountryColors');
    return saved ? JSON.parse(saved) : COUNTRY_COLORS;
  });

  // Organizar países por región con sus colores
  const COUNTRIES_BY_REGION = {
    'Grandes Antillas': [
      { code: CARIBBEAN_COUNTRIES.CUBA, name: 'Cuba', flag: '🇨🇺' },
      { code: CARIBBEAN_COUNTRIES.JAMAICA, name: 'Jamaica', flag: '🇯🇲' },
      { code: CARIBBEAN_COUNTRIES.HAITI, name: 'Haití', flag: '🇭🇹' },
      { code: CARIBBEAN_COUNTRIES.DOMINICAN_REPUBLIC, name: 'República Dominicana', flag: '🇩🇴' },
      { code: CARIBBEAN_COUNTRIES.PUERTO_RICO, name: 'Puerto Rico', flag: '🇵🇷' },
    ],
    'Sudamérica': [
      { code: CARIBBEAN_COUNTRIES.VENEZUELA, name: 'Venezuela', flag: '🇻🇪' },
      { code: CARIBBEAN_COUNTRIES.COLOMBIA, name: 'Colombia', flag: '🇨🇴' },
    ],
    'Pequeñas Antillas': [
      { code: CARIBBEAN_COUNTRIES.TRINIDAD_TOBAGO, name: 'Trinidad y Tobago', flag: '🇹🇹' },
      { code: CARIBBEAN_COUNTRIES.ARUBA, name: 'Aruba', flag: '🇦🇼' },
      { code: CARIBBEAN_COUNTRIES.CURACAO, name: 'Curaçao', flag: '🇨🇼' },
      { code: CARIBBEAN_COUNTRIES.BAHAMAS, name: 'Bahamas', flag: '🇧🇸' },
    ],
    'Centroamérica': [
      { code: CARIBBEAN_COUNTRIES.PANAMA, name: 'Panamá', flag: '🇵🇦' },
      { code: CARIBBEAN_COUNTRIES.COSTA_RICA, name: 'Costa Rica', flag: '🇨🇷' },
      { code: CARIBBEAN_COUNTRIES.NICARAGUA, name: 'Nicaragua', flag: '🇳🇮' },
      { code: CARIBBEAN_COUNTRIES.HONDURAS, name: 'Honduras', flag: '🇭🇳' },
      { code: CARIBBEAN_COUNTRIES.BELIZE, name: 'Belice', flag: '🇧🇿' },
      { code: CARIBBEAN_COUNTRIES.GUATEMALA, name: 'Guatemala', flag: '🇬🇹' },
      { code: CARIBBEAN_COUNTRIES.MEXICO, name: 'México', flag: '🇲🇽' },
    ],
    'Norteamérica': [
      { code: CARIBBEAN_COUNTRIES.USA, name: 'Estados Unidos', flag: '🇺🇸' },
    ],
  };

  const handleColorChange = (countryCode, newColor) => {
    const updated = { ...countryColors, [countryCode]: newColor };
    setCountryColors(updated);
    localStorage.setItem('maritimeCountryColors', JSON.stringify(updated));
    
    // Disparar evento para actualizar el mapa
    window.dispatchEvent(new CustomEvent('maritimeColorsChanged', {
      detail: { colors: updated }
    }));
  };

  const selectAll = () => {
    const allCodes = Object.values(COUNTRIES_BY_REGION).flat().map(c => c.code);
    updateCountries(allCodes);
  };

  const selectNone = () => {
    updateCountries([]);
  };

  const selectDefaults = () => {
    updateCountries([
      CARIBBEAN_COUNTRIES.VENEZUELA,
      CARIBBEAN_COUNTRIES.CUBA,
      CARIBBEAN_COUNTRIES.COLOMBIA,
      CARIBBEAN_COUNTRIES.JAMAICA,
      CARIBBEAN_COUNTRIES.HAITI,
      CARIBBEAN_COUNTRIES.DOMINICAN_REPUBLIC,
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Waves className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Límites Marítimos - Selección de Países</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones rápidas */}
        <div className="p-4 border-b border-slate-700 flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
          >
            Seleccionar Todos
          </button>
          <button
            onClick={selectNone}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Deseleccionar Todos
          </button>
          <button
            onClick={selectDefaults}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Valores por Defecto
          </button>
          <div className="ml-auto text-sm text-slate-400">
            {selectedCountries.length} países seleccionados
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {Object.entries(COUNTRIES_BY_REGION).map(([region, countries]) => (
            <div key={region} className="mb-6">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">
                {region}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {countries.map((country) => {
                  const isSelected = selectedCountries.includes(country.code);
                  const currentColor = countryColors[country.code] || COUNTRY_COLORS[country.code] || '#64748b';
                  
                  return (
                    <div
                      key={country.code}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-cyan-900/50 border-2 border-cyan-500'
                          : 'bg-slate-800/50 border-2 border-slate-700'
                      }`}
                    >
                      {/* Checkbox para seleccionar */}
                      <button
                        onClick={() => toggleCountry(country.code)}
                        className="flex items-center gap-2 flex-1"
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-white">{country.name}</div>
                          <div className="text-xs text-slate-400">{country.code}</div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-cyan-400" />
                        )}
                      </button>
                      
                      {/* Selector de color */}
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border-2 border-white/20"
                          style={{ backgroundColor: currentColor }}
                        />
                        <input
                          type="color"
                          value={currentColor}
                          onChange={(e) => handleColorChange(country.code, e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                          title={`Cambiar color de ${country.name}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            ℹ️ Los límites se cargarán automáticamente al activar la capa
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

