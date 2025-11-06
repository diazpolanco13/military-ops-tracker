import { X, Settings, Layers, Eye, Zap, Tag, Monitor, Bot, Sliders, Map, Video, Cloud, CloudRain, Thermometer, Wind, Gauge, Users, Shield, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getActiveWeatherLayers, saveActiveWeatherLayers, WEATHER_LAYERS } from '../Weather/WeatherLayers';
import UserManagement from '../Auth/UserManagement';
import RolePermissionsEditor from './RolePermissionsEditor';

/**
 * ⚙️ Panel de Configuración
 * Ajustes dinámicos para visualización del mapa
 */
export default function SettingsPanel({ onClose }) {
  // 📑 Estado de tabs
  const [activeTab, setActiveTab] = useState('clustering');
  // 📱 Estado para sidebar móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cargar configuración desde localStorage con valores por defecto actualizados
  const [clusterZoomThreshold, setClusterZoomThreshold] = useState(() => {
    return parseInt(localStorage.getItem('clusterZoomThreshold') || '6'); // ✅ Cambiado de 8 a 6
  });
  
  const [clusterRadius, setClusterRadius] = useState(() => {
    return parseInt(localStorage.getItem('clusterRadius') || '58'); // ✅ Cambiado de 60 a 58
  });

  const [iconSize, setIconSize] = useState(() => {
    return parseInt(localStorage.getItem('iconSize') || '48');
  });

  const [useImages, setUseImages] = useState(() => {
    const stored = localStorage.getItem('useImages');
    return stored === null ? true : stored === 'true'; // ✅ Default TRUE (mostrar imágenes)
  });

  // 🏷️ NUEVO: Configuración de etiquetas
  const [showLabelName, setShowLabelName] = useState(() => {
    return localStorage.getItem('showLabelName') !== 'false'; // Default: true
  });

  const [showLabelType, setShowLabelType] = useState(() => {
    return localStorage.getItem('showLabelType') !== 'false'; // Default: true
  });

  const [showLabelClass, setShowLabelClass] = useState(() => {
    return localStorage.getItem('showLabelClass') === 'true'; // Default: false
  });

  // 🎴 Modo de vista de entidad (siempre card futurista)
  const [entityViewMode] = useState('card'); // Siempre card futurista

  // 🎯 NUEVO: Mostrar/ocultar círculo de entidades
  const [showEntityCircle, setShowEntityCircle] = useState(() => {
    const stored = localStorage.getItem('showEntityCircle');
    return stored === null ? false : stored === 'true'; // ✅ Default false, respeta valor guardado
  });

  // 🤖 NUEVO: Configuración de IA (Grok)
  const [aiModel, setAiModel] = useState(() => {
    return localStorage.getItem('aiModel') || 'grok-4';
  });

  const [aiTemperature, setAiTemperature] = useState(() => {
    return parseFloat(localStorage.getItem('aiTemperature') || '0.7');
  });

  const [aiMaxTokens, setAiMaxTokens] = useState(() => {
    return parseInt(localStorage.getItem('aiMaxTokens') || '1000');
  });

  const [aiPersonality, setAiPersonality] = useState(() => {
    return localStorage.getItem('aiPersonality') || 'profesional';
  });

  // 🌎 NUEVO: Perspectiva geopolítica
  const [aiPerspective, setAiPerspective] = useState(() => {
    return localStorage.getItem('aiPerspective') || 'neutral';
  });

  // 🎥 NUEVO: Configuración de cámara del mapa
  const [mapPitch, setMapPitch] = useState(() => {
    return parseInt(localStorage.getItem('mapPitch') || '0');
  });

  const [mapBearing, setMapBearing] = useState(() => {
    return parseInt(localStorage.getItem('mapBearing') || '0');
  });

  // 🌦️ NUEVO: Capas de clima
  const [weatherLayers, setWeatherLayers] = useState(() => {
    const saved = localStorage.getItem('activeWeatherLayers');
    return saved ? JSON.parse(saved) : {
      precipitation: false,
      clouds: false,
      temperature: false,
      wind: false,
      pressure: false
    };
  });

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('clusterZoomThreshold', clusterZoomThreshold);
    localStorage.setItem('clusterRadius', clusterRadius);
    localStorage.setItem('iconSize', iconSize);
    localStorage.setItem('useImages', useImages);
    localStorage.setItem('showLabelName', showLabelName);
    localStorage.setItem('showLabelType', showLabelType);
    localStorage.setItem('showLabelClass', showLabelClass);
    localStorage.setItem('entityViewMode', 'card'); // Siempre card futurista
    localStorage.setItem('showEntityCircle', showEntityCircle);
    localStorage.setItem('aiModel', aiModel);
    localStorage.setItem('aiTemperature', aiTemperature);
    localStorage.setItem('aiMaxTokens', aiMaxTokens);
    localStorage.setItem('aiPersonality', aiPersonality);
    localStorage.setItem('aiPerspective', aiPerspective);
    localStorage.setItem('mapPitch', mapPitch);
    localStorage.setItem('mapBearing', mapBearing);
    saveActiveWeatherLayers(weatherLayers);
    
    // Disparar evento personalizado para que el mapa se actualice
    window.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { 
        clusterZoomThreshold, 
        clusterRadius, 
        iconSize, 
        useImages,
        showLabelName,
        showLabelType,
        showLabelClass,
        entityViewMode: 'card', // Siempre card futurista
        showEntityCircle,
        aiModel,
        aiTemperature,
        aiMaxTokens,
        aiPersonality,
        aiPerspective,
        mapPitch,
        mapBearing,
        weatherLayers
      }
    }));
  }, [clusterZoomThreshold, clusterRadius, iconSize, useImages, showLabelName, showLabelType, showLabelClass, showEntityCircle, aiModel, aiTemperature, aiMaxTokens, aiPersonality, aiPerspective, mapPitch, mapBearing, weatherLayers]);

  const resetToDefaults = () => {
    setClusterZoomThreshold(5); // ✅ Actualizado
    setClusterRadius(58); // ✅ Actualizado
    setIconSize(32);
    setUseImages(true);
    setShowLabelName(true);
    setShowLabelType(true);
    setShowLabelClass(false);
    // entityViewMode siempre es 'card', no necesita reset
    setShowEntityCircle(false); // ✅ Actualizado
    setAiModel('grok-4');
    setAiTemperature(0.7);
    setAiMaxTokens(1000);
    setAiPersonality('profesional');
    setAiPerspective('neutral');
    setMapPitch(45);
    setMapBearing(0);
    setWeatherLayers({
      clouds: false,
      precipitation: false,
      temperature: false,
      wind: false,
      pressure: false
    });
  };

  // Toggle capa de clima
  const toggleWeatherLayer = (layerType) => {
    setWeatherLayers(prev => ({
      ...prev,
      [layerType]: !prev[layerType]
    }));
  };

  // 📑 Definición de tabs
  const tabs = [
    { id: 'clustering', label: 'Clustering', icon: Layers },
    { id: 'visualizacion', label: 'Visualización', icon: Eye },
    { id: 'vista', label: 'Modo Vista', icon: Monitor },
    { id: 'etiquetas', label: 'Etiquetas', icon: Tag },
    { id: 'mapa', label: 'Cámara Mapa', icon: Video },
    { id: 'ia', label: 'IA (Grok 4)', icon: Bot },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'permisos', label: 'Permisos', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col" style={{ top: '56px' }}>
      {/* Header fijo */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3">
          {/* Botón menú móvil */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 -ml-2"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Settings className="w-6 h-6 text-blue-400 hidden sm:block" />
          <h2 className="text-lg sm:text-xl font-bold text-white">Configuración del Mapa</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-2 -mr-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay para móvil cuando sidebar está abierto */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ top: '56px' }}
        />
      )}

      {/* Contenedor principal: Sidebar + Contenido */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar lateral derecho - Responsive */}
        <div className={`
          fixed lg:static inset-y-0 right-0 z-50
          w-64 lg:w-64
          border-l border-slate-700 bg-slate-800/95 lg:bg-slate-800/30 backdrop-blur-sm lg:backdrop-blur-none
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `} style={{ top: '56px', maxHeight: 'calc(100vh - 56px)' }}>
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Menú</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Cerrar sidebar en móvil al seleccionar un tab
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 w-full lg:w-auto">
          <div className="p-4 sm:p-6">
          {/* TAB: Clustering */}
          {activeTab === 'clustering' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-blue-400 mb-6 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Clustering de Entidades
            </h3>

            {/* Umbral de zoom */}
                <div className="space-y-6">
              <div>
                    <label className="flex items-center justify-between mb-3">
                      <span className="text-base text-slate-200 font-medium">Cambiar a iconos en zoom:</span>
                      <span className="text-lg font-mono text-blue-400 bg-slate-900 px-3 py-1 rounded">{clusterZoomThreshold}</span>
                </label>
                <input 
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={clusterZoomThreshold}
                  onChange={(e) => setClusterZoomThreshold(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                  <span>5 (Más temprano)</span>
                  <span>12 (Más tarde)</span>
                </div>
                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                  ℹ️ Valor menor = iconos aparecen con menos zoom. Recomendado: 6-7 para ver iconos antes.
                </p>
              </div>

              {/* Radio de cluster */}
                  <div className="pt-6 border-t border-slate-700">
                    <label className="flex items-center justify-between mb-3">
                      <span className="text-base text-slate-200 font-medium">Radio de agrupación:</span>
                      <span className="text-lg font-mono text-blue-400 bg-slate-900 px-3 py-1 rounded">{clusterRadius}px</span>
                </label>
                <input 
                  type="range"
                  min="30"
                  max="100"
                      step="2"
                  value={clusterRadius}
                  onChange={(e) => setClusterRadius(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                  <span>30px (Menos agrupación)</span>
                  <span>100px (Más agrupación)</span>
                </div>
                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                  ℹ️ Controla qué tan cerca deben estar las entidades para agruparse.
                </p>
              </div>
            </div>
          </div>
            </div>
          )}

          {/* TAB: Visualización */}
          {activeTab === 'visualizacion' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-green-400 mb-6 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Visualización de Entidades
            </h3>

                <div className="space-y-6">
            {/* Toggle Iconos/Imágenes */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <label className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-base text-slate-200 font-medium block mb-1">Usar imágenes de plantillas</span>
                        <span className="text-xs text-slate-400">
                          {useImages 
                            ? '✅ Mostrando imágenes de plantillas cuando estén disponibles'
                            : 'Mostrando solo iconos (más rápido)'}
                        </span>
                      </div>
                <button
                  onClick={() => setUseImages(!useImages)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                    useImages ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            useImages ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Toggle Mostrar Círculo */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <label className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-base text-slate-200 font-medium block mb-1">Mostrar círculo de entidades</span>
                        <span className="text-xs text-slate-400">
                          {showEntityCircle 
                            ? '✅ Mostrando círculo de borde en las entidades'
                            : 'Solo icono sin círculo (vista minimalista)'}
                        </span>
                      </div>
                <button
                  onClick={() => setShowEntityCircle(!showEntityCircle)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                    showEntityCircle ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            showEntityCircle ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>

                  {/* Tamaño de iconos */}
                  <div className="pt-6 border-t border-slate-700">
                    <label className="flex items-center justify-between mb-3">
                      <span className="text-base text-slate-200 font-medium">Tamaño de iconos:</span>
                      <span className="text-lg font-mono text-green-400 bg-slate-900 px-3 py-1 rounded">{iconSize}px</span>
              </label>
              <input 
                type="range"
                min="24"
                max="72"
                step="8"
                value={iconSize}
                onChange={(e) => setIconSize(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                <span>24px (Pequeño)</span>
                <span>48px (Normal)</span>
                <span>72px (Grande)</span>
              </div>
                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                ℹ️ Tamaño de los iconos de barcos/aviones en el mapa.
              </p>
            </div>
          </div>
              </div>
            </div>
          )}

          {/* TAB: Modo de Vista */}
          {activeTab === 'vista' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Modo de Vista de Entidad
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  La aplicación utiliza la Card Futurista como modo de visualización por defecto.
                </p>

                <div className="bg-gradient-to-br from-cyan-950/30 to-slate-800/30 rounded-lg p-6 border border-cyan-900/30">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎴</div>
                    <div className="text-base font-semibold text-white mb-2">Card Futurista</div>
                    <div className="text-sm text-slate-400 mb-3">
                      Flotante, centrada, estilo juego
                    </div>
                    <div className="text-sm font-bold text-cyan-400">✓ ACTIVO</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Etiquetas */}
          {activeTab === 'etiquetas' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Etiquetas de Información
            </h3>
                <p className="text-sm text-slate-400 mb-6">
              Controla qué información se muestra debajo de cada entidad en el mapa.
            </p>

                <div className="space-y-4">
              {/* Toggle: Nombre del barco */}
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div>
                      <div className="text-base font-medium text-white mb-1">Nombre de la entidad</div>
                      <div className="text-sm text-slate-400">USS Newport News, MV Ocean Trader, etc.</div>
                </div>
                <button
                  onClick={() => setShowLabelName(!showLabelName)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                    showLabelName ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          showLabelName ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle: Tipo de barco */}
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div>
                      <div className="text-base font-medium text-white mb-1">Tipo de entidad</div>
                      <div className="text-sm text-slate-400">Destructor, Submarino, Aeronave, etc.</div>
                </div>
                <button
                  onClick={() => setShowLabelType(!showLabelType)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                    showLabelType ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          showLabelType ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle: Modelo/Clase del barco */}
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div>
                      <div className="text-base font-medium text-white mb-1">Modelo/Clase</div>
                      <div className="text-sm text-slate-400">Arleigh Burke Flight IIA, Los Angeles Class, etc.</div>
                </div>
                <button
                  onClick={() => setShowLabelClass(!showLabelClass)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                    showLabelClass ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          showLabelClass ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Vista previa */}
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-purple-900/30">
                  <div className="text-sm text-slate-400 mb-3 font-medium">Vista previa:</div>
                  <div className="flex flex-col items-center gap-1">
                {showLabelName && (
                      <div className="px-3 py-1 bg-slate-800 text-white text-sm font-semibold rounded border border-red-500">
                    USS Newport News
                  </div>
                )}
                {showLabelType && (
                      <div className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                    Submarino
                  </div>
                )}
                {showLabelClass && (
                      <div className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-[11px]">
                    Los Angeles Class
                  </div>
                )}
                {!showLabelName && !showLabelType && !showLabelClass && (
                      <div className="text-sm text-slate-500 italic">Sin etiquetas</div>
                )}
              </div>
            </div>
          </div>
            </div>
          )}

          {/* TAB: Configuración de Cámara del Mapa */}
          {activeTab === 'mapa' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-purple-400 mb-6 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Configuración de Cámara del Mapa
            </h3>

                <div className="space-y-6">
                  {/* Pitch (Inclinación) */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-base text-slate-200 font-medium">Inclinación del Mapa (Pitch)</span>
                        <span className="block text-xs text-slate-400 mt-1">
                          {mapPitch === 0 ? '📐 Vista plana (2D)' :
                           mapPitch < 30 ? '📐 Ligeramente inclinado' :
                           mapPitch < 50 ? '🏔️ Inclinación media (3D)' :
                           '🏔️ Muy inclinado (3D profundo)'}
                        </span>
              </div>
                      <span className="text-lg font-mono text-purple-400 bg-slate-900 px-3 py-1 rounded">{mapPitch}°</span>
                    </label>
                    <input 
                      type="range"
                      min="0"
                      max="85"
                      step="5"
                      value={mapPitch}
                      onChange={(e) => setMapPitch(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                      <span>0° (Plano)</span>
                      <span>45° (Medio)</span>
                      <span>85° (Máximo)</span>
              </div>
                    
                    {/* Presets de Pitch */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setMapPitch(0)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapPitch === 0 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        📐 Plano (0°)
                      </button>
                      <button
                        onClick={() => setMapPitch(30)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapPitch === 30 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        🏞️ Ligero (30°)
                      </button>
                      <button
                        onClick={() => setMapPitch(60)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapPitch === 60 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        🏔️ 3D Completo (60°)
                      </button>
              </div>

                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                      ℹ️ <strong>Pitch (Inclinación):</strong> Define el ángulo de la cámara. 
                      <br/>• 0° = Vista plana tradicional (mapa 2D)
                      <br/>• 60-85° = Vista 3D con edificios y terreno en perspectiva
                      <br/>💡 Usa pitch alto para visualizar operaciones militares en terreno montañoso
                    </p>
            </div>

                  {/* Bearing (Rotación) */}
                  <div className="pt-6 border-t border-slate-700">
                    <label className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-base text-slate-200 font-medium">Rotación del Mapa (Bearing)</span>
                        <span className="block text-xs text-slate-400 mt-1">
                          {mapBearing === 0 ? '🧭 Norte arriba (estándar)' :
                           mapBearing === 90 ? '🧭 Este arriba' :
                           mapBearing === 180 ? '🧭 Sur arriba (invertido)' :
                           mapBearing === 270 ? '🧭 Oeste arriba' :
                           `🧭 ${mapBearing}° desde el norte`}
                        </span>
          </div>
                      <span className="text-lg font-mono text-purple-400 bg-slate-900 px-3 py-1 rounded">{mapBearing}°</span>
                    </label>
                    <input 
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={mapBearing}
                      onChange={(e) => setMapBearing(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                      <span>0° (Norte)</span>
                      <span>90° (Este)</span>
                      <span>180° (Sur)</span>
                      <span>270° (Oeste)</span>
                      <span>360°</span>
        </div>

                    {/* Presets de Bearing */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setMapBearing(0)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapBearing === 0 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        🧭 Norte (0°)
                      </button>
                      <button
                        onClick={() => setMapBearing(90)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapBearing === 90 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        ➡️ Este (90°)
                      </button>
                      <button
                        onClick={() => setMapBearing(180)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapBearing === 180 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        ⬇️ Sur (180°)
                      </button>
                      <button
                        onClick={() => setMapBearing(270)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          mapBearing === 270 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        ⬅️ Oeste (270°)
                      </button>
                    </div>

                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                      ℹ️ <strong>Bearing (Rotación):</strong> Define la orientación del mapa.
                      <br/>• 0° = Norte en la parte superior (estándar)
                      <br/>• 90° = Este en la parte superior
                      <br/>• 180° = Sur en la parte superior (mapa invertido)
                      <br/>💡 Útil para alinear el mapa con la dirección de una operación militar
                    </p>
                  </div>

                  {/* Info adicional */}
                  <div className="pt-6 border-t border-slate-700 bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      Cambios en Tiempo Real
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Los cambios se aplican instantáneamente al cerrar este panel</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>También puedes rotar/inclinar con los controles del mapa</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">ℹ️</span>
                        <span>Valores guardados en localStorage para persistencia</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <span>Recarga la página para aplicar completamente los cambios iniciales</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Capas de Clima */}
          {activeTab === 'clima' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-sky-400 mb-6 flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Capas Meteorológicas en Tiempo Real
                </h3>

                <div className="space-y-4">
                  {/* Nubes */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Cloud className="w-5 h-5 text-blue-300" />
                        <div>
                          <span className="text-base text-slate-200 font-medium block">☁️ Cobertura de Nubes</span>
                          <span className="text-xs text-slate-400">OWM preferido / RainViewer fallback</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWeatherLayer('clouds')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          weatherLayers.clouds ? 'bg-sky-600' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            weatherLayers.clouds ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {/* Precipitación */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CloudRain className="w-5 h-5 text-blue-400" />
                        <div>
                          <span className="text-base text-slate-200 font-medium block">🌧️ Precipitación</span>
                          <span className="text-xs text-slate-400">OWM preferido / RainViewer fallback</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWeatherLayer('precipitation')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          weatherLayers.precipitation ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            weatherLayers.precipitation ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {/* Temperatura */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-5 h-5 text-orange-400" />
                        <div>
                          <span className="text-base text-slate-200 font-medium block">🌡️ Temperatura</span>
                          <span className="text-xs text-slate-400">Solo OpenWeatherMap (requiere API key)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWeatherLayer('temperature')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          weatherLayers.temperature ? 'bg-orange-600' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            weatherLayers.temperature ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {/* Viento */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wind className="w-5 h-5 text-cyan-400" />
                        <div>
                          <span className="text-base text-slate-200 font-medium block">💨 Viento</span>
                          <span className="text-xs text-slate-400">Solo OpenWeatherMap (requiere API key)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWeatherLayer('wind')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          weatherLayers.wind ? 'bg-cyan-600' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            weatherLayers.wind ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {/* Presión */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gauge className="w-5 h-5 text-green-400" />
                        <div>
                          <span className="text-base text-slate-200 font-medium block">📊 Presión Atmosférica</span>
                          <span className="text-xs text-slate-400">Solo OpenWeatherMap (requiere API key)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWeatherLayer('pressure')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          weatherLayers.pressure ? 'bg-green-600' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            weatherLayers.pressure ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {/* Información - Sistema Híbrido */}
                  <div className="pt-6 border-t border-slate-700 bg-gradient-to-r from-blue-900/20 to-green-900/20 p-4 rounded-lg border border-blue-700/30">
                    <h4 className="text-sm font-semibold text-sky-300 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Sistema Híbrido de Capas Meteorológicas
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">🔵</span>
                        <span><strong>CON API key:</strong> OpenWeatherMap (5 capas completas)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">🟢</span>
                        <span><strong>SIN API key:</strong> RainViewer (2 capas básicas gratis)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <span><strong>API Key:</strong> VITE_OPENWEATHER_API_KEY en .env</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">🔗</span>
                        <span>Obtén API key gratis: <strong>openweathermap.org/api</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">ℹ️</span>
                        <span><strong>Activación:</strong> La API key puede tardar hasta 2 horas</span>
                      </li>
                    </ul>
                  </div>

                  {/* Presets rápidos */}
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-3 font-medium">PRESETS RÁPIDOS:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setWeatherLayers({
                          clouds: true,
                          precipitation: true,
                          temperature: false,
                          wind: false,
                          pressure: false
                        })}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        🌧️ Lluvia y Nubes
                      </button>
                      <button
                        onClick={() => setWeatherLayers({
                          clouds: false,
                          precipitation: false,
                          temperature: true,
                          wind: true,
                          pressure: false
                        })}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        🌡️ Temp + Viento
                      </button>
                      <button
                        onClick={() => setWeatherLayers({
                          clouds: true,
                          precipitation: true,
                          temperature: true,
                          wind: true,
                          pressure: true
                        })}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        ✅ Todas (5)
                      </button>
                      <button
                        onClick={() => setWeatherLayers({
                          clouds: false,
                          precipitation: false,
                          temperature: false,
                          wind: false,
                          pressure: false
                        })}
                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        ❌ Ninguna
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Configuración de IA (Grok 4) */}
          {activeTab === 'ia' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Configuración de SAE-IA (Grok 4)
                </h3>

                <div className="space-y-6">
                  {/* Modelo de IA */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="block mb-3">
                      <span className="text-base text-slate-200 font-medium block mb-2">Modelo de IA</span>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="grok-4">Grok 4 (Recomendado - Más reciente)</option>
                        <option value="grok-2-1212">Grok 2 (Diciembre 2024)</option>
                        <option value="grok-2-latest">Grok 2 Latest (Siempre última versión)</option>
                        <option value="grok-beta">Grok Beta (Experimental)</option>
                      </select>
                    </label>
                    <p className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded">
                      🚀 <strong>Grok 4:</strong> Lanzado en julio 2025. Mayor precisión en razonamiento y análisis militar.
                    </p>
                  </div>

                  {/* Personalidad de la IA */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <label className="block mb-3">
                      <span className="text-base text-slate-200 font-medium block mb-2">Personalidad de la IA</span>
                      <select
                        value={aiPersonality}
                        onChange={(e) => setAiPersonality(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="profesional">🎖️ Profesional Militar</option>
                        <option value="tecnico">🔧 Técnico/Analítico</option>
                        <option value="casual">💬 Conversacional</option>
                        <option value="conciso">⚡ Conciso y Directo</option>
                      </select>
                    </label>
                    <p className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded">
                      ℹ️ Define el tono y estilo de las respuestas de SAE-IA.
                    </p>
                  </div>

                  {/* Perspectiva Geopolítica */}
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-amber-700/50">
                    <label className="block mb-3">
                      <span className="text-base text-slate-200 font-medium block mb-2 flex items-center gap-2">
                        🌎 Perspectiva Geopolítica
                        <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">IMPORTANTE</span>
                      </span>
                      <select
                        value={aiPerspective}
                        onChange={(e) => setAiPerspective(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-amber-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="neutral">⚖️ Neutral / Observador Internacional</option>
                        <option value="venezuela">🇻🇪 Venezuela (Defensa Nacional)</option>
                        <option value="eeuu">🇺🇸 Estados Unidos</option>
                        <option value="regional">🌎 América Latina</option>
                        <option value="rusia">🇷🇺 Rusia</option>
                        <option value="china">🇨🇳 China</option>
                        <option value="iran">🇮🇷 Irán</option>
                      </select>
                    </label>
                    <div className="bg-amber-900/20 p-3 rounded border border-amber-800/30">
                      <p className="text-sm text-amber-200 font-semibold mb-2">
                        ⚠️ Esto cambia COMPLETAMENTE el análisis:
                      </p>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li><strong>Neutral:</strong> Análisis objetivo sin afiliación</li>
                        <li><strong>Venezuela:</strong> Análisis desde defensa nacional venezolana</li>
                        <li><strong>EEUU:</strong> Perspectiva de comando militar estadounidense</li>
                        <li><strong>Regional:</strong> Enfoque latinoamericano</li>
                      </ul>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="pt-6 border-t border-slate-700">
                    <label className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-base text-slate-200 font-medium">Creatividad (Temperature)</span>
                        <span className="block text-xs text-slate-400 mt-1">
                          {aiTemperature < 0.4 ? '🔒 Muy preciso y factual' :
                           aiTemperature < 0.7 ? '⚖️ Balanceado' :
                           '🎨 Más creativo'}
                        </span>
                      </div>
                      <span className="text-lg font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded">{aiTemperature.toFixed(2)}</span>
                    </label>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiTemperature}
                      onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                      <span>0.0 (Preciso)</span>
                      <span>0.5 (Equilibrado)</span>
                      <span>1.0 (Creativo)</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                      ℹ️ <strong>Recomendado: 0.7</strong> - Balance entre precisión y fluidez en respuestas.
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div className="pt-6 border-t border-slate-700">
                    <label className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-base text-slate-200 font-medium">Longitud de respuesta</span>
                        <span className="block text-xs text-slate-400 mt-1">
                          {aiMaxTokens <= 150 ? '⚡ Ultra-corto (tweet)' :
                           aiMaxTokens <= 300 ? '💬 Muy breve (párrafo)' :
                           aiMaxTokens < 500 ? '📝 Breve (2-3 párrafos)' :
                           aiMaxTokens < 1500 ? '📄 Media (análisis completo)' :
                           '📚 Detallada (informe extenso)'}
                        </span>
                      </div>
                      <span className="text-lg font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded">{aiMaxTokens}</span>
                    </label>
                    <input 
                      type="range"
                      min="100"
                      max="4000"
                      step="50"
                      value={aiMaxTokens}
                      onChange={(e) => setAiMaxTokens(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-sm text-slate-500 mt-2">
                      <span>100</span>
                      <span>500</span>
                      <span>1000</span>
                      <span>2000</span>
                      <span>4000</span>
                    </div>
                    
                    {/* Presets de respuesta rápida */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setAiMaxTokens(100)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          aiMaxTokens === 100 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        ⚡ Ultra-corto (100)
                      </button>
                      <button
                        onClick={() => setAiMaxTokens(200)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          aiMaxTokens === 200 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        💬 Muy breve (200)
                      </button>
                      <button
                        onClick={() => setAiMaxTokens(500)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          aiMaxTokens === 500 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        📝 Breve (500)
                      </button>
                      <button
                        onClick={() => setAiMaxTokens(1000)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          aiMaxTokens === 1000 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        📄 Normal (1000)
                      </button>
                      <button
                        onClick={() => setAiMaxTokens(2000)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          aiMaxTokens === 2000 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        📚 Detallado (2000)
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-400 mt-3 bg-slate-900/50 p-3 rounded">
                      <strong>Recomendaciones:</strong>
                      <br/>• 100-200 tokens: Respuestas tipo "telegrama" (hechos clave solamente)
                      <br/>• 500-1000 tokens: Balance ideal para análisis rápido pero completo
                      <br/>• 2000+ tokens: Informes extensos con múltiples secciones
                    </p>
                  </div>

                  {/* Información del sistema */}
                  <div className="pt-6 border-t border-slate-700 bg-cyan-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                      <Sliders className="w-4 h-4" />
                      Capacidades de SAE-IA
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Consulta en tiempo real a la base de datos Supabase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Acceso a todas las entidades desplegadas (ubicación, tripulación, estado)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Análisis del Timeline de eventos militares</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Cálculo automático de efectivos totales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">⚠</span>
                        <span>No inventa datos - solo usa información verificada del sistema</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Gestión de Usuarios */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <UserManagement />
              </div>
            </div>
          )}

          {/* TAB: Editor de Permisos */}
          {activeTab === 'permisos' && (
            <div className="space-y-6">
              <RolePermissionsEditor />
            </div>
          )}
          
          {/* Footer con resumen y botones */}
          <div className="mt-8 border-t border-slate-700 bg-slate-800/50">
            {/* Resumen de configuración actual */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-700">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">{clusterZoomThreshold}</div>
                  <div className="text-xs text-slate-400">Zoom cluster</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">{clusterRadius}px</div>
                  <div className="text-xs text-slate-400">Radio agrupación</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-lg sm:text-xl font-bold text-green-400">{iconSize}px</div>
                  <div className="text-xs text-slate-400">Tamaño icono</div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
              <button
                onClick={resetToDefaults}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Restablecer Valores
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
              >
                Aplicar y Cerrar
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

