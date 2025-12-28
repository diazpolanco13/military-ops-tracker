# Propuesta: Registro de Aeronaves Militares del Caribe

> **Estado**: **MVP IMPLEMENTADO (en producción) + mejoras en curso**  
> **Fecha**: 26 de diciembre de 2024 (actualizado: 28 de diciembre de 2025)  
> **Prioridad**: Alta  

---

## 📋 Resumen Ejecutivo

Crear un **sistema de registro persistente de aeronaves militares de EEUU** que operan en el Caribe, tratando cada aeronave como una **entidad única y rastreable** a lo largo del tiempo. Esto permitirá:

1. Identificar cada aeronave individual por su ICAO24 (hex único del transponder)
2. Rastrear su historial de operaciones y patrones
3. Determinar bases probables por frecuencia de origen/destino
4. Mantener un inventario por país/base
5. Asociar imágenes por modelo de aeronave

---

## 🎯 Objetivos

### Problema Actual
- El sistema detecta incursiones pero NO identifica aeronaves individuales
- No se sabe si el F/A-18 de hoy es el mismo que vino la semana pasada
- No hay inventario de activos militares por país/base
- Las estadísticas son agregadas, no individualizadas

### Solución Propuesta
- Registrar cada ICAO24 único como entidad persistente
- Trackear movimientos origen → destino
- Calcular base probable por frecuencia
- Permitir consultas: "¿Qué hay en Puerto Rico?" / "¿Cuántas veces vino AE1234?"
- Galería de imágenes por modelo de aeronave

---

## ✅ Estado Actual (Dic 2025)

### Implementado (MVP)
- **Registro persistente por aeronave (ICAO24)**: `military_aircraft_registry` operativo.
- **Historial de detecciones**: `aircraft_location_history` operativo (eventos `detection`).
- **Presencia por país**: `aircraft_country_presence` + vista `caribbean_deployment_summary`.
- **Detección de país/EEZ con PostGIS**:
  - RPCs `get_country_at_point` y `get_eez_at_point` (mejoradas con `ST_Covers` + SRID).
  - Normalización de country codes para consistencia (ISO3 en tracking: `USA`, `VEN`, `COL`, `PAN`, etc.).
- **Catálogo de modelos**: `aircraft_model_catalog` + UI enriquecida (especificaciones, fabricante, rol).
- **Imágenes por modelo**: `aircraft_model_images` + uploader/galería (por `aircraft_type`).
- **Vista de detalle full-screen**: `AircraftDetailView` reemplaza modales, con layout PC (imagen izq, tabs der).
- **CALLSIGN como dato prioritario**:
  - En lista/grid y en header del detalle.
- **Inventario optimizado**:
  - Se muestra **último país detectado + fecha** y **base probable** en la lista (batch via vista `aircraft_last_presence`).
- **Base probable**:
  - RPC `recalculate_probable_base` corregida para funcionar con `detection` y resolver IATA/ICAO.
  - `caribbean_military_bases` ampliada con bases/aeropuertos clave (US/PR/PA) según `origin_icao`.
- **Fix crítico**: normalización de ramas militares en el collector (v14) para que entren Navy/Marines/Army/Coast Guard sin violar constraints.

### Operativa enfocada (inteligencia)
- **Foco principal**: aeronaves militares/gobierno de EEUU, priorizando **Caribe + EEUU**.
- **Puerto Rico (PR)**: resaltado como **Territorio de USA** en UI para evitar ambigüedades.

---

## 🗄️ Esquema de Base de Datos

### Tabla 1: `military_aircraft_registry`
**Propósito**: Registro único de cada aeronave militar detectada.

