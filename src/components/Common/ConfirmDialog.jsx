import { AlertTriangle, X } from 'lucide-react';

/**
 * 🚨 Diálogo de Confirmación
 * Componente reutilizable para confirmar acciones destructivas
 */
export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger' // 'danger' | 'warning' | 'info'
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-400',
      bg: 'bg-red-900/30',
      border: 'border-red-900/50',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-900/50',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-400',
      bg: 'bg-blue-900/30',
      border: 'border-blue-900/50',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const style = typeStyles[type] || typeStyles.danger;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Icono de alerta */}
        <div className={`flex items-center justify-center w-16 h-16 mx-auto -mt-8 rounded-full ${style.bg} ${style.border} border-2`}>
          <AlertTriangle className={`w-8 h-8 ${style.icon}`} />
        </div>

        {/* Contenido */}
        <div className="p-6 pt-4">
          <h3 className="text-lg font-bold text-white text-center mb-2">
            {title}
          </h3>
          
          {message && (
            <p className="text-sm text-slate-300 text-center mb-6 leading-relaxed">
              {message}
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 ${style.button} text-white rounded-lg font-medium transition-colors shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

