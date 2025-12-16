import { useState, useEffect } from 'react';
import { 
  Settings, 
  CloudRain, 
  Filter, 
  BarChart3,
  Clock,
  Plane
} from 'lucide-react';
import FlightRadarFiltersPanel from './FlightRadarFiltersPanel';

/**
 * 🎛️ BARRA INFERIOR FLIGHTRADAR24
 * 
 * Barra compacta + Contador circular clickeable que abre el panel lateral
 */
export default function FlightRadarBottomBar({ 
  onFilterChange,
  activeFilters = {},
  flightCount = 0,
  isFlightRadarEnabled = true,
  onToggleFlightRadar,
  updateInterval = 30000,
  onOpenPanel, // Nueva prop para abrir el sidebar
  isPanelOpen = false,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [progress, setProgress] = useState(0);

  // Animación de progreso circular
  useEffect(() => {
    if (!isFlightRadarEnabled) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / updateInterval) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isFlightRadarEnabled, updateInterval, flightCount]);

  const activeCount = Object.values(activeFilters).filter(Boolean).length;
  const circumference = 2 * Math.PI * 26;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      {/* Barra inferior compacta - responsive para móvil */}
      <div id="flight-radar-bottom-bar" className="fixed bottom-6 left-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 z-30">
        <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl">
          
          {/* Toggle FlightRadar ON/OFF */}
          <button
            onClick={onToggleFlightRadar}
            className={`p-2 sm:p-2.5 rounded-full transition-all ${
              isFlightRadarEnabled 
                ? 'text-yellow-400 bg-yellow-900/30' 
                : 'text-slate-500 hover:text-white hover:bg-slate-800'
            }`}
            title={isFlightRadarEnabled ? 'Desactivar radar' : 'Activar radar'}
          >
            <Plane size={18} className={`sm:w-5 sm:h-5 ${isFlightRadarEnabled ? 'drop-shadow-lg' : ''}`} />
          </button>

          <div className="w-px h-5 sm:h-6 bg-slate-700 mx-0.5 sm:mx-1"></div>

          <button className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all" title="Configuración">
            <Settings size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          {/* Ocultar en móvil muy pequeño para evitar overflow */}
          <button className="hidden xs:block p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all" title="Clima">
            <CloudRain size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 sm:p-2.5 rounded-full transition-all ${
              showFilters ? 'text-yellow-400 bg-yellow-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Filtros"
          >
            <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
            {activeCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] sm:text-[9px] font-bold text-black">{activeCount}</span>
              </div>
            )}
          </button>

          <button className="hidden xs:block p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all" title="Estadísticas">
            <BarChart3 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <button className="hidden sm:block p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all" title="Historial">
            <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {/* CONTADOR CIRCULAR CLICKEABLE - Abre el sidebar */}
      {isFlightRadarEnabled && !isPanelOpen && (
        <button
          id="flight-radar-counter-button"
          onClick={onOpenPanel}
          className="fixed bottom-6 right-4 sm:right-6 z-30 group"
          title="Ver lista de vuelos"
        >
          <div className="relative flex items-center justify-center transition-transform hover:scale-110">
            {/* SVG Progreso - más pequeño en móvil */}
            <svg className="absolute w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28" cy="28" r="26"
                fill="none"
                stroke="rgba(71, 85, 105, 0.4)"
                strokeWidth="3"
              />
              <circle
                cx="28" cy="28" r="26"
                fill="none"
                stroke="#FFC107"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            
            {/* Centro - más pequeño en móvil */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border-2 border-slate-700 group-hover:border-yellow-500 rounded-full shadow-xl flex flex-col items-center justify-center transition-colors">
              <Plane size={16} className="sm:w-[18px] sm:h-[18px] text-yellow-400 -mt-0.5" />
              <span className="text-[10px] sm:text-xs font-bold text-white leading-none">
                {flightCount}
              </span>
            </div>
          </div>
        </button>
      )}

      <FlightRadarFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
      />
    </>
  );
}
