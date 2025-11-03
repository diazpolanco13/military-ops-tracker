import { X, Settings, Layers, Eye, Zap, Tag, Monitor, Bot, Sliders } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * ⚙️ Panel de Configuración
 * Ajustes dinámicos para visualización del mapa
 */
export default function SettingsPanel({ onClose }) {
  // 📑 Estado de tabs
  const [activeTab, setActiveTab] = useState('clustering');

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
    return localStorage.getItem('useImages') === 'true';
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

  // 🎴 NUEVO: Modo de vista de entidad (card vs sidebar)
  const [entityViewMode, setEntityViewMode] = useState(() => {
    return localStorage.getItem('entityViewMode') || 'card'; // Default: card futurista
  });

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

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('clusterZoomThreshold', clusterZoomThreshold);
    localStorage.setItem('clusterRadius', clusterRadius);
    localStorage.setItem('iconSize', iconSize);
    localStorage.setItem('useImages', useImages);
    localStorage.setItem('showLabelName', showLabelName);
    localStorage.setItem('showLabelType', showLabelType);
    localStorage.setItem('showLabelClass', showLabelClass);
    localStorage.setItem('entityViewMode', entityViewMode);
    localStorage.setItem('showEntityCircle', showEntityCircle);
    localStorage.setItem('aiModel', aiModel);
    localStorage.setItem('aiTemperature', aiTemperature);
    localStorage.setItem('aiMaxTokens', aiMaxTokens);
    localStorage.setItem('aiPersonality', aiPersonality);
    localStorage.setItem('aiPerspective', aiPerspective);
    
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
        entityViewMode,
        showEntityCircle,
        aiModel,
        aiTemperature,
        aiMaxTokens,
        aiPersonality,
        aiPerspective
      }
    }));
  }, [clusterZoomThreshold, clusterRadius, iconSize, useImages, showLabelName, showLabelType, showLabelClass, entityViewMode, showEntityCircle, aiModel, aiTemperature, aiMaxTokens, aiPersonality, aiPerspective]);

  const resetToDefaults = () => {
    setClusterZoomThreshold(6); // ✅ Actualizado
    setClusterRadius(58); // ✅ Actualizado
    setIconSize(48);
    setUseImages(false);
    setShowLabelName(true);
    setShowLabelType(true);
    setShowLabelClass(false);
    setEntityViewMode('card');
    setShowEntityCircle(false); // ✅ Actualizado
    setAiModel('grok-4');
    setAiTemperature(0.7);
    setAiMaxTokens(1000);
    setAiPersonality('profesional');
    setAiPerspective('neutral');
  };

  // 📑 Definición de tabs
  const tabs = [
    { id: 'clustering', label: 'Clustering', icon: Layers },
    { id: 'visualizacion', label: 'Visualización', icon: Eye },
    { id: 'vista', label: 'Modo Vista', icon: Monitor },
    { id: 'etiquetas', label: 'Etiquetas', icon: Tag },
    { id: 'ia', label: 'IA (Grok 4)', icon: Bot },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      {/* Modal más ancho y responsivo */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configuración del Mapa</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="border-b border-slate-700 bg-slate-800/30">
          <div className="flex overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido según tab activo */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
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
                      min="5"
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
                  Elige cómo mostrar los detalles cuando haces clic en una entidad del mapa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opción: Card Futurista */}
                  <button
                    onClick={() => setEntityViewMode('card')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      entityViewMode === 'card'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">🎴</div>
                      <div className="text-base font-semibold text-white mb-2">Card Futurista</div>
                      <div className="text-sm text-slate-400">
                        Flotante, centrada, estilo juego
                      </div>
                      {entityViewMode === 'card' && (
                        <div className="mt-3 text-sm font-bold text-cyan-400">✓ ACTIVO</div>
                      )}
                    </div>
                  </button>

                  {/* Opción: Sidebar Clásico */}
                  <button
                    onClick={() => setEntityViewMode('sidebar')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      entityViewMode === 'sidebar'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">📊</div>
                      <div className="text-base font-semibold text-white mb-2">Sidebar Clásico</div>
                      <div className="text-sm text-slate-400">
                        Panel lateral, más espacio
                      </div>
                      {entityViewMode === 'sidebar' && (
                        <div className="mt-3 text-sm font-bold text-cyan-400">✓ ACTIVO</div>
                      )}
                    </div>
                  </button>
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
        </div>

        {/* Footer con resumen y botones */}
        <div className="border-t border-slate-700 bg-slate-800/50">
          {/* Resumen de configuración actual */}
          <div className="px-6 py-3 border-b border-slate-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xl font-bold text-blue-400">{clusterZoomThreshold}</div>
                <div className="text-xs text-slate-400">Zoom cluster</div>
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xl font-bold text-blue-400">{clusterRadius}px</div>
                <div className="text-xs text-slate-400">Radio agrupación</div>
              </div>
              <div className="bg-slate-900/50 rounded p-2">
                <div className="text-xl font-bold text-green-400">{iconSize}px</div>
                <div className="text-xs text-slate-400">Tamaño icono</div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-4 flex justify-between">
            <button
              onClick={resetToDefaults}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Restablecer Valores
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
            >
              Aplicar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

