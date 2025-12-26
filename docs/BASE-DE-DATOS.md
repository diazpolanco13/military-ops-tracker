# SAE-RADAR - Esquema de Base de Datos

> PostgreSQL + PostGIS en Supabase

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
| crew_count | INTEGER | Tripulación |
| embarked_personnel | INTEGER | Personal embarcado |
| embarked_aircraft | INTEGER | Aeronaves embarcadas |

### `entity_templates` - Plantillas Base
Modelos reutilizables para crear entidades (25 plantillas).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| code | VARCHAR | Slug único (ej: "destructor-general") |
| name | VARCHAR | Nombre de la plantilla |
| category | VARCHAR | Categoría (ej: "Buques de Guerra") |
| entity_type | VARCHAR | Tipo de entidad |
| icon_url | TEXT | URL del icono i2 |
| displacement_tons | INTEGER | Desplazamiento |
| max_speed_knots | INTEGER | Velocidad máxima |
| crew_count | INTEGER | Tripulación estándar |
| armamento | TEXT | Armamento principal |

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
| latitude/longitude | NUMERIC | Ubicación opcional |
| tags | TEXT[] | Etiquetas |

### `event_entities` - Relación Eventos ↔ Entidades
Many-to-many entre eventos y entidades.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| event_id | UUID | FK a events |
| entity_id | UUID | FK a entities |
| relationship_type | VARCHAR | mentioned, involved, location, subject |

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
| aircraft_model | TEXT | Nombre completo |
| zone_code | TEXT | País (ej: "VEN") |
| status | TEXT | active, pending_exit, closed |
| started_at | TIMESTAMPTZ | Inicio de incursión |
| ended_at | TIMESTAMPTZ | Fin de incursión |
| detection_count | INTEGER | Número de detecciones |
| avg_altitude | NUMERIC | Altitud promedio |
| avg_speed | NUMERIC | Velocidad promedio |
| event_id | UUID | FK a events (calendario) |
| day_of_week | SMALLINT | 0=Domingo...6=Sábado |
| hour_of_day | SMALLINT | 0-23 UTC |
| entry_quadrant | TEXT | NE, NW, SE, SW |

### `incursion_waypoints` - Posiciones Durante Incursión
Cada punto detectado durante una incursión. **Usado para generar el trail visual en screenshots de salida.**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| session_id | UUID | FK a incursion_sessions |
| flight_id | TEXT | ICAO24 hex |
| latitude/longitude | NUMERIC | Posición |
| altitude | INTEGER | Altitud en ft |
| speed | INTEGER | Velocidad en kts |
| heading | INTEGER | Rumbo |
| detected_at | TIMESTAMPTZ | Timestamp |

> **Uso en Screenshots**: Al cerrar una sesión (`incursion-session-closer`), se recuperan todos los waypoints ordenados por `detected_at` para renderizar el trail completo en el screenshot de salida.

### `incursion_monitor_config` - Configuración del Monitor
Una sola fila con configuración global.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| is_active | BOOLEAN | Monitor activo |
| query_bounds_* | NUMERIC | Límites de escaneo N/S/E/W |
| zone_center_lat/lon | NUMERIC | Centro para cuadrantes |
| inactivity_threshold_minutes | INTEGER | Tiempo para cerrar sesión |
| icao24_military_prefixes | TEXT[] | Prefijos hex militares |
| telegram_destinations | JSONB | Array de destinos Telegram |
| telegram_entry_template | TEXT | Template mensaje entrada |
| telegram_exit_template | TEXT | Template mensaje salida |
| screenshot_service_url | TEXT | URL del servicio de screenshots |
| screenshot_auth_token | TEXT | Token de autenticación para screenshots |

---

## Tablas de Límites Geográficos

### `maritime_boundaries_cache` - EEZ (Zona Económica Exclusiva)
Polígonos marítimos de Marine Regions.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| country_code | VARCHAR | ISO3 (ej: "VEN") |
| country_name | VARCHAR | Nombre del país |
| zone_name | VARCHAR | Nombre de la zona específica |
| geojson | JSONB | GeoJSON del polígono |
| mrgid | INTEGER | ID de Marine Regions |

### `terrestrial_boundaries_cache` - Límites Terrestres
Polígonos terrestres de Natural Earth/GADM.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| country_code | VARCHAR | ISO3 |
| country_name | VARCHAR | Nombre del país |
| geojson | JSONB | GeoJSON del polígono |
| source | VARCHAR | Natural Earth, GADM, etc. |

### `maritime_boundaries_settings` - Configuración Visual
Preferencias de visualización por país.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| country_code | VARCHAR | ISO3 |
| is_visible | BOOLEAN | Mostrar en mapa |
| alert_enabled | BOOLEAN | Enviar alertas Telegram |
| color | VARCHAR | Color hex |
| opacity | NUMERIC | Opacidad 0-1 |

---

## Tablas de Patrones Militares

### `military_callsign_patterns` - Patrones de Callsign
32 patrones para identificar vuelos militares USA.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| pattern | VARCHAR | Prefijo (ej: "RCH", "BAT") |
| description | VARCHAR | Descripción |
| mission_type | VARCHAR | transport, reconnaissance, patrol, etc. |
| military_branch | VARCHAR | USAF, Navy, Marines, Army, Coast Guard |
| alert_priority | INTEGER | 1 (crítica) a 5 (baja) |

