import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  getAllFlights, 
  getMilitaryFlights,
  filterFlightsByCategory,
  getFlightCategory
} from '../services/flightRadarService';
import { supabase } from '../lib/supabase';

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
// ✅ Ahora usa API pública GRATUITA para el frontend
// La API pagada solo se usa en military-airspace-monitor (alertas Telegram)
export function useFlightRadar({ 
  autoUpdate = true,
  updateInterval = 30000,  // 30 segundos - API gratuita, sin límite
  enabled = true,
  militaryOnly = false,
  bounds = null,
} = {}) {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isActive, setIsActive] = useState(enabled);

  // Cache local para evitar queries repetidas al catálogo en cada refresh
  const aircraftCatalogCacheRef = useRef(new Map()); // type -> catalog row
  const aircraftImageCacheRef = useRef(new Map());   // type -> url

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

    // unique
    return Array.from(new Set(candidates)).filter(Boolean);
  }, [normalizeTypeForCatalog]);

  const enrichFlightsWithCatalog = useCallback(async (flightsData) => {
    try {
      const types = Array.from(
        new Set(
          (flightsData || [])
            .flatMap((f) => getTypeCandidates(f?.aircraft?.type))
            .filter(Boolean)
        )
      );

      // Solo consultar por tipos que aún no estén en cache
      const missingTypes = types.filter((t) => !aircraftCatalogCacheRef.current.has(t) && !aircraftImageCacheRef.current.has(t));

      if (missingTypes.length > 0) {
        // 1) Catálogo de modelos (batch)
        const { data: catalogRows } = await supabase
          .from('aircraft_model_catalog')
          .select('aircraft_type, aircraft_model, category, manufacturer, primary_image_url, thumbnail_url')
          .in('aircraft_type', missingTypes);

        (catalogRows || []).forEach((row) => {
          if (row?.aircraft_type) aircraftCatalogCacheRef.current.set(String(row.aircraft_type).toUpperCase(), row);
          const img = row?.thumbnail_url || row?.primary_image_url;
          if (img && row?.aircraft_type) aircraftImageCacheRef.current.set(String(row.aircraft_type).toUpperCase(), img);
        });

        // 2) Imágenes por tipo (batch) - preferir imagen primaria si existe
        const { data: imageRows } = await supabase
          .from('aircraft_model_images')
          .select('aircraft_type, thumbnail_url, image_url, is_primary, created_at')
          .in('aircraft_type', missingTypes)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        (imageRows || []).forEach((row) => {
          const t = row?.aircraft_type ? String(row.aircraft_type).toUpperCase() : null;
          if (!t) return;
          if (aircraftImageCacheRef.current.has(t)) return;
          const img = row?.thumbnail_url || row?.image_url;
          if (img) aircraftImageCacheRef.current.set(t, img);
        });
      }

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
   * Obtener vuelos militares/gobierno
   * ⚠️ NO borra vuelos existentes si hay error (preserva última actualización)
   */
  const fetchFlights = useCallback(async () => {
    if (!isActive) return;

    try {
      // Solo mostrar loading en la primera carga
      if (isFirstLoadRef.current) {
        setLoading(true);
      }
      setError(null);

      // Usar bounds del viewport o los por defecto
      const currentBounds = boundsRef.current;
      
      let flightsData;
      
      if (militaryOnly) {
        // Modo original: solo militares con bounds
        flightsData = await getMilitaryFlights(currentBounds);
      } else {
        // Modo completo: todos los vuelos militares con categoría
        flightsData = await getAllFlights(currentBounds);
      }

      if (!isMountedRef.current) return;

      // ⚠️ Solo actualizar si hay datos válidos
      if (Array.isArray(flightsData) && flightsData.length > 0) {
        const enriched = await enrichFlightsWithCatalog(flightsData);
        if (!isMountedRef.current) return;
        setAllFlights(enriched);
        setLastUpdate(new Date());
        isFirstLoadRef.current = false;
        console.log(`✅ FlightRadar24: ${flightsData.length} vuelos cargados`);
      } else if (flightsData && flightsData.length === 0) {
        // Si la API devuelve vacío, mantener los vuelos anteriores pero notificar
        console.warn('⚠️ API devolvió 0 vuelos, manteniendo datos anteriores');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      // ⚠️ NO borrar vuelos existentes - solo loguear el error
      console.error('❌ Error fetching flights (manteniendo datos anteriores):', err);
      setError(err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isActive, militaryOnly]);

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

    // 🛡️ Iniciar monitor de alertas de espacio aéreo (cada 3 min)
    startAirspaceMonitor();

    fetchFlights();

    if (autoUpdate) {
      intervalRef.current = setInterval(() => {
        fetchFlights();
      }, updateInterval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isActive, autoUpdate, updateInterval, fetchFlights]);

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

  return {
    // Estado
    flights,           // Vuelos filtrados
    allFlights,        // Todos los vuelos cargados
    loading,
    error,
    lastUpdate,
    isActive,
    categoryFilters,   // Filtros activos

    // Acciones
    startTracking,
    pauseTracking,
    refetch,
    clearFlights,

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
