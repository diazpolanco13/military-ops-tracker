import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 📊 Hook para estadísticas de incursiones aéreas
 * Optimizado: usa RealtimeManager centralizado
 */
export function useIncursionStats() {
  const [stats, setStats] = useState({
    summary: null,
    hourlyPatterns: [],
    weeklyPatterns: [],
    quadrantPatterns: [],
    aircraftPatterns: [],
    heatmapData: [],
    recentIncursions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce para evitar ráfagas: realtime puede disparar múltiples eventos seguidos.
  const debounceRef = useRef(null);

  const tryLoadBundled = useCallback(async () => {
    // ✅ OPTIMIZACIÓN: Intentar vista materializada primero (1 query vs 7)
    // Si no existe, fallback a Edge Function o fan-out
    try {
      // 1. Intentar vista materializada (PRIORIDAD 1)
      const { data: viewData, error: viewError } = await supabase
        .from('incursion_stats_bundle')
        .select('*')
        .eq('id', 1)
        .single();

      if (!viewError && viewData) {
        // Adaptar formato de la vista al esperado por el componente
        return {
          summary: viewData.summary,
          hourlyPatterns: viewData.hourly_patterns || [],
          weeklyPatterns: viewData.weekly_patterns || [],
          quadrantPatterns: viewData.quadrant_patterns || [],
          aircraftPatterns: viewData.aircraft_patterns || [],
          heatmapData: viewData.heatmap_data || [],
          recentIncursions: viewData.recent_incursions || [],
        };
      }

      // 2. Fallback a Edge Function (PRIORIDAD 2)
      const { data, error: fnError } = await supabase.functions.invoke('incursion-stats-bundle', {
        body: {},
      });
      if (fnError) return null;
      if (!data) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 0) Intentar bundle (1 request) si está disponible
      const bundled = await tryLoadBundled();
      if (bundled) {
        setStats({
          summary: bundled.summary ?? null,
          hourlyPatterns: bundled.hourlyPatterns || [],
          weeklyPatterns: bundled.weeklyPatterns || [],
          quadrantPatterns: bundled.quadrantPatterns || [],
          aircraftPatterns: bundled.aircraftPatterns || [],
          heatmapData: bundled.heatmapData || [],
          recentIncursions: bundled.recentIncursions || [],
        });
        return;
      }

      // Cargar todas las estadísticas en paralelo
      const [
        summaryResult,
        hourlyResult,
        weeklyResult,
        quadrantResult,
        aircraftResult,
        heatmapResult,
        recentResult,
      ] = await Promise.all([
        supabase.from('incursion_prediction_summary').select('*').single(),
        supabase.from('incursion_patterns_hourly').select('*').order('hour_of_day'),
        supabase.from('incursion_patterns_weekly').select('*').order('day_of_week'),
        supabase.from('incursion_patterns_quadrant').select('*').order('total_incursions', { ascending: false }),
        supabase.from('incursion_patterns_aircraft').select('*').order('total_incursions', { ascending: false }).limit(10),
        supabase.from('incursion_heatmap').select('*').order('incursion_count', { ascending: false }).limit(20),
        supabase.from('incursion_sessions').select('*').order('started_at', { ascending: false }).limit(10),
      ]);

      setStats({
        summary: summaryResult.data,
        hourlyPatterns: hourlyResult.data || [],
        weeklyPatterns: weeklyResult.data || [],
        quadrantPatterns: quadrantResult.data || [],
        aircraftPatterns: aircraftResult.data || [],
        heatmapData: heatmapResult.data || [],
        recentIncursions: recentResult.data || [],
      });

    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tryLoadBundled]);

  useEffect(() => {
    loadStats();

    // 🔄 Suscripción centralizada para incursion_sessions
    const unsubscribe = realtimeManager.subscribe('incursion_sessions', () => {
      // Debounce para evitar ráfagas cuando llegan varios cambios seguidos
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        loadStats();
      }, 1500);
    });

    // REDUCIDO: Actualizar cada 10 minutos en lugar de 5
    const interval = setInterval(loadStats, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsubscribe();
    };
  }, [loadStats]);

  return {
    ...stats,
    loading,
    error,
    refresh: loadStats,
  };
}

/**
 * Helpers para formatear datos
 */
export const formatTimePeriod = (period) => {
  const labels = {
    madrugada: '🌙 Madrugada',
    mañana: '🌅 Mañana',
    tarde: '☀️ Tarde',
    noche: '🌆 Noche',
  };
  return labels[period] || period;
};

export const formatDayName = (day) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[day] || day;
};

export const formatQuadrant = (quadrant) => {
  const labels = {
    NE: '↗️ Noreste',
    NW: '↖️ Noroeste',
    SE: '↘️ Sureste',
    SW: '↙️ Suroeste',
  };
  return labels[quadrant] || quadrant;
};

export const getQuadrantColor = (quadrant) => {
  const colors = {
    NE: '#3b82f6',
    NW: '#ef4444',
    SE: '#22c55e',
    SW: '#f59e0b',
  };
  return colors[quadrant] || '#64748b';
};
