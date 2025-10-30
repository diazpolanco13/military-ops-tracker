# 🔧 SOLUCIÓN: Variables de Entorno VITE_* no detectadas

## 🐛 Problema Identificado

Las variables de entorno `VITE_*` están configuradas en Dokploy pero **no están disponibles** en la aplicación porque:

**Vite requiere que las variables `VITE_*` estén disponibles en TIEMPO DE BUILD**, no solo en tiempo de ejecución.

Las variables configuradas en "Environment Settings" de Dokploy son variables de **runtime** (cuando el contenedor corre), pero Vite las necesita durante `npm run build`.

## ✅ Solución Aplicada

### 1. Dockerfile Modificado

El Dockerfile ahora acepta **build arguments** y los pasa como variables de entorno durante el build:

```dockerfile
# Build arguments (vienen de Dokploy Build-time Arguments)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_MAPBOX_ACCESS_TOKEN
# ... etc

# Pasarlas como ENV para que Vite las capture
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# ... etc
```

### 2. Configuración Requerida en Dokploy

**IMPORTANTE:** Debes mover las variables `VITE_*` de **"Environment Settings"** a **"Build-time Arguments"** en Dokploy.

## 🚀 Pasos para Solucionar

### Paso 1: Verificar Dockerfile Actualizado

El Dockerfile ya tiene los cambios. Verifica que esté en GitHub.

### Paso 2: Configurar Build-time Arguments en Dokploy

1. Ve a tu aplicación en Dokploy: `Frontend-militar-argis`
2. Ve a la pestaña **"Environment"**
3. **MUEVE** estas variables de "Environment Settings" a **"Build-time Arguments"**:

```
VITE_SUPABASE_URL=tu_supabase_url_aqui
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
VITE_MAPBOX_ACCESS_TOKEN=tu_mapbox_token_aqui
VITE_XAI_API_KEY=tu_xai_api_key_aqui
VITE_APP_NAME="Military Ops Tracker"
VITE_APP_VERSION="3.2.0"
VITE_X_API_KEY=tu_x_api_key_aqui
VITE_X_API_SECRET=tu_x_api_secret_aqui
VITE_MAP_CENTER_LAT=14.2095
VITE_MAP_CENTER_LNG=-66.1057
VITE_MAP_DEFAULT_ZOOM=5.5
NODE_ENV=production
```

**Nota:** Reemplaza los valores `tu_*_aqui` con tus valores reales desde Dokploy.

### Paso 3: Mantener Runtime Variables

Mantén estas en **"Environment Settings"** (runtime):
```
SUPABASE_ACCESS_TOKEN=tu_supabase_access_token_aqui
```

### Paso 4: Rebuild la Aplicación

1. Haz click en **"Redeploy"** o **"Rebuild"**
2. Espera a que termine el build (5-10 minutos)
3. Las variables ahora estarán incrustadas en el código JavaScript

## 🔍 Verificación

Después del rebuild:

1. Abre `https://maps.operativus.net`
2. Abre la consola del navegador (F12)
3. No deberías ver errores de variables faltantes
4. La aplicación debería cargar correctamente

## 📋 Resumen de Variables

### Build-time Arguments (requeridas para Vite):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_ACCESS_TOKEN`
- `VITE_XAI_API_KEY`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_X_API_KEY`
- `VITE_X_API_SECRET`
- `VITE_MAP_CENTER_LAT`
- `VITE_MAP_CENTER_LNG`
- `VITE_MAP_DEFAULT_ZOOM`
- `NODE_ENV`

### Runtime Environment (pueden quedarse en Environment Settings):
- `SUPABASE_ACCESS_TOKEN` (si se usa en el servidor)

## ⚠️ Importante

- **Build-time Arguments** se usan durante `docker build`
- **Environment Settings** se usan cuando el contenedor corre
- Las variables `VITE_*` SE INCORPORAN en el código JavaScript durante el build
- Por eso deben estar en Build-time Arguments, no en Environment Settings

---

**Fecha:** 30 Octubre 2025
**Estado:** Solución implementada en Dockerfile, requiere configuración en Dokploy

