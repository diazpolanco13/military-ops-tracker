import { useState, useEffect } from 'react';
import { 
  Layers, 
  Map as MapIcon, 
  MapPin, 
  Search, 
  Settings,
  Anchor,
  ChevronDown,
  Satellite,
  Moon,
  Navigation,
  Mountain,
  Check,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  ArchiveRestore,
  Lock,
  Unlock,
  Waves,
  Palette,
  Radar,
  Activity,
  Ruler,
  TrendingUp,
  Clock
} from 'lucide-react';
import { MAPBOX_STYLES } from '../../lib/maplibre';
import { useSelection } from '../../stores/SelectionContext';
import { useEntityActions } from '../../hooks/useEntityActions';
import { useHiddenCount } from '../../hooks/useHiddenCount';
import { useArchivedCount } from '../../hooks/useArchivedCount';
import { useLock } from '../../stores/LockContext';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import EntitiesManagementModal from '../Sidebar/EntitiesManagementModal';
import SettingsPanel from '../Settings/SettingsPanel';
import MaritimeBoundariesManager from '../Settings/MaritimeBoundariesManager';
import ZonesPanel from './ZonesPanel';

/**
 * 🧭 BARRA DE NAVEGACIÓN SUPERIOR HORIZONTAL
 * Estilo IBM i2 Analyst's Notebook
 * Iconos horizontales con menús desplegables que se expanden hacia abajo
 */
