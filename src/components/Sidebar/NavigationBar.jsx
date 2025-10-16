import { useState } from 'react';
import { 
  Star, 
  Ship, 
  MapPin, 
  Search, 
  Settings,
  Anchor,
  Filter,
  X
} from 'lucide-react';

/**
 * 🧭 BARRA DE NAVEGACIÓN LATERAL IZQUIERDA
 * Estilo VesselFinder con iconos y menús desplegables
 */
export default function NavigationBar({ onFilterChange }) {
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  return (
    <>
      {/* 🎨 BARRA LATERAL FIJA */}
      <div className="fixed left-0 top-0 h-full w-16 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 flex flex-col items-center py-4 gap-1 shadow-2xl" style={{ zIndex: 50 }}>
        
        {/* 🏢 Logo / Inicio */}
        <button
          className="w-12 h-12 flex items-center justify-center text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all mb-2"
          title="Inicio"
        >
          <Anchor className="w-6 h-6" />
        </button>

        <div className="w-10 h-px bg-slate-700 my-1" />

        {/* ⭐ Favoritos */}
        <NavButton
          icon={<Star className="w-5 h-5" />}
          active={activePanel === 'favorites'}
          onClick={() => togglePanel('favorites')}
          title="Favoritos"
        />

        {/* 🚢 Tipos de Embarcaciones (con submenú) */}
        <NavButton
          icon={<Ship className="w-5 h-5" />}
          active={activePanel === 'vessels'}
          onClick={() => togglePanel('vessels')}
          title="Tipos de Embarcaciones"
          hasSubmenu
        />

        {/* 📍 Ubicaciones */}
        <NavButton
          icon={<MapPin className="w-5 h-5" />}
          active={activePanel === 'locations'}
          onClick={() => togglePanel('locations')}
          title="Ubicaciones"
        />

        {/* 🔍 Búsqueda */}
        <NavButton
          icon={<Search className="w-5 h-5" />}
          active={activePanel === 'search'}
          onClick={() => togglePanel('search')}
          title="Búsqueda"
        />

        {/* 🎛️ Filtros */}
        <NavButton
          icon={<Filter className="w-5 h-5" />}
          active={activePanel === 'filters'}
          onClick={() => togglePanel('filters')}
          title="Filtros"
        />

        <div className="flex-grow" />

        {/* ⚙️ Configuración (abajo) */}
        <NavButton
          icon={<Settings className="w-5 h-5" />}
          active={activePanel === 'settings'}
          onClick={() => togglePanel('settings')}
          title="Configuración"
        />
      </div>

      {/* 📋 PANELES DESPLEGABLES */}
      {activePanel && (
        <SidePanel 
          title={getPanelTitle(activePanel)} 
          onClose={() => setActivePanel(null)}
          position="left"
        >
          {renderPanelContent(activePanel, onFilterChange)}
        </SidePanel>
      )}
    </>
  );
}

/**
 * 🔘 BOTÓN DE NAVEGACIÓN
 */
