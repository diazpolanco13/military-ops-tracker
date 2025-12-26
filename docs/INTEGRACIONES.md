# SAE-RADAR - Integraciones Externas

## FlightRadar24

### Arquitectura
```
Frontend → flightradar-proxy (Edge Function) → FlightRadar24 API
```

### Endpoints Utilizados

#### API Pública (Gratis - Sin límite)
```
https://data-cloud.flightradar24.com/zones/fcgi/feed.js
?bounds=27,8,-85,-58
&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=0&air=1
&estimated=0&maxage=14400&gliders=0&stats=0
```
- **Uso**: Vuelos en el mapa (actualización cada 30 seg)
- **Límite**: Sin límite, es el feed público

#### API Oficial (Pagada - Con créditos)
```
https://fr24api.flightradar24.com/api/flight/tracks?flight={id}
https://fr24api.flightradar24.com/api/live/flight-positions/full
```
- **Uso**: Trail de vuelo, detalles completos
- **Límite**: Según plan contratado
- **Requiere**: `FR24_API_TOKEN` en secrets de Supabase

### Área de Cobertura
```javascript
CARIBBEAN_BOUNDS = {
  north: 27.0,   // Sur de Florida
  south: 8.0,    // Norte de Venezuela
  west: -85.0,   // Panamá/Nicaragua
  east: -58.0,   // Trinidad y Tobago
}
```

### Detección de Aeronaves Militares USA

#### Por ICAO24 (Transponder Hex)
| Prefijo | Descripción |
|---------|-------------|
| AE | USAF/Military |
| AF | USAF/Military |

#### Por Callsign (32 patrones en BD)
| Patrón | Rama | Tipo Misión |
|--------|------|-------------|
| RCH | USAF | Transporte (REACH) |
| CNV | USAF | Convoy |
| BAT | Navy | Patrulla P-8 Poseidon |
| NAVY | Navy | General |
| SPAR | USAF | VIP/Gobierno |
| SAM | USAF | Special Air Mission |
| DUKE | Army | General |
| BOXER | Marines | Operaciones |
| OMNI | USAF | AWACS |
| SHARK | Navy | P-8 Poseidon |

#### Por Tipo de Aeronave (18 modelos en BD)
| Código | Modelo | Categoría |
|--------|--------|-----------|
| C17 | C-17 Globemaster III | Transporte |
| C130 | C-130 Hercules | Transporte |
| P8 | P-8A Poseidon | Patrulla |
| KC135 | KC-135 Stratotanker | Tanquero |
| E3 | E-3 Sentry AWACS | Vigilancia |
| E6 | E-6 Mercury | Comunicaciones |
| RC135 | RC-135 Rivet Joint | Reconocimiento |

### Categorías de Vuelo
```javascript
const CATEGORIES = {
  combat: '#ef4444',       // Rojo - Cazas
  bomber: '#dc2626',       // Rojo oscuro
  transport: '#FFC107',    // Amarillo
  tanker: '#10b981',       // Verde
  surveillance: '#f59e0b', // Naranja
  helicopter: '#8b5cf6',   // Morado
  vip: '#ec4899',          // Rosa
  other: '#FFC107',        // Amarillo
};
```

### Detección de Estado del Transponder

La API de FlightRadar24 incluye un campo `signalType` (posición [7] en el array de datos) que indica el tipo de señal:

| Valor API | Tipo | Estado | Descripción |
|-----------|------|--------|-------------|
| `F-BDWY1`, `F-...` | ADS-B | ✅ Activo | Señal directa del transponder |
| `F-EST` | Estimated | ❌ Apagado | Posición calculada/proyectada |
| `F-MLAT` | MLAT | ⚠️ Débil | Multilateración (triangulación) |
| (vacío) | Unknown | ❓ | Sin información |

**Implementación en `flightRadarService.js`:**
```javascript
export const SIGNAL_TYPES = {
  ADSB: 'adsb',
  ESTIMATED: 'estimated',
  MLAT: 'mlat',
  UNKNOWN: 'unknown',
};

export function detectSignalType(signalField) {
  const field = (signalField || '').toUpperCase();
  
  if (field.includes('EST')) {
    return { type: SIGNAL_TYPES.ESTIMATED, isTransponderActive: false, label: 'ESTIMADO' };
  }
  if (field.includes('MLAT')) {
    return { type: SIGNAL_TYPES.MLAT, isTransponderActive: true, label: 'MLAT' };
  }
  if (field.startsWith('F-') || field.length > 0) {
    return { type: SIGNAL_TYPES.ADSB, isTransponderActive: true, label: 'ON' };
  }
  return { type: SIGNAL_TYPES.UNKNOWN, isTransponderActive: null, label: '?' };
}
```

### Visualización de Posición Estimada

Cuando `signal.isTransponderActive === false`:

| Elemento | Comportamiento |
|----------|----------------|
| Icono del avión | Opacidad 50% |
| Etiqueta callsign | Prefijo 📍, color rojo claro |
| Panel de detalles | Badge "ESTIMADO" en rojo |

### Trail con Líneas de Estado

El trail del vuelo incluye tres tipos de líneas:

