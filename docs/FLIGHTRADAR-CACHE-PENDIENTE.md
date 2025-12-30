# 🛩️ FlightRadar Cache - Documentación de Arquitectura

## Estado: ⚠️ PARCIALMENTE IMPLEMENTADO

Fecha: 2025-12-30

---

## 📋 Problema Original

### Síntomas observados:
- "Session timeout (puede ser saturación de red)" frecuentes
- "Usando permisos por defecto (timeout de red)"
- Trails (trayectorias) mostrando "0 puntos"
- Múltiples peticiones simultáneas saturando conexión

### Causa raíz:
Cada usuario conectado hacía peticiones independientes a FlightRadar24:
- 10 usuarios = 10 peticiones cada 30 segundos
- 1,500 vuelos por petición × 10 usuarios = 15,000 vuelos procesados/30s
- Saturación de la conexión Supabase por queries paralelas

---

## 🏗️ Arquitectura Implementada

### Componentes nuevos:

#### 1. Tabla `flights_cache` (Supabase)
```sql
CREATE TABLE flights_cache (
  id TEXT PRIMARY KEY DEFAULT 'military_flights',
  flights JSONB NOT NULL DEFAULT '[]',
  total_fetched INTEGER DEFAULT 0,
  military_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system',
  update_duration_ms INTEGER DEFAULT 0
);
```

#### 2. Edge Function `flights-cache-updater` (v2)
- **URL**: `https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/flights-cache-updater`
- **Función**: Consulta FlightRadar24, filtra militares, guarda en cache
- **Frecuencia**: Cada minuto (pg_cron)
- **Fix v2**: ID del vuelo es la KEY del objeto FR24 (no ICAO24)

#### 3. Cron Job (pg_cron)
```sql
SELECT cron.schedule(
  'update_flights_cache',
  '* * * * *',  -- Cada minuto
  $$
  SELECT net.http_post(
    url := 'https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/flights-cache-updater',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  )
  $$
);
```

#### 4. Frontend `useFlightRadar.js`
```javascript
// Nuevo flujo:
1. fetchFromCache() - Lee de flights_cache (instantáneo)
2. Si cache > 2 min → fallback a API directa
3. triggerCacheUpdate() - Forzar actualización manual
```

### Flujo de datos:
```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA NUEVA                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [pg_cron] ──(cada 1 min)──► [flights-cache-updater]       │
│                                        │                    │
│                                        ▼                    │
│                              [FlightRadar24 API]           │
│                                        │                    │
│                                        ▼                    │
│                              [flights_cache tabla]          │
│                                        │                    │
│              ┌─────────────────────────┼─────────────────┐  │
│              ▼                         ▼                 ▼  │
│         [Usuario A]             [Usuario B]        [Usuario C]
│                                                             │
│  RESULTADO: 1 petición/min sin importar cuántos usuarios   │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Lo que SÍ funciona

1. **Cache se actualiza correctamente**
   - 12-15 vuelos militares detectados
   - IDs correctos de FlightRadar24 (ej: `3db6353c`)
   - Actualización cada minuto por pg_cron

2. **Frontend lee del cache**
   - Mensajes en consola: `✅ Cache: 12 vuelos militares (de 1500 total, edad: 18s)`
   - Respuesta instantánea

3. **Vuelos se muestran en el mapa**
   - Iconos de aviones visibles
   - Clustering funcionando

---

## ❌ Problemas PENDIENTES

### 1. Session Timeout persiste
```
⚠️ Session timeout (puede ser saturación de red)
⚠️ Usando permisos por defecto (timeout de red)
```
**Causa probable**: Otras queries de Supabase (no relacionadas con FlightRadar) siguen saturando la conexión:
- `useUserRole` - timeout al verificar sesión
- `useAircraftRegistry` - queries al inventario
- `useShipRadar` - 500 barcos cargados
- `RealtimeManager` - suscripciones

**Posible solución**: 
- Revisar y optimizar otros hooks
- Implementar queue de peticiones
- Aumentar timeouts o añadir reintentos

### 2. Trails con 0 puntos
```
Trail recibido: 0 puntos
```
**Causa probable**: 
- La API de detalles (`/clickhandler`) requiere autenticación diferente
- El proxy `flightradar-proxy` puede no estar pasando el `flight` param correctamente
- Rate limiting de FlightRadar24 para detalles

**Para investigar**:
```javascript
// En flightRadarService.js, función getFlightDetails()
const url = `${FLIGHTRADAR_PROXY_URL}?flight=${flightId}`;
// Verificar que flightId sea correcto (ej: "3db6353c", no "AE4A60")
```

### 3. Posible duplicación de peticiones
- El frontend aún puede estar llamando a la API directa como fallback
- Verificar que `useCache = true` esté activo por defecto

---

## 🔧 Comandos útiles para debugging

### Verificar estado del cache:
```sql
SELECT 
  military_count,
  total_fetched,
  last_updated_at,
  updated_by,
  update_duration_ms,
  (flights->0->>'id') as sample_flight_id,
  (flights->0->>'icao24') as sample_icao24,
  (flights->0->>'callsign') as sample_callsign
FROM flights_cache
WHERE id = 'military_flights';
```

### Verificar cron job:
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'update_flights_cache';
```

### Ver historial de ejecuciones del cron:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update_flights_cache')
ORDER BY start_time DESC 
LIMIT 10;
```

### Forzar actualización manual del cache:
```sql
SELECT net.http_post(
  url := 'https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/flights-cache-updater',
  headers := jsonb_build_object('Content-Type', 'application/json'),
  body := '{}'::jsonb
);
```

### Probar Edge Function directamente:
```bash
curl -X POST "https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/flights-cache-updater" | jq .
```

---

## 📁 Archivos relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useFlightRadar.js` | Hook principal, lee del cache |
| `src/services/flightRadarService.js` | Servicio FR24, getFlightDetails() |
| `src/components/FlightRadar/FlightTrailLayer.jsx` | Dibuja trails en el mapa |
| `src/hooks/useUserRole.js` | Posible causa de timeouts |
| `supabase/functions/flights-cache-updater` | Edge Function (en Supabase) |
| `supabase/functions/flightradar-proxy` | Proxy para API FR24 |

---

## 🎯 Próximos pasos sugeridos

1. **Reducir queries paralelas**
   - Implementar queue o throttling para peticiones Supabase
   - Priorizar queries críticas

2. **Investigar trails**
   - Verificar que `flightradar-proxy` soporte el param `flight`
   - Probar manualmente: `curl "PROXY_URL?flight=3db6353c"`

3. **Optimizar otros hooks**
   - `useShipRadar`: ¿500 barcos es necesario? Paginar
   - `useAircraftRegistry`: Lazy loading
   - `useUserRole`: Aumentar reintentos

4. **Monitoreo**
   - Agregar métricas de tiempo de respuesta
   - Alertas cuando cache tiene > 2 min de antigüedad

---

## 📊 Métricas actuales

| Métrica | Antes | Después |
|---------|-------|---------|
| Peticiones FR24/min | ~20 (2/usuario) | 1 (cache) |
| Vuelos procesados/refresh | 1,500 | 12-15 (pre-filtrados) |
| Tiempo respuesta | 2-10s | <100ms |
| Timeouts | Frecuentes | Reducidos* |

*Los timeouts persisten por otras causas no relacionadas con FlightRadar

---

**Última actualización**: 2025-12-30 21:25 UTC

