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

# ====== MONITOR DE ESPACIO AÉREO (cada 3 minutos) ======
echo "🛡️ Setting up airspace monitor cron job..."

# Crear script de monitoreo aéreo
cat > /usr/local/bin/airspace-monitor.sh << 'MONITOR_SCRIPT'
#!/bin/sh
curl -s -X POST "https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/military-airspace-monitor" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHVqZHFic3pidm96c3V1bmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjY1NDYsImV4cCI6MjA3NjIwMjU0Nn0.Rd0GMUcx1J_UCzwfzW0csZPjjppzp0o64g5nggKq9GM" \
  -H "Content-Type: application/json" > /dev/null 2>&1
MONITOR_SCRIPT
chmod +x /usr/local/bin/airspace-monitor.sh

# ====== MONITOR MARÍTIMO (cada 5 minutos) ======
echo "🚢 Setting up maritime monitor cron job..."

# Crear script de recolección AIS
cat > /usr/local/bin/ais-collector.sh << 'COLLECTOR_SCRIPT'
#!/bin/sh
curl -s -X POST "https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/aisstream-collector" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHVqZHFic3pidm96c3V1bmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjY1NDYsImV4cCI6MjA3NjIwMjU0Nn0.Rd0GMUcx1J_UCzwfzW0csZPjjppzp0o64g5nggKq9GM" \
  -H "Content-Type: application/json" > /dev/null 2>&1
COLLECTOR_SCRIPT
chmod +x /usr/local/bin/ais-collector.sh

# Crear script de monitoreo marítimo
cat > /usr/local/bin/maritime-monitor.sh << 'MARITIME_SCRIPT'
#!/bin/sh
curl -s -X POST "https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/maritime-vessel-monitor" \
  -H "Content-Type: application/json" > /dev/null 2>&1
MARITIME_SCRIPT
chmod +x /usr/local/bin/maritime-monitor.sh

# ====== CIERRE DE SESIONES DE INCURSIÓN (cada 5 minutos) ======
echo "🔒 Setting up incursion session closer cron job..."

cat > /usr/local/bin/incursion-closer.sh << 'CLOSER_SCRIPT'
#!/bin/sh
curl -s -X POST "https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/incursion-session-closer" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHVqZHFic3pidm96c3V1bmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjY1NDYsImV4cCI6MjA3NjIwMjU0Nn0.Rd0GMUcx1J_UCzwfzW0csZPjjppzp0o64g5nggKq9GM" \
  -H "Content-Type: application/json" > /dev/null 2>&1
CLOSER_SCRIPT
chmod +x /usr/local/bin/incursion-closer.sh

# Configurar cron jobs
cat > /etc/crontabs/root << 'CRONTAB'
# Monitor de espacio aéreo - cada 3 minutos
*/3 * * * * /usr/local/bin/airspace-monitor.sh

# Cierre de sesiones de incursión - cada 5 minutos
*/5 * * * * /usr/local/bin/incursion-closer.sh

# Recolector AIS - cada 2 minutos
*/2 * * * * /usr/local/bin/ais-collector.sh

# Monitor marítimo (alertas) - cada 5 minutos
*/5 * * * * /usr/local/bin/maritime-monitor.sh
CRONTAB

# Iniciar crond en segundo plano
crond -b -l 8
echo "✅ Airspace monitor started (every 3 minutes)"
echo "✅ Incursion session closer started (every 5 minutes)"
echo "✅ AIS collector started (every 2 minutes)"
echo "✅ Maritime monitor started (every 5 minutes)"

echo "🌐 Starting Nginx..."
# Iniciar Nginx
exec nginx -g 'daemon off;'

