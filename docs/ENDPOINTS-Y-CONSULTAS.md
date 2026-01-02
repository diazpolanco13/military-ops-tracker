# SAE-RADAR - Endpoints y Consultas

> Documento de referencia: APIs consumidas, consultas a Supabase y recomendaciones  
> Última actualización: 2026-01-02 (Optimizaciones de rendimiento)

---

## 1. APIs Externas Consumidas

### FlightRadar24

El sistema usa **dos APIs diferentes** de FlightRadar24:

#### API Pública (Gratis - Sin límite)
```
GET https://data-cloud.flightradar24.com/zones/fcgi/feed.js
?bounds=27,8,-85,-58
&faa=1&satellite=1&mlat=1&adsb=1&gnd=0&air=1
```
- **Uso**: Vuelos en el mapa (cada 30 seg)
- **Llamada desde**: Edge Function `flightradar-proxy`
- **Filtro militar**: Server-side en Edge Function (patrones ICAO24, callsign)
- **On-click**: Trail via `/clickhandler` (también gratis)

#### API Pagada (Con créditos)
```
# Lista de vuelos militares (categoría M)
GET https://fr24api.flightradar24.com/api/live/flight-positions/full
?bounds=22,8,-75,-58&categories=M
Authorization: Bearer {FR24_API_TOKEN}

# Trail de vuelo específico
GET https://fr24api.flightradar24.com/api/flight/tracks?flight={id}
Authorization: Bearer {FR24_API_TOKEN}
```
- **Uso**: Sistema de alertas (detección de incursiones)
- **Llamada desde**: Edge Function `military-airspace-monitor`
- **Consumo estimado**: ~22,000 llamadas/mes (cada 2 min + trails)
- **Ventaja**: `categories=M` filtra militares directamente en FR24

#### Flujo de APIs
```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (mapa cada 30s)                                │
│ └── flightradar-proxy → API PÚBLICA (gratis)            │
│                                                         │
│ BACKEND (alertas cada 2min)                             │
│ └── military-airspace-monitor → API PAGADA (créditos)   │
│                                                         │
│ ON-CLICK (detalles + trail)                             │
│ └── flightradar-proxy → clickhandler (gratis)           │
└─────────────────────────────────────────────────────────┘
```

---

### Telegram Bot API

```
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage
```
- **Uso**: Alertas de incursiones
- **Llamada desde**: Edge Functions `military-airspace-monitor`, `incursion-session-closer`

---

### Screenshot Service (Propio)

```
POST https://operativus.net/screenshot
Authorization: Bearer {SCREENSHOT_AUTH_TOKEN}
Content-Type: application/json

{
  "flight": "AE54C7",
  "callsign": "SHARK33",
  "lat": 10.5,
  "lon": -66.9,
  "mode": "entry|exit",
  "waypoints": [...]
}
```
- **Uso**: Generar capturas para Telegram
- **Llamada desde**: Edge Functions de incursiones

---

### Nominatim (OpenStreetMap)

```
GET https://nominatim.openstreetmap.org/reverse
?lat={latitude}&lon={longitude}&format=json
User-Agent: SAE-RADAR/1.0
```
- **Uso**: Reverse geocoding para detectar país
- **Rate limit**: 1 request/segundo (obligatorio)
- **Llamada desde**: Frontend (`AircraftDetailView.jsx`)

---

## 2. Edge Functions de Supabase

### `flightradar-proxy` (v24)

**Propósito**: Proxy para datos de FlightRadar24 (evita CORS)

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/functions/v1/flightradar-proxy?bounds=...` | GET | ❌ No | Obtener vuelos |
| `/functions/v1/flightradar-proxy?bounds=...&military=true` | GET | ❌ No | Solo militares (filtro server-side) |
| `/functions/v1/flightradar-proxy?flight={id}` | GET | ❌ No | Obtener trail |
| `/functions/v1/flightradar-proxy?stats=true` | GET | ❌ No | Info de versión |

**Parámetros**:
- `bounds`: Área geográfica (north,south,west,east)
- `military=true`: Filtro server-side por patrones ICAO24/callsign
- `flight={id}`: Trail completo via clickhandler (gratis)

**Respuesta con military=true**:
```json
{
  "_source": "public_api_military_filtered",
  "_version": "V24",
  "_total_flights": 847,
  "_military_flights": 4,
  "abc123": [...],
  "def456": [...]
}
```

---

### `military-airspace-monitor` (v38)

**Propósito**: Detectar incursiones y enviar alertas

| Trigger | Schedule | Auth | API |
|---------|----------|------|-----|
| pg_cron | `*/2 * * * *` | ❌ No | **PAGADA** (fr24api) |

**Flujo**:
```
1. GET fr24api.flightradar24.com/api/live/flight-positions/full
   ?bounds=22,8,-75,-58&categories=M
   → Respuesta: Array de vuelos militares
   
