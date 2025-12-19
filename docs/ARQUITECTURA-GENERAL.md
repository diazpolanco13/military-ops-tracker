# SAE-MONITOR - Arquitectura General

Sistema de Monitoreo de Espacio Aéreo y Marítimo para Inteligencia Estratégica

## 📋 Resumen

SAE-MONITOR es una aplicación web de inteligencia geoespacial para el seguimiento en tiempo real de:
- ✈️ Vuelos militares y comerciales (integración FlightRadar24)
- 🚢 Tráfico marítimo AIS (integración AISStream.io)
- 📍 Entidades estratégicas (buques, bases, unidades militares)
- 📅 Eventos y operaciones en timeline y calendario
- 🗺️ Límites marítimos (EEZ) y territoriales
- 🔔 **Alertas automáticas a Telegram** para incursiones en espacio aéreo/marítimo
- 📊 **Estadísticas predictivas** de patrones de incursión

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Mapas | Mapbox GL JS |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Despliegue | Dokploy (Docker) |
| Alertas | Telegram Bot API |
| FlightRadar | API Híbrida (pública + pagada) |
| ShipRadar | AISStream.io WebSocket API |
| Datos Geográficos | Marine Regions + Natural Earth + GADM |

## 🗺️ Componentes Principales

### 1. Mapa Interactivo (`src/components/Map/`)
- **MapContainer.jsx**: Contenedor principal del mapa, orquesta todas las capas
- **EntityMarker.jsx**: Marcadores de entidades (buques, bases, etc.)
- **MaritimeBoundariesLayer.jsx**: Límites marítimos EEZ por país (zona roja)

### 2. FlightRadar (`src/components/FlightRadar/`)
- **FlightLayer.jsx**: Capa GeoJSON de vuelos en el mapa
- **FlightMarker.jsx**: Iconos de aviones con rotación según heading
- **FlightPopup.jsx**: Popup al hover sobre un vuelo
- **FlightDetailsPanel.jsx**: Panel lateral con detalles completos
- **FlightTrailLayer.jsx**: Dibuja la trayectoria del vuelo seleccionado
- **FlightRadarBottomBar.jsx**: Barra flotante con controles y estadísticas
- **FlightRadarPanel.jsx**: Panel lateral con lista de vuelos filtrados

### 3. ShipRadar (`src/components/ShipRadar/`)
- **ShipLayer.jsx**: Capa de buques AIS en el mapa
- **ShipDetailsPanel.jsx**: Panel con detalles del buque seleccionado
- **ShipRadarBottomBar.jsx**: Barra flotante con controles de buques
- **ShipRadarPanel.jsx**: Panel lateral con lista de buques

### 4. Analytics (`src/components/Analytics/`)
- **IncursionStatsPanel.jsx**: Panel de estadísticas de incursiones
  - Patrones horarios y semanales
  - Distribución por cuadrante geográfico
  - Análisis por tipo de aeronave
  - Predicciones basadas en datos históricos

### 5. Gestión de Zonas (`src/components/Settings/`)
- **MaritimeBoundariesManager.jsx**: CRUD de países con límites marítimos
  - Toggle visibilidad en mapa (👁️)
  - Toggle alertas Telegram (🔔)
  - Personalización de colores y opacidad

### 6. Timeline de Eventos (`src/components/Timeline/`)
- **EventTimeline.jsx**: Timeline horizontal de eventos
- **EventCard.jsx**: Tarjeta individual de evento

### 7. Calendario (`src/components/Calendar/`)
- Vista mensual y diaria de eventos
- **Integración automática de incursiones como eventos**

## 🔌 Servicios (Edge Functions)

### `flightradar-proxy` (v17)
**Propósito**: Proxy para obtener datos de vuelos

