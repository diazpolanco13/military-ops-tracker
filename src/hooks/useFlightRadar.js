import { useState, useEffect, useCallback, useRef } from 'react';
import { getMilitaryFlights } from '../services/flightRadarService';

/**
 * 🛩️ HOOK USEFLIGHTRADAR
 * 
 * Hook personalizado para tracking de vuelos militares en tiempo real
 * - Actualización automática cada X segundos
 * - Filtrado de vuelos militares
 * - Control de estado de carga y errores
 * - Pause/Resume de actualizaciones
 */
export function useFlightRadar({ 
  autoUpdate = true,          // Actualización automática
  updateInterval = 30000,     // Intervalo en ms (30 segundos por defecto)
  enabled = true,             // Habilitar/deshabilitar tracking
} = {}) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isActive, setIsActive] = useState(enabled);
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Obtener vuelos militares
   */
  const fetchFlights = useCallback(async () => {
    if (!isActive) return;

    try {
      setLoading(true);
      setError(null);

      const militaryFlights = await getMilitaryFlights();

      if (!isMountedRef.current) return;

      setFlights(militaryFlights);
      setLastUpdate(new Date());
      
      console.log(`✅ FlightRadar24: ${militaryFlights.length} vuelos militares detectados`);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('❌ Error fetching flights:', err);
      setError(err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isActive]);

  /**
   * Iniciar tracking automático
   */
  const startTracking = useCallback(() => {
    setIsActive(true);
    fetchFlights(); // Fetch inmediato
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
    setFlights([]);
    setError(null);
    setLastUpdate(null);
  }, []);

  /**
   * Efecto: Fetch inicial y setup de intervalo
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !isActive) {
      return;
    }

    // Fetch inicial
    fetchFlights();

    // Setup de actualización automática
    if (autoUpdate) {
      intervalRef.current = setInterval(() => {
        fetchFlights();
      }, updateInterval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isActive, autoUpdate, updateInterval, fetchFlights]);

  /**
   * Obtener conteo por categoría
   */
  const getFlightsByCategory = useCallback(() => {
    const categories = {
      combat: 0,
      transport: 0,
      tanker: 0,
      surveillance: 0,
      bomber: 0,
      other: 0,
    };

    flights.forEach(flight => {
      const category = flight.category || 'other';
      if (categories[category] !== undefined) {
        categories[category]++;
      }
    });

    return categories;
  }, [flights]);

  /**
   * Filtrar vuelos por callsign
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
   * Filtrar vuelos por categoría
   */
  const filterByCategory = useCallback((category) => {
    if (!category) return flights;
    return flights.filter(flight => flight.category === category);
  }, [flights]);

  return {
    // Estado
    flights,
    loading,
    error,
    lastUpdate,
    isActive,

    // Acciones
    startTracking,
    pauseTracking,
    refetch,
    clearFlights,

    // Utilidades
    getFlightsByCategory,
    searchByCallsign,
    filterByCategory,

    // Estadísticas
    totalFlights: flights.length,
  };
}

export default useFlightRadar;

