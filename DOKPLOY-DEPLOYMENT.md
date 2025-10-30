# 🚀 Guía de Deployment en Dokploy

## 📋 Pre-requisitos

1. ✅ Cuenta en Dokploy
2. ✅ Repositorio Git conectado (GitHub/GitLab/Bitbucket)
3. ✅ Variables de entorno preparadas

---

## 🔧 Configuración en Dokploy

### Paso 1: Crear Nueva Aplicación

1. Accede a tu panel de Dokploy
2. Click en **"New Application"** o **"Add Service"**
3. Selecciona **"Dockerfile"** como tipo de deployment
4. Conecta tu repositorio Git

### Paso 2: Configuración del Proyecto

**Build Settings:**
```yaml
Build Method: Dockerfile
Dockerfile Path: ./Dockerfile
Build Context: .
Port: 80
```

**Environment Variables (Variables de Entorno):**

Añade estas variables en la sección **Environment**:

```bash
# Mapbox (REQUERIDO)
VITE_MAPBOX_ACCESS_TOKEN=tu_token_de_mapbox_aqui

# Supabase (REQUERIDO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Opcional: Entorno
NODE_ENV=production
```

### Paso 3: Deploy

1. Click en **"Deploy"** o **"Build & Deploy"**
2. Espera a que el build termine (5-10 minutos primera vez)
3. Dokploy generará automáticamente una URL tipo: `https://app-mapas.dokploy.app`

---

## 🔍 Verificación del Deployment

### Health Check

Tu app tiene un endpoint de health check:

```bash
curl https://tu-app.dokploy.app/health
# Debe responder: healthy
```

### Logs en Tiempo Real

En Dokploy:
1. Ve a tu aplicación
2. Click en **"Logs"**
3. Verifica que no haya errores

---

## 🐛 Troubleshooting

### Problema 1: "Application failed to start"

**Causa:** Falta alguna variable de entorno

**Solución:**
1. Verifica que `VITE_MAPBOX_ACCESS_TOKEN` esté configurada
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas
3. Redeploy después de agregar variables

### Problema 2: "Cannot GET /"

**Causa:** Nginx no está sirviendo correctamente

**Solución:**
1. Verifica que `nginx.conf` esté en el root del proyecto
2. Verifica que el Dockerfile copie correctamente `nginx.conf`
3. Rebuild la imagen

### Problema 3: "Build timeout" o "Out of memory"

**Causa:** El build consume demasiados recursos

**Solución:**
1. Aumenta los recursos en Dokploy (Settings → Resources)
2. O construye localmente y sube la imagen:

```bash
# Build local
docker build -t app-mapas:latest .

# Tag para tu registry
docker tag app-mapas:latest tu-registry/app-mapas:latest

# Push
docker push tu-registry/app-mapas:latest
```

### Problema 4: Mapa no carga o pantalla en blanco

**Causa:** Variables de entorno no están disponibles en el build

**Solución:**
```bash
# IMPORTANTE: Las variables VITE_* deben estar en BUILD TIME
# Asegúrate de configurarlas ANTES del deploy, no después
```

### Problema 5: Error CORS o API no funciona

**Causa:** Supabase no permite el dominio de Dokploy

**Solución:**
1. Ve a Supabase Dashboard → Settings → API
2. Agrega tu URL de Dokploy a **"Site URL"**
3. Agrega tu URL a **"Redirect URLs"**

---

## 📊 Arquitectura del Deployment

```
┌─────────────────────────────────────────┐
│           Dokploy Platform              │
│  ┌───────────────────────────────────┐  │
│  │   Docker Container                │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │   Nginx (Port 80)            │ │  │
│  │  │   - Serve static files       │ │  │
│  │  │   - SPA routing              │ │  │
│  │  │   - Gzip compression         │ │  │
│  │  │   - Health check (/health)   │ │  │
│  │  └──────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│               ⬇                         │
│     Traefik/Load Balancer               │
│               ⬇                         │
│     https://app-mapas.dokploy.app       │
└─────────────────────────────────────────┘
              ⬇
   ┌──────────────────────┐
   │   External APIs      │
   │  - Mapbox GL JS      │
   │  - Supabase          │
   └──────────────────────┘
```

