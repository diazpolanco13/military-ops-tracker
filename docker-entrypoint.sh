#!/bin/sh
set -e

echo "🚀 Starting container..."
echo "📝 Generating runtime config..."

# Verificar que las variables críticas existan
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "⚠️  WARNING: VITE_SUPABASE_URL is not set!"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  WARNING: VITE_SUPABASE_ANON_KEY is not set!"
fi

# Reemplazar placeholders con variables de entorno reales
envsubst '
  ${VITE_MAPBOX_ACCESS_TOKEN}
  ${VITE_SUPABASE_URL}
  ${VITE_SUPABASE_ANON_KEY}
  ${VITE_XAI_API_KEY}
  ${VITE_X_API_KEY}
  ${VITE_X_API_SECRET}
  ${VITE_APP_NAME}
  ${VITE_APP_VERSION}
  ${VITE_MAP_CENTER_LAT}
  ${VITE_MAP_CENTER_LNG}
  ${VITE_MAP_DEFAULT_ZOOM}
' < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js

echo "✅ Runtime config generated"
cat /usr/share/nginx/html/env-config.js

# ====== CRON JOBS DESACTIVADOS ======
# Los cron jobs ahora se ejecutan SOLO desde pg_cron de Supabase
# para evitar duplicados. Ver tabla cron.job para configuración.
#
# Jobs activos en pg_cron:
# - military-airspace-monitor: cada 2 min (jobid 5)
# - incursion-session-closer: cada 5 min (jobid 6)
# - incursion-situation-report: cada 10 min (jobid 2)
# - flights-cache-updater: cada 1 min (jobid 8)
# - aircraft-registry-collector: cada 5 min (jobid 3)

echo "ℹ️  Cron jobs se ejecutan desde pg_cron de Supabase (sin duplicados)"

echo "🌐 Starting Nginx..."
# Iniciar Nginx
exec nginx -g 'daemon off;'