function NavButton({ icon, active, onClick, title, hasSubmenu }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-12 h-12 flex items-center justify-center rounded-lg
        transition-all duration-200
        ${active 
          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/50' 
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }
      `}
      title={title}
    >
      {icon}
      {hasSubmenu && (
        <div className="absolute right-1 top-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      )}
    </button>
  );
}

/**
 * 📋 PANEL LATERAL DESPLEGABLE
 */
function SidePanel({ title, onClose, children, position = 'left' }) {
  return (
    <div 
      className={`
        fixed ${position === 'left' ? 'left-16' : 'right-0'} top-0 h-full w-80 
        bg-slate-900/95 backdrop-blur-md border-r border-slate-700 
        shadow-2xl animate-slideIn
      `}
      style={{ zIndex: 40 }}
    >
      {/* Header */}
      <div className="h-14 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
        <h2 className="text-white font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

/**
 * 📝 CONTENIDO DE LOS PANELES
 */
function renderPanelContent(panelName, onFilterChange) {
  switch (panelName) {
    case 'favorites':
      return <FavoritesPanel />;
    case 'vessels':
      return <VesselsPanel onFilterChange={onFilterChange} />;
    case 'locations':
      return <LocationsPanel />;
    case 'search':
      return <SearchPanel />;
    case 'filters':
      return <FiltersPanel onFilterChange={onFilterChange} />;
    case 'settings':
      return <SettingsPanel />;
    default:
      return <div className="p-4 text-slate-400">Panel en desarrollo</div>;
  }
}

function getPanelTitle(panelName) {
  const titles = {
    favorites: 'Favoritos',
    vessels: 'Tipos de Embarcaciones',
    locations: 'Ubicaciones',
    search: 'Búsqueda',
    filters: 'Filtros',
    settings: 'Configuración',
  };
  return titles[panelName] || '';
}

/**
 * ⭐ PANEL DE FAVORITOS
 */
function FavoritesPanel() {
  return (
    <div className="p-4">
      <p className="text-slate-400 text-sm mb-4">Tus entidades favoritas aparecerán aquí</p>
      <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
        <Star className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-xs">No hay favoritos aún</p>
      </div>
    </div>
  );
}

/**
 * 🚢 PANEL DE TIPOS DE EMBARCACIONES (con categorías desplegables)
 */
function VesselsPanel({ onFilterChange }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const categories = [
    {
      id: 'naval',
      name: 'Buques de Guerra',
      icon: '⚓',
      types: [
        { id: 'destroyer', name: 'Destructores', count: 1 },
        { id: 'frigate', name: 'Fragatas', count: 0 },
        { id: 'corvette', name: 'Corbetas', count: 0 },
        { id: 'submarine', name: 'Submarinos', count: 0 },
      ]
    },
    {
      id: 'air',
      name: 'Aeronaves',
      icon: '✈️',
      types: [
        { id: 'fighter', name: 'Cazas', count: 0 },
        { id: 'helicopter', name: 'Helicópteros', count: 0 },
        { id: 'drone', name: 'Drones', count: 0 },
      ]
    },
    {
      id: 'ground',
      name: 'Fuerzas Terrestres',
      icon: '🚛',
      types: [
        { id: 'tank', name: 'Tanques', count: 0 },
        { id: 'vehicle', name: 'Vehículos', count: 0 },
      ]
    },
  ];

  const handleTypeClick = (typeId) => {
    if (onFilterChange) {
      onFilterChange({ type: typeId });
    }
  };

  return (
    <div className="p-2">
      {categories.map((category) => (
        <div key={category.id} className="mb-2">
          <button
            onClick={() => setExpandedCategory(
              expandedCategory === category.id ? null : category.id
            )}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{category.icon}</span>
              <span className="text-white text-sm font-medium">{category.name}</span>
            </div>
            <span className="text-slate-400 text-xs">
              {expandedCategory === category.id ? '▲' : '▼'}
            </span>
          </button>

          {/* Submenú desplegable */}
          {expandedCategory === category.id && (
            <div className="mt-1 ml-4 space-y-1 animate-slideDown">
              {category.types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeClick(type.id)}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-700/30 transition-all text-left"
                >
                  <span className="text-slate-300 text-xs">{type.name}</span>
                  <span className="text-cyan-400 text-xs font-mono">{type.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 📍 PANEL DE UBICACIONES
 */
function LocationsPanel() {
  const locations = [
    { name: 'Mar Mediterráneo', count: 1, region: 'Europa' },
    { name: 'Océano Atlántico', count: 0, region: 'Global' },
    { name: 'Océano Pacífico', count: 0, region: 'Global' },
  ];

  return (
    <div className="p-4 space-y-2">
      {locations.map((location, idx) => (
        <button
          key={idx}
          className="w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/30 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{location.name}</p>
              <p className="text-slate-400 text-xs">{location.region}</p>
            </div>
            <span className="text-cyan-400 text-sm font-mono">{location.count}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * 🔍 PANEL DE BÚSQUEDA
 */
function SearchPanel() {
  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Buscar entidad..."
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
      />
      <p className="text-slate-500 text-xs mt-4">
        Busca por nombre, ID o características
      </p>
    </div>
  );
}

/**
 * 🎛️ PANEL DE FILTROS
 */
function FiltersPanel({ onFilterChange }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-slate-300 text-sm font-medium mb-2 block">Estado</label>
        <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-600">
          <option>Todos</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>
      <div>
        <label className="text-slate-300 text-sm font-medium mb-2 block">Velocidad Mínima</label>
        <input
          type="range"
          min="0"
          max="50"
          className="w-full"
        />
      </div>
    </div>
  );
}

/**
 * ⚙️ PANEL DE CONFIGURACIÓN
 */
function SettingsPanel() {
  return (
    <div className="p-4 space-y-3">
      <SettingToggle label="Mostrar trayectorias" />
      <SettingToggle label="Actualización automática" defaultChecked />
      <SettingToggle label="Sonido de alertas" />
      <SettingToggle label="Modo oscuro" defaultChecked />
    </div>
  );
}

function SettingToggle({ label, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      onClick={() => setChecked(!checked)}
      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/30"
    >
      <span className="text-slate-300 text-sm">{label}</span>
      <div
        className={`
          w-10 h-6 rounded-full transition-all
          ${checked ? 'bg-cyan-600' : 'bg-slate-700'}
        `}
      >
        <div
          className={`
            w-4 h-4 bg-white rounded-full mt-1 transition-all
            ${checked ? 'ml-5' : 'ml-1'}
          `}
        />
      </div>
    </button>
  );
}

