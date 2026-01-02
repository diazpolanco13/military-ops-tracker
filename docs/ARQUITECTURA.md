# SAE-RADAR - Arquitectura del Sistema

> Sistema de Monitoreo de Espacio Aéreo para Inteligencia Estratégica  
> Última actualización: 2026-01-02 (Optimizaciones de rendimiento)

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Mapas | Mapbox GL JS |
| Backend | Supabase (PostgreSQL + PostGIS + Edge Functions) |
| Despliegue | Dokploy (Docker) en `maps.operativus.net` |
| Alertas | Telegram Bot API |
| FlightRadar | API Híbrida (pública + pagada) |
| Geodatos | Marine Regions + Natural Earth + GADM |
| Screenshots | Servicio Puppeteer en `operativus.net/screenshot` |

---

## Estructura del Proyecto

```
src/
├── components/
│   ├── Aircraft/          # Registro de aeronaves militares
│   ├── Analytics/         # Estadísticas de incursiones
│   ├── Auth/              # Login, gestión de usuarios
│   ├── Calendar/          # Vista de calendario
│   ├── Cards/             # Modales y cards de entidades
│   ├── FlightRadar/       # Vuelos en tiempo real
│   ├── Map/               # Mapa principal y capas
│   ├── Measurement/       # Herramientas de medición
│   ├── Navigation/        # Navbar y menús
│   ├── Radar/             # Radar visual 360°
│   ├── Screenshot/        # Vista para capturas
│   ├── Settings/          # Configuraciones
│   ├── Sidebar/           # Panel lateral
│   ├── Templates/         # Paleta de plantillas
│   ├── Timeline/          # Eventos en timeline
│   └── Weather/           # Capas meteorológicas
├── hooks/                 # useMapLayers, useFlightRadar, useAircraftRegistry, etc.
├── services/              # flightRadarService, geocodingService
├── stores/                # Contexts de estado
├── config/                # Configuraciones (iconos i2)
├── lib/                   # Clientes (Supabase, Mapbox, RealtimeManager)
└── utils/                 # Utilidades
```

---

## Flujo de Datos Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│  Mapa Mapbox  │  FlightRadar Panel  │  Calendario  │  Inventario    │
└───────┬───────┴─────────┬───────────┴──────┬───────┴────────┬───────┘
        │                 │                  │                │
        ▼                 ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE EDGE FUNCTIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│ flightradar-proxy  │  military-airspace-monitor  │  incursion-*     │
│      (v21)         │          (v34)              │    (v8-v14)      │
└─────────┬──────────┴────────────┬───────────────┴─────────┬─────────┘
          │                       │                         │
          ▼                       ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐
│ FlightRadar24   │    │    Telegram     │    │  Screenshot Service │
│   API (FR24)    │    │    Bot API      │    │   (Puppeteer)       │
└─────────────────┘    └─────────────────┘    └─────────────────────┘
```

---

## Componentes Clave

### 1. Sistema de Vuelos (FlightRadar)
- **Actualización**: Cada 30 segundos (API pública gratuita)
- **Trail**: On-click (API pagada FR24)
- **Detección militar**: Por ICAO24 (prefijos AE/AF) y patrones de callsign
- **Área de cobertura**: 27°N a 8°S, -85°W a -58°E (Caribe ampliado)
- **Detección de transponder**: ADS-B, MLAT, Estimado
- **Visualización**: Icono semi-transparente cuando transponder apagado

### 2. Sistema de Incursiones
- **Sesiones**: Agrupan múltiples detecciones del mismo vuelo
- **Waypoints**: Registran cada posición durante la incursión
- **Alertas Telegram**: 
  - **Entrada**: Foto con mapa + detalles del avión
  - **Salida**: Foto con trail completo + resumen estadístico
- **Screenshots**: Generados por servicio Puppeteer externo

### 3. Sistema de Entidades
- **Plantillas**: 14 modelos genéricos (destructores, cazas, tropas, etc.)
- **Iconos**: 610 iconos profesionales IBM i2 en `/public/Icons/i2/`
- **Tipos**: destructor, fragata, avion, tropas, tanque, submarino, portaaviones, anfibio, insurgente, vehiculo, lugar

### 4. Límites Geográficos
- **Frontend**: Archivos locales para carga instantánea:
  - `src/data/maritimeBoundaries.js` (11 zonas EEZ, 5.9 MB)
  - `src/data/terrestrialBoundaries.js` (18 países, 880 KB)
  - `src/data/esequiboClaimZone.js` (zona en reclamación)
- **Backend**: Tablas Supabase para Edge Functions de detección

### 5. Registro de Aeronaves Militares
- **Inventario**: 100+ aeronaves únicas identificadas por ICAO24
- **Catálogo**: 82+ modelos con especificaciones técnicas
- **Bases**: 40+ aeropuertos/bases militares del Caribe
- **Historial**: Trail de posiciones por aeronave
- Ver: `docs/REGISTRO-AERONAVES-MILITARES.md`

---

## Edge Functions

| Función | Versión | Propósito | JWT | Frecuencia |
|---------|---------|-----------|-----|------------|
| `flightradar-proxy` | v24 | Proxy para datos de vuelos | ❌ No | On-demand |
| `military-airspace-monitor` | v38 | Detectar incursiones + Telegram | ❌ No | Cron 2min |
| `incursion-session-closer` | v12 | Cerrar sesiones + screenshot | ❌ No | Cron 5min |
| `incursion-situation-report` | v4 | Reporte consolidado de actividad | ❌ No | Cron 10min |
| `aircraft-registry-collector` | v14 | Registrar aeronaves en inventario | ❌ No | Cron 5min |

> **Nota**: Todas las Edge Functions usan `verify_jwt: false` para permitir ejecución desde pg_cron.

---

## Cron Jobs (pg_cron)

| Job ID | Nombre | Schedule | Función |
|--------|--------|----------|---------|
| 3 | `aircraft-registry-collector` | `*/5 * * * *` | Recolección de aeronaves |
| 4 | `reset-new-today-flags` | `0 4 * * *` | Reset de flags diarios |
| 5 | `military-airspace-monitor-cron` | `*/2 * * * *` | Detección de incursiones |
| 6 | `incursion-session-closer-cron` | `*/5 * * * *` | Cierre de sesiones |
| 7 | `situation-report-every-10-min` | `*/10 * * * *` | Reportes de situación |

> **Importante**: Los cron jobs se ejecutan SOLO desde pg_cron. El archivo `docker-entrypoint.sh` NO contiene cron jobs duplicados.

---

## Actualizaciones en Tiempo Real

| Componente | Frecuencia | Fuente |
|------------|------------|--------|
| Vuelos en mapa | 30 seg | API Pública FR24 |
| Trail de vuelo | On-click | API Pagada FR24 |
| Monitor de incursiones | 2 min | Cron `military-airspace-monitor` |
| Cierre de sesiones | 5 min | Cron `incursion-session-closer` |
| Registro de aeronaves | 5 min | Cron `aircraft-registry-collector` |
| Entidades/Eventos | Realtime | Supabase Realtime |

---

## Variables de Entorno

### Frontend (Vite)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx
```

