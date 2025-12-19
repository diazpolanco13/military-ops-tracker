import { useState, useEffect, useRef } from 'react';
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
  Clock,
  Calendar,
  User,
  LogOut,
  UserCircle2,
  Ship,
  Plane,
  Users,
  Truck,
  MapPinned
} from 'lucide-react';
import { MAPBOX_STYLES } from '../../lib/maplibre';
import { useSelection } from '../../stores/SelectionContext';
import { useEntityActions } from '../../hooks/useEntityActions';
import { useHiddenCount } from '../../hooks/useHiddenCount';
import { useArchivedCount } from '../../hooks/useArchivedCount';
import { useLock } from '../../stores/LockContext';
import { useMaritimeBoundariesContext } from '../../stores/MaritimeBoundariesContext';
import { useUserRole } from '../../hooks/useUserRole';
import EntitiesManagementModal from '../Sidebar/EntitiesManagementModal';
import SettingsPanel from '../Settings/SettingsPanel';
import MaritimeBoundariesManager from '../Settings/MaritimeBoundariesManager';
import ZonesPanel from './ZonesPanel';
import WeatherLayersPanel from '../Weather/WeatherLayersPanel';
import LogoutConfirmModal from '../Auth/LogoutConfirmModal';

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
  onToggleCalendar = () => {},
  calendarVisible = false,
  onToggleSearch = () => {},
  searchVisible = true,
  user = null,
  onSignOut = null
}) {
  const [activePanel, setActivePanel] = useState(null);
  
  // 🚢 Estado para ocultar/mostrar embarcaciones
  const [shipsVisible, setShipsVisible] = useState(() => {
    return localStorage.getItem('shipsVisible') !== 'false'; // Por defecto visible
  });

  // ✈️ Estado para ocultar/mostrar aeronaves
  const [aircraftVisible, setAircraftVisible] = useState(() => {
    return localStorage.getItem('aircraftVisible') !== 'false';
  });

  // 👥 Estado para ocultar/mostrar tropas
  const [troopsVisible, setTroopsVisible] = useState(() => {
    return localStorage.getItem('troopsVisible') !== 'false';
  });

  // 🚙 Estado para ocultar/mostrar vehículos
  const [vehiclesVisible, setVehiclesVisible] = useState(() => {
    return localStorage.getItem('vehiclesVisible') !== 'false';
  });

  // 📍 Estado para ocultar/mostrar lugares (bases, aeropuertos, instalaciones)
  const [placesVisible, setPlacesVisible] = useState(() => {
    return localStorage.getItem('placesVisible') !== 'false';
  });
  // 🗺️ Persistir selección de mapa en localStorage
  const [currentMapStyle, setCurrentMapStyle] = useState(() => {
    return localStorage.getItem('selectedMapStyle') || 'satellite-streets';
  });
  const [showEntitiesModal, setShowEntitiesModal] = useState(null); // 'hidden' | 'archived' | null
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showMaritimePanel, setShowMaritimePanel] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const { hiddenCount } = useHiddenCount();
  const { archivedCount } = useArchivedCount();
  const { canAccessSettings, canCreate } = useUserRole();

  // 🌊 Escuchar evento para abrir panel de límites marítimos
  useEffect(() => {
    const handleOpenMaritimePanel = () => {
      setShowMaritimePanel(true);
    };

    window.addEventListener('openMaritimePanel', handleOpenMaritimePanel);
    return () => window.removeEventListener('openMaritimePanel', handleOpenMaritimePanel);
  }, []);

  // Cerrar panel de configuración si no tiene permiso
  useEffect(() => {
    if (showSettingsPanel && !canAccessSettings()) {
      setShowSettingsPanel(false);
    }
  }, [showSettingsPanel, canAccessSettings]);

  // Disparar eventos cuando el panel de configuración se abre/cierra
  useEffect(() => {
    if (showSettingsPanel) {
      window.dispatchEvent(new CustomEvent('settingsPanelOpen'));
    } else {
      window.dispatchEvent(new CustomEvent('settingsPanelClose'));
    }
  }, [showSettingsPanel]);

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  // Toggle para embarcaciones
  const toggleShipsVisibility = () => {
    const newState = !shipsVisible;
    setShipsVisible(newState);
    localStorage.setItem('shipsVisible', newState.toString());
    
    // Emitir evento para que MapContainer actualice el filtro
    window.dispatchEvent(new CustomEvent('toggleShipsVisibility', { 
      detail: { visible: newState } 
    }));
  };

  // Toggle para aeronaves
  const toggleAircraftVisibility = () => {
    const newState = !aircraftVisible;
    setAircraftVisible(newState);
    localStorage.setItem('aircraftVisible', newState.toString());
    window.dispatchEvent(new CustomEvent('toggleAircraftVisibility', { 
      detail: { visible: newState } 
    }));
  };

  // Toggle para tropas
  const toggleTroopsVisibility = () => {
    const newState = !troopsVisible;
    setTroopsVisible(newState);
    localStorage.setItem('troopsVisible', newState.toString());
    window.dispatchEvent(new CustomEvent('toggleTroopsVisibility', { 
      detail: { visible: newState } 
    }));
  };

  // Toggle para vehículos
  const toggleVehiclesVisibility = () => {
    const newState = !vehiclesVisible;
    setVehiclesVisible(newState);
    localStorage.setItem('vehiclesVisible', newState.toString());
    window.dispatchEvent(new CustomEvent('toggleVehiclesVisibility', { 
      detail: { visible: newState } 
    }));
  };

  // Toggle para lugares
  const togglePlacesVisibility = () => {
    const newState = !placesVisible;
    setPlacesVisible(newState);
    localStorage.setItem('placesVisible', newState.toString());
    window.dispatchEvent(new CustomEvent('togglePlacesVisibility', { 
      detail: { visible: newState } 
    }));
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
          <span className="text-white font-bold text-xs sm:text-sm hidden sm:block">SAE - RADAR</span>
        </div>

        {/* Separador - Oculto en móvil */}
        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        {/* 🎨 Paleta de Plantillas - Solo visible si puede crear entidades */}
        {canCreate() && (
          <NavButton
            icon={<Layers className="w-5 h-5" />}
            label="Plantillas"
            active={paletteVisible}
            onClick={onTogglePalette}
            tooltip="Paleta de Plantillas"
          />
        )}

        {/* 🗺️ Mapas */}
        <NavButton
          icon={<MapIcon className="w-5 h-5" />}
          label="Mapas"
          active={activePanel === 'maps'}
          onClick={() => togglePanel('maps')}
          tooltip="Estilos de Mapa"
          hasSubmenu
        />

        {/* 🌦️ Clima - Panel independiente (no usa activePanel) */}
        <div className="flex-shrink-0">
          <WeatherLayersPanel map={map} />
        </div>

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

        {/* Separador - Oculto en móvil */}
        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        {/* Spacer - Empuja menú de usuario a la derecha */}
        <div className="flex-1"></div>

        {/* 👤 Menú de Usuario Desplegable - Minimalista */}
        {user && onSignOut && (
          <div className="relative flex-shrink-0" ref={userMenuRef}>
            {/* Botón Avatar Minimalista */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-500/50 transition-all shadow-lg ml-2"
              title={user.email}
            >
              <span className="text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase() || '?'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Menú desplegable del usuario - FUERA del navbar para evitar overflow */}
      {showUserMenu && user && (
        <div 
          ref={userMenuRef}
          className="fixed right-4 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-[100] overflow-hidden"
          style={{ top: '60px', width: '260px' }}
        >
          {/* Info del usuario */}
          <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-blue-500/30">
                <span className="text-white font-bold text-sm">
                  {user.email?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {user.email}
                </div>
                <div className="text-slate-400 text-xs">
                  Usuario activo
                </div>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            {/* Configuración */}
            {canAccessSettings() && (
              <button
                onClick={() => {
                  setShowSettingsPanel(true);
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                  <Settings className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Configuración</div>
                  <div className="text-slate-500 text-xs">Ajustes del sistema</div>
                </div>
              </button>
            )}

            {/* Cerrar Sesión */}
            <button
              onClick={() => {
                setShowLogoutModal(true);
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 transition-colors text-left border-t border-slate-800 group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-red-400 text-sm font-medium">Cerrar Sesión</div>
                <div className="text-red-400/60 text-xs">Salir del sistema</div>
              </div>
            </button>
          </div>
        </div>
      )}

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
                    onToggleShips={toggleShipsVisibility}
                    shipsVisible={shipsVisible}
                    onToggleAircraft={toggleAircraftVisibility}
                    aircraftVisible={aircraftVisible}
                    onToggleTroops={toggleTroopsVisibility}
                    troopsVisible={troopsVisible}
                    onToggleVehicles={toggleVehiclesVisibility}
                    vehiclesVisible={vehiclesVisible}
                    onTogglePlaces={togglePlacesVisibility}
                    placesVisible={placesVisible}
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

      {/* Panel de Configuración - Solo visible si tiene permiso */}
      {showSettingsPanel && canAccessSettings() && (
        <SettingsPanel onClose={() => setShowSettingsPanel(false)} />
      )}

      {/* Gestor de Límites Marítimos */}
      {showMaritimePanel && (
        <MaritimeBoundariesManager onClose={() => setShowMaritimePanel(false)} />
      )}

      {/* Modal de Confirmación de Logout */}
      {showLogoutModal && user && (
        <LogoutConfirmModal
          userEmail={user.email}
          onConfirm={() => {
            setShowLogoutModal(false);
            onSignOut();
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
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
  searchVisible = true,
  onToggleShips = () => {},
  shipsVisible = true,
  onToggleAircraft = () => {},
  aircraftVisible = true,
  onToggleTroops = () => {},
  troopsVisible = true,
  onToggleVehicles = () => {},
  vehiclesVisible = true,
  onTogglePlaces = () => {},
  placesVisible = true
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

    // Acción de toggle embarcaciones
    if (action === 'toggle-ships') {
      onToggleShips();
      return; // No cerrar el panel
    }

    // Acción de toggle aeronaves
    if (action === 'toggle-aircraft') {
      onToggleAircraft();
      return;
    }

    // Acción de toggle tropas
    if (action === 'toggle-troops') {
      onToggleTroops();
      return;
    }

    // Acción de toggle vehículos
    if (action === 'toggle-vehicles') {
      onToggleVehicles();
      return;
    }

    // Acción de toggle lugares
    if (action === 'toggle-places') {
      onTogglePlaces();
      return;
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

  // Grupos organizados
  const ENTITY_TOGGLES = [
    { id: 'toggle-ships', label: 'Embarcaciones', icon: Ship, active: shipsVisible, color: 'blue' },
    { id: 'toggle-aircraft', label: 'Aeronaves', icon: Plane, active: aircraftVisible, color: 'sky' },
    { id: 'toggle-troops', label: 'Tropas', icon: Users, active: troopsVisible, color: 'amber' },
    { id: 'toggle-vehicles', label: 'Vehículos', icon: Truck, active: vehiclesVisible, color: 'slate' },
    { id: 'toggle-places', label: 'Instalaciones', icon: MapPinned, active: placesVisible, color: 'purple' },
  ];

  const TOOLS = [
    { id: 'toggle-measurement', label: 'Medición', icon: Ruler, active: measurementVisible, color: 'cyan' },
    { id: 'toggle-radar', label: 'Radar', icon: Radar, active: radarVisible, color: 'green' },
    { id: 'toggle-search', label: 'Búsqueda', icon: Search, active: searchVisible, color: 'blue' },
    { id: 'toggle-lock', label: isLocked ? 'Bloqueado' : 'Desbloqueado', icon: isLocked ? Lock : Unlock, active: isLocked, color: 'orange' },
  ];

  const colorMap = {
    blue: { active: 'bg-blue-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    sky: { active: 'bg-sky-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    amber: { active: 'bg-amber-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    slate: { active: 'bg-slate-500', inactive: 'bg-slate-700 hover:bg-slate-600' },
    purple: { active: 'bg-purple-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    cyan: { active: 'bg-cyan-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    green: { active: 'bg-emerald-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    orange: { active: 'bg-orange-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    yellow: { active: 'bg-yellow-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
    red: { active: 'bg-red-600', inactive: 'bg-slate-700 hover:bg-slate-600' },
  };

  const ToggleButton = ({ item }) => {
    const Icon = item.icon;
    const colors = colorMap[item.color] || colorMap.slate;
    return (
      <button
        onClick={() => handleAction(item.id)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
          item.active ? `${colors.active} text-white` : `${colors.inactive} text-slate-300`
        }`}
        title={item.active ? `Ocultar ${item.label}` : `Mostrar ${item.label}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Grupo 1: Capas de entidades */}
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Capas del Mapa</div>
        <div className="flex flex-wrap gap-1.5">
          {ENTITY_TOGGLES.map(item => <ToggleButton key={item.id} item={item} />)}
        </div>
      </div>

      {/* Grupo 2: Herramientas */}
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Herramientas</div>
        <div className="flex flex-wrap gap-1.5">
          {TOOLS.map(item => <ToggleButton key={item.id} item={item} />)}
        </div>
      </div>

      {/* Grupo 3: Gestión de entidades */}
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">
          Gestión {selectedCount > 0 && <span className="text-blue-400">({selectedCount} seleccionadas)</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleAction('hide')}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedCount > 0 ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Ocultar</span>
          </button>
          <button
            onClick={() => handleAction('show-hidden')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver ocultas</span>
          </button>
          <button
            onClick={() => handleAction('archive')}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedCount > 0 ? 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/50' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archivar</span>
          </button>
          <button
            onClick={() => handleAction('show-archived')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/50 transition-all"
          >
            <ArchiveRestore className="w-3.5 h-3.5" />
            <span>Ver archivadas</span>
          </button>
          <button
            onClick={() => handleAction('delete')}
            disabled={selectedCount === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedCount > 0 ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
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

