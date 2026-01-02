# SAE-RADAR - Endpoints y Consultas

> Documento de referencia: APIs consumidas, consultas a Supabase y recomendaciones  
> Última actualización: 2026-01-02

---

## 1. APIs Externas Consumidas

### FlightRadar24

#### API Pública (Gratis - Sin límite)
```
GET https://data-cloud.flightradar24.com/zones/fcgi/feed.js
?bounds=27,8,-85,-58
&faa=1&satellite=1&mlat=1&adsb=1&gnd=0&air=1
```
- **Uso**: Vuelos en el mapa (cada 30 seg)
- **Llamada desde**: Frontend (`flightRadarService.js`) y Edge Functions

#### API Pagada (Con créditos)
```
GET https://fr24api.flightradar24.com/api/flight/tracks?flight={id}
Authorization: Bearer {FR24_API_TOKEN}
```
- **Uso**: Trail de vuelo (on-click)
- **Límite**: Según plan contratado
- **Llamada desde**: Edge Function `flightradar-proxy`

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

### `flightradar-proxy` (v21)

**Propósito**: Proxy para datos de FlightRadar24 (evita CORS)

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/functions/v1/flightradar-proxy` | GET | ❌ No | Obtener vuelos |
| `/functions/v1/flightradar-proxy?flight={id}` | GET | ❌ No | Obtener trail |

**Parámetros**:
- Sin parámetros: Devuelve todos los vuelos en el área
- `?flight={id}`: Devuelve trail del vuelo específico

---

### `military-airspace-monitor` (v34)

**Propósito**: Detectar incursiones y enviar alertas

| Trigger | Schedule | Auth |
|---------|----------|------|
| pg_cron | `*/2 * * * *` | ❌ No |

**Acciones**:
1. Consulta API FlightRadar24
2. Filtra aeronaves militares (ICAO24, callsign)
3. Verifica si están en zonas monitoreadas
4. Crea/actualiza sesiones de incursión
5. Envía alertas Telegram con screenshot

---

### `incursion-session-closer` (v8)

**Propósito**: Cerrar sesiones inactivas y enviar resumen

| Trigger | Schedule | Auth |
|---------|----------|------|
| pg_cron | `*/5 * * * *` | ❌ No |

**Acciones**:
1. Busca sesiones con inactividad > umbral
2. Calcula estadísticas (duración, waypoints, altitud)
3. Genera screenshot con trail completo
4. Envía resumen a Telegram
5. Marca sesión como `closed`

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

### Consultas Frecuentes

| Hook | Tabla(s) | Frecuencia | Notas |
|------|----------|------------|-------|
| `useEntities` | `entities` | Realtime + inicial | Limit 500 |
| `useEvents` | `events` | Realtime + inicial | Limit 100 |
| `useFlightRadar` | `flights_cache` | 30 seg | Cache de vuelos |
| `useAircraftRegistry` | `military_aircraft_registry`, `aircraft_model_catalog` | On-demand | Paginado |
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
3. **Select Mínimo**: Solo columnas necesarias
4. **Realtime Centralizado**: `RealtimeManager` evita canales duplicados
5. **Cache Frontend**: `flights_cache` evita polling por usuario
6. **Edge Functions sin JWT**: Permite ejecución desde pg_cron

### ⚠️ Cosas a Evitar

1. **Polling agresivo**: No hacer queries cada <5 segundos
2. **Queries sin límite**: Siempre usar `.limit()` o paginación
3. **Múltiples canales**: Usar `RealtimeManager` en lugar de crear canales directos
4. **JWT hardcodeado**: Nunca commitear tokens en código

### 🚀 Optimizaciones Futuras

1. **Cache global de vuelos**: Usar Realtime en lugar de polling
2. **Catálogo estático**: Generar JSON en build time
3. **Índices**: Verificar índices en columnas frecuentes
4. **Compresión de historial**: Retención de 30 días para `aircraft_location_history`

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