```sql
CREATE TABLE military_aircraft_registry (
  -- Identificación única
  icao24 VARCHAR(6) PRIMARY KEY,           -- Hex único del transponder (ej: "AE1234")
  
  -- Identificación de aeronave
  callsigns_used TEXT[] DEFAULT '{}',       -- Array de callsigns usados ["RCH851", "BAT91"]
  aircraft_type VARCHAR(10),                -- Código FR24: F18S, C17, E2, P8, etc.
  aircraft_model VARCHAR(100),              -- Nombre completo: "Boeing F/A-18 Hornet"
  
  -- Clasificación militar
  military_branch VARCHAR(20),              -- Navy, USAF, Marines, Army, Coast Guard
  squadron VARCHAR(50),                     -- Escuadrón si se puede determinar
  tail_number VARCHAR(20),                  -- Matrícula si disponible
  
  -- Base probable (calculada)
  probable_base_icao VARCHAR(4),            -- TJSJ, TNCC, etc.
  probable_base_name VARCHAR(100),          -- "Roosevelt Roads"
  probable_country VARCHAR(3),              -- PR, CW, NL, CO
  base_confidence INTEGER DEFAULT 0,        -- 0-100% confianza en la base
  
  -- Estadísticas
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_detections INTEGER DEFAULT 1,       -- Veces detectado en general
  total_incursions INTEGER DEFAULT 0,       -- Veces que incursionó en VEN
  total_flights INTEGER DEFAULT 1,          -- Vuelos únicos registrados
  
  -- Metadata
  notes TEXT,                               -- Notas manuales
  is_active BOOLEAN DEFAULT TRUE,           -- Si sigue operativo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_aircraft_type ON military_aircraft_registry(aircraft_type);
CREATE INDEX idx_probable_country ON military_aircraft_registry(probable_country);
CREATE INDEX idx_last_seen ON military_aircraft_registry(last_seen);
CREATE INDEX idx_military_branch ON military_aircraft_registry(military_branch);
```

### Tabla 2: `aircraft_model_images`
**Propósito**: Galería de imágenes por modelo de aeronave. Una imagen aplica para todos los aviones del mismo modelo.

```sql
CREATE TABLE aircraft_model_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificación del modelo
  aircraft_type VARCHAR(10) NOT NULL,       -- F18S, C17, E2, P8 (código FR24)
  aircraft_model VARCHAR(100) NOT NULL,     -- "Boeing F/A-18 Hornet"
  
  -- Imagen
  image_url TEXT NOT NULL,                  -- URL en Supabase Storage
  thumbnail_url TEXT,                       -- Thumbnail para listas
  
  -- Metadata de imagen
  image_source VARCHAR(100),                -- "US Navy", "Wikipedia", "User Upload"
  image_caption TEXT,                       -- Descripción de la imagen
  is_primary BOOLEAN DEFAULT FALSE,         -- Imagen principal del modelo
  
  -- Control
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(aircraft_type, is_primary) WHERE is_primary = TRUE
);

-- Índice para búsqueda rápida
CREATE INDEX idx_model_images_type ON aircraft_model_images(aircraft_type);
```

### Tabla 3: `caribbean_military_bases`
**Propósito**: Catálogo de aeropuertos y bases militares del Caribe.

```sql
CREATE TABLE caribbean_military_bases (
  -- Identificación
  icao_code VARCHAR(4) PRIMARY KEY,         -- TJSJ, TNCC, TNCM, etc.
  iata_code VARCHAR(3),                     -- SJU, CUR, SXM, etc.
  
  -- Información básica
  name VARCHAR(150) NOT NULL,               -- "Luis Muñoz Marín International"
  alternate_names TEXT[],                   -- Nombres alternativos
  
  -- Ubicación
  country_code VARCHAR(3) NOT NULL,         -- PR, CW, NL, CO, VE, TT, etc.
  country_name VARCHAR(100) NOT NULL,       -- Puerto Rico, Curazao, etc.
  city VARCHAR(100),                        -- San Juan, Willemstad, etc.
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  
  -- Clasificación
  base_type VARCHAR(20) NOT NULL,           -- military, civilian_military, civilian
  military_presence BOOLEAN DEFAULT FALSE,  -- ¿Hay presencia militar conocida?
  
  -- Información militar
  known_units TEXT[],                       -- Unidades estacionadas conocidas
  facilities TEXT[],                        -- Hangares, pistas, etc.
  host_nation_agreement BOOLEAN,            -- ¿Hay acuerdo con país anfitrión?
  
  -- Estadísticas (calculadas)
  total_aircraft_based INTEGER DEFAULT 0,   -- Aeronaves con base aquí
  last_military_activity TIMESTAMPTZ,       -- Última actividad militar
  
  -- Control
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla 4: `aircraft_location_history`
**Propósito**: Historial de movimientos de cada aeronave.

```sql
CREATE TABLE aircraft_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referencia a aeronave
  icao24 VARCHAR(6) NOT NULL REFERENCES military_aircraft_registry(icao24),
  
  -- Datos del vuelo
  callsign VARCHAR(10),
  flight_number VARCHAR(10),
  
  -- Origen y destino
  origin_icao VARCHAR(4),                   -- Aeropuerto origen
  origin_country VARCHAR(3),                -- País origen
  destination_icao VARCHAR(4),              -- Aeropuerto destino
  destination_country VARCHAR(3),           -- País destino
  
  -- Posición al momento de detección
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  altitude INTEGER,                         -- Pies
  speed INTEGER,                            -- Nudos
  heading INTEGER,                          -- 0-360
  
  -- Tipo de evento
  event_type VARCHAR(20) NOT NULL,          -- departure, arrival, transit, incursion, overflight
  
  -- Referencias
  incursion_session_id UUID,                -- FK a incursion_sessions si aplica
  
  -- Timestamp
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT fk_origin FOREIGN KEY (origin_icao) REFERENCES caribbean_military_bases(icao_code),
  CONSTRAINT fk_destination FOREIGN KEY (destination_icao) REFERENCES caribbean_military_bases(icao_code)
);