```
MAPA (API Pública - Gratis):
├── Endpoint: data-cloud.flightradar24.com
├── Sin consumo de créditos
├── Actualización cada 30 segundos
└── Parámetro: ?bounds=N,S,W,E

TRAIL/DETALLES (API Pagada):
├── Endpoint: fr24api.flightradar24.com/api/flight/tracks
├── Historial completo del vuelo
├── Se activa solo al hacer clic en un avión
└── Parámetro: ?flight=ID
```

### `military-airspace-monitor` (v25 - FULL-ZONE)
**Propósito**: Detectar incursiones militares y enviar alertas a Telegram

```
Flujo V25:
1. Lee zonas con alert_enabled=true de maritime_boundaries_settings
2. Carga polígonos de AMBAS tablas:
   - terrestrial_boundaries_cache (territorio terrestre)
   - maritime_boundaries_cache (EEZ marítima)
3. Consulta API oficial FlightRadar24 (categories=M)
4. Verifica point-in-polygon para cada vuelo
5. Filtra solo militares USA (ICAO24: AE/AF, callsigns militares)
6. Gestiona SESIONES de incursión:
   - Nueva incursión → Crea sesión + evento calendario + alerta Telegram
   - Incursión activa → Actualiza estadísticas + registra waypoint
   - Incursión finalizada → Cierra sesión + envía resumen
7. Calcula datos analíticos (hora, día, cuadrante, rumbo)
```

**Características V25**:
- ✅ Zonas de alerta dinámicas (territorio + mar)
- ✅ Sistema de sesiones (evita alertas duplicadas)
- ✅ Waypoints para análisis de trayectorias
- ✅ Integración con calendario de eventos
- ✅ Datos analíticos para predicciones
- ✅ Ejecuta cada 3 minutos vía cron

### `incursion-session-closer` (v3)
**Propósito**: Cerrar sesiones de incursión inactivas y enviar resúmenes

```
Flujo:
1. Busca sesiones pending_exit por más de 10 minutos
2. Calcula estadísticas finales (duración, distancia, altitud promedio)
3. Envía resumen a Telegram
4. Actualiza evento en calendario con información completa
5. Marca sesión como closed
```

### `ship-positions` (v1)
**Propósito**: Obtener posiciones de buques desde caché AIS

### `aisstream-collector` (v4)
**Propósito**: Recolectar datos AIS en tiempo real vía WebSocket

## 📊 Base de Datos (Supabase)

### Tablas Principales

