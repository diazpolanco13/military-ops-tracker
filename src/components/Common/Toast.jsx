import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * 🎨 Componente de notificación Toast
 * Elegante y minimalista, auto-dismiss en 3 segundos
 */
export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-600/95',
      borderColor: 'border-green-400',
      iconColor: 'text-green-200',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-600/95',
      borderColor: 'border-red-400',
      iconColor: 'text-red-200',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-600/95',
      borderColor: 'border-yellow-400',
      iconColor: 'text-yellow-200',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor } = config[type] || config.success;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-slideInFromTop">
      <div className={`${bgColor} backdrop-blur-md ${borderColor} border-2 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[320px]`}>
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <p className="text-white font-medium text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

