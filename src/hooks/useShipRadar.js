import { useState, useEffect, useCallback, useRef } from 'react';
import { getShips } from '../services/shipRadarService';

/**
 * 🚢 Hook para tracking de buques AIS
 * 
 * Similar a useFlightRadar pero para buques
 */
export function useShipRadar(options = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minuto (los buques se mueven más lento)
    filterType = 'all', // 'military', 'tanker', 'all'
    bounds = null,
  } = options;

  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, military: 0, tankers: 0 });
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);

  // Fetch ships
  const fetchShips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getShips({
        type: filterType,
        bounds,
      });
      
      if (result.success) {
        setShips(result.ships);
        setStats(result.stats);
        setLastUpdate(new Date());
        
        console.log(`🚢 Ships loaded: ${result.ships.length} total, ${result.stats.military} military, ${result.stats.tankers} tankers`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching ships:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, bounds]);

  // Inicializar y auto-refresh
  useEffect(() => {
    fetchShips();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchShips, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchShips, autoRefresh, refreshInterval]);

  // Filtrar buques por categoría
  const militaryShips = ships.filter(s => s.is_military);
  const tankerShips = ships.filter(s => s.is_tanker);
  const cargoShips = ships.filter(s => s.category === 'cargo');
  const passengerShips = ships.filter(s => s.category === 'passenger');

  return {
    // Datos
    ships,
    militaryShips,
    tankerShips,
    cargoShips,
    passengerShips,
    stats,
    
    // Estado
    loading,
    error,
    lastUpdate,
    
    // Acciones
    refetch: fetchShips,
  };
}

export default useShipRadar;
