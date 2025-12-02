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
export function useFlightRadar({ 
  autoUpdate = true,
  updateInterval = 30000,
  enabled = true,
  militaryOnly = false,  // Si true, solo carga militares (modo original)
} = {}) {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isActive, setIsActive] = useState(enabled);
  
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

  /**
   * Obtener vuelos (todos o solo militares)
   */
  const fetchFlights = useCallback(async () => {
    if (!isActive) return;

    try {
      setLoading(true);
      setError(null);

      let flightsData;
      
      if (militaryOnly) {
        // Modo original: solo militares
        flightsData = await getMilitaryFlights();
      } else {
        // Modo completo: todos los vuelos con categoría
        flightsData = await getAllFlights();
      }

      if (!isMountedRef.current) return;

      setAllFlights(flightsData);
      setLastUpdate(new Date());
      
      console.log(`✅ FlightRadar24: ${flightsData.length} vuelos cargados`);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('❌ Error fetching flights:', err);
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

    // Estadísticas
    totalFlights: flights.length,
    totalLoaded: allFlights.length,
  };
}

export default useFlightRadar;