```
┌─────────────────────────────────────────────────────────┐
│  ORIGEN                                       DESTINO   │
│    ●━━━━━━━━━━━━━●──────────────●- - - - - - - - ●     │
│    │             │              │                │      │
│    │  Coloreado  │  Negra      │  Negra         │      │
│    │  por altitud│  continua   │  punteada      │      │
│    │  (ADS-B)    │  (gap)      │  (predicción)  │      │
│    └─────────────┴─────────────┴────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

| Línea | Color | Estilo | Significado |
|-------|-------|--------|-------------|
| Trail normal | Rojo/Naranja/Verde | Continua | Datos ADS-B reales, color por altitud |
| Gap | Negro (#1f2937) | Continua | Transponder apagado, sin datos reales |
| Predicción | Negro (#1f2937) | Punteada | Ruta estimada hacia destino declarado |

### Base de Datos de Aeropuertos (Predicción de Ruta)

Para dibujar la línea de predicción, se usa una base de datos local de aeropuertos:

```javascript
// src/services/flightRadarService.js
export const AIRPORTS_DB = {
  'CUR': { lat: 12.1889, lng: -68.9598, name: 'Hato International', country: 'CW' },
  'AUA': { lat: 12.5014, lng: -70.0152, name: 'Queen Beatrix International', country: 'AW' },
  'BLB': { lat: 8.9148, lng: -79.5996, name: 'Balboa Panama Pacifico', country: 'PA' },
  'PTY': { lat: 9.0714, lng: -79.3835, name: 'Tocumen International', country: 'PA' },
  // ... más aeropuertos del Caribe
};

export function getAirportCoordinates(iataCode) {
  return AIRPORTS_DB[iataCode] || null;
}
```

---

## AISStream.io (Buques)

### Arquitectura
```
aisstream-collector (Edge Function) → WebSocket → ship_positions (BD)
```

### Configuración
```javascript
const AISSTREAM_URL = 'wss://stream.aisstream.io/v0/stream';
const API_KEY = process.env.AISSTREAM_API_KEY;
```

### Tipos de Buque AIS
| Código | Tipo |
|--------|------|
| 30 | Fishing |
| 35 | Military |
| 37 | Pleasure Craft |
| 60-69 | Passenger |
| 70-79 | Cargo |
| 80-89 | Tanker |

### Datos Recibidos
```javascript
{
  mmsi: "123456789",
  shipName: "VESSEL NAME",
  shipType: 70,
  latitude: 10.5,
  longitude: -66.9,
  speed: 12.5,
  course: 180,
  heading: 182,
  destination: "PUERTO LA CRUZ",
  eta: "2025-12-25T10:00:00Z"
}
```

---

## Telegram Bot API

### Configuración
Variables en `incursion_monitor_config`:
- `telegram_destinations`: Array de destinos
- `telegram_entry_template`: Template de entrada
- `telegram_exit_template`: Template de salida

Secrets de Supabase:
- `TELEGRAM_BOT_TOKEN`

### Formato de Destinos
```json
[
  {
    "name": "Canal Principal",
    "chat_id": "-100xxxxxxxxxx",
    "enabled": true,
    "type": "channel"
  }
]
```

### Variables en Templates

#### Mensaje de Entrada
```
{{aircraft_model}}     - Nombre del modelo
{{callsign}}          - Callsign
{{hex_code}}          - ICAO24
{{registration}}      - Registro
{{altitude}}          - Altitud ft
{{speed}}             - Velocidad kts
{{heading}}           - Rumbo grados
{{heading_category}}  - N, NE, E, SE, etc.
{{country_flag}}      - Emoji bandera
{{country_name}}      - Nombre país
{{zone_type}}         - Marítimo/Terrestre
{{quadrant}}          - NE, NW, SE, SW
{{latitude}}          - Latitud
{{longitude}}         - Longitud
{{timestamp}}         - Fecha/hora
```

#### Mensaje de Salida/Resumen
```
{{duration}}          - Duración total
{{detection_count}}   - Número detecciones
{{avg_altitude}}      - Altitud promedio
{{max_altitude}}      - Altitud máxima
{{min_altitude}}      - Altitud mínima
{{avg_speed}}         - Velocidad promedio
{{max_speed}}         - Velocidad máxima
{{zone_name}}         - Nombre de la zona
{{last_latitude}}     - Última latitud
{{last_longitude}}    - Última longitud
{{start_time}}        - Hora inicio
{{end_time}}          - Hora fin
```

### Endpoints Usados
```
POST https://api.telegram.org/bot{token}/sendMessage
POST https://api.telegram.org/bot{token}/sendPhoto
```

### Tipos de Alerta

#### 🚨 Entrada (Incursión Detectada)
- **Edge Function**: `military-airspace-monitor` (v33)
- **Screenshot**: Mapa con trail del vuelo (si disponible de FR24 API)
- **Template**: `telegram_entry_template`
- **Badge**: "🚨 INCURSIÓN DETECTADA"

#### ✅ Salida (Fin de Incursión)
- **Edge Function**: `incursion-session-closer` (v8)
- **Screenshot**: Mapa con trail completo + panel de estadísticas
- **Template**: `telegram_exit_template`
- **Badge**: "✅ FIN DE INCURSIÓN"
- **Datos incluidos**: Duración, detecciones, altitud (avg/max/min), velocidad (avg/max)

---

## Screenshot Service

### Arquitectura
```
military-airspace-monitor ──┐
                            ├──→ Screenshot Service ──→ Telegram (foto con trail)
