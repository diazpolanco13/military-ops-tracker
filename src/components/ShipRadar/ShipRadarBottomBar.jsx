import { useState, useEffect } from 'react';
import { Ship } from 'lucide-react';

/**
 * 🚢 CONTADOR CIRCULAR SHIP RADAR
 * Muestra solo los buques de interés (militares + petroleros)
 */

export default function ShipRadarBottomBar({ 
  stats = { total: 0, military: 0, tankers: 0 }, 
  loading = false, 
  isEnabled = true,
  onToggle,
  refreshInterval = 60000,
  onOpenPanel,
  isPanelOpen = false,
}) {
  const [progress, setProgress] = useState(0);

  // Conteo de buques de interés (solo militares + petroleros)
  const interestCount = stats.military + stats.tankers;

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
  }, [isEnabled, refreshInterval, interestCount]);

  const circumference = 2 * Math.PI * 26;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // No mostrar si el panel está abierto o está deshabilitado
  if (!isEnabled || isPanelOpen) return null;

  return (
    <button
      onClick={onOpenPanel}
      className="fixed bottom-6 right-[76px] sm:right-[88px] z-20 group"
      title="Ver lista de buques"
    >
      <div className="relative flex items-center justify-center transition-transform hover:scale-110">
        {/* SVG Progreso */}
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
            stroke="#06B6D4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        
        {/* Centro - Muestra SOLO buques de interés */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border-2 border-slate-700 group-hover:border-cyan-500 rounded-full shadow-xl flex flex-col items-center justify-center transition-colors">
          <Ship size={16} className="sm:w-[18px] sm:h-[18px] text-cyan-400 -mt-0.5" />
          <span className="text-[10px] sm:text-xs font-bold text-white leading-none">
            {interestCount}
          </span>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
}