---

## 🔐 Seguridad

### Headers de Seguridad (Ya configurados en nginx.conf)

- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection: 1; mode=block`

### Recomendaciones Adicionales

1. **SSL/TLS:** Dokploy maneja automáticamente los certificados
2. **Environment Secrets:** Nunca commitear `.env` al repo
3. **API Keys:** Rotar periódicamente las keys de Mapbox y Supabase

---

## 🚀 Comandos Útiles (Testing Local con Docker)

### Build local

```bash
docker build -t app-mapas:latest .
```

### Run local (puerto 3000)

```bash
docker run -d -p 3000:80 \
  -e VITE_MAPBOX_ACCESS_TOKEN="tu_token" \
  -e VITE_SUPABASE_URL="tu_url" \
  -e VITE_SUPABASE_ANON_KEY="tu_key" \
  --name app-mapas-test \
  app-mapas:latest
```

### Ver logs

```bash
docker logs -f app-mapas-test
```

### Detener y limpiar

```bash
docker stop app-mapas-test
docker rm app-mapas-test
```

### Con docker-compose

```bash
# Edita docker-compose.yml con tus variables de entorno
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## 📈 Optimizaciones de Producción

### Ya implementadas:

- ✅ **Multi-stage build** (reduce imagen de ~1.5GB a ~50MB)
- ✅ **Code splitting** (chunks separados para mapbox, react, turf)
- ✅ **Gzip compression** en Nginx
- ✅ **Cache de assets estáticos** (1 año)
- ✅ **Health checks** automáticos
- ✅ **Alpine Linux** (imagen base mínima)

### Métricas esperadas:

| Métrica | Valor |
|---------|-------|
| Tamaño imagen final | ~50-70 MB |
| Tiempo de build | 5-10 min |
| Tiempo de inicio | ~5 segundos |
| Memory usage | ~50-100 MB |

---

## 📱 Dominios Personalizados

### Configurar dominio custom en Dokploy:

1. Ve a tu aplicación → **Settings** → **Domains**
2. Añade tu dominio: `mapas.tuempresa.com`
3. Configura DNS (en tu proveedor):

```
Type: CNAME
Name: mapas
Value: tu-app.dokploy.app
TTL: 3600
```

4. Espera propagación DNS (5-60 minutos)
5. Dokploy generará certificado SSL automáticamente

---

## 🔄 CI/CD Automático

Dokploy redeploy automáticamente cuando:
- ✅ Haces push a la rama configurada (main/master)
- ✅ Creas un nuevo tag
- ✅ Abres un PR (si está configurado)

### Webhook Manual

Si necesitas trigger manual:
```bash
curl -X POST https://dokploy.app/api/deploy/tu-webhook-id
```

---

## ✅ Checklist Final

Antes de hacer deploy, verifica:

- [ ] Variables de entorno configuradas en Dokploy
- [ ] Dockerfile en el root del proyecto
- [ ] nginx.conf en el root del proyecto
- [ ] .dockerignore creado
- [ ] vite.config.js configurado para producción
- [ ] Build local exitoso: `npm run build`
- [ ] Test local con Docker: `docker build . && docker run -p 3000:80`
- [ ] Supabase permite tu dominio de Dokploy
- [ ] Mapbox token es válido

---

## 📞 Soporte

Si tienes problemas:

1. **Logs de Dokploy:** Revisa los logs en tiempo real
2. **Health Check:** Verifica `/health` endpoint
3. **Build logs:** Revisa si el build completó correctamente
4. **Browser Console:** Abre DevTools y verifica errores

---

**Última actualización:** Octubre 30, 2025
**Versión:** 1.0.0
**Compatibilidad:** Dokploy v1.x

