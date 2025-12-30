import { useState, useEffect, useCallback } from 'react';
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

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
  }, []);

  useEffect(() => {
    loadStats();

    // 🔄 Suscripción centralizada para incursion_sessions
    const unsubscribe = realtimeManager.subscribe('incursion_sessions', () => {
      loadStats();
    });

    // REDUCIDO: Actualizar cada 10 minutos en lugar de 5
    const interval = setInterval(loadStats, 10 * 60 * 1000);

    return () => {
      clearInterval(interval);
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
