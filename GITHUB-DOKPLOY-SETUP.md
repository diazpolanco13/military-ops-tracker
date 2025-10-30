# 🚀 Guía Completa: GitHub → Dokploy

## 📋 Resumen del Flujo

```
Local (tu máquina) → GitHub → Dokploy → https://maps.operativus.net
```

---

## ✅ Pre-requisitos

- [ ] Cuenta de GitHub activa
- [ ] Git instalado localmente
- [ ] Acceso a Dokploy (https://operativus.net)
- [ ] Variables de entorno preparadas (Mapbox + Supabase)

---

## 📦 PARTE 1: Preparar el Proyecto para Git

### Paso 1: Verificar archivos necesarios

Tu proyecto debe tener estos archivos (✅ ya creados):

```
✅ Dockerfile
✅ nginx.conf
✅ .dockerignore
✅ .gitignore
✅ docker-compose.yml
✅ vite.config.js (configurado)
✅ package.json
```

### Paso 2: Crear archivo README para GitHub

Ya tienes varios README, pero crea uno principal si quieres:

```bash
# El README.md actual está bien, o puedes crear uno nuevo
```

---

## 🐙 PARTE 2: Subir a GitHub

### Opción A: Crear Repositorio Nuevo en GitHub

#### 1. Crear repo en GitHub.com

1. Ve a: https://github.com/new
2. Configura:
   ```
   Repository name: app-mapas-operativus
   Description: Military Operations Tracker - Caribbean Region
   Visibility: Private (recomendado) o Public
   ❌ NO inicializar con README (ya tienes archivos)
   ```
3. Click en **"Create repository"**

#### 2. Inicializar Git localmente

```bash
cd /root/app-mapas

# Inicializar git (si no existe)
git init

# Verificar status
git status

# Ver qué archivos se subirán
git status --short
```

#### 3. Configurar Git (si es primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

#### 4. Agregar archivos al staging

```bash
# Agregar todos los archivos (respetando .gitignore)
git add .

# Verificar qué se agregó
git status
```

⚠️ **IMPORTANTE:** Verifica que `.env` NO aparezca en la lista. Debe estar ignorado.

#### 5. Hacer el primer commit

```bash
git commit -m "Initial commit: Military Ops Tracker with Docker setup"
```

#### 6. Conectar con GitHub

```bash
# Reemplaza con tu usuario y nombre de repo
git remote add origin https://github.com/TU-USUARIO/app-mapas-operativus.git

# Verificar remote
git remote -v
```

#### 7. Push a GitHub

```bash
# Primera vez (crear rama main)
git branch -M main
git push -u origin main

# O si prefieres master
git branch -M master
git push -u origin master
```

**Credenciales GitHub:**

Si te pide usuario/contraseña, usa un **Personal Access Token**:

1. Ve a: https://github.com/settings/tokens
2. Generate new token (classic)
3. Scopes: `repo` (full control)
4. Copia el token
5. Úsalo como contraseña

---

### Opción B: Repo Existente

Si ya tienes un repo:

```bash
cd /root/app-mapas

# Agregar cambios
git add .
git commit -m "Add Docker configuration for Dokploy deployment"
git push
```

---

## 🚢 PARTE 3: Configurar Dokploy

### Paso 1: Acceder a Dokploy

1. Ve a: https://operativus.net
2. Inicia sesión
3. Ve a **Projects** o **Applications**

### Paso 2: Crear Nueva Aplicación

1. Click en **"Create Application"** o **"+ New"**
2. Selecciona **"Deploy from GitHub"**

### Paso 3: Conectar GitHub (Primera vez)

Si es tu primera app desde GitHub:

1. Click en **"Connect GitHub"**
2. Autoriza Dokploy en GitHub
3. Selecciona los repositorios que Dokploy puede acceder:
   - Opción 1: Todos los repositorios
   - Opción 2: Solo `app-mapas-operativus`

### Paso 4: Seleccionar Repositorio

1. En el dropdown, busca: `TU-USUARIO/app-mapas-operativus`
2. Selecciónalo

### Paso 5: Configuración de Build

```yaml
Application Name: app-mapas
Branch: main (o master)
Build Method: Dockerfile
Dockerfile Path: ./Dockerfile
Build Context: .
Port: 80
```

**Advanced Settings:**
```yaml
Health Check Path: /health
Health Check Interval: 30s
Restart Policy: unless-stopped
```

### Paso 6: Variables de Entorno

⚠️ **MUY IMPORTANTE:** Las variables `VITE_*` se inyectan en BUILD TIME.

Click en **"Environment Variables"** y añade:

```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHh4eHh4eHgifQ.xxxxxxxxxxxx
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxx
NODE_ENV=production
```

**Cómo obtener tus valores:**

**Mapbox:**
1. Ve a: https://account.mapbox.com/access-tokens/
2. Crea un token público o usa uno existente
3. Copia el token completo

**Supabase:**
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Paso 7: Configurar Dominio

1. En la configuración de la app, ve a **"Domains"**
2. Click en **"Add Domain"**
3. Añade: `maps.operativus.net`
4. Dokploy automáticamente:
   - ✅ Configura reverse proxy
   - ✅ Genera certificado SSL (Let's Encrypt)
   - ✅ Habilita HTTPS

**Verificar DNS:**

Asegúrate que tu DNS está configurado (en tu proveedor de dominio):

```
Type: A
Name: maps
Value: [IP de tu servidor Dokploy]
TTL: 3600

# O si usas CNAME:
Type: CNAME
Name: maps
Value: operativus.net
TTL: 3600
```

### Paso 8: Deploy! 🚀

1. Revisa toda la configuración
2. Click en **"Deploy"** o **"Create & Deploy"**
3. Dokploy comenzará a:
   - ✅ Clonar tu repo de GitHub
   - ✅ Instalar dependencias (`npm ci`)
   - ✅ Build Vite (`npm run build`)
   - ✅ Construir imagen Docker
   - ✅ Iniciar container
   - ✅ Health check
   - ✅ Generar certificado SSL

**Tiempo estimado:** 5-10 minutos (primera vez)

### Paso 9: Monitorear Build

En Dokploy, ve a **"Logs"** para ver el progreso en tiempo real:

```
[1/6] Cloning repository...
[2/6] Installing dependencies...
[3/6] Building application...
[4/6] Creating Docker image...
[5/6] Starting container...
[6/6] Health check passed ✓

✅ Deployed to: https://maps.operativus.net
```

---

## ✅ PARTE 4: Verificación Post-Deploy

### 1. Health Check

```bash
curl https://maps.operativus.net/health
# Respuesta esperada: healthy
```

### 2. Acceso Web

Abre en el navegador:
```
https://maps.operativus.net
```

Deberías ver:
- ✅ Mapa del Caribe cargado
- ✅ Marcadores de entidades
- ✅ Sin errores en consola (F12)

### 3. Verificar SSL

```bash
curl -I https://maps.operativus.net
# Debe mostrar: HTTP/2 200
# Debe mostrar: certificate válido
```

### 4. Test de Funcionalidad

- [ ] Mapa se visualiza correctamente
- [ ] Marcadores aparecen
- [ ] Click en marcador muestra popup
- [ ] Drag & drop de marcadores funciona
- [ ] Paleta de plantillas abre
- [ ] No hay errores en DevTools console

---

## 🔄 PARTE 5: Configurar Auto-Deploy

### Opción A: Auto-deploy en Push (Recomendado)

Dokploy puede detectar automáticamente pushes a GitHub.

**Configuración en Dokploy:**

1. Ve a tu app → **Settings** → **GitHub Integration**
2. Habilita **"Auto Deploy on Push"**
3. Selecciona rama: `main` (o `master`)
4. Cada vez que hagas `git push`, Dokploy redeploy automáticamente

### Opción B: Webhook Manual

Si la opción A no está disponible:

1. En Dokploy, copia la **Webhook URL**
2. Ve a GitHub → Tu repo → **Settings** → **Webhooks**
3. Add webhook:
   ```
   Payload URL: [URL del webhook de Dokploy]
   Content type: application/json
   Secret: [si Dokploy lo pide]
   Events: Just the push event
   ```
4. Save webhook

**Probar:**
```bash
# Hacer un cambio pequeño
echo "# Test auto-deploy" >> README.md
git add README.md
git commit -m "Test: verificar auto-deploy"
git push

# Dokploy debería redeployar automáticamente
```

---

## 🔧 PARTE 6: Workflow de Desarrollo

### Desarrollo Local

```bash
# Trabajar en local
cd /root/app-mapas
npm run dev

# Hacer cambios...
# Testear en http://localhost:5173
```

### Commit y Push

```bash
# Cuando estés satisfecho
git add .
git commit -m "feat: nueva funcionalidad X"
git push

# Dokploy redeploy automáticamente
```

### Monitorear Deploy

1. Ve a Dokploy → tu app → **Deployments**
2. Verás el historial de deploys
3. Click en el último para ver logs

---

## 🐛 Troubleshooting

### Problema 1: "Build failed: npm ci failed"

**Causa:** `package-lock.json` tiene conflictos

**Solución:**
```bash
# Regenerar lock file
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock"
git push
```

### Problema 2: "Cannot connect to GitHub"

**Causa:** Permisos de Dokploy en GitHub

**Solución:**
1. Ve a: https://github.com/settings/installations
2. Encuentra "Dokploy"
3. Configure → Repository access
4. Asegúrate que tu repo esté seleccionado

### Problema 3: "Environment variables not working"

**Causa:** Variables no están en build args

**Solución:**
1. Dokploy → tu app → **Environment Variables**
2. Verifica que todas las `VITE_*` estén presentes
3. **Rebuild** (no solo restart)

### Problema 4: "502 Bad Gateway después de deploy"

**Causa:** Container no pasó health check

**Solución:**
```bash
# Verificar logs en Dokploy
# Buscar errores tipo:
# - Port 80 already in use
# - Health check failed
# - Out of memory
```

### Problema 5: "Git push pide usuario/password constantemente"

**Solución: Usar SSH en lugar de HTTPS**

```bash
# Cambiar remote a SSH
git remote set-url origin git@github.com:TU-USUARIO/app-mapas-operativus.git

# Configurar SSH key (si no la tienes)
ssh-keygen -t ed25519 -C "tu@email.com"
cat ~/.ssh/id_ed25519.pub
# Copiar y agregar a: https://github.com/settings/keys
```

---

## 📊 Comandos Útiles

### Git

```bash
# Ver status
git status

# Ver historial
git log --oneline

# Ver diferencias
git diff

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Ver branches
git branch -a

# Crear nueva branch
git checkout -b feature/nueva-funcionalidad

# Mergear a main
git checkout main
git merge feature/nueva-funcionalidad
```

### Dokploy CLI (si está disponible)

```bash
# Ver logs en tiempo real
dokploy logs app-mapas --follow

# Redeployar
dokploy deploy app-mapas

# Ver status
dokploy status app-mapas
```

---

## 📈 Mejores Prácticas

### Commits

```bash
# Buenos commits
git commit -m "feat: agregar sistema de alertas"
git commit -m "fix: corregir popup no aparece en mobile"
git commit -m "docs: actualizar README con nuevas features"
git commit -m "refactor: optimizar consultas a Supabase"

# Malos commits
git commit -m "cambios"
git commit -m "fix"
git commit -m "asdf"
```

### Branches

```
main/master     → Producción (maps.operativus.net)
develop         → Desarrollo/staging
feature/X       → Nueva funcionalidad
fix/X           → Arreglar bug
hotfix/X        → Arreglo urgente en producción
```

### Tags/Releases

```bash
# Crear release
git tag -a v1.0.0 -m "Release v1.0.0: MVP completo"
git push origin v1.0.0

# En GitHub, esto crea un release oficial
```

---

## ✅ Checklist Final

Antes de hacer el primer deploy:

- [ ] Dockerfile existe en root
- [ ] nginx.conf existe en root
- [ ] .dockerignore creado
- [ ] .gitignore no incluye archivos sensibles
- [ ] Variables de entorno preparadas (Mapbox + Supabase)
- [ ] DNS configurado (maps.operativus.net)
- [ ] Build local exitoso: `npm run build`
- [ ] Repo subido a GitHub
- [ ] Dokploy conectado a GitHub
- [ ] Variables configuradas en Dokploy
- [ ] Dominio añadido en Dokploy
- [ ] Supabase permite dominio maps.operativus.net

---

## 🎯 Comandos Completos de Setup

### Setup Completo desde Cero

```bash
# 1. Inicializar Git
cd /root/app-mapas
git init
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# 2. Agregar archivos
git add .
git status  # Verificar que .env NO esté incluido

# 3. Primer commit
git commit -m "Initial commit: Military Ops Tracker - Dokploy ready"

# 4. Crear repo en GitHub (hazlo en github.com/new)
# Luego conectar:
git remote add origin https://github.com/TU-USUARIO/app-mapas-operativus.git
git branch -M main
git push -u origin main

# 5. Configurar Dokploy (via UI):
# - Connect GitHub
# - Select repo
# - Add environment variables
# - Configure domain: maps.operativus.net
# - Deploy!

# 6. Verificar
curl https://maps.operativus.net/health
```

---

## 🔗 Enlaces Útiles

| Servicio | URL |
|----------|-----|
| **App Producción** | https://maps.operativus.net |
| **Dokploy Panel** | https://operativus.net |
| **GitHub Repo** | https://github.com/TU-USUARIO/app-mapas-operativus |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **Mapbox Account** | https://account.mapbox.com |

---

**¡Listo para deployar! 🚀**

Cualquier duda, revisa los logs en Dokploy o verifica el health endpoint.

