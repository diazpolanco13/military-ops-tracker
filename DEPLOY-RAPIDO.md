# ⚡ Deploy Rápido a Dokploy (5 minutos)

## 🎯 Tu Setup

- **Dokploy Panel:** https://operativus.net
- **Tu App:** https://maps.operativus.net
- **Método:** GitHub → Dokploy

---

## ✅ Paso a Paso Rápido

### 1️⃣ Verificar archivos (30 segundos)

```bash
cd /root/app-mapas
bash pre-deploy-check.sh
```

Si todo está ✅ verde, continúa.

---

### 2️⃣ Subir a GitHub (2 minutos)

```bash
# Inicializar Git (si no está)
git init

# Agregar todo
git add .
git commit -m "Deploy inicial a Dokploy"

# Conectar con GitHub (crea el repo primero en github.com/new)
git remote add origin https://github.com/TU-USUARIO/app-mapas.git
git branch -M main
git push -u origin main
```

**Si te pide credenciales:**
- Usuario: tu username de GitHub
- Password: [Personal Access Token](https://github.com/settings/tokens)

---

### 3️⃣ Configurar Dokploy (2 minutos)

1. Ve a https://operativus.net
2. **Create Application** → **GitHub**
3. Selecciona tu repo: `TU-USUARIO/app-mapas`
4. Configuración:
   ```
   Branch: main
   Build Method: Dockerfile
   Port: 80
   Health Check: /health
   ```

---

### 4️⃣ Variables de Entorno (1 minuto)

En Dokploy → **Environment Variables**, añade:

```bash
VITE_MAPBOX_ACCESS_TOKEN=tu_token_mapbox
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
NODE_ENV=production
```

**¿Dónde conseguir los valores?**

- **Mapbox:** https://account.mapbox.com/access-tokens/
- **Supabase:** https://supabase.com/dashboard → Settings → API

---

### 5️⃣ Añadir Dominio (30 segundos)

En Dokploy → **Domains** → Añadir:

```
maps.operativus.net
```

Dokploy genera SSL automáticamente.

---

### 6️⃣ Deploy! 🚀

Click en **Deploy** y espera 5-10 minutos.

---

## ✅ Verificar

```bash
# Health check
curl https://maps.operativus.net/health

# Debe responder: healthy
```

Abre en navegador: **https://maps.operativus.net**

---

## 🔄 Futuros Deploys

Simplemente:

```bash
git add .
git commit -m "tus cambios"
git push
```

Dokploy redeploy automáticamente.

---

## 🆘 Ayuda

- **Guía completa:** Ver `GITHUB-DOKPLOY-SETUP.md`
- **Troubleshooting:** Ver `DEPLOYMENT-OPERATIVUS.md`
- **Logs:** https://operativus.net → tu app → Logs