### `military_aircraft_patterns` - Tipos de Aeronave
18 modelos de aeronave militar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| aircraft_code | VARCHAR | Código FR24 (ej: "C17", "P8") |
| aircraft_name | VARCHAR | Nombre completo |
| category | VARCHAR | transport, reconnaissance, tanker, awacs, fighter, etc. |
| alert_priority | INTEGER | Prioridad de alerta |

---

## Tablas de Buques

### `ship_positions` - Posiciones AIS
Última posición conocida de cada buque.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| mmsi | VARCHAR | Maritime Mobile Service Identity (único) |
| ship_name | VARCHAR | Nombre del buque |
| ship_type | INTEGER | Código AIS de tipo |
| flag_country | VARCHAR | Bandera |
| latitude/longitude | NUMERIC | Posición |
| speed | NUMERIC | Velocidad |
| heading | INTEGER | Rumbo |
| destination | VARCHAR | Destino |
| is_military | BOOLEAN | ¿Militar? |
| last_update | TIMESTAMPTZ | Última actualización |

### `ship_alerts` - Alertas de Buques
Similar a airspace_alerts pero para tráfico marítimo.

---

## Tablas de Inteligencia

### `intelligence_events` - Eventos de Inteligencia
Eventos detectados automáticamente por Grok AI.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| event_type | VARCHAR | sighting, news, exercise, deployment, etc. |
| priority | VARCHAR | low, medium, high, urgent |
| title | VARCHAR | Título |
| summary | TEXT | Resumen |
| source_type | VARCHAR | twitter, news, official |
| source_credibility | VARCHAR | official, verified, unverified |
| confidence_score | INTEGER | 0-100 |
| status | VARCHAR | pending, verified, dismissed, archived |

### `intelligence_tweets_cache` - Cache de Tweets
Tweets procesados para evitar duplicados.

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
| organizacion | VARCHAR | Organización |
| cargo | VARCHAR | Cargo |

### `role_permissions` - Permisos por Rol
Configuración de permisos JSONB por rol.

---

## Tablas de Auditoría

### `user_audit_logs` - Logs de Actividad de Usuarios
Registro completo de actividad de usuarios en el sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK a auth.users |
| user_email | TEXT | Email del usuario (respaldo) |
| event_type | TEXT | login, logout, login_failed, password_change, session_refresh |
| ip_address | TEXT | Dirección IP del cliente |
| user_agent | TEXT | User-Agent completo |
| device_type | TEXT | desktop, mobile, tablet |
| browser | TEXT | Navegador (Chrome, Safari, Firefox) |
| os | TEXT | Sistema operativo |
| success | BOOLEAN | Resultado de la operación |
| error_message | TEXT | Mensaje de error (si aplica) |
| metadata | JSONB | Datos adicionales |
| created_at | TIMESTAMPTZ | Timestamp del evento |

**Índices**:
- `idx_audit_user_id`: Por user_id para historial
- `idx_audit_created_at`: Por fecha para filtros
- `idx_audit_event_type`: Por tipo de evento

### `user_sessions` - Sesiones de Usuario
Tracking de sesiones activas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK a auth.users |
| session_token | TEXT | Token de sesión |
| ip_address | TEXT | IP de la sesión |
| device_info | JSONB | Info del dispositivo |
| started_at | TIMESTAMPTZ | Inicio de sesión |
| last_activity | TIMESTAMPTZ | Última actividad |
| ended_at | TIMESTAMPTZ | Fin de sesión |
| is_active | BOOLEAN | Sesión activa |

### `movement_history` - Historial de Movimientos
Registra cada cambio de posición de entidades.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| entity_id | UUID | FK a entities |
| old_position | GEOGRAPHY | Posición anterior |
| new_position | GEOGRAPHY | Nueva posición |
| distance_meters | NUMERIC | Distancia calculada |
| moved_at | TIMESTAMPTZ | Timestamp |

### `api_usage` - Uso de API
Tracking de llamadas a APIs externas.

---

## Extensiones PostgreSQL

```sql
-- Requeridas
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## RLS (Row Level Security)

Las siguientes tablas tienen RLS habilitado:
- `entities` ✅
- `entity_templates` ✅
- `events` ✅
- `event_entities` ✅
- `maritime_boundaries_cache` ✅
- `terrestrial_boundaries_cache` ✅
- `incursion_sessions` ✅
- `incursion_waypoints` ✅
- `incursion_monitor_config` ✅
- `user_profiles` ✅
- `intelligence_events` ✅
- `user_audit_logs` ✅ (solo admins pueden leer)
- `user_sessions` ✅ (solo admins pueden leer)

## Funciones PostGIS Útiles

```sql
-- Distancia entre dos puntos (metros)
ST_Distance(position1::geography, position2::geography)

-- Verificar si punto está dentro de polígono
ST_Within(point::geometry, polygon::geometry)

-- Crear punto desde lat/lon
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)

-- Extraer lat/lon de geometry
ST_Y(position::geometry) -- latitude
ST_X(position::geometry) -- longitude
```

