import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  getAllFlights, 
  getMilitaryFlights,
  filterFlightsByCategory,
  getFlightCategory
} from '../services/flightRadarService';

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
        setAllFlights(flightsData);
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
