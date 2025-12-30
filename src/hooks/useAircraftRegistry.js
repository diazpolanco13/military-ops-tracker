/**
 * 🎖️ useAircraftRegistry - Hook para gestionar el registro de aeronaves militares
 * 
 * Proporciona:
 * - Lista de aeronaves registradas con filtros
 * - Detalle de aeronave individual
 * - Historial de ubicaciones
 * - Estadísticas por base/país
 * - Aeronaves nuevas del día
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, withTimeout } from '../lib/supabase';

const QUERY_TIMEOUT = 15000; // 15 segundos para listas grandes

/**
 * Hook principal para el registro de aeronaves
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y funciones del registry
 */
export function useAircraftRegistry(options = {}) {
  const {
    enabled = true,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minuto
    filters = {},
  } = options;

  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const mergeLastPresence = useCallback((aircraftRows, lastPresenceRows) => {
    const byIcao = {};
    (lastPresenceRows || []).forEach((p) => {
      if (p?.icao24) byIcao[String(p.icao24).toUpperCase()] = p;
    });

    return (aircraftRows || []).map((a) => {
      const p = byIcao[String(a.icao24).toUpperCase()];
      if (!p) return a;
      return {
        ...a,
        last_presence: p,
        last_country_code: p.country_code,
        last_country_name: p.country_name,
        last_country_flag: p.country_flag,
        last_seen_in_country: p.last_seen_in_country,
        last_position_lat: p.last_position_lat,
        last_position_lon: p.last_position_lon,
      };
    });
  }, []);

  /**
   * Cargar lista de aeronaves con filtros
   * NOTA: No usamos JOINs por falta de FKs - las tablas relacionadas
   * se consultan por separado si se necesitan detalles
   */
  const fetchAircraft = useCallback(async (customFilters = {}) => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('military_aircraft_registry')
        .select('*')
        .order('last_seen', { ascending: false });

      // Aplicar filtros
      const activeFilters = { ...filters, ...customFilters };

      if (activeFilters.country) {
        query = query.eq('probable_country', activeFilters.country);
      }
      if (activeFilters.base) {
        query = query.eq('probable_base_icao', activeFilters.base);
      }
      if (activeFilters.type) {
        query = query.eq('aircraft_type', activeFilters.type);
      }
      if (activeFilters.branch) {
        query = query.eq('military_branch', activeFilters.branch);
      }
      if (activeFilters.isActive !== undefined) {
        query = query.eq('is_active', activeFilters.isActive);
      }
      if (activeFilters.hasIncursions) {
        query = query.gt('total_incursions', 0);
      }
      if (activeFilters.newToday) {
        query = query.eq('is_new_today', true);
      }
      if (activeFilters.search) {
        const searchTerm = `%${activeFilters.search}%`;
        query = query.or(`icao24.ilike.${searchTerm},aircraft_model.ilike.${searchTerm},callsigns_used.cs.{${activeFilters.search}}`);
      }
      if (activeFilters.limit) {
        query = query.limit(activeFilters.limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Cargar última presencia por aeronave (batch) y mezclar
      const icaoList = (data || []).map((r) => r.icao24).filter(Boolean);
      let merged = data || [];
      if (icaoList.length > 0) {
        const { data: presenceRows } = await supabase
          .from('aircraft_last_presence')
          .select('*')
          .in('icao24', icaoList);
        merged = mergeLastPresence(merged, presenceRows);
      }

      setAircraft(merged);
    } catch (err) {
      console.error('Error fetching aircraft registry:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled, filters]);

  /**
   * Cargar estadísticas generales
   */
  const fetchStats = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('military_aircraft_registry')
        .select('icao24, aircraft_type, probable_country, military_branch, total_incursions, is_new_today, first_seen_date');

      if (queryError) throw queryError;

      // Calcular estadísticas
      const totalAircraft = data.length;
      const newToday = data.filter(a => a.is_new_today).length;
      const withIncursions = data.filter(a => a.total_incursions > 0).length;
      
      // Por país
      const byCountry = data.reduce((acc, a) => {
        const country = a.probable_country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      // Por rama
      const byBranch = data.reduce((acc, a) => {
        const branch = a.military_branch || 'Unknown';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
      }, {});

      // Por tipo
      const byType = data.reduce((acc, a) => {
        const type = a.aircraft_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalAircraft,
        newToday,
        withIncursions,
        byCountry,
        byBranch,
        byType,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  /**
   * Obtener aeronave por ICAO24 con información enriquecida del catálogo
   */
  const getByIcao24 = useCallback(async (icao24) => {
    try {
      const { data, error: queryError } = await supabase
        .from('military_aircraft_registry')
        .select('*')
        .eq('icao24', icao24.toUpperCase())
        .single();

      if (queryError && queryError.code !== 'PGRST116') throw queryError;
      
      // Si encontramos la aeronave, buscar modelo y base por separado
      if (data) {
        // Obtener modelo de aeronave del catálogo (con especificaciones completas)
        if (data.aircraft_type) {
          // Evitar `.single()` aquí: si el tipo no existe en catálogo, PostgREST responde 406.
          const { data: modelRows } = await supabase
            .from('aircraft_model_catalog')
            .select('*')
            .eq('aircraft_type', data.aircraft_type)
            .limit(1);
          const modelData = modelRows?.[0] || null;
          if (modelData) {
            data.model = modelData;
            // Si el registro no tiene el nombre completo, usar el del catálogo
            if (!data.aircraft_model || data.aircraft_model === data.aircraft_type) {
              data.aircraft_model = modelData.aircraft_model;
            }
          }
        }
        
        // Obtener base probable
        if (data.probable_base_icao) {
          // Evitar `.single()` por el mismo motivo: si no está en el catálogo de bases, 406.
          const { data: baseRows } = await supabase
            .from('caribbean_military_bases')
            .select('*')
            .eq('icao_code', data.probable_base_icao)
            .limit(1);
          const baseData = baseRows?.[0] || null;
          if (baseData) data.base = baseData;
        }
        
        // Obtener presencia por países
        const { data: presenceData } = await supabase
          .from('aircraft_country_presence')
          .select('country_code, country_name, country_flag, total_sightings, first_seen_in_country, last_seen_in_country')
          .eq('icao24', icao24.toUpperCase())
          .order('total_sightings', { ascending: false });
        
        if (presenceData && presenceData.length > 0) {
          data.countries = presenceData;
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching aircraft:', err);
      return null;
    }
  }, []);

  /**
   * Obtener historial de ubicaciones
   */
  const getLocationHistory = useCallback(async (icao24, limit = 50) => {
    try {
      const { data, error: queryError } = await supabase
        .from('aircraft_location_history')
        .select('*')
        .eq('icao24', icao24.toUpperCase())
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      console.error('Error fetching location history:', err);
      return [];
    }
  }, []);

  /**
   * Obtener aeronaves nuevas del día
   */
  const getNewAircraftToday = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .rpc('get_new_aircraft_today');

      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      console.error('Error fetching new aircraft:', err);
      return [];
    }
  }, []);

  /**
   * Actualizar notas de una aeronave
   */
  const updateNotes = useCallback(async (icao24, notes) => {
    try {
      const { error: updateError } = await supabase
        .from('military_aircraft_registry')
        .update({ notes })
        .eq('icao24', icao24.toUpperCase());

      if (updateError) throw updateError;
      
      // Refrescar lista
      await fetchAircraft();
      return { success: true };
    } catch (err) {
      console.error('Error updating notes:', err);
      return { success: false, error: err.message };
    }
  }, [fetchAircraft]);

  /**
   * Recalcular base probable
   */
  const recalculateBase = useCallback(async (icao24) => {
    try {
      const { error: rpcError } = await supabase
        .rpc('recalculate_probable_base', { p_icao24: icao24.toUpperCase() });

      if (rpcError) throw rpcError;
      
      // Refrescar lista
      await fetchAircraft();
      return { success: true };
    } catch (err) {
      console.error('Error recalculating base:', err);
      return { success: false, error: err.message };
    }
  }, [fetchAircraft]);

  // Cargar datos iniciales - solo cuando enabled cambia (con timeout)
  useEffect(() => {
    if (!enabled) return;
    
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch aircraft con timeout
        const aircraftResult = await withTimeout(
          supabase
            .from('military_aircraft_registry')
            .select('*')
            .order('last_seen', { ascending: false }),
          QUERY_TIMEOUT
        );
        
        if (cancelled) return;
        if (aircraftResult.error) throw aircraftResult.error;
        
        const aircraftData = aircraftResult.data || [];

        // Obtener tipos únicos de aeronaves para buscar imágenes
        const uniqueTypes = [...new Set(aircraftData.map(a => a.aircraft_type).filter(Boolean))];
        
        // Cargar catálogo completo de modelos (con timeout)
        let modelCatalog = {};
        if (uniqueTypes.length > 0) {
          try {
            const catalogResult = await withTimeout(
              supabase
                .from('aircraft_model_catalog')
                .select('*')
                .in('aircraft_type', uniqueTypes),
              QUERY_TIMEOUT
            );
            
            if (!cancelled && catalogResult.data) {
              catalogResult.data.forEach(m => {
                modelCatalog[m.aircraft_type] = m;
              });
            }
          } catch (catalogErr) {
            console.warn('[useAircraftRegistry] Catalog timeout:', catalogErr.message);
            // Continuar sin catálogo
          }
        }

        if (cancelled) return;

        // Asociar datos del catálogo a cada aeronave
        const aircraftWithCatalog = aircraftData.map(a => {
          const catalogInfo = modelCatalog[a.aircraft_type] || null;
          return {
            ...a,
            aircraft_model: (a.aircraft_model === a.aircraft_type && catalogInfo) 
              ? catalogInfo.aircraft_model 
              : a.aircraft_model,
            model: catalogInfo
          };
        });

        // Mezclar última presencia por aeronave (con timeout)
        const icaoList = aircraftWithCatalog.map((r) => r.icao24).filter(Boolean);
        let aircraftWithPresence = aircraftWithCatalog;
        if (icaoList.length > 0) {
          try {
            const presenceResult = await withTimeout(
              supabase
                .from('aircraft_last_presence')
                .select('*')
                .in('icao24', icaoList),
              QUERY_TIMEOUT
            );
            
            if (!cancelled && presenceResult.data) {
              aircraftWithPresence = mergeLastPresence(aircraftWithCatalog, presenceResult.data);
            }
          } catch (presenceErr) {
            console.warn('[useAircraftRegistry] Presence timeout:', presenceErr.message);
            // Continuar sin presencia
          }
        }

        if (cancelled) return;
        setAircraft(aircraftWithPresence);

        // Fetch stats (sin bloquear si falla)
        try {
          const statsResult = await withTimeout(
            supabase
              .from('military_aircraft_registry')
              .select('icao24, aircraft_type, probable_country, military_branch, total_incursions, is_new_today, first_seen_date'),
            QUERY_TIMEOUT
          );
          
          if (!cancelled && statsResult.data) {
            const statsData = statsResult.data;
            const totalAircraft = statsData.length;
            const newToday = statsData.filter(a => a.is_new_today).length;
            const withIncursions = statsData.filter(a => a.total_incursions > 0).length;
            const byCountry = statsData.reduce((acc, a) => {
              const country = a.probable_country || 'Unknown';
              acc[country] = (acc[country] || 0) + 1;
              return acc;
            }, {});
            setStats({ totalAircraft, newToday, withIncursions, byCountry });
          }
        } catch (statsErr) {
          console.warn('[useAircraftRegistry] Stats timeout:', statsErr.message);
        }
      } catch (err) {
        console.error('[useAircraftRegistry] Error loading data:', err);
        if (!cancelled) {
          setError(err.message?.includes('Timeout') 
            ? 'Tiempo de espera agotado. La conexión es lenta.' 
            : err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, [enabled, mergeLastPresence]);

  // Auto-refresh (deshabilitado por defecto)
  useEffect(() => {
    if (!enabled || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchAircraft();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, autoRefresh, refreshInterval]); // Removido fetchAircraft de deps

  // Datos computados
  const topIncursionAircraft = useMemo(() => {
    return [...aircraft]
      .filter(a => a.total_incursions > 0)
      .sort((a, b) => b.total_incursions - a.total_incursions)
      .slice(0, 10);
  }, [aircraft]);

  const recentlySeenAircraft = useMemo(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return aircraft.filter(a => new Date(a.last_seen) > oneHourAgo);
  }, [aircraft]);

  return {
    // Estado
    aircraft,
    loading,
    error,
    stats,

    // Datos computados
    topIncursionAircraft,
    recentlySeenAircraft,
    totalCount: aircraft.length,

    // Funciones
    refetch: fetchAircraft,
    refreshStats: fetchStats,
    getByIcao24,
    getLocationHistory,
    getNewAircraftToday,
    updateNotes,
    recalculateBase,
  };
}

/**
 * Hook para obtener bases militares del Caribe
 */
export function useMilitaryBases(options = {}) {
  const { enabled = true, countryCode = null } = options;

  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchBases = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('caribbean_military_bases')
          .select('*')
          .eq('is_active', true)
          .order('country_code', { ascending: true });

        if (countryCode) {
          query = query.eq('country_code', countryCode);
        }

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        setBases(data || []);
      } catch (err) {
        console.error('Error fetching bases:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBases();
  }, [enabled, countryCode]);

  // Agrupar por país
  const basesByCountry = useMemo(() => {
    return bases.reduce((acc, base) => {
      const country = base.country_name || 'Unknown';
      if (!acc[country]) acc[country] = [];
      acc[country].push(base);
      return acc;
    }, {});
  }, [bases]);

  // Solo bases con presencia militar
  const militaryBases = useMemo(() => {
    return bases.filter(b => b.military_presence);
  }, [bases]);

  return {
    bases,
    basesByCountry,
    militaryBases,
    loading,
    error,
  };
}

/**
 * Hook para catálogo de modelos de aeronaves
 */
export function useAircraftModels(options = {}) {
  const { enabled = true, category = null } = options;

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchModels = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('aircraft_model_catalog')
          .select('*')
          .order('aircraft_type', { ascending: true });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        setModels(data || []);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [enabled, category]);

  // Agrupar por categoría
  const modelsByCategory = useMemo(() => {
    return models.reduce((acc, model) => {
      const cat = model.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(model);
      return acc;
    }, {});
  }, [models]);

  // Obtener modelo por código
  const getModelByType = useCallback((aircraftType) => {
    return models.find(m => m.aircraft_type === aircraftType?.toUpperCase());
  }, [models]);

  return {
    models,
    modelsByCategory,
    loading,
    error,
    getModelByType,
  };
}

/**
 * Hook para presencia de aeronaves por país del Caribe
 */
export function useCountryPresence(options = {}) {
  const { enabled = true } = options;

  const [countries, setCountries] = useState([]);
  const [deploymentSummary, setDeploymentSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar resumen de despliegue
  const fetchDeploymentSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('caribbean_deployment_summary')
        .select('*')
        .order('total_aircraft', { ascending: false });
      
      if (queryError) throw queryError;
      setDeploymentSummary(data || []);
    } catch (err) {
      console.error('Error fetching deployment summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar lista de países
  const fetchCountries = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('caribbean_countries')
        .select('*')
        .order('country_name');
      
      if (queryError) throw queryError;
      setCountries(data || []);
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  }, []);

  // Obtener aeronaves en un país específico
  const getAircraftInCountry = useCallback(async (countryCode) => {
    try {
      const { data, error: queryError } = await supabase
        .from('aircraft_country_presence')
        .select(`
          *,
          aircraft:military_aircraft_registry(
            icao24, aircraft_type, aircraft_model, military_branch,
            callsigns_used, total_incursions, last_seen
          )
        `)
        .eq('country_code', countryCode.toUpperCase())
        .order('last_seen_in_country', { ascending: false });
      
      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      console.error('Error fetching aircraft in country:', err);
      return [];
    }
  }, []);

  // Registrar presencia de aeronave en país
  const registerPresence = useCallback(async (icao24, countryCode, countryName, countryFlag, lat, lon, airportIcao) => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('upsert_aircraft_country_presence', {
          p_icao24: icao24,
          p_country_code: countryCode,
          p_country_name: countryName,
          p_country_flag: countryFlag,
          p_latitude: lat,
          p_longitude: lon,
          p_airport_icao: airportIcao
        });
      
      if (rpcError) throw rpcError;
      
      // Refrescar resumen
      await fetchDeploymentSummary();
      
      return { success: true, id: data };
    } catch (err) {
      console.error('Error registering presence:', err);
      return { success: false, error: err.message };
    }
  }, [fetchDeploymentSummary]);

  // Cargar al montar
  useEffect(() => {
    if (enabled) {
      fetchCountries();
      fetchDeploymentSummary();
    }
  }, [enabled, fetchCountries, fetchDeploymentSummary]);

  return {
    countries,
    deploymentSummary,
    loading,
    error,
    refetch: fetchDeploymentSummary,
    getAircraftInCountry,
    registerPresence,
  };
}

export default useAircraftRegistry;

