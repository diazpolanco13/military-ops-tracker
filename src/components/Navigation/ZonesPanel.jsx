import { Waves, Palette, MapPin } from 'lucide-react';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import { useUserRole } from '../../hooks/useUserRole';

/**
 * 📍 Panel de Límites Territoriales
 * Incluye límites marítimos y futuras zonas personalizadas
 */
export default function ZonesPanel({ onClose, onOpenMaritimeConfig }) {
  const { showBoundaries, toggleBoundaries } = useMaritimeBoundariesContext();
  const { isAdmin } = useUserRole();

  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Límites Marítimos</div>
      <div className="flex flex-wrap gap-2">
        {/* Toggle Límites */}
        <button
          onClick={toggleBoundaries}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            showBoundaries 
              ? 'bg-cyan-600 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title={showBoundaries ? 'Ocultar EEZ de 200 NM' : 'Ver EEZ y aguas territoriales'}
        >
          <Waves className="w-4 h-4" />
          <span className="text-xs font-medium">
            {showBoundaries ? 'Límites Visibles' : 'Límites Ocultos'}
          </span>
        </button>

        {/* Gestor de Países - Solo visible para admins */}
        {isAdmin() && (
          <button
            onClick={() => {
              onOpenMaritimeConfig();
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
            title="Buscar, agregar y personalizar límites"
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">Gestor de Países</span>
          </button>
        )}

        {/* Zonas Personalizadas (próximamente) - Solo visible para admins */}
        {isAdmin() && (
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-500 cursor-not-allowed opacity-50"
            title="Próximamente"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">Zonas Personalizadas</span>
          </button>
        )}
      </div>
    </div>
  );
}