### Edge Functions (Supabase Secrets)
```env
FR24_API_TOKEN=xxx
TELEGRAM_BOT_TOKEN=xxx
SCREENSHOT_SERVICE_URL=https://operativus.net/screenshot
SCREENSHOT_AUTH_TOKEN=xxx
```

---

## Servicios Externos

### FlightRadar24
- **API Pública**: `data-cloud.flightradar24.com` (sin límite)
- **API Pagada**: `fr24api.flightradar24.com` (trails, detalles)

### Screenshot Service
- **URL**: `https://operativus.net/screenshot`
- **Tecnología**: Node.js + Puppeteer
- **Propósito**: Generar capturas del mapa para alertas Telegram

### Telegram Bot
- **Destinos**: Configurados en `incursion_monitor_config.telegram_destinations`
- **Alertas**: Entrada (incursión detectada) y Salida (fin con resumen)

### Nominatim (OpenStreetMap)
- **Uso**: Reverse geocoding para detectar país de aeronaves
- **Rate limit**: 1 request/segundo

---

## Optimizaciones Implementadas (2026-01-02)

### Fase 1: Limpieza y Deduplicación

| Cambio | Impacto |
|--------|---------|
| ❌ Eliminación AISStream/ShipRadar | -2,400 queries/hora |
| ✅ Políticas RLS consolidadas | -60% evaluaciones (97→63) |
| ✅ Cron jobs deduplicados (solo pg_cron) | Sin alertas Telegram duplicadas |
| ✅ Edge Functions sin JWT | Sin errores 401 |
| ✅ Tablas `ship_*` eliminadas | BD más limpia |

### Fase 2: Optimizaciones de Código

| Cambio | Archivo | Impacto |
|--------|---------|---------|
| ✅ Cache de plantillas (singleton) | `useEntityTemplates.js` | -10-20 queries/carga |
| ✅ Select específico (no `*`) | `useEntities.js` | -50% payload |
| ✅ Select específico (no `*`) | `useEvents.js` | -50% payload |
| ✅ Índice compuesto | Migración Supabase | Queries más rápidas |
| ✅ Monitor redundante eliminado | `useFlightRadar.js` | Sin duplicación frontend/cron |

### Ahorro Total Estimado
```
ANTES: ~5,000 queries/hora (con 50 usuarios)
DESPUÉS: ~2,000 queries/hora
REDUCCIÓN: ~60%

Cache de plantillas: TTL 5 minutos (compartido entre componentes)
Índice parcial: idx_entities_visible_active_created
```

---

## Sistema de Auditoría

**Ubicación**: Configuración → Auditoría (solo admins)

**Eventos registrados**:
- `login`, `logout`, `login_failed`, `password_change`, `session_refresh`

**Datos capturados**:
- IP, dispositivo, navegador, SO, timestamp, resultado

**Componentes**:
- `src/components/Settings/AuditSection.jsx`
- `src/hooks/useAuditLog.js`
- Tablas: `user_audit_logs`, `user_sessions`

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/lib/supabase.js` | Cliente Supabase con métricas |
| `src/lib/realtimeManager.js` | Singleton para Realtime |
| `src/hooks/useFlightRadar.js` | Hook principal de vuelos |
| `src/hooks/useAircraftRegistry.js` | Hook de inventario |
| `docker-entrypoint.sh` | Setup de Docker (sin cron jobs) |

---

## Monitoreo

### Métricas en Frontend
```javascript
// En consola del navegador
window.supabaseMetrics()     // Ver estadísticas de queries
window.resetSupabaseMetrics() // Resetear métricas
window.realtimeManager.getStatus() // Estado de Realtime
```

### Logs de Edge Functions
```sql
-- En Supabase Dashboard → Logs
SELECT * FROM pg_cron.job_run_details 
ORDER BY start_time DESC LIMIT 10;
```
