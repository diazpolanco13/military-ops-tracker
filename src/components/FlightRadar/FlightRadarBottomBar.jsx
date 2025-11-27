import { useState } from 'react';
import { 
  Settings, 
  CloudRain, 
  Filter, 
  BarChart3,
  Clock,
  X
} from 'lucide-react';

/**
 * 🎛️ BARRA INFERIOR FLIGHTRADAR24 - VERSIÓN COMPACTA
 * 
 * Barra pequeña centrada en la parte inferior (estilo FlightRadar24)
 * Panel de filtros lateral derecho
 */
export default function FlightRadarBottomBar({ 
  onFilterChange,
  activeFilters = {
    militaryOnly: true,
    showCombat: true,
    showTransport: true,
    showTanker: true,
    showSurveillance: true,
    showBomber: true,
    showOthers: true,
  }
}) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterToggle = (filterName) => {
    if (onFilterChange) {
      onFilterChange({
        ...activeFilters,
        [filterName]: !activeFilters[filterName]
      });
    }
  };

  // Contar filtros activos
  const activeCount = Object.values(activeFilters).filter(Boolean).length - 1; // -1 porque militaryOnly no cuenta

  return (
    <>
      {/* Barra inferior compacta centrada */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl">
          
          {/* Settings */}
          <button
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            title="Configuración"
          >
            <Settings size={18} />
          </button>

          {/* Weather */}
          <button
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            title="Clima"
          >
            <CloudRain size={18} />
          </button>

          {/* Filters (PRINCIPAL) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 rounded-full transition-all ${
              showFilters 
                ? 'text-blue-400 bg-blue-900/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Filtros"
          >
            <Filter size={18} />
            {activeFilters.militaryOnly && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{activeCount}</span>
              </div>
            )}
          </button>

          {/* Widgets */}
          <button
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            title="Widgets"
          >
            <BarChart3 size={18} />
          </button>

          {/* Playback */}
          <button
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            title="Reproducir"
          >
            <Clock size={18} />
          </button>
        </div>
      </div>

      {/* Panel lateral de filtros (estilo FlightRadar24) */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-45"
            onClick={() => setShowFilters(false)}
          />

          {/* Panel lateral derecho */}
          <div className="fixed right-0 top-0 h-screen w-80 bg-slate-900/98 backdrop-blur-md border-l border-slate-700 shadow-2xl z-50 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Filter size={18} />
                Filtros
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Categorías */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Categorías
                </h4>
                
                {/* Militar/Gobierno */}
                <label className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg cursor-pointer hover:bg-yellow-900/30 transition-colors mb-2">
                  <input
                    type="checkbox"
                    checked={activeFilters.militaryOnly}
                    onChange={() => handleFilterToggle('militaryOnly')}
                    className="w-4 h-4 rounded border-slate-600 text-yellow-600 focus:ring-yellow-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-yellow-200">
                      Militar o gobierno
                    </div>
                  </div>
                </label>

                {/* Combate */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.showCombat}
                    onChange={() => handleFilterToggle('showCombat')}
                    className="w-4 h-4 rounded border-slate-600 text-red-600"
                    disabled={!activeFilters.militaryOnly}
                  />
                  <span className={`text-sm ${activeFilters.militaryOnly ? 'text-slate-300' : 'text-slate-500'}`}>
                    Combate
                  </span>
                  <span className="ml-auto text-[10px] text-slate-500 bg-red-900/30 px-2 py-0.5 rounded">
                    F-15, F-16, F-22
                  </span>
                </label>

                {/* Transporte */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.showTransport}
                    onChange={() => handleFilterToggle('showTransport')}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600"
                    disabled={!activeFilters.militaryOnly}
                  />
                  <span className={`text-sm ${activeFilters.militaryOnly ? 'text-slate-300' : 'text-slate-500'}`}>
                    Transporte
                  </span>
                  <span className="ml-auto text-[10px] text-slate-500 bg-blue-900/30 px-2 py-0.5 rounded">
                    C-17, C-130
                  </span>
                </label>

                {/* Tanquero */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.showTanker}
                    onChange={() => handleFilterToggle('showTanker')}
                    className="w-4 h-4 rounded border-slate-600 text-cyan-600"
                    disabled={!activeFilters.militaryOnly}
                  />
                  <span className={`text-sm ${activeFilters.militaryOnly ? 'text-slate-300' : 'text-slate-500'}`}>
                    Tanquero
                  </span>
                  <span className="ml-auto text-[10px] text-slate-500 bg-cyan-900/30 px-2 py-0.5 rounded">
                    KC-135, KC-10
                  </span>
                </label>

                {/* Vigilancia */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.showSurveillance}
                    onChange={() => handleFilterToggle('showSurveillance')}
                    className="w-4 h-4 rounded border-slate-600 text-yellow-600"
                    disabled={!activeFilters.militaryOnly}
                  />
                  <span className={`text-sm ${activeFilters.militaryOnly ? 'text-slate-300' : 'text-slate-500'}`}>
                    Vigilancia
                  </span>
                  <span className="ml-auto text-[10px] text-slate-500 bg-yellow-900/30 px-2 py-0.5 rounded">
                    E-3, P-8, RC-135
                  </span>
                </label>

                {/* Bombardero */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.showBomber}
                    onChange={() => handleFilterToggle('showBomber')}
                    className="w-4 h-4 rounded border-slate-600 text-orange-600"
                    disabled={!activeFilters.militaryOnly}
                  />
                  <span className={`text-sm ${activeFilters.militaryOnly ? 'text-slate-300' : 'text-slate-500'}`}>
                    Bombardero
                  </span>
                  <span className="ml-auto text-[10px] text-slate-500 bg-orange-900/30 px-2 py-0.5 rounded">
                    B-1, B-2, B-52
                  </span>
                </label>

                {/* Otros */}
                <label className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.showOthers}
                    onChange={() => handleFilterToggle('showOthers')}
                    className="w-4 h-4 rounded border-slate-600 text-slate-600"
                    disabled={!activeFilters.militaryOnly}
                  />
                  <span className={`text-sm ${activeFilters.militaryOnly ? 'text-slate-300' : 'text-slate-500'}`}>
                    Otros militares
                  </span>
                </label>
              </div>

              {/* Área de cobertura */}
              <div className="p-3 bg-blue-900/10 border border-blue-700/30 rounded-lg">
                <div className="text-xs font-semibold text-blue-300 mb-1">
                  📍 Área de Monitoreo
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Caribe • República Dominicana • Puerto Rico • Trinidad y Tobago • Curazao • Aruba • Venezuela • Colombia • Panamá
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
