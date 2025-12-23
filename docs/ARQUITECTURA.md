# SAE-RADAR - Arquitectura del Sistema

> Sistema de Monitoreo de Espacio Aéreo y Marítimo para Inteligencia Estratégica

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Mapas | Mapbox GL JS |
| Backend | Supabase (PostgreSQL + PostGIS + Edge Functions) |
| Despliegue | Dokploy (Docker) |
| Alertas | Telegram Bot API |
| FlightRadar | API Híbrida (pública + pagada) |
| ShipRadar | AISStream.io WebSocket |
| Geodatos | Marine Regions + Natural Earth + GADM |

## Estructura del Proyecto

```
src/
├── components/
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
│   ├── ShipRadar/         # Buques AIS
│   ├── Sidebar/           # Panel lateral
│   ├── Templates/         # Paleta de plantillas
│   ├── Timeline/          # Eventos en timeline
│   └── Weather/           # Capas meteorológicas
├── hooks/                 # Hooks personalizados
├── services/              # Servicios externos (FR24, AIS)
├── stores/                # Contexts de estado
├── config/                # Configuraciones (iconos i2)
├── lib/                   # Clientes (Supabase, Mapbox)
└── utils/                 # Utilidades
```

## Flujo de Datos Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│  Mapa Mapbox  │  FlightRadar Panel  │  ShipRadar  │  Calendario     │
└───────┬───────┴─────────┬───────────┴──────┬──────┴────────┬────────┘
        │                 │                  │               │
        ▼                 ▼                  ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE EDGE FUNCTIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│ flightradar-proxy  │  military-airspace-monitor  │  ship-positions  │
│      (v19)         │          (v33)              │       (v3)       │
└─────────┬──────────┴────────────┬───────────────┴─────────┬─────────┘
          │                       │                         │
          ▼                       ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐
│ FlightRadar24   │    │    Telegram     │    │   AISStream.io      │
│   API (FR24)    │    │    Bot API      │    │   WebSocket         │
└─────────────────┘    └─────────────────┘    └─────────────────────┘
```

## Componentes Clave

### 1. Sistema de Vuelos (FlightRadar)
- **Actualización**: Cada 30 segundos (API pública gratuita)
- **Trail**: On-click (API pagada)
- **Detección militar**: Por ICAO24 (prefijos AE/AF) y patrones de callsign
- **Área de cobertura**: 27°N a 8°S, -85°W a -58°E (Caribe ampliado)

### 2. Sistema de Incursiones
- **Sesiones**: Agrupan múltiples detecciones del mismo vuelo
- **Waypoints**: Registran cada posición durante la incursión
- **Alertas Telegram**: Automáticas al iniciar/finalizar incursión
- **Screenshots con Trail**: Captura del mapa mostrando la trayectoria completa del vuelo
  - **Entrada**: Obtiene trail desde API FR24 si disponible
  - **Salida**: Usa waypoints almacenados + estadísticas de sesión
- **Estadísticas**: Patrones horarios, semanales, por cuadrante, duración, altitud, velocidad

### 3. Sistema de Buques (ShipRadar)
- **Fuente**: AISStream.io WebSocket
- **Almacenamiento**: `ship_positions` con MMSI único
- **Detección militar**: Por tipo de buque y bandera

### 4. Sistema de Entidades
- **Plantillas**: 25 modelos base (destructores, cazas, tropas, etc.)
- **Herencia**: Entidades heredan especificaciones de plantillas
- **Iconos**: 610 iconos profesionales IBM i2 en `/public/Icons/i2/`

### 5. Límites Geográficos
- **Marítimos**: EEZ de Marine Regions (200mn)
- **Terrestres**: Natural Earth / GADM
- **Almacenamiento**: `maritime_boundaries_cache`, `terrestrial_boundaries_cache`

## Edge Functions Principales

| Función | Versión | Propósito | Frecuencia |
|---------|---------|-----------|------------|
| `flightradar-proxy` | v19 | Proxy para datos de vuelos | On-demand |
| `military-airspace-monitor` | v33 | Detectar incursiones + Telegram con trail | Cron 3min |
| `incursion-session-closer` | v8 | Cerrar sesiones + screenshot con trail | Cron 5min |
| `ship-positions` | v3 | Posiciones de buques | On-demand |
| `aisstream-collector` | v6 | Recolector AIS | Cron 1min |
| `test-incursion-alert` | v5 | Simular alertas (debug) | Manual |

## Configuración de Alertas

### Destinos Telegram
Configurados en `incursion_monitor_config.telegram_destinations`:
```json
[
  {"name": "Canal Principal", "chat_id": "-100xxx", "enabled": true}
]
```

### Patrones Militares
- **Tabla**: `military_callsign_patterns` (32 patrones)
- **Tabla**: `military_aircraft_patterns` (18 tipos de aeronave)
- **Prefijos ICAO24**: AE, AF (configurados en `incursion_monitor_config`)

## Variables de Entorno

```env
# Frontend
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx

# Edge Functions (Supabase Secrets)
FR24_API_TOKEN=xxx
TELEGRAM_BOT_TOKEN=xxx
AISSTREAM_API_KEY=xxx
SCREENSHOT_SERVICE_URL=https://operativus.net/screenshot
SCREENSHOT_AUTH_TOKEN=xxx
```

## Servicios Externos

### Screenshot Service
- **URL**: `https://operativus.net/screenshot`
- **Tecnología**: Node.js + Puppeteer
- **Versión**: v1.5.0
- **Propósito**: Generar capturas del mapa para alertas Telegram
- **Repositorio**: `sae-screenshot-service` (GitHub)
- **Características**:
  - Soporte para modo `entry` (incursión detectada) y `exit` (fin de incursión)
  - Renderizado de trail con hasta 100 waypoints
  - Estadísticas de sesión en modo exit (duración, detecciones, altitud, velocidad)

### Dokploy
- **URL Panel**: `operativus.net`
- **URL App**: `maps.operativus.net`
- **Crons**: Configurados para ejecutar Edge Functions

## Actualizaciones en Tiempo Real

| Componente | Frecuencia | Fuente |
|------------|------------|--------|
| Vuelos en mapa | 30 seg | API Pública FR24 |
| Trail de vuelo | On-click | API Pagada FR24 |
| Monitor de alertas | 3 min | Cron + FR24 API |
| Cierre de sesiones | 5 min | Cron |
| Buques AIS | 1 min | AISStream WebSocket |
| Límites marítimos | On-demand | Marine Regions API |

