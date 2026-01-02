# SAE-RADAR - Esquema de Base de Datos

> PostgreSQL + PostGIS en Supabase  
> Última actualización: 2026-01-02

## Tablas Principales

### `entities` - Entidades Militares
Buques, aeronaves, tropas y vehículos rastreados en el mapa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | TEXT | Nombre de la entidad |
| class | TEXT | Clase (ej: "Arleigh Burke") |
| type | TEXT | destructor, fragata, avion, tropas, tanque, submarino, portaaviones, anfibio, insurgente, vehiculo, lugar |
| status | TEXT | activo, patrullando, estacionado, en_transito, en_vuelo, vigilancia |
| position | GEOGRAPHY(POINT) | Ubicación PostGIS |
| latitude/longitude | NUMERIC | Coordenadas (generadas) |
| heading | INTEGER | Rumbo 0-360° |
| speed | NUMERIC | Velocidad |
| template_id | UUID | FK a entity_templates |
| is_visible | BOOLEAN | Visibilidad en mapa |
| archived_at | TIMESTAMPTZ | Soft delete |

### `entity_templates` - Plantillas Base
14 plantillas genéricas por tipo de entidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| code | VARCHAR | Slug único (ej: "destructor-general") |
| name | VARCHAR | Nombre de la plantilla |
| category | VARCHAR | Categoría (ej: "Buques de Guerra") |
| entity_type | VARCHAR | Tipo de entidad |
| icon_url | TEXT | URL del icono i2 |

### `events` - Timeline de Eventos
Eventos manuales y automáticos (incursiones).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| title | VARCHAR | Título del evento |
| description | TEXT | Descripción completa |
| event_date | TIMESTAMPTZ | Fecha del evento |
| type | VARCHAR | evento, noticia, informe |
| priority_level | VARCHAR | normal, importante, urgente |
| source_reliability | VARCHAR | A-F (confiabilidad fuente) |
| info_credibility | VARCHAR | 1-6 (credibilidad info) |

---

## Tablas de Incursiones

### `incursion_sessions` - Sesiones de Incursión
Agrupa todas las detecciones de un vuelo mientras está en la zona.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| flight_id | TEXT | ICAO24 hex |
| callsign | TEXT | Callsign del vuelo |
| aircraft_type | TEXT | Código (ej: "C17") |
| zone_code | TEXT | País (ej: "VEN") |
| status | TEXT | active, pending_exit, closed |
| started_at | TIMESTAMPTZ | Inicio de incursión |
| ended_at | TIMESTAMPTZ | Fin de incursión |
| detection_count | INTEGER | Número de detecciones |
| avg_altitude | NUMERIC | Altitud promedio |
| avg_speed | NUMERIC | Velocidad promedio |

### `incursion_waypoints` - Posiciones Durante Incursión
Cada punto detectado durante una incursión (usado para trail en screenshots).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| session_id | UUID | FK a incursion_sessions |
| flight_id | TEXT | ICAO24 hex |
| latitude/longitude | NUMERIC | Posición |
| altitude | INTEGER | Altitud en ft |
| speed | INTEGER | Velocidad en kts |
| detected_at | TIMESTAMPTZ | Timestamp |

### `incursion_monitor_config` - Configuración del Monitor
Una sola fila con configuración global.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| is_active | BOOLEAN | Monitor activo |
| query_bounds_* | NUMERIC | Límites de escaneo N/S/E/W |
| icao24_military_prefixes | TEXT[] | Prefijos hex militares |
| telegram_destinations | JSONB | Array de destinos Telegram |

---

## Tablas de Límites Geográficos

> **Nota**: Las Edge Functions usan estas tablas para detección.
> El frontend usa archivos locales (`src/data/*.js`) para carga instantánea.

### `maritime_boundaries_cache` - EEZ
Polígonos marítimos de Marine Regions (200mn).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| country_code | VARCHAR | ISO3 (ej: "VEN") |
| country_name | VARCHAR | Nombre del país |
| geojson | JSONB | GeoJSON del polígono |

