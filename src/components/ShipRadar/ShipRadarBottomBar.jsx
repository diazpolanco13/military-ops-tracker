import { useState, useEffect } from 'react';
import { Ship, Anchor, Fuel, Settings } from 'lucide-react';

/**
 * 🚢 WIDGET SHIP RADAR
 * Contador circular + barra compacta posicionada a la derecha
 * Similar al estilo de FlightRadarBottomBar
 */

export default function ShipRadarBottomBar({ 
  stats = { total: 0, military: 0, tankers: 0 }, 
  loading = false, 
  isEnabled = true,
  onToggle,
  refreshInterval = 60000,
  onOpenPanel,
}) {
  const [progress, setProgress] = useState(0);

  // Animación de progreso circular
  useEffect(() => {
    if (!isEnabled) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / refreshInterval) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isEnabled, refreshInterval, stats.total]);

  const circumference = 2 * Math.PI * 26;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-4 z-30">
      <div className="flex items-center gap-3">
        
        {/* Barra de stats compacta */}
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-full px-3 py-1.5 flex items-center gap-3 shadow-lg">
          {/* Militares */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm">⚔️</span>
            <span className="text-xs font-bold text-red-400">{stats.military}</span>
          </div>
          
          {/* Separador */}
          <div className="w-px h-4 bg-slate-600" />
          
          {/* Petroleros */}
          <div className="flex items-center gap-1.5">
            <Fuel size={14} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">{stats.tankers}</span>
          </div>
        </div>

        {/* Contador circular clickeable */}
        <button
          onClick={onToggle}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isEnabled 
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
              : 'bg-slate-800/80 border-2 border-slate-600 opacity-50'
          }`}
          title={isEnabled ? 'Desactivar ShipRadar' : 'Activar ShipRadar'}
        >
          {/* Círculo de progreso */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="rgba(6, 182, 212, 0.2)"
              strokeWidth="3"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="rgb(6, 182, 212)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-100"
            />
          </svg>
          
          {/* Icono y contador */}
          <div className="relative z-10 flex flex-col items-center">
            <Ship size={18} className={isEnabled ? 'text-cyan-400' : 'text-slate-500'} />
            <span className={`text-xs font-bold ${isEnabled ? 'text-white' : 'text-slate-500'}`}>
              {stats.total}
            </span>
          </div>

          {/* Indicador de carga */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-full">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