```sql
-- Configuración de límites marítimos
maritime_boundaries_settings (
  id UUID PRIMARY KEY,
  country_code VARCHAR(3),      -- ISO3: VEN, COL, CUB...
  country_name VARCHAR,
  is_visible BOOLEAN,           -- Mostrar en mapa
  alert_enabled BOOLEAN,        -- Enviar alertas Telegram
  color VARCHAR,                -- Color del polígono
  opacity NUMERIC
)

-- Caché de polígonos EEZ (200 millas náuticas)
maritime_boundaries_cache (
  id UUID PRIMARY KEY,
  country_code VARCHAR(3),
  zone_name VARCHAR,
  mrgid INTEGER,                -- ID de Marine Regions
  geojson JSONB,                -- Polígono GeoJSON
  source_url TEXT,
  fetched_at TIMESTAMPTZ
)

-- Caché de límites terrestres (GADM/Natural Earth)
terrestrial_boundaries_cache (
  id UUID PRIMARY KEY,
  country_code VARCHAR(3),
  country_name VARCHAR,
  source VARCHAR,               -- Natural Earth 1:50m, GADM, etc.
  geojson JSONB                 -- Polígono GeoJSON del territorio
)

-- ⭐ SESIONES DE INCURSIÓN (Sistema principal)
incursion_sessions (
  id UUID PRIMARY KEY,
  flight_id VARCHAR,            -- ICAO24
  callsign VARCHAR,
  aircraft_type VARCHAR,
  aircraft_model VARCHAR,
  registration VARCHAR,
  hex_code VARCHAR,
  zone_code VARCHAR(3),         -- País de la zona
  zone_name VARCHAR,
  
  -- Temporales
  status VARCHAR,               -- active, pending_exit, closed
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  
  -- Posiciones
  entry_latitude NUMERIC,
  entry_longitude NUMERIC,
  exit_latitude NUMERIC,
  exit_longitude NUMERIC,
  last_latitude NUMERIC,
  last_longitude NUMERIC,
  
  -- Estadísticas de vuelo
  detection_count INTEGER,
  total_altitude NUMERIC,
  total_speed NUMERIC,
  avg_altitude NUMERIC,
  avg_speed NUMERIC,
  min_altitude NUMERIC,
  max_altitude NUMERIC,
  min_speed NUMERIC,
  max_speed NUMERIC,
  last_altitude NUMERIC,
  last_speed NUMERIC,
  last_heading NUMERIC,
  
  -- ⭐ Datos analíticos para predicciones
  day_of_week INTEGER,          -- 0=Domingo, 6=Sábado
  hour_of_day INTEGER,          -- 0-23 UTC
  time_period VARCHAR,          -- madrugada, mañana, tarde, noche
  entry_quadrant VARCHAR,       -- NE, NW, SE, SW
  exit_quadrant VARCHAR,
  entry_heading_category VARCHAR, -- N, NE, E, SE, S, SW, W, NW
  flight_path_type VARCHAR,     -- transit, patrol, etc.
  distance_traveled_nm NUMERIC,
  
  -- Referencias
  event_id UUID,                -- FK a events (calendario)
  entry_message_id INTEGER,     -- ID mensaje Telegram entrada
  exit_message_id INTEGER       -- ID mensaje Telegram salida
)

-- Waypoints de trayectoria
incursion_waypoints (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES incursion_sessions,
  flight_id VARCHAR,
  latitude NUMERIC,
  longitude NUMERIC,
  altitude INTEGER,
  speed INTEGER,
  heading INTEGER,
  vertical_speed INTEGER,
  detected_at TIMESTAMPTZ,
  source VARCHAR
)

-- Alertas históricas (legacy)
airspace_alerts (
  id UUID PRIMARY KEY,
  flight_id VARCHAR,
  callsign VARCHAR,
  aircraft_type VARCHAR,
  aircraft_model VARCHAR,
  latitude VARCHAR,
  longitude VARCHAR,
  altitude VARCHAR,
  speed VARCHAR,
  heading VARCHAR,
  alert_type VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ
)

-- Eventos (calendario)
events (
  id UUID PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  type VARCHAR,                 -- evento, informe, noticia
  event_date TIMESTAMPTZ,
  location VARCHAR,
  latitude NUMERIC,
  longitude NUMERIC,
  priority_level VARCHAR,       -- urgente, alta, media, baja
  tags TEXT[],
  source_reliability VARCHAR,   -- A, B, C, D, E, F
  info_credibility VARCHAR      -- 1, 2, 3, 4, 5, 6
)

-- Posiciones AIS de buques
ais_positions (
  mmsi VARCHAR PRIMARY KEY,
  ship_name VARCHAR,
  ship_type INTEGER,
  latitude NUMERIC,
  longitude NUMERIC,
  speed NUMERIC,
  course NUMERIC,
  heading INTEGER,
  destination VARCHAR,
  eta VARCHAR,
  last_updated TIMESTAMPTZ
)
```

### Vistas Analíticas

```sql
-- Patrones horarios de incursiones
incursion_patterns_hourly

-- Patrones semanales
incursion_patterns_weekly

-- Distribución por cuadrante geográfico
incursion_patterns_quadrant

-- Patrones por tipo de aeronave
incursion_patterns_aircraft

-- Mapa de calor de incursiones
incursion_heatmap

-- Resumen para predicciones
incursion_prediction_summary
```

