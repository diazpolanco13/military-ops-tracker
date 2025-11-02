import { AlertTriangle, Info, Globe } from 'lucide-react';

/**
 * 🏴 Panel de Información de Territorios Disputados
 * Muestra las zonas en conflicto territorial
 */
export default function DisputedTerritoriesPanel({ onLoadTerrestrial, loadingTerrestrial, terrestrialStatus }) {
  return (
    <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-red-400 font-semibold text-sm mb-2">
            🏴 Territorios en Disputa
          </h4>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="bg-slate-800/50 rounded p-2 border border-red-900/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-red-300">Guayana Esequiba</span>
                <span className="text-slate-500">Desde 1966</span>
              </div>
              <div className="text-slate-400">
                <div className="mb-1">
                  <span className="text-slate-500">De facto:</span> Guyana (GUY)
                </div>
                <div className="mb-1">
                  <span className="text-slate-500">Reclamada por:</span> Venezuela (VEN)
                </div>
                <div className="mb-1">
                  <span className="text-slate-500">Visualización:</span> 
                  <span className="text-red-400 font-semibold ml-1">Asignada a Venezuela</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-400">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <div className="text-xs">
                <p className="text-amber-300">
                  ⚠️ <strong>Limitación:</strong> La zona en disputa territorial (Guayana Esequiba) no puede representarse correctamente porque la API de Marine Regions la asigna a Guyana según reconocimiento internacional.
                </p>
                <p className="text-slate-400 mt-2">
                  <strong>Recomendación:</strong> Elimina Guyana del gestor y trabaja solo con Venezuela para evitar conflictos visuales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