export default function TopNavigationBar({ 
  onTogglePalette, 
  paletteVisible, 
  map, 
  onToggleRadar, 
  radarVisible = false, 
  onToggleRadarMode = () => {}, 
  radarCompact = true,
  onToggleMeasurement = () => {},
  measurementVisible = false,
  onToggleTimeline = () => {},
  timelineVisible = false,
  onToggleSearch = () => {},
  searchVisible = true
}) {
  const [activePanel, setActivePanel] = useState(null);
  // 🗺️ Persistir selección de mapa en localStorage
  const [currentMapStyle, setCurrentMapStyle] = useState(() => {
    return localStorage.getItem('selectedMapStyle') || 'satellite-streets';
  });
  const [showEntitiesModal, setShowEntitiesModal] = useState(null); // 'hidden' | 'archived' | null
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showMaritimePanel, setShowMaritimePanel] = useState(false);
  const { hiddenCount } = useHiddenCount();
  const { archivedCount } = useArchivedCount();

  // 🌊 Escuchar evento para abrir panel de límites marítimos
  useEffect(() => {
    const handleOpenMaritimePanel = () => {
      setShowMaritimePanel(true);
    };

    window.addEventListener('openMaritimePanel', handleOpenMaritimePanel);
    return () => window.removeEventListener('openMaritimePanel', handleOpenMaritimePanel);
  }, []);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const handleMapStyleChange = (styleId, styleUrl) => {
    if (map) {
      map.setStyle(styleUrl);
      setCurrentMapStyle(styleId);
      
      // 💾 Guardar selección en localStorage
      localStorage.setItem('selectedMapStyle', styleId);
      
      // NO cerrar panel - permitir probar múltiples estilos
    }
  };

  return (
    <>
      {/* 🎨 BARRA SUPERIOR FIJA - RESPONSIVE */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shadow-2xl z-50 overflow-x-auto custom-scrollbar-horizontal">
        
        {/* 🏢 Logo / Inicio */}
        <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 border-r border-slate-700 flex-shrink-0">
          <span className="text-white font-bold text-xs sm:text-sm hidden sm:block">SAE - MONITOR</span>
        </div>

        {/* Separador - Oculto en móvil */}
        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        {/* 🎨 Paleta de Plantillas */}
        <NavButton
          icon={<Layers className="w-5 h-5" />}
          label="Plantillas"
          active={paletteVisible}
          onClick={onTogglePalette}
          tooltip="Paleta de Plantillas"
        />

        {/* 🗺️ Mapas */}
        <NavButton
          icon={<MapIcon className="w-5 h-5" />}
          label="Mapas"
          active={activePanel === 'maps'}
          onClick={() => togglePanel('maps')}
          tooltip="Estilos de Mapa"
          hasSubmenu
        />

        {/* 👁️ Ver */}
        <NavButton
          icon={<Eye className="w-5 h-5" />}
          label="Ver"
          active={activePanel === 'view'}
          onClick={() => togglePanel('view')}
          tooltip="Gestión de Visibilidad"
          hasSubmenu
          badge={hiddenCount > 0 ? hiddenCount : null}
        />

        {/* 📍 Ubicaciones */}
        <NavButton
          icon={<MapPin className="w-5 h-5" />}
          label="Zonas"
          active={activePanel === 'zones'}
          onClick={() => togglePanel('zones')}
          tooltip="Zonas de Interés"
        />

        {/* Timeline de Eventos */}
        <NavButton
          icon={<Clock className="w-5 h-5" />}
          label="Timeline"
          active={timelineVisible}
          onClick={onToggleTimeline}
          tooltip="Timeline de Eventos"
        />

        {/* Separador - Oculto en móvil */}
        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        {/* Spacer - Empuja configuración a la derecha */}
        <div className="flex-1"></div>

        {/* ⚙️ Configuración (derecha) */}
        <NavButton
          icon={<Settings className="w-5 h-5" />}
          label="Config"
          active={showSettingsPanel}
          onClick={() => setShowSettingsPanel(true)}
          tooltip="Configuración"
        />
      </div>

      {/* PANELES DESPLEGABLES (se expanden hacia abajo desde la navbar) */}
      {activePanel && (
        <>
          {/* Backdrop para cerrar al hacer click fuera */}
          <div 
            className="fixed inset-0 bg-black/20"
            style={{ top: '56px', zIndex: 45 }} // Después de la navbar
            onClick={() => setActivePanel(null)}
          />

          {/* Panel desplegable */}
          <div className="fixed left-0 right-0 bg-slate-800/98 backdrop-blur-md border-b border-slate-700 shadow-2xl animate-in slide-in-from-top duration-200"
               style={{ top: '56px', maxHeight: '500px', zIndex: 46 }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{getPanelTitle(activePanel)}</h3>
                <button
                  onClick={() => setActivePanel(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div>
                {activePanel === 'maps' ? (
                  <MapStylesPanel 
                    currentStyle={currentMapStyle}
                    onStyleChange={handleMapStyleChange}
                  />
                ) : activePanel === 'view' ? (
                  <ViewPanel 
                    onClose={() => setActivePanel(null)} 
                    onShowHidden={() => setShowEntitiesModal('hidden')}
                    onShowArchived={() => setShowEntitiesModal('archived')}
                    onToggleRadar={onToggleRadar}
                    radarVisible={radarVisible}
                    onToggleRadarMode={onToggleRadarMode}
                    radarCompact={radarCompact}
                    onToggleMeasurement={onToggleMeasurement}
                    measurementVisible={measurementVisible}
                    onToggleSearch={onToggleSearch}
                    searchVisible={searchVisible}
                  />
                ) : activePanel === 'zones' ? (
                  <ZonesPanel 
                    onClose={() => setActivePanel(null)}
                    onOpenMaritimeConfig={() => setShowMaritimePanel(true)}
                  />
                ) : (
                  <div className="text-slate-300 text-sm">
                    {getPanelContent(activePanel)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Unificado de Gestión de Entidades */}
      {showEntitiesModal && (
        <EntitiesManagementModal 
          type={showEntitiesModal} 
          onClose={() => setShowEntitiesModal(null)} 
        />
      )}

      {/* Panel de Configuración */}
      {showSettingsPanel && (
        <SettingsPanel onClose={() => setShowSettingsPanel(false)} />
      )}

      {/* Gestor de Límites Marítimos */}
      {showMaritimePanel && (
        <MaritimeBoundariesManager onClose={() => setShowMaritimePanel(false)} />
      )}
    </>
  );
}

/**
 * Botón de navegación horizontal
 */
function NavButton({ icon, label, active, onClick, tooltip, hasSubmenu, badge }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`
        flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all relative flex-shrink-0
        ${active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }
      `}
    >
      {icon}
      {/* Label oculto en móvil (< 640px), visible en tablet+ */}
      <span className="text-xs font-medium hidden sm:inline">{label}</span>
      {hasSubmenu && <ChevronDown size={14} className={`transition-transform ${active ? 'rotate-180' : ''} hidden sm:inline`} />}
      
      {/* Badge de conteo */}
      {badge && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

/**
 * Panel de gestión de visibilidad
 */
function ViewPanel({ 
  onClose, 
  onShowHidden, 
  onShowArchived, 
  onToggleRadar, 
  radarVisible = false, 
  onToggleRadarMode = () => {}, 
  radarCompact = true,
  onToggleMeasurement = () => {},
  measurementVisible = false,
  onToggleSearch = () => {},
  searchVisible = true
}) {
  const { getSelectedCount, getSelectedIds, clearSelection } = useSelection();
  const { toggleVisibility, archiveEntity, deleteEntity } = useEntityActions();
  const { isLocked, toggleLock } = useLock();

  const selectedCount = getSelectedCount();
  const selectedIds = getSelectedIds();

  const handleAction = async (action) => {
    // Acciones que requieren selección
    if ((action === 'hide' || action === 'archive' || action === 'delete') && selectedCount === 0) {
      console.log('Selecciona al menos una entidad primero (Ctrl+Click en el mapa)');
      return;
    }

    // Acciones de paneles
    if (action === 'show-hidden') {
      onShowHidden();
      onClose();
      return;
    }
    
    if (action === 'show-archived') {
      onShowArchived();
      onClose();
      return;
    }

    // Acción de bloqueo/desbloqueo
    if (action === 'toggle-lock') {
      toggleLock();
      return; // No cerrar el panel
    }

    // Acción de toggle de búsqueda
    if (action === 'toggle-search') {
      onToggleSearch();
      return; // No cerrar el panel
    }

    // Acción de toggle radar
    if (action === 'toggle-radar') {
      onToggleRadar();
      return; // No cerrar el panel
    }

    // Acción de toggle modo radar
    if (action === 'toggle-radar-mode') {
      onToggleRadarMode();
      return; // No cerrar el panel
    }

    // Acción de toggle herramientas de medición
    if (action === 'toggle-measurement') {
      onToggleMeasurement();
      return; // No cerrar el panel
    }

    let actionFunction = null;

    switch (action) {
      case 'hide':
        actionFunction = (id) => toggleVisibility(id, true);
        break;
      case 'archive':
        actionFunction = archiveEntity;
        break;
      case 'delete':
        actionFunction = deleteEntity;
        break;
      default:
        return;
    }

    // Ejecutar acción para cada entidad seleccionada
    for (const id of selectedIds) {
      await actionFunction(id);
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(id);
      }
    }

    clearSelection();
    onClose();
  };

  const VIEW_ACTIONS = [
    {
      id: 'toggle-measurement',
      title: measurementVisible ? 'Ocultar Medición' : 'Herramientas de Medición',
      description: measurementVisible ? 'Cerrar herramientas' : 'Medir distancias, áreas y círculos',
      icon: Ruler,
      color: measurementVisible ? 'bg-cyan-900/30' : 'bg-slate-700',
      hoverColor: measurementVisible ? 'hover:bg-cyan-900/50' : 'hover:bg-slate-600',
      textColor: measurementVisible ? 'text-cyan-400' : 'text-slate-300',
      requiresSelection: false,
    },
    {
      id: 'toggle-radar',
      title: radarVisible ? 'Ocultar Radar' : 'Mostrar Radar',
      description: radarVisible ? 'Desactivar sistema de radar' : 'Radar de detección en tiempo real',
      icon: Radar,
      color: radarVisible ? 'bg-green-900/30' : 'bg-slate-700',
      hoverColor: radarVisible ? 'hover:bg-green-900/50' : 'hover:bg-slate-600',
      textColor: radarVisible ? 'text-green-400' : 'text-slate-300',
      requiresSelection: false,
    },
    {
      id: 'toggle-radar-mode',
      title: radarCompact ? 'Radar Completo' : 'Radar Compacto',
      description: radarCompact ? 'Expandir panel de control' : 'Minimizar radar (recomendado)',
      icon: Activity,
      color: radarCompact ? 'bg-cyan-900/30' : 'bg-blue-900/30',
      hoverColor: radarCompact ? 'hover:bg-cyan-900/50' : 'hover:bg-blue-900/50',
      textColor: radarCompact ? 'text-cyan-400' : 'text-blue-400',
      requiresSelection: false,
    },
    {
      id: 'toggle-lock',
      title: isLocked ? 'Desbloquear Movimiento' : 'Bloquear Movimiento',
      description: isLocked ? 'Permitir mover entidades' : 'Evitar movimientos accidentales',
      icon: isLocked ? Lock : Unlock,
      color: isLocked ? 'bg-orange-900/30' : 'bg-green-900/30',
      hoverColor: isLocked ? 'hover:bg-orange-900/50' : 'hover:bg-green-900/50',
      textColor: isLocked ? 'text-orange-400' : 'text-green-400',
      requiresSelection: false,
    },
    {
      id: 'toggle-search',
      title: searchVisible ? 'Ocultar Búsqueda' : 'Mostrar Búsqueda',
      description: searchVisible ? 'Ocultar barra de búsqueda' : 'Mostrar barra de búsqueda de entidades',
      icon: Search,
      color: searchVisible ? 'bg-blue-900/30' : 'bg-slate-700',
      hoverColor: searchVisible ? 'hover:bg-blue-900/50' : 'hover:bg-slate-600',
      textColor: searchVisible ? 'text-blue-400' : 'text-slate-300',
      requiresSelection: false,
    },
    {
      id: 'hide',
      title: 'Ocultar Seleccionadas',
      description: 'Oculta las entidades del mapa sin eliminarlas',
      icon: EyeOff,
      color: 'bg-slate-700',
      hoverColor: 'hover:bg-slate-600',
      requiresSelection: true,
    },
    {
      id: 'show-hidden',
      title: 'Ver Entidades Ocultas',
      description: 'Muestra panel con entidades ocultas',
      icon: Eye,
      color: 'bg-blue-900/30',
      hoverColor: 'hover:bg-blue-900/50',
      requiresSelection: false,
    },
    {
      id: 'archive',
      title: 'Archivar Seleccionadas',
      description: 'Archiva entidades (se pueden restaurar)',
      icon: Archive,
      color: 'bg-yellow-900/30',
      hoverColor: 'hover:bg-yellow-900/50',
      textColor: 'text-yellow-400',
      requiresSelection: true,
    },
    {
      id: 'show-archived',
      title: 'Ver Archivadas',
      description: 'Panel de entidades archivadas',
      icon: ArchiveRestore,
      color: 'bg-yellow-900/30',
      hoverColor: 'hover:bg-yellow-900/50',
      textColor: 'text-yellow-400',
      requiresSelection: false,
    },
    {
      id: 'delete',
      title: 'Eliminar Permanentemente',
      description: '⚠️ No se puede deshacer',
      icon: Trash2,
      color: 'bg-red-900/30',
      hoverColor: 'hover:bg-red-900/50',
      textColor: 'text-red-400',
      requiresSelection: true,
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar" style={{ maxWidth: '100%' }}>
      {VIEW_ACTIONS.map((action) => {
        const ActionIcon = action.icon;
        const isDisabled = action.requiresSelection && selectedCount === 0;

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
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
              <ActionIcon className={`w-8 h-8 ${action.textColor || 'text-white'}`} />
            </div>

            {/* Texto */}
            <div className="text-center">
              <div className={`font-medium text-sm ${action.textColor || 'text-white'}`}>
                {action.title}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {action.description}
              </div>
              {isDisabled && (
                <div className="text-xs text-yellow-500 mt-1">
                  Selecciona entidades primero
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Obtener título del panel según el tipo
 */
function getPanelTitle(panel) {
  const titles = {
    maps: '🗺️ Estilos de Mapa',
    view: '👁️ Gestión de Visibilidad',
    types: '🚢 Filtrar por Tipo',
    zones: '📍 Zonas de Interés',
    search: '🔍 Búsqueda Avanzada',
    filters: '🎛️ Filtros y Capas',
    settings: '⚙️ Configuración',
  };
  return titles[panel] || 'Panel';
}

/**
 * Contenido del panel desplegable
 */
function getPanelContent(panel) {
  const content = {
    types: 'Filtrar por: Destructores, Fragatas, Aviones, etc.',
    zones: 'Gestión de zonas de interés',
    search: 'Búsqueda avanzada de entidades',
    filters: 'Activar/desactivar capas del mapa',
    settings: 'Configuración general de la aplicación',
  };
  return content[panel] || 'Contenido del panel';
}

/**
 * Panel de estilos de mapa (reemplaza MapStyleSelector)
 */
function MapStylesPanel({ currentStyle, onStyleChange }) {
  const STYLE_OPTIONS = [
    {
      id: 'satellite-streets',
      name: 'Satélite + Calles',
      icon: Satellite,
      style: MAPBOX_STYLES.SATELLITE_STREETS,
      description: 'Vista satélite con información de calles',
      color: 'bg-blue-500',
    },
    {
      id: 'dark',
      name: 'Oscuro',
      icon: Moon,
      style: MAPBOX_STYLES.DARK,
      description: 'Estilo oscuro profesional',
      color: 'bg-slate-700',
    },
    {
      id: 'navigation-night',
      name: 'Navegación Nocturna',
      icon: Navigation,
      style: MAPBOX_STYLES.NAVIGATION_NIGHT,
      description: 'Optimizado para navegación nocturna',
      color: 'bg-indigo-600',
    },
    {
      id: 'satellite',
      name: 'Satélite Puro',
      icon: Satellite,
      style: MAPBOX_STYLES.SATELLITE,
      description: 'Vista satélite sin overlays',
      color: 'bg-green-600',
    },
    {
      id: 'streets',
      name: 'Calles',
      icon: MapIcon,
      style: MAPBOX_STYLES.STREETS,
      description: 'Mapa de calles estándar',
      color: 'bg-gray-500',
    },
    {
      id: 'outdoors',
      name: 'Terreno',
      icon: Mountain,
      style: MAPBOX_STYLES.OUTDOORS,
      description: 'Vista topográfica con relieve',
      color: 'bg-amber-600',
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar" style={{ maxWidth: '100%' }}>
      {STYLE_OPTIONS.map((option) => {
        const OptionIcon = option.icon;
        const isActive = currentStyle === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onStyleChange(option.id, option.style)}
            className={`flex-shrink-0 flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-200'
            }`}
            style={{ width: '200px', height: '140px' }}
          >
            {/* Icono con color */}
            <div
              className={`w-16 h-16 ${
                isActive ? 'bg-white/20' : option.color
              } rounded-lg flex items-center justify-center`}
            >
              <OptionIcon className="w-8 h-8 text-white" />
            </div>

            {/* Nombre */}
            <div className="text-center">
              <div className="font-medium text-sm flex items-center gap-2">
                {option.name}
                {isActive && <Check size={14} className="text-white" />}
              </div>
              <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                {option.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

