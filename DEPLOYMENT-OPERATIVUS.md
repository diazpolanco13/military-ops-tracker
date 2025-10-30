# 🚀 Deployment en Operativus.net

## 🌐 Información del Dominio

- **Dokploy Panel:** https://operativus.net/
- **App URL:** https://maps.operativus.net/
- **Health Check:** https://maps.operativus.net/health

---

## 📋 Pasos para Deployment

### 1️⃣ Acceder a Dokploy

1. Ve a: https://operativus.net/
2. Inicia sesión con tus credenciales
3. Ve a la sección de **Applications** o **Services**

---

### 2️⃣ Crear Nueva Aplicación

**Configuración Básica:**
```yaml
Name: app-mapas
Type: Dockerfile
Repository: [Tu repositorio Git]
Branch: main (o master)
```

**Build Configuration:**
```yaml
Build Method: Dockerfile
Dockerfile Path: ./Dockerfile
Build Context: .
Port: 80
Health Check Path: /health
```

---

### 3️⃣ Configurar Variables de Entorno

En Dokploy, ve a **Environment Variables** y añade:

```bash
# MAPBOX (OBLIGATORIO)
VITE_MAPBOX_ACCESS_TOKEN=tu_token_mapbox_aqui

# SUPABASE (OBLIGATORIO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# ENVIRONMENT
NODE_ENV=production
```

⚠️ **IMPORTANTE:** Las variables `VITE_*` deben estar configuradas ANTES del build, no después.

---

### 4️⃣ Configurar Dominio

En Dokploy:

1. Ve a tu aplicación → **Domains**
2. Añade el dominio: `maps.operativus.net`
3. Dokploy configurará automáticamente:
   - SSL/TLS con Let's Encrypt
   - Reverse proxy (Traefik)
   - Redirección HTTP → HTTPS

**Verificación DNS:**

Tu DNS debería estar configurado así (verifica en tu proveedor):

```
Type: A o CNAME
Name: maps
Value: [IP de tu servidor Dokploy] o operativus.net
TTL: 3600
```

---

### 5️⃣ Deploy

1. Click en **Deploy** o **Build & Deploy**
2. Espera el build (primera vez: 5-10 minutos)
3. Monitorea los logs en tiempo real

**Progreso esperado:**
```
✓ Cloning repository...
✓ Installing dependencies...
✓ Building Vite app...
✓ Creating Docker image...
✓ Starting container...
✓ Health check passed!
✓ SSL certificate generated
✓ App deployed at https://maps.operativus.net
```

---

### 6️⃣ Verificación Post-Deploy

**Health Check:**
```bash
curl https://maps.operativus.net/health
# Respuesta esperada: healthy
```

**Acceso Web:**
```
https://maps.operativus.net
```

**Verificar SSL:**
```bash
curl -I https://maps.operativus.net
# Debe mostrar: HTTP/2 200
```

---

## 🔧 Configuración de Supabase

### Agregar Dominio a Supabase

1. Ve a: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. En **"Site URL"**, añade: `https://maps.operativus.net`
5. En **"Redirect URLs"**, añade:
   ```
   https://maps.operativus.net
   https://maps.operativus.net/**
   ```
6. Click en **Save**

---

## 🐛 Troubleshooting Específico

### Problema: "502 Bad Gateway"

**Causa:** Container no está corriendo o healthcheck falla

**Solución:**
```bash
# En Dokploy, revisa logs:
# Applications → app-mapas → Logs

# Verifica que el container esté up:
# Debe mostrar: Status: Running
```

### Problema: "Blank screen" o "Loading forever"

**Causa:** Variables de entorno no están en build time

**Solución:**
1. Ve a Dokploy → app-mapas → **Environment Variables**
2. Verifica que `VITE_MAPBOX_ACCESS_TOKEN` esté presente
3. Verifica que `VITE_SUPABASE_URL` esté presente
4. **Redeploy** (rebuild) la aplicación
5. Las variables VITE_* se inyectan en TIEMPO DE BUILD, no runtime

### Problema: "Mapa no carga"

**Causa:** Token de Mapbox inválido o CORS

**Solución:**
1. Verifica token en: https://account.mapbox.com/access-tokens/
2. Crea uno nuevo si es necesario (scope: público)
3. Actualiza `VITE_MAPBOX_ACCESS_TOKEN` en Dokploy
4. Redeploy

### Problema: "Supabase error: Invalid API key"

