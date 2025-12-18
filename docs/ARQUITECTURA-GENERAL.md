# SAE-MONITOR - Arquitectura General

Sistema de Monitoreo de Espacio Aéreo y Entidades Estratégicas

## 📋 Resumen

SAE-MONITOR es una aplicación web de inteligencia geoespacial para el seguimiento en tiempo real de:
- Vuelos militares y comerciales (integración FlightRadar24)
- Entidades estratégicas (buques, bases, unidades militares)
- Eventos y operaciones en timeline
- Límites marítimos y territoriales
- **Alertas automáticas a Telegram** para incursiones en espacio aéreo

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite |
| Mapas | Mapbox GL JS |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Despliegue | Dokploy (Docker) |
| Alertas | Telegram Bot API |
| FlightRadar | API Híbrida (pública + pagada) |

## 🗺️ Componentes Principales

### 1. Mapa Interactivo (`src/components/Map/`)
- **MapContainer.jsx**: Contenedor principal del mapa
- **EntityMarker.jsx**: Marcadores de entidades (buques, bases, etc.)
- **MaritimeBoundariesLayer.jsx**: Límites marítimos EEZ por país

### 2. FlightRadar (`src/components/FlightRadar/`)
- **FlightLayer.jsx**: Capa GeoJSON de vuelos en el mapa
- **FlightMarker.jsx**: Iconos de aviones con rotación según heading
- **FlightPopup.jsx**: Popup al hover sobre un vuelo
- **FlightDetailsPanel.jsx**: Panel lateral con detalles completos
- **FlightTrailLayer.jsx**: Dibuja la trayectoria del vuelo seleccionado
- **FlightRadarFiltersPanel.jsx**: Filtros por categoría (militar, pasajeros, cargo)

### 3. Gestión de Zonas (`src/components/Settings/`)
- **MaritimeBoundariesManager.jsx**: CRUD de países con límites marítimos
  - Toggle visibilidad en mapa (👁️)
  - Toggle alertas Telegram (🔔)
  - Personalización de colores y opacidad

### 4. Timeline de Eventos (`src/components/Timeline/`)
- **EventTimeline.jsx**: Timeline horizontal de eventos
- **EventCard.jsx**: Tarjeta individual de evento
- **AddEventModal.jsx**: Modal para crear/editar eventos

### 5. Calendario (`src/components/Calendar/`)
- Vista mensual y diaria de eventos

## 🔌 Servicios (Edge Functions)

### `flightradar-proxy` (v17 - Híbrido)
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

### `military-airspace-monitor` (v17 - Dinámico)
**Propósito**: Detectar incursiones militares y enviar alertas a Telegram

```
Flujo:
1. Lee zonas con alert_enabled=true de maritime_boundaries_settings
2. Carga polígonos GeoJSON de maritime_boundaries_cache
3. Consulta API oficial FlightRadar24 (categories=M)
4. Verifica point-in-polygon para cada vuelo
5. Filtra solo militares USA (ICAO24: AE/AF)
6. Si es nuevo hoy → Envía alerta con imagen de mapa
7. Guarda en airspace_alerts
```

**Características**:
- ✅ Zonas de alerta dinámicas (configurables desde UI)
- ✅ Polígonos reales de límites marítimos
- ✅ Imagen del mapa con posición del avión
- ✅ Solo 1 alerta por vuelo por día
- ✅ Ejecuta cada 5 minutos via cron

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

-- Caché de polígonos GeoJSON
maritime_boundaries_cache (
  id UUID PRIMARY KEY,
  country_code VARCHAR(3),
  zone_name VARCHAR,
  geojson JSONB,                -- Polígono GeoJSON
  source_url TEXT,
  fetched_at TIMESTAMPTZ
)

-- Alertas de espacio aéreo
airspace_alerts (
  id UUID PRIMARY KEY,
  flight_id VARCHAR,            -- ICAO24 o callsign
  callsign VARCHAR,
  aircraft_type VARCHAR,
  aircraft_model VARCHAR,
  operator VARCHAR,
  country_code VARCHAR(2),
  latitude NUMERIC,
  longitude NUMERIC,
  altitude INTEGER,
  speed INTEGER,
  heading INTEGER,
  detection_date DATE,          -- Para evitar duplicados
  telegram_sent BOOLEAN,
  telegram_message_id VARCHAR,
  created_at TIMESTAMPTZ
)

-- Entidades estratégicas
entities (
  id UUID PRIMARY KEY,
  name VARCHAR,
  type VARCHAR,                 -- ship, base, unit...
  subtype VARCHAR,
  latitude NUMERIC,
  longitude NUMERIC,
  country VARCHAR,
  status VARCHAR,
  classification VARCHAR
)

-- Eventos
events (
  id UUID PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  entity_id UUID REFERENCES entities,
  event_date DATE,
  classification VARCHAR,
  sources JSONB
)
```

## 🛩️ Detección de País por ICAO24

El sistema identifica el país de origen de aeronaves usando el código ICAO24 (hex transponder):

| Prefijo ICAO24 | País | Militar |
|----------------|------|---------|
| AE0000-AEFFFF | 🇺🇸 Estados Unidos | ✅ Sí |
| AF0000-AFFFFF | 🇺🇸 Estados Unidos | ✅ Sí |
| A00000-AFFFFF | 🇺🇸 Estados Unidos | ❌ Civil |
| 380000-3BFFFF | 🇫🇷 Francia | - |
| 400000-43FFFF | 🇬🇧 Reino Unido | - |
| 0D8000-0D8FFF | 🇻🇪 Venezuela | - |

## 🔔 Sistema de Alertas Telegram

### Configuración en UI
1. Ir a **Zonas > Gestor de Países**
2. Agregar países de interés
3. Activar el **icono de campana 🔔** para recibir alertas

### Formato de Alerta (con imagen)
```
🚨 ALERTA ESPACIO AÉREO