## 🛩️ Detección de Aeronaves Militares USA

El sistema identifica aeronaves militares USA usando múltiples criterios:

### Por ICAO24 (Hex Transponder)
| Prefijo | Descripción |
|---------|-------------|
| AE0000-AEFFFF | USAF/Military |
| AF0000-AFFFFF | USAF/Military |

### Por Callsign (Patrones Militares)
```javascript
const MILITARY_PATTERNS = [
  'RCH',      // REACH - Transporte militar
  'CNV',      // Navy
  'NAVY',     // Navy
  'SPAR',     // VIP/Gobierno
  'SAM',      // Special Air Mission
  'DUKE',     // Army
  'IRON',     // Patrulla
  'BAT',      // P-8 Poseidon
  'OMNI',     // AWACS
  'BOXER',    // Marines
  'RHINO',    // F/A-18
  'TRACR',    // E-2 Hawkeye
  'GRNCH',    // E-3 AWACS
  'GRIZZLY',  // C-130
  'BLKCAT',   // RQ-4 Global Hawk
  'SHARK',    // P-8 Poseidon
];
```

### Modelos de Aeronaves Detectados
| Código | Modelo |
|--------|--------|
| C17 | Boeing C-17A Globemaster III |
| C130 | Lockheed C-130 Hercules |
| E2 | Northrop Grumman E-2 Hawkeye |
| P8 | Boeing P-8A Poseidon |
| KC135 | Boeing KC-135 Stratotanker |
| E3 | Boeing E-3 Sentry AWACS |
| E6 | Boeing E-6 Mercury |
| RC135 | Boeing RC-135 Rivet Joint |
| F18 | Boeing F/A-18 Hornet |
| Q4 | Northrop Grumman RQ-4 Global Hawk |

## 🔔 Sistema de Alertas Telegram

### Tipos de Mensajes

#### 1. Inicio de Incursión
```
🚨 INICIO DE INCURSIÓN

✈️ Boeing P-8A Poseidon
📍 Callsign: BAT91
🔢 ICAO24: AE5B1E
🏷️ Registro: 169806

📏 Altitud: 25,000 ft
💨 Velocidad: 420 kts
🧭 Rumbo: 145° (SE)

📍 Zona: 🇻🇪 Venezuela
🌊 Tipo: Espacio Marítimo
📍 Cuadrante: SE
📍 Posición: 10.5432°, -65.1234°

🕐 19/12/2025, 10:30:00 a.m.
```

#### 2. Resumen de Incursión (al salir)
```
📊 RESUMEN DE INCURSIÓN

✈️ Boeing P-8A Poseidon (BAT91)

⏱️ Duración: 47 minutos
📍 Detecciones: 28

📏 Altitud:
  • Promedio: 24,500 ft
  • Mín: 22,000 ft | Máx: 27,000 ft

💨 Velocidad:
  • Promedio: 415 kts
  • Mín: 380 kts | Máx: 450 kts

🧭 Trayectoria:
  • Entrada: Cuadrante SE
  • Salida: Cuadrante NE
  • Distancia: 125 nm

🕐 Finalizado: 19/12/2025, 11:17:00 a.m.
```

### Configuración en UI
1. Ir a **Zonas > Gestor de Países**
2. Agregar países de interés
3. Activar el **icono de campana 🔔** para recibir alertas

## 📊 Sistema de Estadísticas Predictivas

### Datos Capturados por Incursión
- Día de la semana (0-6)
- Hora del día (0-23 UTC)
- Período del día (madrugada, mañana, tarde, noche)
- Cuadrante de entrada (NE, NW, SE, SW)
- Cuadrante de salida
- Categoría de rumbo (N, NE, E, SE, S, SW, W, NW)
- Tipo de aeronave
- Duración total
- Distancia recorrida

