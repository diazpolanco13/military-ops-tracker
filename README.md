# SAE-RADAR

**Sistema de Análisis Estratégico - Radar de Monitoreo**

Sistema de inteligencia geoespacial para monitoreo en tiempo real del espacio aéreo y marítimo del Caribe, con detección automática de incursiones militares y alertas a Telegram.

## Funcionalidades Principales

### 🛩️ FlightRadar - Monitoreo Aéreo
- Vuelos en tiempo real (actualización cada 30 seg)
- Detección automática de aeronaves militares USA
- Categorización: transporte, reconocimiento, tanqueros, AWACS, cazas
- Trail de vuelo al hacer clic

### 🚨 Sistema de Incursiones
- Detección automática cuando aeronaves militares entran en espacio venezolano
- Alertas instantáneas a Telegram con screenshot del mapa
- Sesiones de incursión con estadísticas (duración, altitud, velocidad)
- Integración con calendario de eventos

### 🚢 ShipRadar - Monitoreo Marítimo
- Posiciones AIS de buques en tiempo real
- Detección de buques militares y tanqueros
- Tracking de destinos y rutas

### 📍 Entidades Militares
- 51 entidades desplegadas (buques, aeronaves, tropas)
- 25 plantillas con iconos profesionales IBM i2
- Drag & drop en el mapa
- Sistema de grupos y formaciones

### 📅 Timeline de Eventos
- Eventos manuales y automáticos (incursiones)
- Clasificación de inteligencia OTAN (A-F, 1-6)
- Asociación de entidades a eventos
- Vista calendario

### 🗺️ Límites Geográficos
- EEZ (Zona Económica Exclusiva) de Marine Regions
- Límites terrestres de Natural Earth
- Configuración de alertas por país

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Mapas | Mapbox GL JS |
| Backend | Supabase (PostgreSQL + PostGIS) |
| Despliegue | Dokploy (Docker) |
| Alertas | Telegram Bot API |
| Vuelos | FlightRadar24 API |
| Buques | AISStream.io WebSocket |

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/diazpolanco13/military-ops-tracker.git
cd military-ops-tracker

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Desarrollo
npm run dev
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx
```

## Documentación

- [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [Esquema de Base de Datos](docs/BASE-DE-DATOS.md)
- [Integraciones Externas](docs/INTEGRACIONES.md)
- [Sistema de Roles y Permisos](roles_permisos/README.md)

## Estructura del Proyecto

```
src/
├── components/
│   ├── FlightRadar/    # Vuelos en tiempo real
│   ├── ShipRadar/      # Buques AIS
│   ├── Map/            # Mapa y capas
│   ├── Timeline/       # Eventos
│   ├── Calendar/       # Vista calendario
│   ├── Analytics/      # Estadísticas
│   ├── Templates/      # Paleta de plantillas
│   ├── Settings/       # Configuraciones
│   └── Screenshot/     # Capturas para Telegram
├── hooks/              # Hooks personalizados
├── services/           # Servicios (FR24, AIS)
├── stores/             # Contexts
├── config/             # Configuraciones
└── lib/                # Clientes (Supabase, Mapbox)
```

## Despliegue

- **URL App**: `maps.operativus.net`
- **Panel Dokploy**: `operativus.net`
- **Crons**: Configurados en Dokploy para Edge Functions

## Edge Functions (Supabase)

| Función | Descripción |
|---------|-------------|
| `flightradar-proxy` | Proxy para FlightRadar24 API |
| `military-airspace-monitor` | Detectar incursiones + Telegram |
| `incursion-session-closer` | Cerrar sesiones inactivas |
| `ship-positions` | Posiciones de buques |
| `aisstream-collector` | Recolector AIS |

## Comandos

```bash
npm run dev      # Desarrollo (localhost:5173)
npm run build    # Build producción
npm run preview  # Preview del build
```

---

**Versión**: 2.0  
**Última actualización**: Diciembre 2025
