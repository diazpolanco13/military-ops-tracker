# Sistema de Registro de Aeronaves Militares del Caribe

> **Estado**: ✅ MVP en Producción (Dic 2025)  
> **Última actualización**: 29 de diciembre de 2025

## Índice

1. [Descripción General](#descripción-general)
2. [Estado Actual](#estado-actual)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Base de Datos](#base-de-datos)
5. [Edge Functions](#edge-functions)
6. [Hooks de React](#hooks-de-react)
7. [Componentes UI](#componentes-ui)
8. [Flujo de Datos](#flujo-de-datos)
9. [Configuración y Secretos](#configuración-y-secretos)
10. [API de FlightRadar24](#api-de-flightradar24)
11. [Funcionalidades Implementadas](#funcionalidades-implementadas)
12. [Pendientes](#pendientes)

---

## Descripción General

### Propósito

El Sistema de Registro de Aeronaves Militares es un módulo del proyecto SAE-RADAR que:

1. **Detecta y registra** todas las aeronaves militares estadounidenses que operan en el Caribe
2. **Mantiene un inventario persistente** de cada aeronave única identificada por su ICAO24
3. **Rastrea patrones operacionales** acumulando estadísticas de detecciones, callsigns usados, y ubicaciones frecuentes
4. **Proporciona visibilidad** del despliegue militar USA en la región caribeña

### Diferencia con el Sistema de Incursiones

| Aspecto | Sistema de Incursiones | Sistema de Registro |
|---------|------------------------|---------------------|
| **Alcance** | Solo Venezuela | Todo el Caribe |
| **Propósito** | Alertas en tiempo real | Inventario y métricas |
| **Acción** | Envía alertas Telegram | Almacena datos históricos |
| **Datos** | Sesiones temporales | Registro permanente |

### Países Monitoreados

- Puerto Rico (USA)
- Islas Vírgenes (USA)
- República Dominicana
- Cuba
- Bahamas
- Jamaica
- Trinidad y Tobago
- Aruba
- Curazao
- Panamá
- Costa Rica
- Venezuela (existente)

---

## Estado Actual

### ✅ Funcionalidades Completadas (Dic 2025)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Recolector Automático** | ✅ 100% | Edge Function v14, cron cada 5 min |
| **Catálogo de Modelos** | ✅ 100% | 82+ tipos de aeronaves con especificaciones |
| **Base de Datos de Bases** | ✅ 100% | 40+ bases militares del Caribe y EEUU |
| **Historial de Ubicaciones** | ✅ 100% | Tabla `aircraft_location_history` funcionando |
| **Presencia por País** | ✅ 100% | Tabla `aircraft_country_presence` funcionando |
| **Base Probable** | ✅ 100% | Función `recalculate_probable_base` implementada |
| **Geocoding** | ✅ 100% | Nominatim API con cache para detectar país |
| **Historial de Vuelos** | ✅ 100% | Vista estilo FR24 con tabla por fechas |
| **Trail en Mapa** | ✅ 100% | Mapbox con línea, puntos y marcadores |
| **Detección País Aeronave** | ✅ 100% | País de origen por prefijo ICAO24 |
| **UI Responsive** | ✅ 100% | Optimizado para desktop y móvil |

### 📊 Estadísticas del Sistema

```
Aeronaves en inventario: 50+ registradas
Modelos en catálogo:     82 tipos
Bases militares:         40+ aeropuertos
Detecciones diarias:     Variable según actividad
```

### 🗂️ Tablas Implementadas

- `military_aircraft_registry` - Inventario principal
- `aircraft_model_catalog` - Especificaciones técnicas
- `aircraft_model_images` - Galería de imágenes por modelo
- `caribbean_military_bases` - Bases y aeropuertos
- `aircraft_location_history` - Historial de posiciones
- `aircraft_country_presence` - Presencia acumulada por país
- `aircraft_last_presence` (VIEW) - Última ubicación conocida

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUJO DE DATOS                           │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
  │ FlightRadar24│───▶│ Edge Function    │───▶│ Supabase        │
  │ API Pública  │    │ aircraft-registry│    │ PostgreSQL      │
  │              │    │ -collector       │    │                 │
  └──────────────┘    └──────────────────┘    └────────┬────────┘
                              ▲                        │
                              │                        ▼
                      ┌───────┴───────┐        ┌──────────────┐
                      │ pg_cron       │        │ Frontend     │
                      │ (cada 5 min)  │        │ React + Hooks│
                      └───────────────┘        └──────────────┘
```

### Componentes Principales

1. **Recolector (Edge Function)**: `aircraft-registry-collector`
   - Consulta la API pública de FR24 cada 5 minutos
   - Filtra vuelos militares USA por ICAO24 y callsign
   - Registra/actualiza aeronaves en la base de datos

2. **Base de Datos (Supabase PostgreSQL)**:
   - `military_aircraft_registry`: Registro principal de aeronaves
   - `aircraft_model_catalog`: Catálogo de especificaciones por tipo
   - `aircraft_model_images`: Imágenes asociadas a modelos
   - `caribbean_military_bases`: Bases militares conocidas

3. **Frontend (React)**:
   - Hook `useAircraftRegistry`: Gestión del estado
   - Panel `AircraftRegistryPanel`: Interfaz principal
   - Modal `AircraftDetailModal`: Detalles de cada aeronave

---

## Base de Datos

### Tabla: `military_aircraft_registry`

Almacena cada aeronave militar única detectada.

```sql
CREATE TABLE military_aircraft_registry (
  icao24 VARCHAR(10) PRIMARY KEY,           -- Código hex único del transponder
  callsigns_used TEXT[],                     -- Array de callsigns observados
  aircraft_type VARCHAR(10),                 -- Código ICAO del tipo (C30J, K35R, etc.)
  aircraft_model VARCHAR(100),               -- Nombre del modelo
  military_branch VARCHAR(20),               -- Rama militar (USAF, USN, USMC, etc.)
  squadron VARCHAR(50),                      -- Escuadrón (si se conoce)
  tail_number VARCHAR(20),                   -- Número de cola/registro
  
  -- Base probable (calculado)
  probable_base_icao VARCHAR(10),            -- Código ICAO de la base
  probable_base_name VARCHAR(100),           -- Nombre de la base
  probable_country VARCHAR(50),              -- País de la base
  base_confidence INTEGER DEFAULT 0,         -- Confianza 0-100%
  
  -- Timestamps
  first_seen TIMESTAMPTZ,                    -- Primera detección
  last_seen TIMESTAMPTZ,                     -- Última detección
  first_seen_date DATE,                      -- Fecha de primera detección
  
  -- Estadísticas
  total_detections INTEGER DEFAULT 0,        -- Veces detectado
  total_incursions INTEGER DEFAULT 0,        -- Incursiones a Venezuela
  total_flights INTEGER DEFAULT 0,           -- Vuelos distintos
  
  -- Estado
  is_new_today BOOLEAN DEFAULT false,        -- Nueva hoy
  is_active BOOLEAN DEFAULT true,            -- Activa/inactiva
  notified_at TIMESTAMPTZ,                   -- Última notificación
  notes TEXT,                                -- Notas manuales
  
  -- Metadatos
  data_source VARCHAR(50),                   -- Fuente: fr24_public, fr24_official
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `aircraft_model_catalog`

Catálogo de especificaciones técnicas por tipo de aeronave.

```sql
CREATE TABLE aircraft_model_catalog (
  aircraft_type VARCHAR(10) PRIMARY KEY,     -- Código ICAO (C30J, F18, etc.)
  aircraft_name VARCHAR(100),                -- Nombre completo
  manufacturer VARCHAR(100),                 -- Fabricante
  category VARCHAR(50),                      -- Categoría: fighter, transport, etc.
  role VARCHAR(100),                         -- Rol: Combat, Cargo, Reconnaissance
  
  -- Especificaciones
  max_speed_kts INTEGER,                     -- Velocidad máxima en nudos
  cruise_speed_kts INTEGER,                  -- Velocidad crucero
  max_altitude_ft INTEGER,                   -- Techo máximo en pies
  range_nm INTEGER,                          -- Alcance en millas náuticas
  crew_size INTEGER,                         -- Tripulación
  
  -- Características
  is_armed BOOLEAN DEFAULT false,            -- ¿Armado?
  is_stealth BOOLEAN DEFAULT false,          -- ¿Stealth?
  primary_operator VARCHAR(50),              -- Operador principal
  
  -- Visual
  thumbnail_url TEXT,                        -- URL de imagen principal
  silhouette_svg TEXT,                       -- SVG de silueta
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `aircraft_model_images`

Sistema de imágenes por modelo (una imagen sirve para todas las aeronaves del mismo tipo).

```sql
CREATE TABLE aircraft_model_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_type VARCHAR(10) REFERENCES aircraft_model_catalog(aircraft_type),
  image_url TEXT NOT NULL,                   -- URL en Supabase Storage
  is_primary BOOLEAN DEFAULT false,          -- ¿Es la imagen principal?
  caption TEXT,                              -- Descripción
  source VARCHAR(255),                       -- Fuente de la imagen
  uploaded_by TEXT,                          -- Usuario que subió
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `caribbean_military_bases`

Catálogo de bases militares y aeropuertos en el Caribe.

```sql
CREATE TABLE caribbean_military_bases (
  icao_code VARCHAR(10) PRIMARY KEY,         -- Código ICAO del aeropuerto
  name VARCHAR(200),                         -- Nombre de la base
  country_code VARCHAR(3),                   -- Código ISO del país
  country_name VARCHAR(100),                 -- Nombre del país
  base_type VARCHAR(50),                     -- Tipo: military, joint, civilian
  latitude DECIMAL(10, 6),                   -- Coordenadas
  longitude DECIMAL(10, 6),
  operators TEXT[],                          -- Operadores militares
  notes TEXT
);
```

### Tabla: `aircraft_location_history` ✅ IMPLEMENTADA

Almacena cada punto de detección para reconstruir trails.

```sql
CREATE TABLE aircraft_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icao24 VARCHAR(10) REFERENCES military_aircraft_registry(icao24),
  event_type VARCHAR(20),             -- 'detection', 'departure', 'arrival', 'incursion'
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  altitude INTEGER,
  heading INTEGER,
  speed INTEGER,
  callsign VARCHAR(20),
  origin_icao VARCHAR(10),
  destination_icao VARCHAR(10),
  country_code VARCHAR(3),            -- Detectado por PostGIS o Nominatim
  detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_location_history_icao24 ON aircraft_location_history(icao24);
CREATE INDEX idx_location_history_detected_at ON aircraft_location_history(detected_at);
```

### Tabla: `aircraft_country_presence` ✅ IMPLEMENTADA

Acumula presencia por país para cada aeronave.

```sql
CREATE TABLE aircraft_country_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icao24 VARCHAR(10) REFERENCES military_aircraft_registry(icao24),
  country_code VARCHAR(3),
  country_name VARCHAR(100),
  first_seen_in_country TIMESTAMPTZ,
  last_seen_in_country TIMESTAMPTZ,
  total_detections_in_country INTEGER DEFAULT 0,
  UNIQUE(icao24, country_code)
);
```

### Vista: `aircraft_last_presence` ✅ IMPLEMENTADA

Vista optimizada para obtener la última ubicación conocida de cada aeronave.

```sql
CREATE VIEW aircraft_last_presence AS
SELECT DISTINCT ON (icao24)
  icao24,
  country_code,
  country_name,
  last_seen_in_country
FROM aircraft_country_presence
ORDER BY icao24, last_seen_in_country DESC;
```

### Función: `recalculate_probable_base` ✅ IMPLEMENTADA

Recalcula la base probable basándose en el historial de origen/destino.

```sql
CREATE OR REPLACE FUNCTION recalculate_probable_base(p_icao24 TEXT)
RETURNS void AS $$
DECLARE
  v_base RECORD;
BEGIN
  -- Buscar aeropuerto más frecuente como origen
  SELECT origin_icao, COUNT(*) as freq
  INTO v_base
  FROM aircraft_location_history
  WHERE icao24 = p_icao24 
    AND origin_icao IS NOT NULL
    AND event_type = 'detection'
  GROUP BY origin_icao
  ORDER BY freq DESC
  LIMIT 1;
  
  IF v_base IS NOT NULL THEN
    -- Buscar datos de la base en caribbean_military_bases
    UPDATE military_aircraft_registry
    SET 
      probable_base_icao = v_base.origin_icao,
      probable_base_name = COALESCE(
        (SELECT name FROM caribbean_military_bases 
         WHERE icao_code = v_base.origin_icao 
            OR iata_code = v_base.origin_icao),
        v_base.origin_icao
      ),
      probable_country = (SELECT country_name FROM caribbean_military_bases 
                          WHERE icao_code = v_base.origin_icao 
                             OR iata_code = v_base.origin_icao),
      base_confidence = LEAST(100, v_base.freq * 10)
    WHERE icao24 = p_icao24;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Edge Functions

### `aircraft-registry-collector` (V11)

**Ubicación**: Supabase Edge Functions  
**Trigger**: Cron job cada 5 minutos  
**JWT**: Deshabilitado (verify_jwt: false)

#### Funcionamiento

```typescript
// 1. Consulta la API pública de FlightRadar24
const fr24Url = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=${CARIBBEAN_BOUNDS}&faa=1&satellite=1&mlat=1&adsb=1`;

// 2. Parsea el formato de respuesta
// Formato: { "flightId": [icao24, lat, lon, heading, alt, speed, ...], ... }

// 3. Filtra vuelos militares USA
function isUSMilitary(hex, callsign, prefixes, patterns) {
  // Por prefijo ICAO24 (AE, AF = USA Military)
  for (const prefix of prefixes) {
    if (hex.startsWith(prefix)) return true;
  }
  // Por patrón de callsign (RCH, NAVY, SHARK, etc.)
  for (const pattern of patterns) {
    if (callsign.startsWith(pattern)) return true;
  }
  return false;
}

// 4. Upsert en military_aircraft_registry
// - Si existe: actualiza last_seen, incrementa total_detections, agrega callsign
// - Si no existe: inserta nuevo registro
```

#### Configuración del Cron Job

```sql
-- Ejecutar cada 5 minutos
SELECT cron.schedule(
  'aircraft-registry-collector-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/aircraft-registry-collector',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
```

#### Respuesta de la Función

```json
{
  "success": true,
  "version": "V11-PUBLIC-API",
  "api": "data-cloud.flightradar24.com",
  "bounds": "30,5,-95,-55",
  "stats": {
    "total_flights": 1347,
    "usa_military": 3,
    "registered": 3
  },
  "military_flights": [
    {
      "hex": "AE54C7",
      "callsign": "SHARK33",
      "type": "C30J",
      "reg": "12-5756",
      "lat": "24.56",
      "lon": "-76.78",
      "alt": 24000,
      "match_reason": "ICAO24 AE"
    }
  ]
}
```

---

## Hooks de React

### `useAircraftRegistry`

**Ubicación**: `src/hooks/useAircraftRegistry.js`

```javascript
export function useAircraftRegistry(options = {}) {
  const {
    enabled = true,
    autoRefresh = false,
    refreshInterval = 60000,
    filters = {},
  } = options;

  // Estado
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [modelCatalog, setModelCatalog] = useState({});
  const [modelImages, setModelImages] = useState({});

  // Funciones principales
  const fetchAircraft = useCallback(async (customFilters) => { ... });
  const fetchStats = useCallback(async () => { ... });
  const getByIcao24 = useCallback(async (icao24) => { ... });
  const getLocationHistory = useCallback(async (icao24) => { ... });
  const updateNotes = useCallback(async (icao24, notes) => { ... });

  // Datos computados
  const topIncursionAircraft = useMemo(() => { ... }, [aircraft]);
  const recentlySeenAircraft = useMemo(() => { ... }, [aircraft]);

  return {
    aircraft,
    loading,
    error,
    stats,
    topIncursionAircraft,
    recentlySeenAircraft,
    refetch: fetchAircraft,
    refreshStats: fetchStats,
    getByIcao24,
    updateNotes,
  };
}
```

### Filtros Disponibles

```javascript
const { aircraft } = useAircraftRegistry({
  filters: {
    country: 'US',           // Por país
    base: 'TJSJ',            // Por base ICAO
    type: 'C30J',            // Por tipo de aeronave
    branch: 'USAF',          // Por rama militar
    isActive: true,          // Solo activas
    hasIncursions: true,     // Con incursiones a Venezuela
    newToday: true,          // Nuevas hoy
    search: 'SHARK',         // Búsqueda texto
    limit: 50,               // Límite
  }
});
```

### `useAircraftImages`

**Ubicación**: `src/hooks/useAircraftImages.js`

```javascript
export function useAircraftImages(aircraftType) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file, isPrimary = false) => { ... };
  const deleteImage = async (imageId) => { ... };
  const setPrimaryImage = async (imageId) => { ... };

  return { images, uploading, uploadImage, deleteImage, setPrimaryImage };
}
```

---

## Componentes UI

### `AircraftRegistryPanel`

**Ubicación**: `src/components/Aircraft/AircraftRegistryPanel.jsx`

Panel principal con tabs:
- **Inventario**: Lista/grid de todas las aeronaves con imagen, callsign, país y base probable
- **Por País**: Aeronaves agrupadas por país de presencia
- **Bases**: Aeronaves agrupadas por base probable
- **Top Incursiones**: Aeronaves con más incursiones a Venezuela
- **Nuevas Hoy**: Aeronaves detectadas por primera vez hoy

Características:
- Vista lista optimizada con thumbnails 56x56px
- Muestra última ubicación conocida y base probable
- Banderas de países con emoji
- Responsive para móvil y desktop

### `AircraftDetailView` (Pantalla Completa)

**Ubicación**: `src/components/Aircraft/AircraftDetailView.jsx`

Vista de pantalla completa con layout de 2 columnas (desktop):

**Columna Izquierda:**
- Imagen grande del modelo (galería con navegación)
- Especificaciones técnicas del catálogo
- Datos del transponder

**Columna Derecha (Tabs):**
- **Info**: Identificación, callsigns, estadísticas, rama militar
- **Historial**: Trail de vuelos estilo FlightRadar24
- **Galería**: Upload y gestión de imágenes
- **Notas**: Notas manuales editables

#### Sub-componente: HistoryTab

Vista de historial de vuelos con:
- **Estadísticas**: Días con actividad, puntos registrados, aeropuertos visitados
- **Tabla de vuelos**: Agrupados por fecha, con hora inicio/fin, duración, aeropuertos
- **Detalle del día**: Al seleccionar una fecha muestra:
  - Mapa Mapbox con trail del vuelo (estilo Outdoors)
  - Línea del recorrido con puntos
  - Marcador verde (inicio) y rojo (fin)
  - Lista colapsable de puntos con hora y país

### `AircraftImageGallery`

**Ubicación**: `src/components/Aircraft/AircraftImageGallery.jsx`

Galería de imágenes por modelo:
- Upload de imágenes a Supabase Storage
- Marcar imagen como principal
- Lightbox para visualización
- Las imágenes se comparten entre todas las aeronaves del mismo tipo

### `FlightDetailsPanel`

**Ubicación**: `src/components/FlightRadar/FlightDetailsPanel.jsx`

Panel de preview rápido en el mapa:
- Muestra al hacer clic en un vuelo del radar
- Imagen del modelo, callsign, tipo, bandera del país
- Estado del transponder, altitud, velocidad
- Modo expandido con más detalles
- Botón para abrir vista completa del inventario

---

## Flujo de Datos

### Recolección Automática

```
1. Cron (cada 5 min)
   │
   ▼
2. Edge Function aircraft-registry-collector
   │
   ├── Consulta API pública FR24
   │   GET https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=30,5,-95,-55
   │
   ├── Parsea respuesta (formato array por vuelo)
   │
   ├── Filtra militares USA
   │   - Prefijos ICAO24: AE, AF
   │   - Patrones callsign: RCH, NAVY, SHARK, etc.
   │
   └── Para cada vuelo militar:
       │
       ├── ¿Existe en DB?
       │   │
       │   ├── SÍ: UPDATE
       │   │   - last_seen = NOW()
       │   │   - total_detections++
       │   │   - Agregar callsign si es nuevo
       │   │
       │   └── NO: INSERT
       │       - first_seen = NOW()
       │       - first_seen_date = TODAY
       │       - is_new_today = true
       │
       └── Fin
```

### Consulta desde Frontend

```
1. Usuario abre panel "Inventario"
   │
   ▼
2. Hook useAircraftRegistry se activa
   │
   ├── fetchAircraft()
   │   SELECT * FROM military_aircraft_registry
   │
   ├── fetchModelCatalog()
   │   SELECT * FROM aircraft_model_catalog
   │
   ├── fetchModelImages()
   │   SELECT * FROM aircraft_model_images
   │
   └── Enriquece datos
       aircraft.map(a => ({
         ...a,
         model: modelCatalog[a.aircraft_type],
         images: modelImages[a.aircraft_type]
       }))
   │
   ▼
3. Renderiza en UI
```

---

## Configuración y Secretos

### Variables de Entorno (Edge Functions)

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Key de servicio (acceso total) |
| `FLIGHTRADAR24_API_KEY` | Token API oficial FR24 (no usado actualmente) |

### Tablas de Configuración

**`incursion_monitor_config`** contiene:
- `icao24_military_prefixes`: Array de prefijos (["AE", "AF"])
- Otras configuraciones del monitor de incursiones

**`military_callsign_patterns`** contiene:
- Patrones de callsign militares (RCH, NAVY, SHARK, etc.)
- Campo `is_active` para activar/desactivar

---

## API de FlightRadar24

### API Pública (Usada actualmente)

```
Base URL: https://data-cloud.flightradar24.com
Endpoint: /zones/fcgi/feed.js

Parámetros:
- bounds: "north,south,west,east" (ej: "30,5,-95,-55")
- faa: 1 (incluir datos FAA)
- satellite: 1 (incluir datos satelitales)
- mlat: 1 (incluir MLAT)
- adsb: 1 (incluir ADS-B)
- gnd: 0 (excluir en tierra)
- air: 1 (incluir en vuelo)

Formato respuesta:
{
  "flightId123": [
    "AE54C7",    // [0] ICAO24 hex
    24.56,       // [1] Latitud
    -76.78,      // [2] Longitud
    301,         // [3] Heading
    24000,       // [4] Altitud (ft)
    240,         // [5] Velocidad (kts)
    "1234",      // [6] Squawk
    "T-MLAT",    // [7] Radar/source
    "C30J",      // [8] Tipo aeronave
    "12-5756",   // [9] Registro
    1703721600,  // [10] Timestamp
    "VQS",       // [11] Origen
    "NRR",       // [12] Destino
    "",          // [13] IATA
    0,           // [14] ?
    0,           // [15] ?
    "SHARK33"    // [16] Callsign
  ],
  "full_count": 15000,
  "version": 4
}
```

### API Oficial (Alternativa con token)

```
Base URL: https://fr24api.flightradar24.com
Endpoint: /api/live/flight-positions/full

Headers:
- Authorization: Bearer {TOKEN}
- Accept-Version: v1

Nota: Esta API tiene comportamiento diferente y puede no devolver
todos los vuelos que muestra la API pública.
```

---

## Funcionalidades Implementadas

### ✅ Completadas (Dic 2025)

| # | Funcionalidad | Estado | Notas |
|---|---------------|--------|-------|
| 1 | **Tracking de Presencia por País** | ✅ | Tabla `aircraft_country_presence` + Nominatim geocoding |
| 2 | **Cálculo de Base Probable** | ✅ | Función `recalculate_probable_base()` |
| 3 | **Historial de Ubicaciones** | ✅ | Tabla `aircraft_location_history` con trail completo |
| 4 | **Vista Historial estilo FR24** | ✅ | Tabla de vuelos por fecha + detalle del día |
| 5 | **Trail en Mapa** | ✅ | Mapbox con línea, puntos, marcadores inicio/fin |
| 6 | **Detección País del Avión** | ✅ | Por prefijo ICAO24 (AE/AF = USA) con bandera |
| 7 | **Rama Militar** | ✅ | Detección por callsign + mostrado en UI |
| 8 | **Catálogo de Modelos** | ✅ | 82+ tipos con especificaciones técnicas |
| 9 | **Galería de Imágenes** | ✅ | Upload a Supabase Storage por modelo |
| 10 | **UI Responsive** | ✅ | Desktop 2 columnas, móvil stack vertical |

### Detalle de Implementaciones

#### Geocoding con Nominatim

Sistema de reverse geocoding para detectar país de cada punto de ubicación:

```javascript
// En HistoryTab
const cache = new Map();
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`; // Precision 2 decimales
  if (cache.has(key)) return cache.get(key);
  
  // Rate limiting: 1 req/segundo
  await delay(1000);
  
  const response = await fetch(
    `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json`
  );
  const data = await response.json();
  
  const result = {
    country: data.address?.country,
    country_code: data.address?.country_code?.toUpperCase()
  };
  
  cache.set(key, result);
  return result;
}
```

#### Detección de País por ICAO24

Basado en prefijos hex del transponder:

```javascript
// Prefijos ICAO24 por país
function getAircraftCountryByIcao24(icao24) {
  const hex = icao24?.toUpperCase() || '';
  
  // USA Military
  if (hex.startsWith('AE') || hex.startsWith('AF')) {
    return { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' };
  }
  // USA Civil
  if (hex.startsWith('A')) {
    return { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' };
  }
  // Otros países...
  return null;
}
```

#### Mapa del Trail con Mapbox

```jsx
// En HistoryTab > FlightDayDetail
useEffect(() => {
  const map = new mapboxgl.Map({
    container: mapContainerRef.current,
    style: MAPBOX_STYLES.OUTDOORS, // Mapa claro con etiquetas legibles
    center: [centerLon, centerLat],
    zoom: 6
  });
  
  // Agregar línea del trail
  map.addSource('trail', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points.map(p => [p.longitude, p.latitude])
      }
    }
  });
  
  map.addLayer({
    id: 'trail-line',
    type: 'line',
    source: 'trail',
    paint: { 'line-color': '#3b82f6', 'line-width': 3 }
  });
  
  // Marcadores inicio (verde) y fin (rojo)
  new mapboxgl.Marker({ color: '#22c55e' })
    .setLngLat([firstPoint.longitude, firstPoint.latitude])
    .setPopup(new mapboxgl.Popup().setHTML('<b>Inicio</b>'))
    .addTo(map);
    
  new mapboxgl.Marker({ color: '#ef4444' })
    .setLngLat([lastPoint.longitude, lastPoint.latitude])
    .setPopup(new mapboxgl.Popup().setHTML('<b>Fin</b>'))
    .addTo(map);
}, [points]);
```

---

## Pendientes

### Alta Prioridad

#### 1. Integración con Sistema de Incursiones
Cuando se cierra una `incursion_session`, actualizar automáticamente:
- `total_incursions` en `military_aircraft_registry`
- Crear entrada en `aircraft_location_history`

#### 2. Almacenamiento Continuo del Trail
Actualmente el collector solo guarda la última posición. Implementar:
- Guardar cada detección en `aircraft_location_history`
- Configurar retención de datos (ej: 30 días)
- Optimizar storage con compresión temporal

### Media Prioridad

#### 3. Reporte Diario a Telegram
Crear Edge Function `daily-aircraft-report`

#### 4. Notificaciones de Nueva Aeronave
Enviar alerta Telegram cuando se detecta una aeronave por primera vez

#### 5. Dashboard de Estadísticas
Crear visualizaciones:
- Gráfico de aeronaves por día
- Mapa de calor de actividad
- Timeline de detecciones

### Baja Prioridad

#### 6. Exportación de Datos
Permitir exportar el inventario (CSV, JSON, Excel)

#### 7. API REST Pública
Endpoints para consultar el inventario

---

## Troubleshooting

### La función no detecta vuelos

1. **Verificar bounds**: Asegurar que cubren el área de interés
   ```
   CARIBBEAN_BOUNDS = '30,5,-95,-55'
   // Norte, Sur, Oeste, Este
   ```

2. **Verificar prefijos**: Confirmar en `incursion_monitor_config`
   ```sql
   SELECT icao24_military_prefixes FROM incursion_monitor_config;
   -- Debe incluir: ["AE", "AF"]
   ```

3. **Verificar patrones**: Confirmar en `military_callsign_patterns`
   ```sql
   SELECT pattern FROM military_callsign_patterns WHERE is_active = true;
   ```

### Error de API FR24

- **API Oficial (401)**: Token inválido o expirado
- **API Pública (403)**: Rate limiting, esperar unos minutos
- **API Pública (500)**: Problema temporal de FR24

### Solución: Usar API Pública

La API pública (`data-cloud.flightradar24.com`) es más confiable y devuelve más datos que la API oficial para este caso de uso.

---

## Archivos Relacionados

```
src/
├── hooks/
│   ├── useAircraftRegistry.js      # Hook principal
│   └── useAircraftImages.js        # Hook de imágenes
├── components/
│   └── Aircraft/
│       ├── AircraftRegistryPanel.jsx   # Panel principal
│       ├── AircraftDetailModal.jsx     # Modal de detalles
│       └── AircraftImageGallery.jsx    # Galería de imágenes
└── services/
    └── flightRadarService.js       # Servicio FR24 (frontend)

supabase/
└── functions/
    └── aircraft-registry-collector/
        └── index.ts                # Edge Function V11

docs/
├── REGISTRO-AERONAVES-MILITARES.md # Este documento
└── PROPUESTA-REGISTRO-AERONAVES-MILITARES.md # Propuesta original
```

---

## Changelog

### V15 (2025-12-29)
- ✅ **Historial de vuelos estilo FR24**: Tabla agrupada por fecha con estadísticas
- ✅ **Trail en mapa Mapbox**: Línea del recorrido con marcadores inicio/fin
- ✅ **Estilo Outdoors**: Mapa claro con etiquetas legibles
- ✅ **FlightDayDetail**: Vista detallada del día con mapa interactivo
- ✅ **Puntos colapsables**: Lista de ubicaciones expandible/colapsable

### V14 (2025-12-28)
- ✅ **País del avión**: Detección por ICAO24 con bandera en UI
- ✅ **Rama militar**: Badge visible en header (US Air Force, US Army, etc.)
- ✅ **UI responsive móvil**: Tabs scrollables, texto truncado
- ✅ **FlightDetailsPanel mejorado**: Preview con imagen, bandera, transponder
- ✅ **82+ modelos** en catálogo con especificaciones
- ✅ **40+ bases militares** en caribbean_military_bases

### V13 (2025-12-28)
- ✅ **Historial de ubicaciones**: Tabla `aircraft_location_history`
- ✅ **Presencia por país**: Tabla `aircraft_country_presence`
- ✅ **Base probable**: Función `recalculate_probable_base()`
- ✅ **Geocoding Nominatim**: Detección de país por coordenadas

### V12 (2025-12-28)
- ✅ **AircraftDetailView**: Pantalla completa reemplaza modal
- ✅ **Layout 2 columnas**: Imagen izq + tabs derecha
- ✅ **Galería de imágenes**: Upload a Supabase Storage
- ✅ **Vista aircraft_last_presence**: Última ubicación optimizada

### V11 (2025-12-27)
- ✅ Migración a API pública de FR24
- ✅ Primer registro exitoso (SHARK33)
- ✅ Cron job funcionando cada 5 minutos

### V1-V10 (2025-12-27)
- Iteraciones de desarrollo y debugging
- Corrección de columnas de tabla
- Cambio de API oficial a pública

---

## Archivos Actualizados

```
src/
├── hooks/
│   ├── useAircraftRegistry.js      # Hook principal (actualizado)
│   ├── useAircraftImages.js        # Hook de imágenes (actualizado)
│   └── useFlightRadar.js           # Enriquecimiento con catálogo
├── components/
│   ├── Aircraft/
│   │   ├── AircraftRegistryPanel.jsx   # Panel inventario (responsive)
│   │   ├── AircraftDetailView.jsx      # ✨ NUEVO: Pantalla completa
│   │   ├── AircraftDetailModal.jsx     # Deprecado (usar DetailView)
│   │   └── AircraftImageGallery.jsx    # Galería (actualizado)
│   └── FlightRadar/
│       ├── FlightDetailsPanel.jsx      # Preview mejorado
│       └── FlightRadarPanel.jsx        # Lista con imágenes
├── lib/
│   └── maplibre.js                     # Estilos Mapbox (OUTDOORS)
└── services/
    └── flightRadarService.js           # Servicio FR24

docs/
├── REGISTRO-AERONAVES-MILITARES.md     # Este documento
└── PROPUESTA-REGISTRO-AERONAVES-MILITARES.md
```

---

## Contacto

Para preguntas sobre esta implementación, revisar:
- Este documento
- `docs/PROPUESTA-REGISTRO-AERONAVES-MILITARES.md`
- `docs/ARQUITECTURA.md`
- `docs/INTEGRACIONES.md`

