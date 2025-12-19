import { useState, useEffect, useRef } from 'react';
import { Cloud, CloudRain, Thermometer, Wind, Gauge, CloudSnow } from 'lucide-react';
import { WEATHER_LAYERS, OPENWEATHER_API_KEY } from './WeatherLayers';

/**
 * 🌦️ Panel de Capas Meteorológicas
 * Acceso rápido desde el navbar para activar/desactivar capas de clima
 */
export default function WeatherLayersPanel({ map }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  
  const [activeLayers, setActiveLayers] = useState(() => {
    const saved = localStorage.getItem('activeWeatherLayers');
    return saved ? JSON.parse(saved) : {
      precipitation: false,
      clouds: false,
      temperature: false,
      wind: false,
      pressure: false
    };
  });

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && 
          buttonRef.current &&
          !panelRef.current.contains(event.target) && 
          !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Obtener icono según tipo de capa
  const getLayerIcon = (layerType) => {
    const icons = {
      clouds: Cloud,
      precipitation: CloudRain,
      temperature: Thermometer,
      wind: Wind,
      pressure: Gauge
    };
    return icons[layerType] || Cloud;
  };

  // Obtener color según tipo de capa
  const getLayerColor = (layerType) => {
    const colors = {
      clouds: 'bg-sky-500',
      precipitation: 'bg-blue-600',
      temperature: 'bg-orange-500',
      wind: 'bg-cyan-500',
      pressure: 'bg-green-500'
    };
    return colors[layerType] || 'bg-slate-500';
  };

  // Toggle capa
  const toggleLayer = (layerType) => {
    const newState = {
      ...activeLayers,
      [layerType]: !activeLayers[layerType]
    };
    
    setActiveLayers(newState);
    localStorage.setItem('activeWeatherLayers', JSON.stringify(newState));
    
    // Disparar evento para actualizar el mapa
    window.dispatchEvent(new CustomEvent('settingsChanged', {
      detail: { weatherLayers: newState }
    }));
  };

  // Contar capas activas
  const activeCount = Object.values(activeLayers).filter(Boolean).length;

  // Verificar si una capa está disponible
  const isLayerAvailable = (layerType) => {
    const layer = WEATHER_LAYERS[layerType];
    if (!layer) return false;
    
    // Si tiene rainviewerType, siempre está disponible (gratis)
    if (layer.rainviewerType) return true;
    
    // Si solo tiene owmLayer, requiere API key
    return Boolean(OPENWEATHER_API_KEY);
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Botón principal */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all relative ${
          activeCount > 0
            ? 'bg-sky-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
        title="Capas de Clima"
      >
        <CloudSnow className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Clima</span>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel desplegable - FIXED para salir del navbar */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="fixed bg-slate-900 rounded-lg shadow-2xl border border-slate-600 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: '60px', // Justo debajo del navbar (altura 56px + margen)
            right: '1rem',
            width: '320px',
            maxHeight: 'calc(100vh - 80px)',
            zIndex: 100
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700 bg-slate-800">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <CloudSnow className="w-5 h-5 text-sky-400" />
              Capas Meteorológicas
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeCount > 0 ? `${activeCount} ${activeCount === 1 ? 'capa activa' : 'capas activas'}` : 'Ninguna capa activa'}
            </p>
          </div>

          {/* Lista de capas */}
          <div className="p-2 max-h-96 overflow-y-auto">
            {Object.entries(WEATHER_LAYERS).map(([layerType, layer]) => {
              const LayerIcon = getLayerIcon(layerType);
              const isActive = activeLayers[layerType];
              const isAvailable = isLayerAvailable(layerType);

              return (
                <div
                  key={layerType}
                  className={`p-3 rounded-lg mb-2 transition-all ${
                    isActive
                      ? 'bg-sky-900 border border-sky-600'
                      : 'bg-slate-800 border border-slate-700'
                  } ${!isAvailable ? 'opacity-50' : ''}`}
                >
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Icono */}
                      <div className={`flex-shrink-0 w-10 h-10 ${getLayerColor(layerType)} rounded-lg flex items-center justify-center ${isActive ? 'shadow-lg' : ''}`}>
                        <LayerIcon className="w-5 h-5 text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {layer.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {!OPENWEATHER_API_KEY && layer.rainviewerType
                            ? '🟢 RainViewer (gratis)'
                            : OPENWEATHER_API_KEY && layer.owmLayer
                            ? '🔵 OpenWeatherMap'
                            : !isAvailable
                            ? '⚠️ Requiere API key'
                            : layer.description
                          }
                        </div>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => isAvailable && toggleLayer(layerType)}
                      disabled={!isAvailable}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isActive && isAvailable
                          ? getLayerColor(layerType)
                          : 'bg-slate-600'
                      } ${!isAvailable ? 'cursor-not-allowed' : ''}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Footer con info */}
          <div className="p-3 border-t border-slate-700 bg-slate-800">
            {!OPENWEATHER_API_KEY ? (
              <div className="text-xs text-amber-300 bg-amber-900 p-2 rounded border border-amber-700">
                <p className="font-semibold">⚠️ Modo Básico (RainViewer)</p>
                <p className="text-slate-300 mt-1">Solo 2 capas disponibles. Configura API key para las 5 capas.</p>
              </div>
            ) : (
              <div className="text-xs text-green-300 bg-green-900 p-2 rounded border border-green-700">
                <p className="font-semibold">✅ Modo Completo (OpenWeatherMap)</p>
                <p className="text-slate-300 mt-1">Todas las capas disponibles</p>
              </div>
            )}
          </div>

          {/* Presets rápidos */}
          <div className="p-3 border-t border-slate-700 bg-slate-800">
            <p className="text-xs text-slate-400 mb-2 font-medium">PRESETS:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  const preset = { clouds: true, precipitation: true, temperature: false, wind: false, pressure: false };
                  setActiveLayers(preset);
                  localStorage.setItem('activeWeatherLayers', JSON.stringify(preset));
                  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { weatherLayers: preset } }));
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
              >
                🌧️ Básico
              </button>
              <button
                onClick={() => {
                  const preset = { clouds: true, precipitation: true, temperature: true, wind: true, pressure: true };
                  setActiveLayers(preset);
                  localStorage.setItem('activeWeatherLayers', JSON.stringify(preset));
                  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { weatherLayers: preset } }));
                }}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
              >
                ✅ Todas
              </button>
              <button
                onClick={() => {
                  const preset = { clouds: false, precipitation: false, temperature: false, wind: false, pressure: false };
                  setActiveLayers(preset);
                  localStorage.setItem('activeWeatherLayers', JSON.stringify(preset));
                  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { weatherLayers: preset } }));
                }}
                className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
              >
                ❌ Ninguna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