-- Índices para consultas frecuentes
CREATE INDEX idx_location_icao24 ON aircraft_location_history(icao24);
CREATE INDEX idx_location_detected ON aircraft_location_history(detected_at);
CREATE INDEX idx_location_origin ON aircraft_location_history(origin_icao);
CREATE INDEX idx_location_destination ON aircraft_location_history(destination_icao);
CREATE INDEX idx_location_event ON aircraft_location_history(event_type);
```

### Tabla 5: `aircraft_model_catalog`
**Propósito**: Catálogo de modelos de aeronaves con especificaciones.

```sql
CREATE TABLE aircraft_model_catalog (
  -- Identificación
  aircraft_type VARCHAR(10) PRIMARY KEY,    -- F18S, C17, E2, P8, etc.
  aircraft_model VARCHAR(100) NOT NULL,     -- "Boeing F/A-18E/F Super Hornet"
  
  -- Clasificación
  category VARCHAR(30) NOT NULL,            -- fighter, transport, tanker, awacs, patrol, helicopter
  manufacturer VARCHAR(100),                -- Boeing, Lockheed Martin, Northrop Grumman
  
  -- Especificaciones
  max_speed_knots INTEGER,
  cruise_speed_knots INTEGER,
  max_altitude_ft INTEGER,
  range_nm INTEGER,
  crew_count INTEGER,
  
  -- Armamento/Capacidad
  primary_role TEXT,                        -- Air superiority, Maritime patrol, etc.
  weapons_systems TEXT[],                   -- Misiles, bombas, etc.
  sensors TEXT[],                           -- Radar, FLIR, etc.
  
  -- Ramas que lo operan
  operated_by TEXT[],                       -- ['Navy', 'Marines']
  
  -- Imágenes (referencia a aircraft_model_images)
  primary_image_url TEXT,                   -- Cache de imagen principal
  
  -- Notas
  description TEXT,
  wikipedia_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 Flujo de Datos

### Al detectar un vuelo militar:

```
┌─────────────────────────────────────────────────────────────┐
│                 DETECCIÓN FLIGHTRADAR24                      │
│  ICAO24: AE1234 | Callsign: BAT91 | Type: DH8B              │
│  Origin: TJSJ | Destination: TNCC | Position: 12.5, -68.0   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            1. VERIFICAR AIRCRAFT REGISTRY                    │
├─────────────────────────────────────────────────────────────┤
│  SELECT * FROM military_aircraft_registry                    │
│  WHERE icao24 = 'AE1234'                                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
         NO EXISTE                       SÍ EXISTE
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│   CREAR NUEVO REGISTRO  │     │   ACTUALIZAR REGISTRO       │
├─────────────────────────┤     ├─────────────────────────────┤
│ INSERT INTO             │     │ UPDATE military_aircraft_   │
│ military_aircraft_      │     │ registry SET                │
│ registry (              │     │   last_seen = NOW(),        │
│   icao24, callsigns,    │     │   total_detections += 1,    │
│   aircraft_type,        │     │   callsigns_used =          │
│   first_seen...         │     │     array_append(callsigns, │
│ )                       │     │     'BAT91')                │
└─────────────────────────┘     └─────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            2. REGISTRAR EN LOCATION HISTORY                  │
├─────────────────────────────────────────────────────────────┤
│  INSERT INTO aircraft_location_history (                     │
│    icao24, callsign, origin_icao, destination_icao,         │
│    latitude, longitude, altitude, event_type                │
│  )                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            3. RECALCULAR BASE PROBABLE                       │
├─────────────────────────────────────────────────────────────┤
│  -- Origen más frecuente = base probable                     │
│  SELECT origin_icao, COUNT(*) as freq                       │
│  FROM aircraft_location_history                              │
│  WHERE icao24 = 'AE1234'                                     │
│  GROUP BY origin_icao                                        │
│  ORDER BY freq DESC LIMIT 1                                  │
│                                                              │
│  UPDATE military_aircraft_registry SET                       │
│    probable_base_icao = <resultado>,                         │
│    base_confidence = <calculado>                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            4. SI ES INCURSIÓN → INCREMENTAR                  │
├─────────────────────────────────────────────────────────────┤
│  UPDATE military_aircraft_registry SET                       │
│    total_incursions = total_incursions + 1                   │
│  WHERE icao24 = 'AE1234'                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖼️ Sistema de Imágenes por Modelo

### Concepto
Una imagen se asocia al **tipo de aeronave** (F18S), no a cada aeronave individual. Así, cuando subes una foto de un F/A-18, aplica automáticamente para todos los F/A-18 detectados.

### Flujo de Upload

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD DE IMAGEN                          │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario selecciona modelo: "Boeing F/A-18 Hornet"       │
│  2. Sube imagen desde su dispositivo                         │
│  3. Sistema:                                                 │
│     a) Sube a Supabase Storage (bucket: aircraft-images)    │
│     b) Genera thumbnail                                      │
│     c) Inserta en aircraft_model_images                      │
│     d) Si is_primary, actualiza aircraft_model_catalog      │
└─────────────────────────────────────────────────────────────┘
```

### Componente React: `AircraftImageUploader`

```jsx
// src/components/Aircraft/AircraftImageUploader.jsx

/**
 * Componente para subir imágenes de modelos de aeronaves.
 * 
 * Props:
 * - aircraftType: string (F18S, C17, etc.)
 * - aircraftModel: string ("Boeing F/A-18 Hornet")
 * - onUploadComplete: function
 * 
 * Funcionalidad:
 * - Drag & drop de imagen
 * - Preview antes de subir
 * - Crop/resize automático
 * - Opción de marcar como imagen principal
 * - Indicar fuente de la imagen
 */
```

### Storage en Supabase

```
Bucket: aircraft-images/
├── F18S/
│   ├── primary.jpg          # Imagen principal
│   ├── thumbnail.jpg        # Thumbnail 200x200
│   ├── gallery/
│   │   ├── img_001.jpg
│   │   └── img_002.jpg
├── C17/
│   ├── primary.jpg
│   └── thumbnail.jpg
└── ...
```

---

## 📊 Consultas Frecuentes

### Inventario por país
```sql
-- ¿Cuántos aviones de cada tipo hay basados en Puerto Rico?
SELECT 
  aircraft_type,
  aircraft_model,
  COUNT(*) as cantidad
FROM military_aircraft_registry
WHERE probable_country = 'PR'
GROUP BY aircraft_type, aircraft_model
ORDER BY cantidad DESC;
```

### Historial de una aeronave
```sql
-- ¿Todas las actividades del ICAO24 AE1234?
SELECT 
  h.detected_at,
  h.event_type,
  h.callsign,
  o.name as origen,
  d.name as destino,
  h.altitude,
  h.speed
FROM aircraft_location_history h
LEFT JOIN caribbean_military_bases o ON h.origin_icao = o.icao_code
LEFT JOIN caribbean_military_bases d ON h.destination_icao = d.icao_code
WHERE h.icao24 = 'AE1234'
ORDER BY h.detected_at DESC;
```

### Actividad reciente por base
```sql
-- ¿Qué aviones salieron de Curazao esta semana?
SELECT DISTINCT
  r.icao24,
  r.aircraft_model,
  r.callsigns_used[array_length(r.callsigns_used, 1)] as ultimo_callsign,
  MAX(h.detected_at) as ultima_deteccion
FROM aircraft_location_history h
JOIN military_aircraft_registry r ON h.icao24 = r.icao24
WHERE h.origin_icao = 'TNCC'
AND h.detected_at > NOW() - INTERVAL '7 days'
GROUP BY r.icao24, r.aircraft_model, r.callsigns_used
ORDER BY ultima_deteccion DESC;
```

### Aeronaves que más incursionan
```sql
-- Top 10 aeronaves con más incursiones
SELECT 
  icao24,
  aircraft_model,
  military_branch,
  probable_base_name,
  total_incursions,
  first_seen,
  last_seen
FROM military_aircraft_registry
WHERE total_incursions > 0
ORDER BY total_incursions DESC
LIMIT 10;
```

---

## 🎨 Componentes de UI a Crear

### 1. `AircraftRegistryPanel`
Panel principal para ver todas las aeronaves registradas.

**Funcionalidades:**
- Lista/Grid de aeronaves con thumbnail
- Filtros: por tipo, país, rama militar, fecha
- Búsqueda por ICAO24, callsign, modelo
- Ordenar por: última vista, incursiones, nombre
- Click para ver detalle

### 2. `AircraftDetailModal`
Modal con información completa de una aeronave.

**Secciones:**
- Header: Imagen + Modelo + ICAO24
- Info básica: Rama, base probable, callsigns usados
- Estadísticas: Detecciones, incursiones, primera/última vista
- Timeline: Historial de movimientos
- Mapa: Posiciones detectadas

### 3. `BaseInventoryPanel`
Inventario de aeronaves por base/país.

**Funcionalidades:**
- Selector de país/base
- Grid de aeronaves en esa ubicación
- Estadísticas de la base
- Exportar a PDF/Excel

### 4. `AircraftImageUploader`
Uploader de imágenes por modelo.

**Funcionalidades:**
- Drag & drop
- Preview
- Marcar como principal
- Indicar fuente
- Ver galería existente

### 5. `AircraftModelCatalog`
Catálogo de modelos de aeronaves.

**Funcionalidades:**
- Lista de todos los modelos detectados
- Especificaciones de cada uno
- Gestión de imágenes
- Editar información del modelo

---

## 📍 Datos Iniciales

### Bases del Caribe (seed data)

```sql
INSERT INTO caribbean_military_bases (icao_code, iata_code, name, country_code, country_name, latitude, longitude, base_type, military_presence) VALUES
-- Puerto Rico
('TJSJ', 'SJU', 'Luis Muñoz Marín International', 'PR', 'Puerto Rico', 18.4394, -66.0018, 'civilian_military', true),
('TJNR', 'NRR', 'José Aponte de la Torre (Roosevelt Roads)', 'PR', 'Puerto Rico', 18.2453, -65.6434, 'military', true),
('TJPS', 'PSE', 'Mercedita International', 'PR', 'Puerto Rico', 18.0083, -66.5630, 'civilian_military', true),

-- Curazao
('TNCC', 'CUR', 'Hato International Airport', 'CW', 'Curazao', 12.1889, -68.9598, 'civilian_military', true),

-- Aruba
('TNCA', 'AUA', 'Queen Beatrix International', 'AW', 'Aruba', 12.5014, -70.0152, 'civilian_military', true),

-- Sint Maarten
('TNCM', 'SXM', 'Princess Juliana International', 'SX', 'Sint Maarten', 18.0410, -63.1089, 'civilian_military', true),

-- Trinidad y Tobago
('TTPP', 'POS', 'Piarco International', 'TT', 'Trinidad y Tobago', 10.5954, -61.3372, 'civilian_military', true),

-- Colombia
('SKBO', 'BOG', 'El Dorado International', 'CO', 'Colombia', 4.7016, -74.1469, 'civilian_military', true),
('SKCG', 'CTG', 'Rafael Núñez International', 'CO', 'Colombia', 10.4424, -75.5130, 'civilian_military', true),

-- Guyana
('SYCJ', 'GEO', 'Cheddi Jagan International', 'GY', 'Guyana', 6.4985, -58.2541, 'civilian_military', true),

-- República Dominicana
('MDSD', 'SDQ', 'Las Américas International', 'DO', 'Rep. Dominicana', 18.4297, -69.6689, 'civilian_military', true),

-- Honduras
('MHSC', 'XPL', 'Soto Cano Air Base (Palmerola)', 'HN', 'Honduras', 14.3824, -87.6212, 'military', true),

-- Venezuela (para referencia)
('SVMI', 'CCS', 'Simón Bolívar International', 'VE', 'Venezuela', 10.6012, -66.9912, 'civilian', false),
('SVBS', 'BLA', 'General José Antonio Anzoátegui', 'VE', 'Venezuela', 10.1071, -64.6892, 'military', false);
```

### Catálogo de modelos (seed data)

```sql
INSERT INTO aircraft_model_catalog (aircraft_type, aircraft_model, category, manufacturer, operated_by, primary_role) VALUES
('F18S', 'Boeing F/A-18E/F Super Hornet', 'fighter', 'Boeing', ARRAY['Navy', 'Marines'], 'Air superiority, Strike'),
('F18', 'Boeing F/A-18 Hornet', 'fighter', 'Boeing', ARRAY['Navy', 'Marines'], 'Air superiority, Strike'),
('C17', 'Boeing C-17A Globemaster III', 'transport', 'Boeing', ARRAY['USAF'], 'Strategic airlift'),
('E2', 'Northrop Grumman E-2 Hawkeye', 'awacs', 'Northrop Grumman', ARRAY['Navy'], 'Airborne early warning'),
('P8', 'Boeing P-8A Poseidon', 'patrol', 'Boeing', ARRAY['Navy'], 'Maritime patrol, ASW'),
('KC135', 'Boeing KC-135 Stratotanker', 'tanker', 'Boeing', ARRAY['USAF'], 'Aerial refueling'),
('C130', 'Lockheed C-130 Hercules', 'transport', 'Lockheed Martin', ARRAY['USAF', 'Marines', 'Coast Guard'], 'Tactical airlift'),
('C5', 'Lockheed C-5M Super Galaxy', 'transport', 'Lockheed Martin', ARRAY['USAF'], 'Strategic airlift'),
('DH8B', 'De Havilland Dash 8', 'patrol', 'De Havilland', ARRAY['CBP', 'Coast Guard'], 'Maritime patrol'),
('RC135', 'Boeing RC-135', 'reconnaissance', 'Boeing', ARRAY['USAF'], 'Signals intelligence'),
('EP3', 'Lockheed EP-3E Aries II', 'reconnaissance', 'Lockheed Martin', ARRAY['Navy'], 'Signals intelligence'),
('MH60', 'Sikorsky MH-60 Seahawk', 'helicopter', 'Sikorsky', ARRAY['Navy'], 'ASW, SAR, VERTREP');
```

---

## 🔧 Modificaciones a Código Existente

### 1. `flightRadarService.js`
Agregar función para registrar aeronave:

```javascript
/**
 * Registra o actualiza una aeronave militar en el registry.
 * Llamar cuando se detecta un vuelo militar.
 */
export async function registerMilitaryAircraft(flightData) {
  const { icao24, callsign, aircraftType, aircraftModel, origin, destination, ... } = flightData;
  
  // 1. Verificar si existe
  // 2. Crear o actualizar
  // 3. Registrar en location_history
  // 4. Recalcular base probable si hay suficientes datos
}
```

### 2. `military-airspace-monitor` (Edge Function)
Modificar para llamar a `registerMilitaryAircraft` cuando detecta un vuelo militar.

### 3. Hook: `useAircraftRegistry`
Nuevo hook para gestionar el registry desde React.

```javascript
// src/hooks/useAircraftRegistry.js
export function useAircraftRegistry() {
  return {
    aircraft,           // Lista de aeronaves
    loading,
    error,
    getByIcao24,        // Obtener una aeronave
    getByCountry,       // Filtrar por país
    getByType,          // Filtrar por tipo
    getHistory,         // Historial de una aeronave
    updateAircraft,     // Actualizar datos
    uploadImage,        // Subir imagen de modelo
  };
}
```

---

## 📱 Integración con UI Existente

### En `IncursionStatsPanel`
- Agregar tab "Aeronaves" que muestre el registry
- Click en aeronave → `AircraftDetailModal`

### En `FlightDetailsPanel`
- Si es militar y tiene registro, mostrar:
  - Imagen del modelo
  - Base probable
  - Historial de incursiones
  - Link a detalle completo

### Nuevo menú en Navbar
- Agregar opción "Inventario Militar" (solo admins)
- Acceso a `AircraftRegistryPanel`

---

## 📋 Checklist de Implementación

### Fase 1: Base de Datos
- [x] Crear tabla `military_aircraft_registry`
- [x] Crear tabla `aircraft_model_images`
- [x] Crear tabla `caribbean_military_bases`
- [x] Crear tabla `aircraft_location_history`
- [x] Crear tabla `aircraft_model_catalog`
- [x] Insertar datos iniciales (bases, catálogo) + ampliaciones por telemetría (`origin_icao`)
- [x] Configurar Storage bucket (imágenes)
- [x] RPCs geoespaciales: `get_country_at_point`, `get_eez_at_point`
- [x] Normalización de country codes (ISO3 en tracking + backfills)

### Fase 2: Backend/Servicios
- [x] Edge Function `aircraft-registry-collector` (v14) registra/actualiza registry + history + country presence
- [x] RPC `recalculate_probable_base` corregida para `detection` y mapeo IATA/ICAO
- [x] Hooks: `useAircraftRegistry`, `useAircraftImages`
- [x] Servicio frontend de geocoding (fallback) para backfill de país en historial cuando sea necesario
- [ ] (Opcional) Integración con API externa (AeroDataBox/Aviation Edge) para auto-poblar specs más allá del catálogo local

### Fase 3: UI - Imágenes
- [x] Upload/galería por `aircraft_type` + selección de imagen primaria

### Fase 4: UI - Registry
- [x] `AircraftRegistryPanel`
- [x] `AircraftDetailView` full-screen (reemplaza modal)
- [x] Vista por país (`caribbean_deployment_summary`) + vista por bases
- [ ] (Mejora) Panel dedicado “US Aircraft por país (Caribe + EEUU)” con filtros operativos
- [ ] (Mejora) “Puerto Rico como hub”: sección fija destacada en “Por País” (PR)

### Fase 5: Integración
- [x] Menú/Panel Inventario integrado en UI
- [ ] (Mejora) Profundizar integración con panel de vuelo/track en mapa (link directo a detalle desde marker)

---

## 🔎 Pendientes Técnicos Prioritarios
- **Códigos de origen no estándar**: ejemplo `QSK` aparece en `origin_icao` y requiere mapeo/limpieza.
- **Cobertura de bases EEUU**: seguir ampliando `caribbean_military_bases` con bases clave (Caribe + SE USA) según telemetría real.
- **Calidad de país en zonas costeras**: ya mejorado con `ST_Covers`, pero seguir validando edge cases.

---

## 🔮 Futuras Extensiones

1. **Alertas de nuevas aeronaves**: "Primera vez detectado: F/A-18 AE5678"
2. **Exportar inventario**: PDF/Excel con todas las aeronaves por país
3. **Mapa de bases**: Visualizar bases con cantidad de aeronaves
4. **Predicción de movimientos**: Basado en patrones históricos
5. **Integración con entidades**: Cada aeronave como entidad en el mapa
6. **API pública**: Endpoint para consultar inventario (con auth)

---

## 📞 Notas para Implementación

- El ICAO24 es el identificador único más confiable (no cambia)
- El callsign puede variar entre vuelos (BAT91, BAT92, etc.)
- La base probable se calcula por frecuencia de origen, no es 100% precisa
- Las imágenes son por modelo, no por aeronave individual
- Considerar rate limits de FlightRadar24 al hacer consultas adicionales

---

*Documento creado para continuación de implementación.*

