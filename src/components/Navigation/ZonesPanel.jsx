import { Waves, Palette, MapPin } from 'lucide-react';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';

/**
 * 📍 Panel de Zonas de Interés
 * Incluye límites marítimos y futuras zonas personalizadas
 */
export default function ZonesPanel({ onClose, onOpenMaritimeConfig }) {
  const { showBoundaries, toggleBoundaries } = useMaritimeBoundariesContext();

  const ZONES_ACTIONS = [
    {
      id: 'toggle-maritime',
      title: showBoundaries ? 'Ocultar Límites Marítimos' : 'Mostrar Límites Marítimos',
      description: showBoundaries ? 'Ocultar EEZ de 200 NM' : 'Ver EEZ y aguas territoriales',
      icon: Waves,
      color: showBoundaries ? 'bg-cyan-900/30' : 'bg-slate-800/30',
      hoverColor: showBoundaries ? 'hover:bg-cyan-900/50' : 'hover:bg-slate-700',
      textColor: showBoundaries ? 'text-cyan-400' : 'text-slate-400',
    },
    {
      id: 'configure-maritime',
      title: 'Gestor de Países',
      description: 'Buscar, agregar y personalizar límites',
      icon: Palette,
      color: 'bg-purple-900/30',
      hoverColor: 'hover:bg-purple-900/50',
      textColor: 'text-purple-400',
    },
    {
      id: 'custom-zones',
      title: 'Zonas Personalizadas',
      description: 'Crear zonas de interés (Próximamente)',
      icon: MapPin,
      color: 'bg-slate-800/30',
      hoverColor: 'hover:bg-slate-700',
      textColor: 'text-slate-400',
      disabled: true,
    },
  ];

  const handleAction = (actionId) => {
    switch (actionId) {
      case 'toggle-maritime':
        toggleBoundaries();
        // No cerrar el panel para permitir múltiples acciones
        break;
      
      case 'configure-maritime':
        onOpenMaritimeConfig();
        onClose();
        break;
      
      case 'custom-zones':
        // Futuro: abrir panel de zonas personalizadas
        break;
      
      default:
        break;
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar" style={{ maxWidth: '100%' }}>
      {ZONES_ACTIONS.map((action) => {
        const ActionIcon = action.icon;
        const isDisabled = action.disabled;

        return (
          <button
            key={action.id}
            onClick={() => !isDisabled && handleAction(action.id)}
            disabled={isDisabled}
            className={`flex-shrink-0 flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all ${
              isDisabled
                ? 'opacity-40 cursor-not-allowed bg-slate-800/30'
                : `${action.color} ${action.hoverColor} cursor-pointer`
            }`}
            style={{ width: '200px', height: '140px' }}
          >
            {/* Icono */}
            <div className={`w-16 h-16 ${isDisabled ? 'bg-slate-700' : 'bg-slate-700/80'} rounded-lg flex items-center justify-center`}>
              <ActionIcon className={`w-8 h-8 ${action.textColor}`} />
            </div>

            {/* Texto */}
            <div className="text-center">
              <div className={`font-medium text-sm ${action.textColor}`}>
                {action.title}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {action.description}
              </div>
              {isDisabled && (
                <div className="text-xs text-yellow-500 mt-1">
                  Próximamente
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

