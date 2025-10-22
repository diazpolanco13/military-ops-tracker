import { X, Settings, Layers, Eye, Zap, Tag, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * ⚙️ Panel de Configuración
 * Ajustes dinámicos para visualización del mapa
 */
export default function SettingsPanel({ onClose }) {
  // Cargar configuración desde localStorage
  const [clusterZoomThreshold, setClusterZoomThreshold] = useState(() => {
    return parseInt(localStorage.getItem('clusterZoomThreshold') || '8');
  });
  
  const [clusterRadius, setClusterRadius] = useState(() => {
    return parseInt(localStorage.getItem('clusterRadius') || '60');
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
        entityViewMode
      }
    }));
  }, [clusterZoomThreshold, clusterRadius, iconSize, useImages, showLabelName, showLabelType, showLabelClass, entityViewMode]);

  const resetToDefaults = () => {
    setClusterZoomThreshold(8);
    setClusterRadius(60);
    setIconSize(48);
    setUseImages(false);
    setShowLabelName(true);
    setShowLabelType(true);
    setShowLabelClass(false);
    setEntityViewMode('card');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Configuración del Mapa</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Sección: Clustering */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              CLUSTERING DE ENTIDADES
            </h3>

            {/* Umbral de zoom */}
            <div className="space-y-3">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Cambiar a iconos en zoom:</span>
                  <span className="text-sm font-mono text-blue-400">{clusterZoomThreshold}</span>
                </label>
                <input 
                  type="range"
                  min="5"
                  max="12"
                  step="1"
                  value={clusterZoomThreshold}
                  onChange={(e) => setClusterZoomThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5 (Más temprano)</span>
                  <span>12 (Más tarde)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  ℹ️ Valor menor = iconos aparecen con menos zoom. Recomendado: 6-7 para ver iconos antes.
                </p>
              </div>

              {/* Radio de cluster */}
              <div className="pt-3 border-t border-slate-700">
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Radio de agrupación:</span>
                  <span className="text-sm font-mono text-blue-400">{clusterRadius}px</span>
                </label>
                <input 
                  type="range"
                  min="30"
                  max="100"
                  step="10"
                  value={clusterRadius}
                  onChange={(e) => setClusterRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>30px (Menos agrupación)</span>
                  <span>100px (Más agrupación)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  ℹ️ Controla qué tan cerca deben estar las entidades para agruparse.
                </p>
              </div>
            </div>
          </div>

          {/* Sección: Visualización */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              VISUALIZACIÓN DE ENTIDADES
            </h3>

            {/* Toggle Iconos/Imágenes */}
            <div className="mb-4 pb-4 border-b border-slate-700">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Usar imágenes de plantillas:</span>
                <button
                  onClick={() => setUseImages(!useImages)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    useImages ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      useImages ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-slate-400">
                {useImages 
                  ? '✅ Mostrando imágenes de plantillas cuando estén disponibles'
                  : '❌ Mostrando solo iconos (más rápido)'}
              </p>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Tamaño de iconos:</span>
                <span className="text-sm font-mono text-green-400">{iconSize}px</span>
              </label>
              <input 
                type="range"
                min="24"
                max="72"
                step="8"
                value={iconSize}
                onChange={(e) => setIconSize(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>24px (Pequeño)</span>
                <span>48px (Normal)</span>
                <span>72px (Grande)</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                ℹ️ Tamaño de los iconos de barcos/aviones en el mapa.
              </p>
            </div>
          </div>

          {/* 🎴 NUEVA SECCIÓN: Modo de Vista de Entidad */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              MODO DE VISTA DE ENTIDAD
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Elige cómo mostrar los detalles cuando haces clic en una entidad del mapa.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Opción: Card Futurista */}
              <button
                onClick={() => setEntityViewMode('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  entityViewMode === 'card'
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🎴</div>
                  <div className="text-sm font-semibold text-white mb-1">Card Futurista</div>
                  <div className="text-xs text-slate-400">
                    Flotante, centrada, estilo juego
                  </div>
                  {entityViewMode === 'card' && (
                    <div className="mt-2 text-xs font-bold text-cyan-400">✓ ACTIVO</div>
                  )}
                </div>
              </button>

              {/* Opción: Sidebar Clásico */}
              <button
                onClick={() => setEntityViewMode('sidebar')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  entityViewMode === 'sidebar'
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-sm font-semibold text-white mb-1">Sidebar Clásico</div>
                  <div className="text-xs text-slate-400">
                    Panel lateral, más espacio
                  </div>
                  {entityViewMode === 'sidebar' && (
                    <div className="mt-2 text-xs font-bold text-cyan-400">✓ ACTIVO</div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* 🏷️ NUEVA SECCIÓN: Etiquetas de Información */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              ETIQUETAS DE INFORMACIÓN
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Controla qué información se muestra debajo de cada entidad en el mapa.
            </p>

            <div className="space-y-3">
              {/* Toggle: Nombre del barco */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">Nombre de la entidad</div>
                  <div className="text-xs text-slate-400">USS Newport News, MV Ocean Trader, etc.</div>
                </div>
                <button
                  onClick={() => setShowLabelName(!showLabelName)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    showLabelName ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      showLabelName ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle: Tipo de barco */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">Tipo de entidad</div>
                  <div className="text-xs text-slate-400">Destructor, Submarino, Aeronave, etc.</div>
                </div>
                <button
                  onClick={() => setShowLabelType(!showLabelType)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    showLabelType ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      showLabelType ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle: Modelo/Clase del barco */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">Modelo/Clase</div>
                  <div className="text-xs text-slate-400">Arleigh Burke Flight IIA, Los Angeles Class, etc.</div>
                </div>
                <button
                  onClick={() => setShowLabelClass(!showLabelClass)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    showLabelClass ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      showLabelClass ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Vista previa */}
            <div className="mt-4 p-3 bg-slate-900/50 rounded border border-purple-900/30">
              <div className="text-xs text-slate-400 mb-2">Vista previa:</div>
              <div className="flex flex-col items-center gap-0.5">
                {showLabelName && (
                  <div className="px-2 py-0.5 bg-slate-800 text-white text-xs font-semibold rounded border border-red-500">
                    USS Newport News
                  </div>
                )}
                {showLabelType && (
                  <div className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">
                    Submarino
                  </div>
                )}
                {showLabelClass && (
                  <div className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-[9px]">
                    Los Angeles Class
                  </div>
                )}
                {!showLabelName && !showLabelType && !showLabelClass && (
                  <div className="text-xs text-slate-500 italic">Sin etiquetas</div>
                )}
              </div>
            </div>
          </div>

          {/* Vista previa de valores actuales */}
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-900/50">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              CONFIGURACIÓN ACTUAL
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-2xl font-bold text-white">{clusterZoomThreshold}</div>
                <div className="text-xs text-slate-400">Zoom iconos</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-2xl font-bold text-white">{clusterRadius}</div>
                <div className="text-xs text-slate-400">Radio cluster</div>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <div className="text-2xl font-bold text-white">{iconSize}</div>
                <div className="text-xs text-slate-400">Tamaño icono</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Restablecer Valores
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

