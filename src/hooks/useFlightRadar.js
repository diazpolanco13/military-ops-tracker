import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  getAllFlights, 
  getMilitaryFlights,
  filterFlightsByCategory,
  getFlightCategory
} from '../services/flightRadarService';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 🛩️ HOOK USEFLIGHTRADAR - VERSIÓN COMPLETA
 * 
 * Hook para tracking de vuelos en tiempo real con filtros tipo FlightRadar24
 * - Carga TODOS los vuelos o solo militares
 * - Filtrado por categorías (passenger, cargo, military, etc.)
 * - Actualización automática
 * - Pause/Resume
 */
// ====== MONITOR DE ESPACIO AÉREO ======
// Ejecuta el monitor de alertas cada 3 minutos (solo una vez activo)
let monitorInterval = null;

async function runAirspaceMonitor() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/military-airspace-monitor`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.alerts_sent > 0) {
        console.log(`🚨 ALERTA: ${data.alerts_sent} vuelos militares detectados en Venezuela:`, data.alerted);
      }
    }
  } catch (error) {
    // Silencioso - no interrumpir la app si falla
  }
}

export function startAirspaceMonitor(intervalMs = 300000) { // 5 minutos para ahorrar créditos
  if (monitorInterval) return; // Ya está corriendo
  console.log('🛡️ Monitor de espacio aéreo iniciado (cada 5 min)');
  runAirspaceMonitor(); // Ejecutar inmediatamente
  monitorInterval = setInterval(runAirspaceMonitor, intervalMs);
}

export function stopAirspaceMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('🛡️ Monitor de espacio aéreo detenido');
  }
}

// ====== HOOK PRINCIPAL ======
// ✅ V2: Lee de cache centralizado en Supabase
// El cache se actualiza por Edge Function (1 sola petición para todos los usuarios)
export function useFlightRadar({ 
  autoUpdate = true,
  updateInterval = 30000,  // 30 segundos - polling del cache
  enabled = true,
  militaryOnly = false,
  bounds = null,
  useCache = true, // Nuevo: usar cache centralizado
  enableAirspaceMonitor = false, // ⚠️ IMPORTANTE: NO correr por defecto (escala por usuario)
} = {}) {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isActive, setIsActive] = useState(enabled);
  const [cacheAge, setCacheAge] = useState(null); // Edad del cache en segundos

  // Cache local para evitar queries repetidas al catálogo en cada refresh
  const aircraftCatalogCacheRef = useRef(new Map()); // type -> catalog row
  const aircraftImageCacheRef = useRef(new Map());   // type -> url
  const catalogPrefetchedRef = useRef(false);
  const catalogPrefetchingRef = useRef(false);

  const normalizeTypeForCatalog = useCallback((type) => {
    // Solo normalización “segura”: uppercase + trim.
    // NO recortar sufijos (ej: DH8B) porque en muchos ICAO el sufijo es parte del tipo real del catálogo.
    return String(type || '').trim().toUpperCase();
  }, []);

  const getTypeCandidates = useCallback((typeRaw) => {
    const t = normalizeTypeForCatalog(typeRaw);
    if (!t) return [];

    // Fallback opcional: si termina en una letra y tiene dígitos, probar sin sufijo.
    // Útil para casos como C17A->C17, C130J->C130, etc. pero manteniendo DH8B intacto como prioridad.
    const candidates = [t];
    if (t.length >= 4 && /[A-Z]$/.test(t) && /\d/.test(t)) {
      candidates.push(t.slice(0, -1));
    }

    // Variante "safe" para catálogo: eliminar separadores y caracteres raros.
    // Evita errores 400 de PostgREST cuando `.in()` recibe valores difíciles de parsear.
    const compact = t.replace(/[^A-Z0-9]/g, '');
    if (compact && compact !== t) candidates.push(compact);

    // unique
    return Array.from(new Set(candidates)).filter(Boolean);
  }, [normalizeTypeForCatalog]);

  const chunkArray = useCallback((arr, size = 50) => {
    const out = [];
    for (let i = 0; i < (arr || []).length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }, []);

  const prefetchCatalogOnce = useCallback(async () => {
    // El catálogo es pequeño (~decenas/centenas). Precargarlo una vez evita:
    // - errores 400 de PostgREST con `.in()` (listas grandes / valores raros)
    // - múltiples peticiones por cada refresh (multiusuario)
    if (catalogPrefetchedRef.current || catalogPrefetchingRef.current) return;
    catalogPrefetchingRef.current = true;

    try {
      const { data: rows } = await supabase
        .from('aircraft_model_catalog')
        .select('aircraft_type, aircraft_model, category, manufacturer, primary_image_url, thumbnail_url')
        .limit(1000);

      (rows || []).forEach((row) => {
        const t = row?.aircraft_type ? String(row.aircraft_type).toUpperCase() : null;
        if (!t) return;
        aircraftCatalogCacheRef.current.set(t, row);
        const img = row?.thumbnail_url || row?.primary_image_url;
        if (img) aircraftImageCacheRef.current.set(t, img);
      });

      catalogPrefetchedRef.current = true;
    } catch {
      // Silencioso: si falla, seguimos con el método por batches.
    } finally {
      catalogPrefetchingRef.current = false;
    }
  }, []);

  const enrichFlightsWithCatalog = useCallback(async (flightsData) => {
    try {
      // 0) Precargar catálogo completo (1 sola vez) para evitar 400 y reducir peticiones
      await prefetchCatalogOnce();

      const types = Array.from(
        new Set(
          (flightsData || [])
            .flatMap((f) => getTypeCandidates(f?.aircraft?.type))
            .filter(Boolean)
        )
      );

      // Solo consultar por tipos que aún no estén en cache
      // Además, limitar cantidad por ciclo para no saturar el endpoint (multiusuario).
      const missingTypes = types
        .filter((t) => !aircraftCatalogCacheRef.current.has(t) && !aircraftImageCacheRef.current.has(t))
        .slice(0, 200);

      // ✅ Importante (multiusuario): NO hacer queries `.in()` contra el catálogo por cada refresh.
      // El catálogo ya se precarga completo (y es pequeño). Los tipos que no existan en el catálogo
      // simplemente se quedan sin enrich. Esto elimina los 400 de PostgREST y baja carga.
      // `missingTypes` se mantiene solo como métrica/diagnóstico.
      void missingTypes;

      // Mezclar data enriquecida
      return (flightsData || []).map((f) => {
        const typeRaw = f?.aircraft?.type || '';
        const candidates = getTypeCandidates(typeRaw);
        const primaryType = candidates[0] || normalizeTypeForCatalog(typeRaw);
        const fallbackType = candidates[1] || null;

        const catalog =
          (primaryType ? aircraftCatalogCacheRef.current.get(primaryType) : null) ||
          (fallbackType ? aircraftCatalogCacheRef.current.get(fallbackType) : null) ||
          null;

        const thumb =
          (primaryType ? aircraftImageCacheRef.current.get(primaryType) : null) ||
          (fallbackType ? aircraftImageCacheRef.current.get(fallbackType) : null) ||
          null;

        const modelName =
          f?.aircraft?.modelName ||
          catalog?.aircraft_model ||
          null;

        const modelCategory =
          f?.aircraft?.modelCategory ||
          catalog?.category ||
          null;

        return {
          ...f,
          aircraft: {
            ...(f.aircraft || {}),
            type: typeRaw,
            type_norm: primaryType || typeRaw,
            modelName,
            modelCategory,
            thumbnailUrl: thumb || null,
            modelCatalog: catalog || null,
          },
        };
      });
    } catch (e) {
      // Si falla el enriquecimiento, devolver sin romper
      return flightsData || [];
    }
  }, [normalizeTypeForCatalog]);
  
  // Guardar bounds en ref para usarlos en fetchFlights
  const boundsRef = useRef(bounds);
  
  // Filtros de categoría activos
  const [categoryFilters, setCategoryFilters] = useState({
    passenger: false,
    cargo: false,
    military: true, // Por defecto, solo militar
    business: false,
    general: false,
    helicopter: false,
    lighter: false,
    gliders: false,
    drones: false,
    ground: false,
    other: false,
    uncategorized: false,
  });
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Ref para saber si es la primera carga
  const isFirstLoadRef = useRef(true);
  
  // Actualizar boundsRef cuando cambian los bounds
  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  /**
   * Obtener vuelos del CACHE centralizado (Supabase)
   * ✅ OPTIMIZADO: No llama a FlightRadar24 directamente
   * El cache se actualiza por Edge Function cada 30s
   */
  const fetchFromCache = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('flights_cache')
        .select('flights, military_count, last_updated_at, total_fetched')
        .eq('id', 'military_flights')
        .single();

      if (fetchError) throw fetchError;

      if (data?.flights) {
        // Calcular edad del cache
        const cacheTime = new Date(data.last_updated_at);
        const ageSeconds = Math.round((Date.now() - cacheTime.getTime()) / 1000);
        setCacheAge(ageSeconds);

        return {
          flights: data.flights,
          militaryCount: data.military_count,
          totalFetched: data.total_fetched,
          lastUpdated: cacheTime,
          ageSeconds,
        };
      }
      return null;
    } catch (err) {
      console.warn('⚠️ Error leyendo cache:', err.message);
      return null;
    }
  }, []);

  /**
   * Obtener vuelos militares/gobierno
   * ✅ V2: Primero intenta cache, fallback a API directa
   */
  const fetchFlights = useCallback(async () => {
    if (!isActive) return;

    try {
      // Solo mostrar loading en la primera carga
      if (isFirstLoadRef.current) {
        setLoading(true);
      }
      setError(null);

      let flightsData = [];
      let fromCache = false;

      // 1. Intentar leer del cache centralizado
      if (useCache) {
        const cacheResult = await fetchFromCache();
        
        if (cacheResult && cacheResult.flights.length > 0) {
          // Cache válido (menos de 2 minutos)
          if (cacheResult.ageSeconds < 120) {
            flightsData = cacheResult.flights;
            fromCache = true;
            console.log(`✅ Cache: ${cacheResult.militaryCount} vuelos militares (de ${cacheResult.totalFetched} total, edad: ${cacheResult.ageSeconds}s)`);
          } else {
            console.warn(`⚠️ Cache viejo (${cacheResult.ageSeconds}s), usando API directa`);
          }
        }
      }

      // 2. Fallback: API directa si no hay cache válido
      if (!fromCache) {
        const currentBounds = boundsRef.current;
        
        if (militaryOnly) {
          flightsData = await getMilitaryFlights(currentBounds);
        } else {
          flightsData = await getAllFlights(currentBounds);
        }
        console.log(`✅ API directa: ${flightsData.length} vuelos cargados`);
      }

      if (!isMountedRef.current) return;

      // ⚠️ Solo actualizar si hay datos válidos
      if (Array.isArray(flightsData) && flightsData.length > 0) {
        const enriched = await enrichFlightsWithCatalog(flightsData);
        if (!isMountedRef.current) return;
        setAllFlights(enriched);
        setLastUpdate(new Date());
        isFirstLoadRef.current = false;
      } else if (flightsData && flightsData.length === 0) {
        console.warn('⚠️ Sin vuelos, manteniendo datos anteriores');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('❌ Error fetching flights:', err);
      setError(err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isActive, militaryOnly, useCache, fetchFromCache, enrichFlightsWithCatalog]);

  /**
   * Vuelos filtrados según categorías activas
   */
  const flights = useMemo(() => {
    const filtered = filterFlightsByCategory(allFlights, categoryFilters);
    console.log(`🎛️ Filtros: ${Object.entries(categoryFilters).filter(([,v]) => v).map(([k]) => k).join(', ') || 'ninguno'}`);
    console.log(`✈️ Vuelos: ${allFlights.length} total → ${filtered.length} filtrados`);
    return filtered;
  }, [allFlights, categoryFilters]);

  /**
   * Actualizar filtros de categoría
   */
  const setFilters = useCallback((newFilters) => {
    setCategoryFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  /**
   * Toggle de una categoría específica
   */
  const toggleCategory = useCallback((category) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  /**
   * Activar solo militar (reset a modo original)
   */
  const setMilitaryOnlyMode = useCallback(() => {
    setCategoryFilters({
      passenger: false,
      cargo: false,
      military: true,
      business: false,
      general: false,
      helicopter: false,
      lighter: false,
      gliders: false,
      drones: false,
      ground: false,
      other: false,
      uncategorized: false,
    });
  }, []);

  /**
   * Activar todas las categorías
   */
  const enableAllCategories = useCallback(() => {
    setCategoryFilters({
      passenger: true,
      cargo: true,
      military: true,
      business: true,
      general: true,
      helicopter: true,
      lighter: true,
      gliders: true,
      drones: true,
      ground: true,
      other: true,
      uncategorized: true,
    });
  }, []);

  /**
   * Desactivar todas las categorías
   */
  const disableAllCategories = useCallback(() => {
    setCategoryFilters({
      passenger: false,
      cargo: false,
      military: false,
      business: false,
      general: false,
      helicopter: false,
      lighter: false,
      gliders: false,
      drones: false,
      ground: false,
      other: false,
      uncategorized: false,
    });
  }, []);

  /**
   * Iniciar tracking
   */
  const startTracking = useCallback(() => {
    setIsActive(true);
    fetchFlights();
  }, [fetchFlights]);

  /**
   * Pausar tracking
   */
  const pauseTracking = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Refetch manual
   */
  const refetch = useCallback(() => {
    fetchFlights();
  }, [fetchFlights]);

  /**
   * Limpiar vuelos
   */
  const clearFlights = useCallback(() => {
    setAllFlights([]);
    setError(null);
    setLastUpdate(null);
  }, []);

  /**
   * Efecto: Fetch inicial y setup de intervalo
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !isActive) {
      // Si está deshabilitado, limpiar vuelos
      setAllFlights([]);
      setLastUpdate(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 🛡️ Monitor de alertas de espacio aéreo
    // ⚠️ En modo multiusuario esto NO debe correr por defecto en cada cliente:
    // debe ejecutarse idealmente por cron/servidor. Se habilita solo si el usuario lo activa explícitamente.
    if (enableAirspaceMonitor) {
      startAirspaceMonitor();
    }

    fetchFlights();

    if (autoUpdate) {
      // Si estamos leyendo desde cache, preferir realtime + un "poll" de seguridad más lento
      const effectiveInterval = useCache ? Math.max(updateInterval, 120000) : updateInterval;
      intervalRef.current = setInterval(fetchFlights, effectiveInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isActive, autoUpdate, updateInterval, fetchFlights]);

  /**
   * ✅ Realtime para cache (reduce polling por usuario)
   * Cuando `flights_cache` se actualiza (cron), refrescamos desde cache.
   */
  useEffect(() => {
    if (!enabled || !isActive) return;
    if (!useCache) return;

    // Trigger: cualquier UPDATE/INSERT a flights_cache -> refetch desde cache.
    const unsubscribe = realtimeManager.subscribe('flights_cache', (payload) => {
      const id = payload?.new?.id || payload?.old?.id;
      if (id !== 'military_flights') return;
      fetchFlights();
    });

    return () => {
      unsubscribe?.();
    };
  }, [enabled, isActive, useCache, fetchFlights]);

  /**
   * Conteo por categoría (de todos los vuelos cargados)
   */
  const flightCountByCategory = useMemo(() => {
    const counts = {
      passenger: 0,
      cargo: 0,
      military: 0,
      business: 0,
      general: 0,
      helicopter: 0,
      lighter: 0,
      gliders: 0,
      drones: 0,
      ground: 0,
      other: 0,
      uncategorized: 0,
      total: allFlights.length,
    };

    allFlights.forEach(flight => {
      const category = flight.flightCategory || getFlightCategory(flight);
      if (counts[category] !== undefined) {
        counts[category]++;
      }
    });

    return counts;
  }, [allFlights]);

  /**
   * Buscar por callsign
   */
  const searchByCallsign = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return flights;
    }

    const term = searchTerm.toUpperCase().trim();
    return flights.filter(flight => 
      (flight.callsign || '').toUpperCase().includes(term) ||
      (flight.registration || '').toUpperCase().includes(term)
    );
  }, [flights]);

  /**
   * 🗺️ Actualizar bounds del viewport y refrescar vuelos
   */
  const updateBounds = useCallback((newBounds) => {
    if (newBounds && newBounds.north && newBounds.south && newBounds.west && newBounds.east) {
      boundsRef.current = newBounds;
      // Refrescar vuelos con los nuevos bounds
      fetchFlights();
    }
  }, [fetchFlights]);

  /**
   * Disparar actualización del cache (llama a Edge Function)
   * Solo usar si el cache está muy viejo (>2 min)
   */
  const triggerCacheUpdate = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flights-cache-updater`,
        { method: 'POST' }
      );
      if (response.ok) {
        const result = await response.json();
        console.log('🔄 Cache actualizado:', result);
        // Refrescar después de actualizar
        setTimeout(fetchFlights, 500);
      }
    } catch (err) {
      console.error('Error actualizando cache:', err);
    }
  }, [fetchFlights]);

  return {
    // Estado
    flights,           // Vuelos filtrados
    allFlights,        // Todos los vuelos cargados
    loading,
    error,
    lastUpdate,
    isActive,
    categoryFilters,   // Filtros activos
    cacheAge,          // Edad del cache en segundos

    // Acciones
    startTracking,
    pauseTracking,
    refetch,
    clearFlights,
    triggerCacheUpdate, // 🔄 Disparar actualización del cache

    // Filtros
    setFilters,
    toggleCategory,
    setMilitaryOnlyMode,
    enableAllCategories,
    disableAllCategories,

    // Utilidades
    searchByCallsign,
    flightCountByCategory,
    updateBounds,  // 🗺️ Para actualizar cuando cambia el viewport

    // Estadísticas
    totalFlights: flights.length,
    totalLoaded: allFlights.length,
  };
}

export default useFlightRadar;