**Causa:** Anon key incorrecta o dominio no autorizado

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia de nuevo la **anon public** key
3. Actualiza `VITE_SUPABASE_ANON_KEY` en Dokploy
4. Añade `https://maps.operativus.net` a Site URL en Supabase
5. Redeploy

---

## 🔄 Redeployment Automático

Dokploy puede auto-deploy cuando:

1. **Push a Git:** Haces commit/push a la rama `main`
2. **Webhook:** Configura webhook en GitHub/GitLab
3. **Manual:** Click en "Redeploy" en Dokploy

**Configurar Webhook (GitHub):**

1. Ve a tu repo → **Settings** → **Webhooks**
2. Add webhook:
   ```
   Payload URL: [URL webhook de Dokploy]
   Content type: application/json
   Events: Just the push event
   ```
3. Dokploy te dará la URL del webhook

---

## 📊 Monitoreo

### Logs en Tiempo Real

En Dokploy:
```
Applications → app-mapas → Logs → [Play button]
```

### Métricas de Rendimiento

```
Applications → app-mapas → Metrics
```

Verás:
- CPU usage
- Memory usage
- Network I/O
- Request rate

### Alertas (Opcional)

Configura alertas en Dokploy para:
- Container crashed
- High memory usage (>80%)
- Health check fails

---

## 🔐 Seguridad

### Headers de Seguridad

Ya configurados automáticamente:
- ✅ SSL/TLS con Let's Encrypt
- ✅ HTTPS forzado
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection

### Firewall

Dokploy maneja automáticamente:
- Solo puerto 80/443 expuestos
- Container aislado
- Network segmentation

### Backups (Recomendado)

1. **Código:** Ya está en Git ✅
2. **Base de datos:** Supabase hace backups automáticos ✅
3. **Variables de entorno:** Guárdalas en un password manager seguro

---

## 📈 Optimizaciones de Producción

### CDN (Opcional pero Recomendado)

Considera usar Cloudflare delante de `maps.operativus.net`:

**Beneficios:**
- Cache de assets estáticos
- Protección DDoS
- Mejor velocidad global
- Analytics gratis

**Setup:**
1. Añade `operativus.net` a Cloudflare
2. Cambia nameservers
3. Cloudflare cachea automáticamente

### Monitoring Externo

Herramientas recomendadas:
- **UptimeRobot:** https://uptimerobot.com (gratis)
- **Pingdom:** Monitoreo profesional
- **Better Uptime:** Alertas por Slack/Discord

---

## 🎯 Checklist Final Pre-Deploy

- [ ] Dockerfile en el root
- [ ] nginx.conf en el root
- [ ] .dockerignore creado
- [ ] vite.config.js configurado
- [ ] Variables de entorno preparadas:
  - [ ] VITE_MAPBOX_ACCESS_TOKEN
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
- [ ] DNS configurado: maps.operativus.net
- [ ] Supabase permite dominio maps.operativus.net
- [ ] Build local exitoso: `npm run build`
- [ ] Test Docker local: `bash test-docker.sh`
- [ ] Git push al repo

---

## 🚀 Comando Rápido de Verificación

Después del deploy, ejecuta esto:

```bash
#!/bin/bash

echo "🔍 Verificando deployment en maps.operativus.net..."
echo ""

# Health check
echo "1. Health Check:"
curl -s https://maps.operativus.net/health
echo ""

# Headers
echo -e "\n2. Security Headers:"
curl -I https://maps.operativus.net 2>&1 | grep -E "(HTTP|x-|X-)"

# SSL
echo -e "\n3. SSL Certificate:"
echo | openssl s_client -servername maps.operativus.net -connect maps.operativus.net:443 2>/dev/null | openssl x509 -noout -dates

# Response time
echo -e "\n4. Response Time:"
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://maps.operativus.net/

echo -e "\n✅ Verificación completa!"
```

---

## 📱 Accesos Rápidos

| Servicio | URL |
|----------|-----|
| **App Principal** | https://maps.operativus.net |
| **Dokploy Panel** | https://operativus.net |
| **Health Check** | https://maps.operativus.net/health |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **Mapbox Account** | https://account.mapbox.com |

---

## 📞 Soporte

Si algo falla:

1. **Logs de Dokploy:** Primera parada para debugging
2. **Browser Console:** F12 → Console para ver errores JS
3. **Network Tab:** F12 → Network para ver requests fallidas
4. **Health endpoint:** `curl https://maps.operativus.net/health`

---

**Dominio:** maps.operativus.net  
**Panel:** operativus.net  
**Última actualización:** Octubre 30, 2025  
**Estado:** ✅ Listo para deployment