2. Filtrar USA (ICAO24 AE/AF, callsigns RCH/CNV/NAVY/etc.)

3. pointInGeoJSON() contra límites de países monitoreados

4. Si incursión NUEVA:
   a) GET /api/flight/tracks?flight={id} (trail)
   b) POST operativus.net/screenshot (imagen)
   c) POST api.telegram.org/sendPhoto (alerta)
   d) INSERT incursion_sessions + incursion_waypoints
```

**Estadísticas** (consultar via SQL):
```sql
SELECT total_executions, total_incursions_detected, last_execution_stats
FROM incursion_monitor_config;
```

---

### `incursion-session-closer` (v12)

**Propósito**: Cerrar sesiones inactivas y enviar resumen

| Trigger | Schedule | Auth | API |
|---------|----------|------|-----|
| pg_cron | `*/5 * * * *` | ❌ No | Screenshot (propio) |

**Flujo**:
```
1. SELECT * FROM incursion_sessions WHERE status='pending_exit'
   AND last_seen_at < (now - umbral_inactividad)
   
2. Para cada sesión a cerrar:
   a) SELECT * FROM incursion_waypoints (trail guardado)
   b) POST operativus.net/screenshot (imagen con trail)
   c) POST api.telegram.org/sendPhoto (resumen)
   d) UPDATE incursion_sessions SET status='closed'
   e) UPDATE events (actualizar evento calendario)
```

**Nota**: No llama a FR24 API - usa waypoints ya guardados

---

### `incursion-situation-report` (v4)

**Propósito**: Reporte consolidado de aeronaves activas

| Trigger | Schedule | Auth |
|---------|----------|------|
| pg_cron | `*/10 * * * *` | ❌ No |

---

### `aircraft-registry-collector` (v14)

**Propósito**: Registrar aeronaves militares en inventario

| Trigger | Schedule | Auth |
|---------|----------|------|
| pg_cron | `*/5 * * * *` | ❌ No |

**Acciones**:
1. Consulta API FlightRadar24
2. Filtra militares USA
3. Upsert en `military_aircraft_registry`
4. Actualiza `aircraft_location_history`

---

## 3. Consultas a Supabase (Frontend)

### Consultas Frecuentes (Optimizadas 2026-01-02)

| Hook | Tabla(s) | Frecuencia | Optimización |
|------|----------|------------|--------------|
| `useEntities` | `entities` | Realtime + inicial | ✅ Select específico (17 columnas) |
| `useEvents` | `events` | Realtime + inicial | ✅ Select específico (11 columnas) |
| `useEntityTemplates` | `entity_templates` | 1x (cache 5min) | ✅ Cache singleton compartido |
| `useFlightRadar` | `flights_cache` | 30 seg | ✅ Sin monitor duplicado |
| `useAircraftRegistry` | `military_aircraft_registry` | On-demand | Paginado (20/página) |
| `useIncursionStats` | `incursion_stats_bundle` | 10 min | Vista materializada |
| `useUserRole` | `user_profiles` | 1x login | Cacheado |

### Consultas Optimizadas

```javascript
// ✅ CORRECTO: Vista materializada (1 query)
supabase.from('incursion_stats_bundle').select('*').eq('id', 1).single()

// ❌ ANTES: 7 queries paralelas
Promise.all([
  supabase.from('incursion_prediction_summary').select('*'),
  supabase.from('incursion_patterns_hourly').select('*'),
  // ... 5 más
])
```

### Paginación

```javascript
// ✅ CORRECTO: Paginado con count
const { data, count } = await supabase
  .from('military_aircraft_registry')
  .select('icao24, callsigns_used, aircraft_type, last_seen', { count: 'exact' })
  .order('last_seen', { ascending: false })
  .range(offset, offset + pageSize - 1);
```

---

## 4. Supabase Realtime

### Canales Activos

| Tabla | Canal | Eventos |
|-------|-------|---------|
| `entities` | `entities-changes` | INSERT, UPDATE, DELETE |
| `events` | `events-changes` | INSERT, UPDATE, DELETE |
| `incursion_sessions` | `incursions-changes` | INSERT, UPDATE |

### Gestión Centralizada

```javascript
// src/lib/realtimeManager.js
const manager = new RealtimeManager();

// Suscribirse
manager.subscribe('entities', 'changes', callback);