### Predicciones Disponibles
- 📅 Días de mayor actividad
- ⏰ Horas pico de incursiones
- 🗺️ Zonas más frecuentadas
- ✈️ Tipos de aeronave más comunes
- 📈 Tendencias semanales/mensuales

## 🐳 Despliegue (Docker)

### Dockerfile
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache curl
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
```

### Cron Jobs (Dokploy)
```bash
# Monitor de espacio aéreo cada 3 minutos
*/3 * * * * curl -X POST https://xxx.supabase.co/functions/v1/military-airspace-monitor

# Cerrar sesiones inactivas cada 5 minutos
*/5 * * * * curl -X POST https://xxx.supabase.co/functions/v1/incursion-session-closer

# Recolector AIS cada minuto
* * * * * curl -X POST https://xxx.supabase.co/functions/v1/aisstream-collector
```

## 📁 Estructura de Carpetas

```
src/
├── components/
│   ├── Analytics/          # Estadísticas de incursiones
│   │   └── IncursionStatsPanel.jsx
│   ├── Auth/               # Login, registro
│   ├── Calendar/           # Vistas calendario
│   ├── FlightRadar/        # Componentes de vuelos
│   │   ├── FlightLayer.jsx
│   │   ├── FlightMarker.jsx
│   │   ├── FlightPopup.jsx
│   │   ├── FlightDetailsPanel.jsx
│   │   ├── FlightTrailLayer.jsx
│   │   ├── FlightRadarBottomBar.jsx
│   │   └── FlightRadarPanel.jsx
│   ├── Map/                # Mapa y capas
│   │   ├── MapContainer.jsx
│   │   ├── EntityMarker.jsx
│   │   └── MaritimeBoundariesLayer.jsx
│   ├── Settings/           # Configuraciones
│   │   └── MaritimeBoundariesManager.jsx
│   ├── ShipRadar/          # Componentes de buques
│   │   ├── ShipLayer.jsx
│   │   ├── ShipDetailsPanel.jsx
│   │   ├── ShipRadarBottomBar.jsx
│   │   └── ShipRadarPanel.jsx
│   ├── Sidebar/            # Navegación y gestión
│   └── Timeline/           # Eventos
├── hooks/
│   ├── useFlightRadar.js        # Hook principal de vuelos
│   ├── useShipRadar.js          # Hook de buques AIS
│   ├── useMaritimeSettings.js   # Config límites marítimos
│   ├── useIncursionStats.js     # Estadísticas de incursiones
│   ├── useEntities.js           # CRUD entidades
│   └── useEvents.js             # CRUD eventos
├── services/
│   ├── flightRadarService.js    # Lógica de vuelos
│   └── imageService.js          # Manejo de imágenes
├── stores/                      # Context providers
├── lib/
│   ├── supabase.js             # Cliente Supabase
│   └── maplibre.js             # Config Mapbox
├── utils/
│   └── loadGADMBoundaries.js   # Carga límites territoriales
└── data/
    └── worldCountries.js       # Lista de países ISO
```

## 🔒 Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Mapbox (en código, no env)
MAPBOX_TOKEN=pk.xxx

# FlightRadar24 API (en Edge Functions)
FR24_API_TOKEN=xxx

# Telegram (en Edge Functions)
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# AISStream (en Edge Functions)
AISSTREAM_API_KEY=xxx
```

## 🚀 Comandos

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview
npm run preview

