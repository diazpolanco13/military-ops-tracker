import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 🗺️ useMapLayers - Hook para sincronización robusta React-Mapbox
 * 
 * Problema que resuelve:
 * - React y Mapbox tienen ciclos de vida independientes
 * - Los useEffect de React pueden ejecutarse antes de que Mapbox esté listo
 * - Las capas pueden no existir cuando intentamos actualizar datos
 * 
 * Solución:
 * - Espera a que el mapa esté completamente listo
 * - Crea sources y layers de forma segura
 * - Proporciona métodos que verifican existencia antes de actuar
 * - Maneja reintentos automáticos
 * - Cleanup automático al desmontar
 * 
 * @param {Object} map - Instancia del mapa Mapbox
 * @param {Object} config - Configuración de layers
 * @param {string} config.id - ID base para sources y layers
 * @param {Array} config.sources - Definiciones de sources [{id, options}]
 * @param {Array} config.layers - Definiciones de layers [{id, ...layerConfig}]
 * @param {string} config.beforeLayerId - Layer antes del cual insertar (opcional)
 */
export function useMapLayers(map, config) {
  const [isReady, setIsReady] = useState(false);
  const initializedRef = useRef(false);
  const configRef = useRef(config);
  
  // Actualizar ref cuando cambia config
  configRef.current = config;

  /**
   * Inicializar sources y layers
   */
  const initialize = useCallback(() => {
    if (!map || initializedRef.current) return false;
    
    try {
      const { sources = [], layers = [], beforeLayerId } = configRef.current;
      const before = beforeLayerId && map.getLayer(beforeLayerId) ? beforeLayerId : undefined;
      const emptyGeoJSON = { type: 'FeatureCollection', features: [] };

      // Crear sources
      for (const source of sources) {
        if (!map.getSource(source.id)) {
          map.addSource(source.id, {
            type: 'geojson',
            data: emptyGeoJSON,
            ...source.options
          });
        }
      }

      // Crear layers en orden
      for (const layer of layers) {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer, before);
        }
      }

      initializedRef.current = true;
      setIsReady(true);
      console.log(`✅ useMapLayers [${configRef.current.id}]: Inicializado correctamente`);
      return true;
    } catch (error) {
      console.error(`❌ useMapLayers [${configRef.current.id}]: Error inicializando:`, error);
      return false;
    }
  }, [map]);

  /**
   * Cleanup - remover layers y sources
   */
  const cleanup = useCallback(() => {
    if (!map) return;
    
    try {
      const { sources = [], layers = [] } = configRef.current;
      
      // Remover layers (en orden inverso)
      for (const layer of [...layers].reverse()) {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
      }
      
      // Remover sources
      for (const source of sources) {
        if (map.getSource(source.id)) {
          map.removeSource(source.id);
        }
      }
      
      initializedRef.current = false;
      setIsReady(false);
      console.log(`🧹 useMapLayers [${configRef.current.id}]: Limpiado`);
    } catch (e) {
      // Ignorar errores de cleanup
    }
  }, [map]);

  /**
   * Actualizar datos de un source de forma segura
   */
  const setSourceData = useCallback((sourceId, data) => {
    if (!map) return false;
    
    const source = map.getSource(sourceId);
    if (source) {
      source.setData(data);
      return true;
    }
    
    // Si no existe y no estamos inicializados, reintentar
    if (!initializedRef.current) {
      console.log(`⏳ useMapLayers: Source ${sourceId} no existe, reintentando...`);
      setTimeout(() => {
        if (initialize()) {
          const retrySource = map.getSource(sourceId);
          if (retrySource) retrySource.setData(data);
        }
      }, 100);
    }
    
    return false;
  }, [map, initialize]);

  /**
   * Limpiar todos los sources (poner datos vacíos)
   */
  const clearAllSources = useCallback(() => {
    if (!map) return;
    
    const emptyGeoJSON = { type: 'FeatureCollection', features: [] };
    const { sources = [] } = configRef.current;
    
    for (const source of sources) {
      const mapSource = map.getSource(source.id);
      if (mapSource) {
        mapSource.setData(emptyGeoJSON);
      }
    }
  }, [map]);

  /**
   * Cambiar visibilidad de layers
   */
  const setLayersVisibility = useCallback((visible) => {
    if (!map) return;
    
    const { layers = [] } = configRef.current;
    const visibility = visible ? 'visible' : 'none';
    
    for (const layer of layers) {
      if (map.getLayer(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', visibility);
      }
    }
  }, [map]);

  /**
   * Efecto principal - inicialización y cleanup
   */
  useEffect(() => {
    if (!map) return;

    const tryInit = () => {
      if (!initializedRef.current) {
        initialize();
      }
    };

    // Estrategia de inicialización robusta
    if (map.isStyleLoaded()) {
      tryInit();
    } else {
      map.once('load', tryInit);
    }
    
    // Fallback con idle
    map.once('idle', tryInit);

    // Reinicializar cuando cambia el estilo
    const handleStyleLoad = () => {
      initializedRef.current = false;
      setIsReady(false);
      setTimeout(tryInit, 50);
    };
    map.on('style.load', handleStyleLoad);

    // Cleanup
    return () => {
      map.off('style.load', handleStyleLoad);
      cleanup();
    };
  }, [map, initialize, cleanup]);

  return {
    isReady,
    setSourceData,
    clearAllSources,
    setLayersVisibility,
    initialize,
    cleanup,
  };
}

/**
 * 🎯 Crear configuración de layer de línea
 */
export function createLineLayerConfig(id, sourceId, options = {}) {
  return {
    id,
    type: 'line',
    source: sourceId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
      ...options.layout
    },
    paint: {
      'line-color': options.color || '#000000',
      'line-width': options.width || 2,
      'line-opacity': options.opacity || 1,
      ...(options.dasharray && { 'line-dasharray': options.dasharray }),
      ...(options.blur && { 'line-blur': options.blur }),
      ...options.paint
    }
  };
}

export default useMapLayers;