// Estado
manager.getStatus(); // { connected: true, channels: [...] }
```

---

## 5. Cron Jobs (pg_cron)

### Jobs Activos

```sql
SELECT jobid, jobname, schedule, active FROM cron.job;
```

| Job | Schedule | Función |
|-----|----------|---------|
| `military-airspace-monitor-cron` | `*/2 * * * *` | Detección incursiones |
| `incursion-session-closer-cron` | `*/5 * * * *` | Cierre sesiones |
| `situation-report-every-10-min` | `*/10 * * * *` | Reporte situación |
| `aircraft-registry-collector` | `*/5 * * * *` | Inventario aeronaves |
| `reset-new-today-flags` | `0 4 * * *` | Reset flags diarios |

### Ejecución

```sql
-- Los cron jobs llaman Edge Functions via pg_net
SELECT net.http_post(
  url := 'https://xxx.supabase.co/functions/v1/military-airspace-monitor',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{}'::jsonb
);
```

---

## 6. Métricas de Uso

### Verificar en Frontend

```javascript
// Ver estadísticas de queries
window.supabaseMetrics()
// {
//   total: 45,
//   byPath: { "/rest/v1/entities": 5, ... },
//   byStatus: { "200": 43, "304": 2 }
// }

// Resetear métricas
window.resetSupabaseMetrics()
```

### Verificar en Supabase

```sql
-- Últimas ejecuciones de cron
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC LIMIT 10;

-- Logs de Edge Functions
-- Dashboard → Logs → Edge Functions
```

---

## 7. Recomendaciones

### ✅ Buenas Prácticas Implementadas

1. **Vistas Materializadas**: `incursion_stats_bundle` reduce 7 queries a 1
2. **Paginación**: Inventario de aeronaves paginado (20 por página)
3. **Select Específico**: Solo columnas necesarias (no `select('*')`)
4. **Realtime Centralizado**: `RealtimeManager` evita canales duplicados
5. **Cache de Plantillas**: Singleton con TTL 5min, compartido entre componentes
6. **Edge Functions sin JWT**: Permite ejecución desde pg_cron
7. **Índice Compuesto**: `idx_entities_visible_active_created` para query principal
8. **Filtro Militar Server-side**: Reduce transferencia de ~800 a ~5 vuelos

### ⚠️ Cosas a Evitar

1. **Polling agresivo**: No hacer queries cada <5 segundos
2. **Queries sin límite**: Siempre usar `.limit()` o paginación
3. **Múltiples canales**: Usar `RealtimeManager` en lugar de crear canales directos
4. **JWT hardcodeado**: Nunca commitear tokens en código

### 🚀 Optimizaciones Futuras (Pendientes)

1. **Cache global de vuelos**: Usar Realtime en lugar de polling por usuario
2. **Catálogo estático**: Generar JSON en build time para modelos de aeronaves
3. **API pública para monitor**: Cambiar `military-airspace-monitor` a API pública + filtro local
4. **Compresión de historial**: Retención de 30 días para `aircraft_location_history`

### 📊 Consumo Actual de APIs

| API | Proceso | Frecuencia | Llamadas/mes |
|-----|---------|------------|--------------|
| FR24 Pública | Mapa (frontend) | 30 seg | Ilimitado |
| FR24 Pública | On-click trail | On-demand | Ilimitado |
| **FR24 Pagada** | Monitor alertas | 2 min | ~21,600 |
| **FR24 Pagada** | Trail incursión | Por incursión | ~100 |
| Screenshot | Alertas Telegram | Por incursión | ~200 |

**Total API Pagada**: ~22,000 llamadas/mes

---

## 8. Troubleshooting

### Error 429 (Rate Limiting)

```javascript
// Verificar qué endpoints están siendo más llamados
window.supabaseMetrics().byPath
```

**Solución**: Aumentar intervalos, agregar cache, usar vistas materializadas

### Error 401 (Unauthorized)

**Posibles causas**:
- ANON_KEY expirada o incorrecta
- Edge Function con `verify_jwt: true` llamada sin token

**Solución**: Verificar `.env`, redesplegar Edge Functions con `verify_jwt: false`

### Timeout en Queries

**Posibles causas**:
- Query sin índice
- Demasiados datos
- Conexión saturada

**Solución**: Agregar `.limit()`, verificar índices, usar paginación

---

## 9. Configuración de Alertas

### Destinos Telegram

```sql
-- Verificar destinos configurados
SELECT telegram_destinations FROM incursion_monitor_config;
```

Formato:
```json
[
  {"name": "Canal Principal", "chat_id": "-100xxx", "enabled": true}
]
```

### Templates de Mensaje

Los templates soportan variables como:
- `{{aircraft_model}}`, `{{callsign}}`, `{{hex_code}}`
- `{{altitude}}`, `{{speed}}`, `{{heading}}`
- `{{zone_name}}`, `{{timestamp}}`
- `{{duration}}`, `{{detection_count}}` (solo en salida)