# Docker local
docker-compose up -d
```

## 📈 Flujo de Datos

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Mapa      │  │  FlightRadar│  │  ShipRadar  │  │  Analytics Panel    │  │
│  │  Mapbox GL  │  │   Panel     │  │   Panel     │  │  (Estadísticas)     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                │                     │             │
└─────────┼────────────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                │                     │
          ▼                ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE EDGE FUNCTIONS                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │  flightradar-proxy  │  │ military-airspace-  │  │  ship-positions     │   │
│  │       (v17)         │  │   monitor (v25)     │  │       (v1)          │   │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤   │
│  │ MAPA: API Pública   │  │ 1. Lee países       │  │ Lee caché AIS       │   │
│  │ TRAIL: API Pagada   │  │ 2. Carga límites    │  └─────────────────────┘   │
│  └─────────────────────┘  │    (terr + marit)   │                            │
│                           │ 3. Consulta FR24    │  ┌─────────────────────┐   │
│  ┌─────────────────────┐  │ 4. Point-in-polygon │  │ aisstream-collector │   │
│  │ incursion-session-  │  │ 5. Gestiona sesión  │  │       (v4)          │   │
│  │   closer (v3)       │  │ 6. Guarda waypoints │  ├─────────────────────┤   │
│  ├─────────────────────┤  │ 7. Telegram + Evento│  │ WebSocket AIS       │   │
│  │ Cierra sesiones     │  └─────────────────────┘  │ → ais_positions     │   │
│  │ inactivas + resumen │                           └─────────────────────┘   │
│  └─────────────────────┘                                                      │
│                                                                               │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   FlightRadar24     │  │     Telegram        │  │    AISStream.io     │
│   API (híbrida)     │  │     Bot API         │  │    WebSocket API    │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Grupo/Canal       │
                         │   de Alertas        │
                         └─────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE DATABASE                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ maritime_       │  │ terrestrial_    │  │ incursion_sessions          │   │
│  │ boundaries_     │  │ boundaries_     │  │ (Sistema principal)         │   │
│  │ cache (EEZ)     │  │ cache (GADM)    │  │                             │   │
│  └─────────────────┘  └─────────────────┘  │ • Sesiones activas/cerradas │   │
│                                            │ • Estadísticas de vuelo     │   │
│  ┌─────────────────┐  ┌─────────────────┐  │ • Datos analíticos          │   │
│  │ maritime_       │  │ incursion_      │  └─────────────────────────────┘   │
│  │ boundaries_     │  │ waypoints       │                                    │
│  │ settings        │  │ (trayectorias)  │  ┌─────────────────────────────┐   │
│  └─────────────────┘  └─────────────────┘  │ events (calendario)         │   │
│                                            │ • Incursiones automáticas   │   │
│  ┌─────────────────┐  ┌─────────────────┐  │ • Eventos manuales          │   │
│  │ ais_positions   │  │ airspace_alerts │  └─────────────────────────────┘   │
│  │ (buques AIS)    │  │ (legacy)        │                                    │
│  └─────────────────┘  └─────────────────┘                                    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      VISTAS ANALÍTICAS                                  │ │
│  │  incursion_patterns_hourly | incursion_patterns_weekly                  │ │
│  │  incursion_patterns_quadrant | incursion_patterns_aircraft              │ │
│  │  incursion_heatmap | incursion_prediction_summary                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Ciclo de Actualización

| Componente | Frecuencia | Fuente |
|------------|------------|--------|
| Vuelos en mapa | 30 seg | API Pública (gratis) |
| Trail de vuelo | On-click | API Pagada |
| Monitor de alertas | 3 min | API Pagada + Cron |
| Cierre de sesiones | 5 min | Cron |
| Buques AIS | 1 min | AISStream + Cron |
| Límites marítimos | On-demand | Marine Regions API |
| Límites terrestres | On-demand | Natural Earth / GADM |
| Estadísticas | 5 min + Realtime | Supabase Views |

## 📊 Versiones de Edge Functions

| Función | Versión | Descripción |
|---------|---------|-------------|
| flightradar-proxy | v17 | Proxy híbrido (público + pagado) |
| military-airspace-monitor | v25 | Detección con sesiones y analytics |
| incursion-session-closer | v3 | Cierre y resúmenes |
| ship-positions | v1 | Posiciones de buques |
| aisstream-collector | v4 | Recolector AIS WebSocket |
| test-point-in-zone | v1 | Utilidad de debug geoespacial |
