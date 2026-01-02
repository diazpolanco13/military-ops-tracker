import { 
  X, 
  Plane, 
  Package, 
  Shield, 
  Briefcase, 
  Wind,
  CircleDot,
  Car,
  HelpCircle,
  Check,
  Lock
} from 'lucide-react';

/**
 * 🎛️ PANEL DE FILTROS FLIGHTRADAR24 - COMPACTO Y OSCURO
 * 
 * Panel lateral con categorías de aeronaves
 * Estilo oscuro consistente con la app
 * 
 * ⚠️ NOTA: Actualmente solo se monitorean vuelos militares.
 * Las demás categorías están deshabilitadas pero visibles
 * para mostrar que el sistema podría filtrar más tipos.
 */

// Categorías de aeronaves
export const AIRCRAFT_CATEGORIES = [
  { 
    id: 'all', 
    name: 'Todas las categorías', 
    color: '#64748b',
  },
  { 
    id: 'passenger', 
    name: 'Pasajeros', 
    color: '#3b82f6',
  },
  { 
    id: 'cargo', 
    name: 'Carga', 
    color: '#f59e0b',
  },
  { 
    id: 'military', 
    name: 'Militar o gobierno', 
    color: '#eab308',
  },
  { 
    id: 'business', 
    name: 'Jets privados', 
    color: '#a855f7',
  },
  { 
    id: 'general', 
    name: 'Aviación general', 
    color: '#22c55e',
  },
  { 
    id: 'helicopter', 
    name: 'Helicópteros', 
    color: '#06b6d4',
  },
  { 
    id: 'lighter', 
    name: 'Más ligeros que el aire', 
    color: '#ec4899',
  },
  { 
    id: 'gliders', 
    name: 'Planeadores', 
    color: '#14b8a6',
  },
  { 
    id: 'drones', 
    name: 'Drones', 
    color: '#ef4444',
  },
  { 
    id: 'ground', 
    name: 'Vehículos terrestres', 
    color: '#f97316',
  },
  { 
    id: 'other', 
    name: 'Otros', 
    color: '#6b7280',
  },
  { 
    id: 'uncategorized', 
    name: 'Sin categorizar', 
    color: '#475569',
  },
];

// ⚠️ Solo estas categorías están habilitadas para selección
const ENABLED_CATEGORIES = ['military'];

export default function FlightRadarFiltersPanel({ 
  isOpen, 
  onClose, 
  activeFilters = {},
  onFilterChange 
}) {
  const handleCategoryToggle = (categoryId) => {
    // Solo permitir toggle de categorías habilitadas
    if (!ENABLED_CATEGORIES.includes(categoryId)) {
      return; // No hacer nada si la categoría está deshabilitada
    }
    
    if (categoryId === 'all') {
      // Toggle all - deshabilitado por ahora
      return;
    } else {
      onFilterChange({
        ...activeFilters,
        [categoryId]: !activeFilters[categoryId]
      });
    }
  };

  // Contar categorías activas
  const activeCount = Object.values(activeFilters).filter(Boolean).length;
  const allActive = AIRCRAFT_CATEGORIES.filter(c => c.id !== 'all').every(cat => activeFilters[cat.id]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop transparente */}
      <div 
        className="fixed inset-0 z-20"
        onClick={onClose}
      />

      {/* Panel compacto - NO toda la ventana */}
      <div className="fixed left-4 bottom-20 w-72 max-h-[70vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden">
        
        {/* Header compacto */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plane size={16} className="text-yellow-400" />
            Filtros de Vuelos
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista de categorías - scrolleable */}
        <div className="flex-1 overflow-y-auto py-1">
          {AIRCRAFT_CATEGORIES.map((category) => {
            const isActive = category.id === 'all' ? allActive : activeFilters[category.id];
            const isEnabled = ENABLED_CATEGORIES.includes(category.id);
            const isDisabled = !isEnabled; // Deshabilitar todo lo que no esté en ENABLED_CATEGORIES
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isDisabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : isActive 
                      ? 'bg-slate-800' 
                      : 'hover:bg-slate-800/50'
                }`}
              >
                {/* Checkbox */}
                <div 
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                    isActive 
                      ? 'border-yellow-500 bg-yellow-500' 
                      : isDisabled
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  {isActive && <Check size={12} className="text-black" strokeWidth={3} />}
                  {isDisabled && !isActive && <Lock size={10} className="text-slate-600" />}
                </div>

                {/* Indicador de color */}
                <div 
                  className={`w-2 h-2 rounded-full ${isDisabled ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: category.color }}
                />

                {/* Nombre */}
                <span className={`flex-1 text-left text-sm ${
                  isDisabled 
                    ? 'text-slate-600' 
                    : isActive 
                      ? 'text-white font-medium' 
                      : 'text-slate-400'
                }`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer con info */}
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/30">
          <p className="text-[10px] text-slate-500 text-center">
            {activeCount} categorías activas
          </p>
          <p className="text-[9px] text-yellow-600/70 text-center mt-1 flex items-center justify-center gap-1">
            <Lock size={8} />
            Solo monitoreo militar habilitado
          </p>
        </div>
      </div>
    </>
  );
}
