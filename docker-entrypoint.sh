#!/bin/sh
set -e

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

# Iniciar Nginx
exec nginx -g 'daemon off;'

