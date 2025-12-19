import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 📊 Hook para estadísticas de incursiones aéreas
 * Proporciona datos analíticos para el panel de inteligencia predictiva
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
        // Resumen predictivo
        supabase.from('incursion_prediction_summary').select('*').single(),
        // Patrones por hora
        supabase.from('incursion_patterns_hourly').select('*').order('hour_of_day'),
        // Patrones por día
        supabase.from('incursion_patterns_weekly').select('*').order('day_of_week'),
        // Patrones por cuadrante
        supabase.from('incursion_patterns_quadrant').select('*').order('total_incursions', { ascending: false }),
        // Patrones por aeronave
        supabase.from('incursion_patterns_aircraft').select('*').order('total_incursions', { ascending: false }).limit(10),
        // Datos para heatmap
        supabase.from('incursion_heatmap').select('*').order('incursion_count', { ascending: false }).limit(20),
        // Incursiones recientes
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

    // Actualizar cada 5 minutos
    const interval = setInterval(loadStats, 5 * 60 * 1000);

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('incursion_stats_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'incursion_sessions' },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
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
    NE: '#3b82f6', // blue
    NW: '#ef4444', // red
    SE: '#22c55e', // green
    SW: '#f59e0b', // amber
  };
  return colors[quadrant] || '#64748b';
};
