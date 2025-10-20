import { X, Settings, Layers, Eye, Zap } from 'lucide-react';
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

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('clusterZoomThreshold', clusterZoomThreshold);
    localStorage.setItem('clusterRadius', clusterRadius);
    localStorage.setItem('iconSize', iconSize);
    localStorage.setItem('useImages', useImages);
    
    // Disparar evento personalizado para que el mapa se actualice
    window.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { clusterZoomThreshold, clusterRadius, iconSize, useImages }
    }));
  }, [clusterZoomThreshold, clusterRadius, iconSize, useImages]);

  const resetToDefaults = () => {
    setClusterZoomThreshold(8);
    setClusterRadius(60);
    setIconSize(48);
    setUseImages(false);
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

