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

---

## Screenshot Service

### Arquitectura
```
military-airspace-monitor → Screenshot Service → Telegram (foto)
```

### Configuración
```env
SCREENSHOT_SERVICE_URL=https://operativus.net/screenshot
SCREENSHOT_AUTH_TOKEN=xxx
```

### Flujo
1. Se detecta incursión
2. Edge Function llama a Screenshot Service con datos del vuelo
3. Screenshot Service abre SAE-RADAR en modo screenshot
4. Puppeteer toma captura del mapa con el vuelo
5. Retorna imagen base64
6. Edge Function envía foto a Telegram como caption

### URL de Screenshot
```
https://maps.operativus.net?screenshot=true&screenshot_token=xxx
&flight=ICAO24&callsign=XXX&lat=10.5&lon=-66.9
&alt=14000&speed=174&heading=65&type=P8
```

### Componente `ScreenshotView.jsx`
- Se activa cuando `screenshot=true` en URL
- Bypasea autenticación
- Muestra mapa con límites de Venezuela
- Panel compacto con datos del vuelo
- Trail del vuelo si está disponible

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

