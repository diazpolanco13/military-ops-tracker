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
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
              <div>
                <p className="mb-1">
                  Las zonas disputadas se muestran con <strong className="text-red-400">líneas punteadas</strong> y <strong className="text-red-400">mayor opacidad</strong> para distinguirlas de límites establecidos.
                </p>
                <p className="mb-2">
                  La asignación visual se configura automáticamente según la tabla de territorios disputados en la base de datos.
                </p>

                <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                  <p className="text-xs text-amber-300 mb-2 font-semibold">
                    ⚠️ Limitación Actual:
                  </p>
                  <p className="text-xs text-slate-300 mb-2">
                    Por ahora, el sistema muestra:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside ml-2">
                    <li>✅ Zona MARÍTIMA de Esequibo (ya reasignada a Venezuela)</li>
                    <li>❌ Falta polígono TERRESTRE con Esequibo</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">
                    <strong>Solución temporal:</strong> Elimina Guyana del gestor para que solo Venezuela aparezca. La zona marítima en reclamación ya está correctamente asignada a Venezuela en la base de datos.
                  </p>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Los límites terrestres de GADM (que incluyen Guayana Esequiba) requieren descarga manual debido a restricciones CORS. Por ahora, el sistema respeta el reclamo marítimo venezolano.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

