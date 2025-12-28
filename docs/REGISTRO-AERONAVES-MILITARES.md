# Sistema de Registro de Aeronaves Militares del Caribe

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos](#base-de-datos)
4. [Edge Functions](#edge-functions)
5. [Hooks de React](#hooks-de-react)
6. [Componentes UI](#componentes-ui)
7. [Flujo de Datos](#flujo-de-datos)
8. [Configuración y Secretos](#configuración-y-secretos)
9. [API de FlightRadar24](#api-de-flightradar24)
10. [Recomendaciones de Mejora](#recomendaciones-de-mejora)

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

### Tabla: `aircraft_country_presence` (Futura)

Para rastrear presencia por país (estructura propuesta).

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
- **Inventario**: Lista/grid de todas las aeronaves
- **Por País**: Aeronaves agrupadas por país de presencia
- **Bases**: Aeronaves agrupadas por base probable
- **Top Incursiones**: Aeronaves con más incursiones a Venezuela
- **Nuevas Hoy**: Aeronaves detectadas por primera vez hoy

### `AircraftDetailModal`

**Ubicación**: `src/components/Aircraft/AircraftDetailModal.jsx`

Modal con información detallada:
- Identificación (ICAO24, callsigns, registro)
- Especificaciones técnicas (del catálogo)
- Estadísticas (detecciones, incursiones)
- Historial de ubicaciones
- Galería de imágenes
- Notas editables

### `AircraftImageGallery`

**Ubicación**: `src/components/Aircraft/AircraftImageGallery.jsx`

Galería de imágenes por modelo:
- Upload de imágenes a Supabase Storage
- Marcar imagen como principal
- Lightbox para visualización
- Las imágenes se comparten entre todas las aeronaves del mismo tipo

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

## Recomendaciones de Mejora

### Alta Prioridad

#### 1. Tracking de Presencia por País
Implementar la tabla `aircraft_country_presence` para rastrear en qué países ha sido detectada cada aeronave.

```sql
-- Cuando se detecta una aeronave, determinar el país
-- usando PostGIS y los límites territoriales existentes
SELECT country_code FROM terrestrial_boundaries_cache
WHERE ST_Contains(geojson::geometry, ST_Point(lon, lat));
```

#### 2. Cálculo de Base Probable
Implementar algoritmo para determinar la base probable basándose en:
- Frecuencia de origen/destino
- Primer avistamiento del día
- Último avistamiento del día

```sql
-- Función para recalcular base probable
CREATE OR REPLACE FUNCTION calculate_probable_base(p_icao24 TEXT)
RETURNS void AS $$
  -- Analizar historial de vuelos
  -- Determinar aeropuerto más frecuente como origen
  -- Actualizar probable_base_icao
$$ LANGUAGE plpgsql;
```

#### 3. Integración con Sistema de Incursiones
Cuando se cierra una `incursion_session`, actualizar automáticamente:
- `total_incursions` en `military_aircraft_registry`
- Crear entrada en `aircraft_location_history`

```sql
-- Trigger después de cerrar incursión
CREATE TRIGGER after_incursion_close
AFTER UPDATE ON incursion_sessions
FOR EACH ROW
WHEN (NEW.status = 'closed')
EXECUTE FUNCTION update_aircraft_incursion_stats();
```

### Media Prioridad

#### 4. Reporte Diario a Telegram
Crear Edge Function `daily-aircraft-report` que envíe a las 18:00:

```
📊 REPORTE DIARIO - AERONAVES MILITARES USA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆕 Nuevas hoy: 5 aeronaves
✈️ Activas: 23 aeronaves
🔄 Total detecciones: 156

📍 Por país:
  🇵🇷 Puerto Rico: 12
  🇩🇴 Rep. Dominicana: 5
  🇨🇺 Cuba: 3
  🇹🇹 Trinidad: 3

🔝 Más activas:
  1. AE54C7 (SHARK33) - 15 detecciones
  2. AE1234 (RCH123) - 12 detecciones
```

#### 5. Historial de Ubicaciones
Crear tabla `aircraft_location_history` para eventos discretos:

```sql
CREATE TABLE aircraft_location_history (
  id UUID PRIMARY KEY,
  icao24 VARCHAR(10),
  event_type VARCHAR(20),  -- 'detection', 'departure', 'arrival', 'incursion'
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  altitude INTEGER,
  heading INTEGER,
  speed INTEGER,
  origin_icao VARCHAR(10),
  destination_icao VARCHAR(10),
  country_code VARCHAR(3),
  detected_at TIMESTAMPTZ
);
```

#### 6. Clasificación Automática de Rama Militar
Mejorar `getOperatorName()` con más patrones:

```javascript
const BRANCH_PATTERNS = {
  'USAF': ['RCH', 'REACH', 'SHARK', 'EVAC', 'SPAR', 'SAM', 'BAT', 'BOXER'],
  'USN': ['NAVY', 'CNV', 'IRON'],
  'USMC': ['VIPER', 'COBRA'],
  'USCG': ['COAST', 'CG'],
  'USA': ['ARMY'],
};
```

### Baja Prioridad

#### 7. Notificaciones de Nueva Aeronave
Enviar alerta Telegram cuando se detecta una aeronave por primera vez:

```
🆕 NUEVA AERONAVE DETECTADA

✈️ AE54C7 - C-130J Super Hercules
📍 Callsign: SHARK33
🎖️ US Air Force
📍 Posición: 24.56°N, 76.78°W
🕐 2025-12-27 19:11:55
```

#### 8. Dashboard de Estadísticas
Crear visualizaciones:
- Gráfico de aeronaves por día
- Mapa de calor de actividad
- Timeline de detecciones
- Comparativa por rama militar

#### 9. Exportación de Datos
Permitir exportar el inventario en formatos:
- CSV
- JSON
- Excel

#### 10. API REST Pública
Exponer endpoints para consultar el inventario:
- `GET /api/aircraft` - Lista de aeronaves
- `GET /api/aircraft/:icao24` - Detalle de aeronave
- `GET /api/stats` - Estadísticas generales

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

### V11 (2025-12-27)
- ✅ Migración a API pública de FR24
- ✅ Primer registro exitoso (SHARK33)
- ✅ Cron job funcionando cada 5 minutos

### V1-V10 (2025-12-27)
- Iteraciones de desarrollo y debugging
- Corrección de nombre de secreto
- Corrección de columnas de tabla
- Cambio de API oficial a pública

---

## Contacto

Para preguntas sobre esta implementación, revisar:
- Este documento
- `docs/PROPUESTA-REGISTRO-AERONAVES-MILITARES.md`
- `docs/ARQUITECTURA.md`
- `docs/INTEGRACIONES.md`

