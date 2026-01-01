-- Crear vista materializada incursion_stats_bundle
DROP MATERIALIZED VIEW IF EXISTS incursion_stats_bundle CASCADE;

CREATE MATERIALIZED VIEW incursion_stats_bundle AS
SELECT
  1 as id,
  NOW() as last_updated,
  (SELECT row_to_json(t) FROM incursion_prediction_summary t LIMIT 1) as summary,
  (SELECT json_agg(row_to_json(t) ORDER BY t.hour_of_day) FROM incursion_patterns_hourly t) as hourly_patterns,
  (SELECT json_agg(row_to_json(t) ORDER BY t.day_of_week) FROM incursion_patterns_weekly t) as weekly_patterns,
  (SELECT json_agg(row_to_json(t) ORDER BY t.total_incursions DESC) FROM incursion_patterns_quadrant t) as quadrant_patterns,
  (SELECT json_agg(row_to_json(t) ORDER BY t.total_incursions DESC) FROM (SELECT * FROM incursion_patterns_aircraft ORDER BY total_incursions DESC LIMIT 10) t) as aircraft_patterns,
  (SELECT json_agg(row_to_json(t) ORDER BY t.incursion_count DESC) FROM (SELECT * FROM incursion_heatmap ORDER BY incursion_count DESC LIMIT 20) t) as heatmap_data,
  (SELECT json_agg(row_to_json(t) ORDER BY t.started_at DESC) FROM (SELECT * FROM incursion_sessions ORDER BY started_at DESC LIMIT 10) t) as recent_incursions;

CREATE UNIQUE INDEX idx_incursion_stats_bundle_id ON incursion_stats_bundle (id);

GRANT SELECT ON incursion_stats_bundle TO authenticated;
GRANT SELECT ON incursion_stats_bundle TO anon;

REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;
