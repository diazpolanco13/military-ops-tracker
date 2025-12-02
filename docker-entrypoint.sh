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

echo "🌐 Starting Nginx..."
# Iniciar Nginx
exec nginx -g 'daemon off;'