✈️ BLKCAT6
🇺🇸 MILITAR USA | Northrop Grumman RQ-4 Global Hawk

📍 Zona: 🇻🇪 Venezuelan Exclusive Economic Zone

📋 Detalles:
• Registro: 169806
• ICAO24: AE7817
• Tipo: HALE

📍 Posición:
• Lat: 12.1927°
• Lon: -65.0538°
• Altitud: 48,000 ft
• Velocidad: 389 kts
• Rumbo: 110°

🛫 KJAX → 🛬 ?

⏰ 18/12/2025, 8:30:03 a. m.
📡 FlightRadar24
```

La alerta incluye una **imagen del mapa satelital** con la posición del avión marcada.

## 🐳 Despliegue (Docker)

### Dockerfile
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache curl
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
```

### Cron Job (Dokploy)
```bash
# Monitor de espacio aéreo cada 5 minutos
*/5 * * * * curl -X POST https://xxx.supabase.co/functions/v1/military-airspace-monitor
```

## 📁 Estructura de Carpetas

```
src/
├── components/
│   ├── Auth/              # Login, registro
│   ├── Calendar/          # Vistas calendario
│   ├── FlightRadar/       # Componentes de vuelos
│   │   ├── FlightLayer.jsx
│   │   ├── FlightMarker.jsx
│   │   ├── FlightPopup.jsx
│   │   ├── FlightDetailsPanel.jsx
│   │   ├── FlightTrailLayer.jsx
│   │   └── FlightRadarFiltersPanel.jsx
│   ├── Map/               # Mapa y capas
│   │   ├── MapContainer.jsx
│   │   ├── EntityMarker.jsx
│   │   └── MaritimeBoundariesLayer.jsx
│   ├── Settings/          # Configuraciones
│   │   └── MaritimeBoundariesManager.jsx
│   ├── Sidebar/           # Navegación y gestión
│   └── Timeline/          # Eventos
├── hooks/
│   ├── useFlightRadar.js       # Hook principal de vuelos
│   ├── useMaritimeSettings.js  # Config límites marítimos
│   ├── useEntities.js          # CRUD entidades
│   └── useEvents.js            # CRUD eventos
├── services/
│   ├── flightRadarService.js   # Lógica de vuelos + detección militar
│   └── imageService.js         # Manejo de imágenes
├── stores/                     # Context providers
├── lib/
│   ├── supabase.js            # Cliente Supabase
│   └── maplibre.js            # Config Mapbox
└── data/
    └── worldCountries.js      # Lista de países ISO
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
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Mapa      │    │  Gestor de  │    │   FlightRadar       │  │
│  │  Mapbox GL  │    │   Países    │    │   Panel + Trail     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                  │                      │              │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE EDGE FUNCTIONS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │  flightradar-proxy  │    │  military-airspace-monitor      │ │
│  │       (v17)         │    │           (v17)                 │ │
│  ├─────────────────────┤    ├─────────────────────────────────┤ │
│  │ MAPA: API Pública   │    │ 1. Lee alert_enabled=true       │ │
│  │ TRAIL: API Pagada   │    │ 2. Carga polígonos GeoJSON      │ │
│  │                     │    │ 3. Consulta FR24 API (M)        │ │
│  └──────────┬──────────┘    │ 4. Point-in-polygon             │ │
│             │               │ 5. Filtra USA (AE/AF)           │ │
│             │               │ 6. Envía Telegram + imagen      │ │
│             │               └───────────────┬─────────────────┘ │
│             │                               │                   │
└─────────────┼───────────────────────────────┼───────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────┐             ┌─────────────────────┐
│   FlightRadar24     │             │     Telegram        │
│   API (híbrida)     │             │     Bot API         │
└─────────────────────┘             └─────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────┐             ┌─────────────────────┐
│   Mapbox Static     │             │   Grupo/Canal       │
│   Images API        │◀────────────│   de Alertas        │
└─────────────────────┘             └─────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ maritime_       │  │ maritime_       │  │ airspace_       │  │
│  │ boundaries_     │  │ boundaries_     │  │ alerts          │  │
│  │ settings        │  │ cache           │  │                 │  │
│  │                 │  │                 │  │                 │  │
│  │ • is_visible    │  │ • geojson       │  │ • flight_id     │  │
│  │ • alert_enabled │  │ • zone_name     │  │ • telegram_sent │  │
│  │ • color         │  │ • country_code  │  │ • detection_date│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Ciclo de Actualización

| Componente | Frecuencia | Fuente |
|------------|------------|--------|
| Vuelos en mapa | 30 seg | API Pública (gratis) |
| Trail de vuelo | On-click | API Pagada |
| Monitor de alertas | 5 min | API Pagada + Cron |
| Límites marítimos | On-demand | Marine Regions API |