incursion-session-closer ───┘
```

### Configuración
```env
SCREENSHOT_SERVICE_URL=https://operativus.net/screenshot
SCREENSHOT_AUTH_TOKEN=xxx
```

### Flujo - Alerta de Entrada (Incursión Detectada)
1. `military-airspace-monitor` detecta incursión
2. Obtiene trail del vuelo desde API FR24 (si disponible)
3. Llama a Screenshot Service con `mode=entry` y waypoints
4. Screenshot Service abre SAE-RADAR en modo screenshot
5. Puppeteer toma captura del mapa con el vuelo y trail
6. Retorna imagen base64
7. Edge Function envía foto a Telegram

### Flujo - Alerta de Salida (Fin de Incursión)
1. `incursion-session-closer` detecta sesión inactiva
2. Recupera todos los waypoints de la sesión desde `incursion_waypoints`
3. Calcula estadísticas (duración, detecciones, alt/vel promedio/max/min)
4. Llama a Screenshot Service con `mode=exit`, waypoints y estadísticas
5. Screenshot Service renderiza mapa con trail completo y panel de resumen
6. Retorna imagen base64
7. Edge Function envía foto a Telegram con resumen

### URL de Screenshot - Entrada
```
https://maps.operativus.net?screenshot=true&screenshot_token=xxx
&flight=ICAO24&callsign=XXX&lat=10.5&lon=-66.9
&alt=14000&speed=174&heading=65&type=P8
&mode=entry&waypoints=[...]
```

### URL de Screenshot - Salida
```
https://maps.operativus.net?screenshot=true&screenshot_token=xxx
&flight=ICAO24&callsign=XXX&lat=10.5&lon=-66.9
&mode=exit&waypoints=[...]
&duration=45min&detections=12
&avg_alt=25000&max_alt=28000&min_alt=22000
&avg_speed=480&max_speed=520&zone_name=EEZ%20Venezuela
```

### Componente `ScreenshotView.jsx`
- Se activa cuando `screenshot=true` en URL
- Bypasea autenticación
- Muestra mapa con límites de Venezuela
- **Modo Entry**: Badge "🚨 INCURSIÓN DETECTADA", zoom cercano
- **Modo Exit**: Badge "✅ FIN DE INCURSIÓN", zoom alejado (contexto regional)
- Trail del vuelo dibujado desde waypoints (línea cyan con gradiente)
- Panel de estadísticas en modo exit (duración, detecciones, altitud, velocidad)

### Parámetros del Screenshot Service (POST Body)
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `flight` | string | ICAO24 hex code |
| `callsign` | string | Callsign del vuelo |
| `lat`, `lon` | number | Última posición |
| `alt`, `speed`, `heading` | number | Datos de vuelo |
| `type` | string | Tipo de aeronave |
| `mode` | string | `entry` o `exit` |
| `waypoints` | array | Array de {lat, lon, alt} |
| `duration` | string | Duración (solo exit) |
| `detections` | number | Número detecciones (solo exit) |
| `avg_alt`, `max_alt`, `min_alt` | number | Estadísticas altitud (solo exit) |
| `avg_speed`, `max_speed` | number | Estadísticas velocidad (solo exit) |
| `zone_name` | string | Nombre zona violada (solo exit) |

### Limitaciones
- Máximo 100 waypoints por screenshot (reducción automática)
- Timeout de 10 segundos mínimo para modo exit
- Límite de 10MB en body JSON

---

## OpenWeatherMap (Opcional)

### Configuración
```env
VITE_OPENWEATHER_API_KEY=xxx
```

### Capas Disponibles
- ☁️ Nubes
- 🌧️ Precipitación
- 🌡️ Temperatura
- 💨 Viento
- 📊 Presión

### URL de Tiles
```
https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={key}
```

---

## Marine Regions API

### Uso
Obtener polígonos EEZ (Zona Económica Exclusiva) de países.

### Endpoint
```
https://marineregions.org/rest/getGazetteerRecordsByType.json/EEZ/
```

### Almacenamiento
Tabla `maritime_boundaries_cache` con campo `geojson` (JSONB).

---

## Natural Earth / GADM

### Uso
Polígonos terrestres de países.

### Fuentes
- Natural Earth 1:50m
- GADM (más detallado)

### Almacenamiento
Tabla `terrestrial_boundaries_cache` con campo `geojson` (JSONB).

---

## Grok AI (X.AI)

### Uso
Análisis de inteligencia desde Twitter/X.

### Configuración
```env
VITE_XAI_API_KEY=xxx
```

### Edge Functions
- `x-intelligence-monitor`: Monitorea tweets
- `intelligence-monitor`: Analiza eventos

### Tablas
- `intelligence_events`
- `intelligence_tweets_cache`
- `intelligence_monitor_config`

