import { useState } from 'react';
import { Satellite, Moon, Sun, Map as MapIcon, Mountain, Navigation } from 'lucide-react';
import { MAPBOX_STYLES } from '../../lib/maplibre';

const STYLE_OPTIONS = [
  {
    id: 'satellite-streets',
    name: 'Satélite + Calles',
    icon: Satellite,
    style: MAPBOX_STYLES.SATELLITE_STREETS,
    description: 'Vista satélite con información de calles',
    color: 'bg-blue-500',
  },
  {
    id: 'dark',
    name: 'Oscuro',
    icon: Moon,
    style: MAPBOX_STYLES.DARK,
    description: 'Estilo oscuro profesional',
    color: 'bg-slate-700',
  },
  {
    id: 'navigation-night',
    name: 'Navegación Nocturna',
    icon: Navigation,
    style: MAPBOX_STYLES.NAVIGATION_NIGHT,
    description: 'Optimizado para navegación nocturna',
    color: 'bg-indigo-600',
  },
  {
    id: 'satellite',
    name: 'Satélite Puro',
    icon: Satellite,
    style: MAPBOX_STYLES.SATELLITE,
    description: 'Vista satélite sin overlays',
    color: 'bg-green-600',
  },
  {
    id: 'streets',
    name: 'Calles',
    icon: MapIcon,
    style: MAPBOX_STYLES.STREETS,
    description: 'Mapa de calles estándar',
    color: 'bg-gray-500',
  },
  {
    id: 'outdoors',
    name: 'Terreno',
    icon: Mountain,
    style: MAPBOX_STYLES.OUTDOORS,
    description: 'Vista topográfica con relieve',
    color: 'bg-amber-600',
  },
];

export default function MapStyleSelector({ map }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('satellite-streets');

  const handleStyleChange = (styleOption) => {
    if (map) {
      map.setStyle(styleOption.style);
      setCurrentStyle(styleOption.id);
      setIsOpen(false);
    }
  };

  const currentStyleOption = STYLE_OPTIONS.find(s => s.id === currentStyle);
  const Icon = currentStyleOption?.icon || Satellite;

  return (
    <div className="absolute top-4 left-4 z-20">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/95 backdrop-blur-sm text-white rounded-lg shadow-lg hover:bg-slate-700 transition-all border border-slate-600 hover:border-slate-500"
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{currentStyleOption?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel de opciones */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800/98 backdrop-blur-md rounded-lg shadow-2xl border border-slate-600 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white">Estilos de Mapa</h3>
            <p className="text-xs text-slate-400 mt-0.5">Selecciona la vista del mapa</p>
          </div>

          <div className="p-2 max-h-96 overflow-y-auto">
            {STYLE_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              const isActive = currentStyle === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleStyleChange(option)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700/50 text-slate-200'
                  }`}
                >
                  {/* Icono con color */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 ${
                      isActive ? 'bg-white/20' : option.color
                    } rounded-lg flex items-center justify-center`}
                  >
                    <OptionIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{option.name}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {option.description}
                    </div>
                  </div>

                  {/* Check mark */}
                  {isActive && (
                    <svg
                      className="w-5 h-5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer con info */}
          <div className="p-2 border-t border-slate-700 bg-slate-900/50">
            <p className="text-xs text-slate-400 text-center">
              Powered by Mapbox GL JS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

