-- ============================================================================
-- VISTA MATERIALIZADA: incursion_stats_bundle
-- ============================================================================
-- Propósito: Consolidar 7 queries separadas en 1 sola vista materializada
-- Impacto: Reduce de 7 queries a 1 query (mejora 85% en useIncursionStats)
--
-- INSTRUCCIONES DE INSTALACIÓN:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar y ejecutar este script completo
-- 3. Verificar que se creó la vista: SELECT * FROM incursion_stats_bundle;
-- 4. Configurar refresh automático (ver sección CRON al final)
-- ============================================================================

-- 1. Eliminar vista existente si existe (para updates)
DROP MATERIALIZED VIEW IF EXISTS incursion_stats_bundle;

-- 2. Crear vista materializada con todos los datos de estadísticas
CREATE MATERIALIZED VIEW incursion_stats_bundle AS
SELECT
  -- ID único para facilitar queries (.single())
  1 as id,

  -- Timestamp de última actualización
  NOW() as last_updated,

  -- 1. Summary (incursion_prediction_summary)
  (
    SELECT row_to_json(t)
    FROM incursion_prediction_summary t
    LIMIT 1
  ) as summary,

  -- 2. Hourly Patterns (incursion_patterns_hourly)
  (
    SELECT json_agg(row_to_json(t) ORDER BY t.hour_of_day)
    FROM incursion_patterns_hourly t
  ) as hourly_patterns,

  -- 3. Weekly Patterns (incursion_patterns_weekly)
  (
    SELECT json_agg(row_to_json(t) ORDER BY t.day_of_week)
    FROM incursion_patterns_weekly t
  ) as weekly_patterns,

  -- 4. Quadrant Patterns (incursion_patterns_quadrant)
  (
    SELECT json_agg(row_to_json(t) ORDER BY t.total_incursions DESC)
    FROM incursion_patterns_quadrant t
  ) as quadrant_patterns,

  -- 5. Aircraft Patterns - Top 10 (incursion_patterns_aircraft)
  (
    SELECT json_agg(row_to_json(t) ORDER BY t.total_incursions DESC)
    FROM (
      SELECT * FROM incursion_patterns_aircraft
      ORDER BY total_incursions DESC
      LIMIT 10
    ) t
  ) as aircraft_patterns,

  -- 6. Heatmap - Top 20 (incursion_heatmap)
  (
    SELECT json_agg(row_to_json(t) ORDER BY t.incursion_count DESC)
    FROM (
      SELECT * FROM incursion_heatmap
      ORDER BY incursion_count DESC
      LIMIT 20
    ) t
  ) as heatmap_data,

  -- 7. Recent Incursions - Last 10 (incursion_sessions)
  (
    SELECT json_agg(row_to_json(t) ORDER BY t.started_at DESC)
    FROM (
      SELECT * FROM incursion_sessions
      ORDER BY started_at DESC
      LIMIT 10
    ) t
  ) as recent_incursions;

-- 3. Crear índice para acceso rápido
CREATE UNIQUE INDEX idx_incursion_stats_bundle_id ON incursion_stats_bundle (id);

-- 4. Dar permisos de lectura a usuarios autenticados
GRANT SELECT ON incursion_stats_bundle TO authenticated;
GRANT SELECT ON incursion_stats_bundle TO anon;

-- 5. Refrescar vista por primera vez
REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;

-- ============================================================================
-- VALIDACIÓN
-- ============================================================================
-- Ejecutar para verificar que la vista funciona correctamente:
SELECT
  id,
  last_updated,
  summary->>'total_incursions' as total_incursions,
  json_array_length(hourly_patterns) as hourly_count,
  json_array_length(weekly_patterns) as weekly_count,
  json_array_length(quadrant_patterns) as quadrant_count,
  json_array_length(aircraft_patterns) as aircraft_count,
  json_array_length(heatmap_data) as heatmap_count,
  json_array_length(recent_incursions) as recent_count
FROM incursion_stats_bundle;

-- Resultado esperado:
-- id | last_updated | total_incursions | hourly_count | weekly_count | ...
--  1 | 2026-01-01   | 150              | 24           | 7            | ...

-- ============================================================================
-- REFRESH AUTOMÁTICO CON PG_CRON (OPCIONAL pero RECOMENDADO)
-- ============================================================================
-- NOTA: pg_cron requiere extensión activada en Supabase.
-- Solo ejecutar si tienes acceso a pg_cron (Supabase Pro/Team)
--
-- Para activar pg_cron:
-- 1. Dashboard → Database → Extensions
-- 2. Buscar "pg_cron" y activarlo
-- 3. Ejecutar el siguiente código:

/*
-- Refrescar vista cada 10 minutos
SELECT cron.schedule(
  'refresh-incursion-stats',
  '*/10 * * * *',  -- Cada 10 minutos (cron expression)
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;
  $$
);

-- Verificar que el cron job se creó correctamente:
SELECT * FROM cron.job WHERE jobname = 'refresh-incursion-stats';

-- Para ver historial de ejecuciones:
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-incursion-stats')
ORDER BY start_time DESC
LIMIT 10;
*/

-- ============================================================================
-- ALTERNATIVA SIN PG_CRON: TRIGGER AUTOMÁTICO
-- ============================================================================
-- Si no tienes pg_cron, puedes usar un trigger que refresque la vista
-- cuando se inserten/actualicen incursiones:

/*
-- Función para refrescar la vista
CREATE OR REPLACE FUNCTION refresh_incursion_stats_bundle()
RETURNS TRIGGER AS $$
BEGIN
  -- Refrescar en background (sin bloquear el INSERT/UPDATE)
  PERFORM pg_notify('refresh_stats', 'trigger');
  REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en incursion_sessions (tabla más crítica)
CREATE TRIGGER trigger_refresh_stats_on_incursion
AFTER INSERT OR UPDATE ON incursion_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_incursion_stats_bundle();
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- ERROR: "materialized view ... does not exist"
-- → Asegúrate de que las tablas base existen:
--   - incursion_prediction_summary
--   - incursion_patterns_hourly
--   - incursion_patterns_weekly
--   - incursion_patterns_quadrant
--   - incursion_patterns_aircraft
--   - incursion_heatmap
--   - incursion_sessions
--
-- ERROR: "permission denied"
-- → Ejecutar como superuser (postgres role en Supabase)
-- → O pedir a admin que ejecute el script
--
-- ERROR: "CONCURRENTLY cannot be used"
-- → Eliminar CONCURRENTLY del REFRESH:
--   REFRESH MATERIALIZED VIEW incursion_stats_bundle;
--
-- ============================================================================
-- MANTENIMIENTO
-- ============================================================================
--
-- Refrescar manualmente:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;
--
-- Ver tamaño de la vista:
-- SELECT pg_size_pretty(pg_total_relation_size('incursion_stats_bundle'));
--
-- Eliminar vista:
-- DROP MATERIALIZED VIEW IF EXISTS incursion_stats_bundle CASCADE;
--
-- ============================================================================
