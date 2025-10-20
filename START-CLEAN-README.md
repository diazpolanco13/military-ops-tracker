# 🚀 Inicio Limpio - Military Ops Tracker

## Descripción
Script automatizado para iniciar la aplicación Military Ops Tracker de forma completamente limpia usando PM2.

## Uso Rápido

```bash
# Opción 1: Usar npm script
npm run start:clean

# Opción 2: Ejecutar directamente
bash start-clean.sh
```

## Qué hace el script

### 🔄 Proceso de Inicio Limpio
1. **Verificación de PM2** - Confirma que PM2 esté instalado
2. **Limpieza de instancias anteriores** - Detiene y elimina procesos previos
3. **Limpieza de cachés** - Remueve archivos temporales de Vite y build
4. **Verificación de dependencias** - Instala npm packages si es necesario
5. **Validación de entorno** - Verifica variables de entorno requeridas
6. **Build de producción** - Construye la aplicación optimizada
7. **Inicio con PM2** - Inicia la aplicación en background
8. **Verificación y logs** - Muestra estado y logs iniciales

### 📊 Información de Acceso
- **URL**: http://localhost:8080
- **PM2 App Name**: app-mapas
- **Logs**: `./logs/` (err.log, out.log, combined.log)

## Comandos PM2 Disponibles

```bash
# Gestión básica
npm run pm2:status     # Ver estado de aplicaciones
npm run pm2:logs       # Ver logs en tiempo real
npm run pm2:restart    # Reiniciar aplicación
npm run pm2:stop       # Detener aplicación

# Comandos directos PM2
pm2 monit              # Monitor detallado
pm2 reload app-mapas   # Reload sin downtime
pm2 describe app-mapas # Información detallada
```

## Variables de Entorno Requeridas

Asegúrate de tener configurado `.env.local` o `.env` con:

```env
VITE_MAPBOX_ACCESS_TOKEN=tu_token_de_mapbox
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## Troubleshooting

### Error: "PM2 no está instalado"
```bash
npm install -g pm2
```

### Error: "Build falló"
```bash
# Limpiar y reconstruir manualmente
rm -rf node_modules/.vite dist
npm install
npm run build
```

### Error: "Puerto 8080 ocupado"
```bash
# Ver qué está usando el puerto
lsof -i :8080
# Matar proceso si es necesario
kill -9 <PID>
```

### Reinicio completo
```bash
# Detener todo
npm run pm2:stop
pm2 kill

# Limpiar completamente
rm -rf dist node_modules/.vite

# Reiniciar limpio
npm run start:clean
```

## Arquitectura

- **Desarrollo**: `npm run dev` (puerto 5173)
- **Producción**: PM2 + serve (puerto 8080)
- **Build**: Vite con optimizaciones
- **Gestión**: PM2 con autorestart y logs
