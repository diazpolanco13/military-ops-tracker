import { LogOut, AlertTriangle, X } from 'lucide-react';

/**
 * 🚪 Modal de Confirmación de Cierre de Sesión
 * Diseño militar profesional
 */
export default function LogoutConfirmModal({ onConfirm, onCancel, userEmail }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg blur-xl opacity-25" />
        
        {/* Modal */}
        <div className="relative bg-slate-900 border border-red-900/50 rounded-lg shadow-2xl p-6">
          {/* Botón cerrar */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icono de advertencia */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-900/20 border border-red-700/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-white text-center mb-2">
            ¿Cerrar Sesión?
          </h2>

          {/* Descripción */}
          <p className="text-slate-400 text-center text-sm mb-6">
            Estás a punto de cerrar sesión como:
          </p>

          {/* Email del usuario */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-6 flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="text-white text-sm font-medium">{userEmail}</span>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mb-6">
            <p className="text-yellow-300 text-xs text-center">
              ⚠️ Tendrás que iniciar sesión nuevamente para acceder al sistema
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

