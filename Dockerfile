# ==================================
# STAGE 1: Build
# ==================================
FROM node:20-alpine AS builder

WORKDIR /app

# Definir build arguments para variables VITE_*
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_XAI_API_KEY
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_X_API_KEY
ARG VITE_X_API_SECRET
ARG VITE_MAP_CENTER_LAT
ARG VITE_MAP_CENTER_LNG
ARG VITE_MAP_DEFAULT_ZOOM
ARG NODE_ENV=production

# Pasar como variables de entorno para que Vite las capture durante el build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_XAI_API_KEY=$VITE_XAI_API_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_X_API_KEY=$VITE_X_API_KEY
ENV VITE_X_API_SECRET=$VITE_X_API_SECRET
ENV VITE_MAP_CENTER_LAT=$VITE_MAP_CENTER_LAT
ENV VITE_MAP_CENTER_LNG=$VITE_MAP_CENTER_LNG
ENV VITE_MAP_DEFAULT_ZOOM=$VITE_MAP_DEFAULT_ZOOM
ENV NODE_ENV=$NODE_ENV

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies porque Vite es necesario para el build)
# NODE_ENV no debe ser 'production' durante el build para que se instalen devDependencies
RUN NODE_ENV=development npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción (las variables VITE_* se incrustan en el código aquí)
RUN npm run build

# ==================================
# STAGE 2: Production (Nginx)
# ==================================
FROM nginx:alpine

# Copiar archivos compilados desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Health check - usando 127.0.0.1 en lugar de localhost para evitar problemas IPv6
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]

