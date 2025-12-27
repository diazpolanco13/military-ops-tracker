import { Waves, Mountain, Palette, AlertTriangle, PenTool, MapPin } from 'lucide-react';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import { useUserRole } from '../../hooks/useUserRole';

/**
 * 📍 Panel de Límites Territoriales
 * 
 * Controla 3 capas independientes:
 * - 🌊 Límites Marítimos (EEZ 200mn)
 * - 🗺️ Límites Terrestres (fronteras)
 * - 🔺 Zona en Reclamación (Guayana Esequiba)
 */
export default function ZonesPanel({ onClose, onOpenMaritimeConfig }) {
  const { 
    showMaritime,
    toggleMaritime,
    showTerrestrial,
    toggleTerrestrial,
    showEsequiboClaim,
    toggleEsequiboClaim,
    isEsequiboEditing,
    toggleEsequiboEditing
  } = useMaritimeBoundariesContext();
  const { isAdmin } = useUserRole();

  return (
    <div className="bg-slate-800 rounded-lg p-3">
      {/* Visibilidad de Capas */}
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">
        Visibilidad de Capas
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Toggle Límites Marítimos */}
        <button
          onClick={toggleMaritime}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            showMaritime 
              ? 'bg-cyan-600 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title={showMaritime ? 'Ocultar EEZ (200 millas náuticas)' : 'Mostrar zonas económicas exclusivas'}
        >
          <Waves className="w-4 h-4" />
          <span className="text-xs font-medium">
            {showMaritime ? 'Marítimos ✓' : 'Marítimos'}
          </span>
        </button>

        {/* Toggle Límites Terrestres */}
        <button
          onClick={toggleTerrestrial}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            showTerrestrial 
              ? 'bg-emerald-600 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title={showTerrestrial ? 'Ocultar fronteras terrestres' : 'Mostrar fronteras de países'}
        >
          <Mountain className="w-4 h-4" />
          <span className="text-xs font-medium">
            {showTerrestrial ? 'Terrestres ✓' : 'Terrestres'}
          </span>
        </button>

        {/* Toggle Guayana Esequiba */}
        <button
          onClick={toggleEsequiboClaim}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            showEsequiboClaim 
              ? 'bg-amber-600 text-white' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
          title={showEsequiboClaim ? 'Ocultar Guayana Esequiba' : 'Mostrar zona en reclamación'}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">
            {showEsequiboClaim ? 'Esequibo ✓' : 'Esequibo'}
          </span>
        </button>
      </div>

      {/* Gestión de Límites - Solo visible para admins */}
      {isAdmin() && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">
            Gestión de Límites
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Gestor de Países */}
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

            {/* Editar Polígono Esequibo */}
            <button
              onClick={() => {
                if (!showEsequiboClaim) toggleEsequiboClaim();
                toggleEsequiboEditing();
                onClose();
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isEsequiboEditing 
                  ? 'bg-yellow-500 text-black animate-pulse' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title={isEsequiboEditing ? 'Cerrar editor de polígono' : 'Editar polígono del Esequibo'}
            >
              <PenTool className="w-4 h-4" />
              <span className="text-xs font-medium">
                {isEsequiboEditing ? 'Editando...' : 'Editar Polígono'}
              </span>
            </button>

            {/* Zonas Personalizadas (próximamente) */}
            <button
              disabled
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-500 cursor-not-allowed opacity-50"
              title="Próximamente"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-medium">Zonas Personalizadas</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
