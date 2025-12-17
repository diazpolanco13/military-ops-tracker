# SAE-MONITOR - Arquitectura General

Sistema de Monitoreo de Espacio Aéreo y Entidades Estratégicas

## 📋 Resumen

SAE-MONITOR es una aplicación web de inteligencia geoespacial para el seguimiento en tiempo real de:
- Vuelos militares y comerciales (integración FlightRadar24)
- Entidades estratégicas (buques, bases, unidades militares)
- Eventos y operaciones en timeline
- Límites marítimos y territoriales

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite |
| Mapas | MapLibre GL + Mapbox |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Despliegue | Dokploy (Docker) |
| Alertas | Telegram Bot API |

## 🗺️ Componentes Principales

### 1. Mapa Interactivo (`src/components/Map/`)
- **MapContainer.jsx**: Contenedor principal del mapa
- **EntityMarker.jsx**: Marcadores de entidades (buques, bases, etc.)
- **MapControls.jsx**: Controles de zoom, capas, herramientas

### 2. FlightRadar (`src/components/FlightRadar/`)
- **FlightLayer.jsx**: Capa de vuelos en el mapa
- **FlightMarker.jsx**: Iconos de aviones con rotación según heading
- **FlightPopup.jsx**: Popup al hover sobre un vuelo
- **FlightDetailsPanel.jsx**: Panel lateral con detalles completos
- **FlightRadarFiltersPanel.jsx**: Filtros por categoría (militar, pasajeros, cargo)

### 3. Timeline de Eventos (`src/components/Timeline/`)
- **EventTimeline.jsx**: Timeline horizontal de eventos
- **EventCard.jsx**: Tarjeta individual de evento
- **AddEventModal.jsx**: Modal para crear/editar eventos

### 4. Calendario (`src/components/Calendar/`)
- Vista mensual y diaria de eventos

### 5. Sidebar y Navegación (`src/components/Sidebar/`)
- **NavigationBar.jsx**: Barra de navegación principal
- **EntitiesManagementModal.jsx**: CRUD de entidades

## 🔌 Servicios (Edge Functions)

### `flightradar-proxy` (v9)
**Propósito**: Proxy para obtener datos de vuelos del frontend

```
API Pública (data-cloud.flightradar24.com)
├── Sin límite de vuelos
├── Gratuita
├── Actualización cada 30 segundos
└── Datos: posición, callsign, tipo, altitud, velocidad
```

**Endpoints**:
- `?bounds=N,S,W,E` → Vuelos en zona geográfica
- `?flight=ID` → Detalles de vuelo específico

### `military-airspace-monitor` (v10)
**Propósito**: Detectar incursiones militares y enviar alertas a Telegram

```
API Oficial (fr24api.flightradar24.com)
├── Filtro categories=M (solo militares)
├── Consume créditos (uso eficiente)
├── Ejecuta cada 3 minutos via cron
└── Almacena en tabla airspace_alerts
```

**Flujo**:
1. Consulta API oficial con `categories=M`
2. Filtra vuelos militares de EE.UU. (ICAO24 prefijos AE/AD/AF)
3. Verifica si ya fue alertado hoy (evita duplicados)
4. Envía mensaje a Telegram con detalles
5. Guarda registro en `airspace_alerts`

## 📊 Base de Datos (Supabase)

### Tablas Principales

```sql
-- Entidades (buques, bases, unidades)
entities (
  id, name, type, subtype,
  latitude, longitude,
  country, status, classification
)

-- Eventos
events (
  id, title, description,
  entity_id, event_date,
  classification, sources
)

-- Alertas de espacio aéreo
airspace_alerts (
  id, flight_id, callsign,
  aircraft_type, aircraft_model,
  country_code, latitude, longitude,
  detection_date, telegram_sent
)
```

## 🛩️ Detección de País por ICAO24

El sistema identifica el país de origen de aeronaves usando el código ICAO24 (hex transponder):

| Prefijo ICAO24 | País |
|----------------|------|
| A00000-AFFFFF | 🇺🇸 Estados Unidos |
| AE0000-AFFFFF | 🇺🇸 Militar USA |
| 380000-3BFFFF | 🇫🇷 Francia |
| 400000-43FFFF | 🇬🇧 Reino Unido |
| 0D0000-0D7FFF | 🇻🇪 Venezuela |

## 🔔 Sistema de Alertas Telegram

### Configuración
```env
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
```

### Formato de Alerta
```
🚨 ALERTA AÉREA - INCURSIÓN MILITAR

✈️ Modelo: E-2D Advanced Hawkeye
🏷️ Callsign: NAVY123
📍 Registro: 169082
🌍 País: 🇺🇸 Estados Unidos (MIL)
📡 ICAO24: AE1234

📍 Posición: 11.234, -68.456
🔼 Altitud: 25,000 ft | 💨 Velocidad: 280 kts
```

## 🐳 Despliegue (Docker)

### Dockerfile
```dockerfile
FROM node:20-alpine
# Incluye cron para el monitor automático
RUN apk add --no-cache curl
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
```

### docker-entrypoint.sh
```bash
# Cron job: monitor cada 3 minutos
echo "*/3 * * * * curl -X POST $MONITOR_URL" > /etc/crontabs/root
crond
npm start
```

## 📁 Estructura de Carpetas

```
src/
├── components/
│   ├── Auth/          # Login, registro
│   ├── Calendar/      # Vistas calendario
│   ├── FlightRadar/   # Componentes de vuelos
│   ├── Map/           # Mapa y capas
│   ├── Sidebar/       # Navegación y gestión
│   └── Timeline/      # Eventos
├── hooks/
│   ├── useFlightRadar.js   # Hook principal de vuelos
│   ├── useEntities.js      # CRUD entidades
│   └── useEvents.js        # CRUD eventos
├── services/
│   ├── flightRadarService.js  # Lógica de vuelos
│   └── imageService.js        # Manejo de imágenes
├── stores/                # Context providers
├── lib/
│   ├── supabase.js       # Cliente Supabase
│   └── maplibre.js       # Config MapLibre
└── data/
    └── mockEntities.js   # Datos de ejemplo
```

## 🔒 Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Mapbox
VITE_MAPBOX_TOKEN=xxx

# FlightRadar24 (API Oficial - solo para monitor)
FLIGHTRADAR24_API_TOKEN=xxx

# Telegram
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
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ FlightRadar │────▶│ flightradar-proxy│────▶│   Frontend  │
│   (público) │     │   (Edge Func)    │     │   (React)   │
└─────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ FlightRadar │────▶│ military-monitor │────▶│  Telegram   │
│  (oficial)  │     │   (Edge Func)    │     │    Bot      │
└─────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    Supabase      │
                    │  airspace_alerts │
                    └──────────────────┘
```