### `terrestrial_boundaries_cache` - Límites Terrestres
Polígonos terrestres de Natural Earth/GADM.

---

## Tablas del Registro de Aeronaves

### `military_aircraft_registry` - Inventario Principal
Cada aeronave militar única detectada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| icao24 | VARCHAR(10) | **PK** - Código hex único |
| callsigns_used | TEXT[] | Array de callsigns observados |
| aircraft_type | VARCHAR(10) | Código ICAO (C30J, K35R) |
| military_branch | VARCHAR(20) | USAF, USN, USMC, USA, USCG |
| probable_base_icao | VARCHAR(10) | Código ICAO base probable |
| first_seen | TIMESTAMPTZ | Primera detección |
| last_seen | TIMESTAMPTZ | Última detección |
| total_detections | INTEGER | Veces detectado |
| total_incursions | INTEGER | Incursiones a Venezuela |

### `aircraft_model_catalog` - Especificaciones Técnicas
Catálogo de 82+ modelos de aeronave.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| aircraft_type | VARCHAR(10) | **PK** - Código ICAO |
| aircraft_name | VARCHAR(100) | Nombre completo |
| category | VARCHAR(50) | fighter, transport, tanker, etc. |
| max_speed_kts | INTEGER | Velocidad máxima |
| is_armed | BOOLEAN | ¿Armado? |

### `aircraft_location_history` - Trail de Posiciones
Historial de ubicaciones para reconstruir vuelos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| icao24 | VARCHAR(10) | FK a registry |
| event_type | VARCHAR(20) | detection, departure, arrival |
| latitude/longitude | DECIMAL | Posición |
| country_code | VARCHAR(3) | País (geocodificado) |
| detected_at | TIMESTAMPTZ | Timestamp |

### `caribbean_military_bases` - Bases y Aeropuertos
40+ bases militares y aeropuertos relevantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| icao_code | VARCHAR(10) | **PK** - Código ICAO |
| name | VARCHAR(200) | Nombre de la base |
| country_code | VARCHAR(3) | Código ISO del país |
| base_type | VARCHAR(50) | military, joint, civilian |

---

## Tablas de Usuarios

### `user_profiles` - Perfiles de Usuario
Extensión de auth.users con datos adicionales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | FK a auth.users |
| username | VARCHAR | Username único |
| role | VARCHAR | admin, operator, analyst, viewer |
| is_active | BOOLEAN | Cuenta activa |

### `user_audit_logs` - Logs de Actividad
Registro completo de actividad de usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_id | UUID | FK a auth.users |
| event_type | TEXT | login, logout, login_failed, etc. |
| ip_address | TEXT | Dirección IP |
| device_type | TEXT | desktop, mobile, tablet |
| created_at | TIMESTAMPTZ | Timestamp |

---

## Vista Materializada

### `incursion_stats_bundle`
Consolida 7 queries de estadísticas en 1 sola.

```sql
-- Consultar
SELECT * FROM incursion_stats_bundle WHERE id = 1;

-- Refrescar (cada 10 min via pg_cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;
```

---

## Extensiones PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## RLS (Row Level Security)

Las siguientes tablas tienen RLS habilitado:
- `entities`, `entity_templates`, `events`, `event_entities`
- `incursion_sessions`, `incursion_waypoints`, `incursion_monitor_config`
- `maritime_boundaries_cache`, `terrestrial_boundaries_cache`
- `user_profiles`, `user_audit_logs`, `user_sessions`
- `military_aircraft_registry`, `aircraft_model_catalog`, `aircraft_location_history`

**Políticas consolidadas**: 63 políticas totales (reducidas de 97).

---

## Funciones Útiles

### PostGIS
```sql
-- Distancia entre dos puntos (metros)
ST_Distance(position1::geography, position2::geography)

-- Verificar si punto está dentro de polígono
ST_Within(point::geometry, polygon::geometry)

-- Crear punto desde lat/lon
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
```

### Custom
```sql
-- Recalcular base probable de aeronave
SELECT recalculate_probable_base('AE54C7');
```
