# 🛩️ Integración FlightRadar24

## 📋 Descripción

Integración completa de FlightRadar24 para monitoreo en tiempo real de vuelos militares y gubernamentales en el Caribe.

---

## ✨ Características Implementadas

### 1. **Tracking de Vuelos en Tiempo Real**
- ✅ Conexión a API de FlightRadar24 mediante Edge Function (proxy)
- ✅ Actualización automática cada 30 segundos
- ✅ Zona ampliada del Caribe (27°N a 8°S, -85°W a -58°E)
- ✅ Detección avanzada de aeronaves militares/gubernamentales

### 2. **Visualización en Mapa**
- ✅ Marcadores de avión usando icono `<Plane />` de Lucide React
- ✅ Rotación según rumbo real del avión
- ✅ Colores por categoría militar
- ✅ Tooltip simple en hover con callsign
- ✅ Click para panel de detalles completo

### 3. **Barra Inferior Estilo FlightRadar24**
- ✅ Barra compacta centrada en la parte inferior
- ✅ 5 botones: Settings, Weather, **Filters**, Widgets, Playback
- ✅ Badge con contador de filtros activos
- ✅ Panel lateral derecho para filtros (como FR24)

### 4. **Sistema de Filtros**
- ✅ **Militar/Gobierno** (filtro principal)
- ✅ **Por categorías**:
  - Combate (F-15, F-16, F-22, F-35)
  - Transporte (C-17, C-130, C-5)
  - Tanquero (KC-135, KC-10, KC-46)
  - Vigilancia (E-3, E-8, P-8, RC-135)
  - Bombardero (B-1, B-2, B-52)
  - Otros militares

### 5. **Panel de Detalles**
- ✅ Panel lateral completo con información del vuelo
- ✅ Posición (lat/lon/rumbo)
- ✅ Altitud y velocidad
- ✅ Tipo de aeronave
- ✅ Ruta (origen/destino)
- ✅ Clasificación militar

---

## 🗺️ Área de Cobertura

### Coordenadas del Bounding Box
```javascript
CARIBBEAN_BOUNDS = {
  north: 27.0,   // Sur de Florida + Bahamas
  south: 8.0,    // Norte de Venezuela (incluye Caracas 10.5°N)
  west: -85.0,   // Costa oeste de Panamá/Nicaragua
  east: -58.0,   // Trinidad y Tobago + Barbados
}
```

### Países/Territorios Cubiertos
- 🇩🇴 República Dominicana
- 🇵🇷 Puerto Rico
- 🇹🇹 Trinidad y Tobago
- 🇨🇼 Curazao
- 🇦🇼 Aruba
- 🇧🇶 Bonaire
- 🇻🇪 Venezuela (incluye Caracas)
- 🇨🇴 Colombia
- 🇵🇦 Panamá
- 🏝️ Todas las islas del Caribe
- 🇺🇸 Sur de Florida
- 🇧🇸 Bahamas

---

## 🔧 Arquitectura Técnica

### Componentes Creados

```
src/
├── components/
│   └── FlightRadar/
│       ├── FlightMarker.jsx              // Marcador de avión en mapa
│       ├── FlightPopup.jsx               // Popup con info básica
│       ├── FlightDetailsPanel.jsx        // Panel lateral de detalles
│       ├── FlightRadarPanel.jsx          // Panel de lista de vuelos
│       └── FlightRadarBottomBar.jsx      // Barra inferior con filtros
├── hooks/
│   └── useFlightRadar.js                 // Hook React para tracking
├── services/
│   └── flightRadarService.js             // Servicio API FlightRadar24
└── lib/
    └── constants.js                      // Configuración (actualizado)

supabase/
└── functions/
    └── flightradar-proxy/
        └── index.ts                      // Edge Function proxy (evita CORS)
```

### Flujo de Datos

```
Frontend (React)
    ↓
useFlightRadar Hook
    ↓
flightRadarService.js
    ↓
Supabase Edge Function (flightradar-proxy)
    ↓
FlightRadar24 API (data-cloud.flightradar24.com)
    ↓
Datos de vuelos en tiempo real
    ↓
Parseo y categorización
    ↓
Aplicación de filtros
    ↓
Renderizado en mapa (máx 100 vuelos)
```

---

## 🎯 Detección de Aeronaves Militares

### Métodos de Detección

1. **Callsigns Militares** (37+ prefijos)
   - USA: RCH, CNV, SPAR, DUKE, PAT, NAVY, USAF, SAM, etc.
   - Latinoamérica: FAC, FAB, FAV, AME, FARD, FAP

2. **Registros Especiales**
   - N16xxx (USAF)
   - N17xxx (USAF)
   - N2xxx (Government)
   - N5xxx (US Army)
   - N8xxx, N9xxx (Military Special)

3. **Squawk Codes Militares**
   - 1277 (Military VFR)
   - 4000, 4001 (Military ops)
   - 1300 (Military training)

4. **Tipos de Aeronave** (40+ tipos)
   - C-17, C-130, C-5, KC-135, KC-10, F-15, F-16, F-22, F-35, B-1, B-2, B-52, E-3, P-8, RC-135, etc.

---

## 🚀 Deployment

### Edge Function Deployada

**Nombre**: `flightradar-proxy`  
**Status**: ✅ ACTIVE  
**URL**: `https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/flightradar-proxy`  
**Versión**: 4

### Variables de Entorno

**NO requiere API key** - El endpoint público de FlightRadar24 funciona sin autenticación cuando se accede desde el servidor.

---

## 📊 Performance

- **Límite de vuelos**: 100 simultáneos en mapa
- **Actualización**: Cada 30 segundos
- **Optimizaciones**:
  - `useMemo` para evitar recalcular categorías
  - HTML/SVG puro (sin createRoot en cada render)
  - Dependencias optimizadas en useEffect
  - Filtrado eficiente

---

## 🎨 UI/UX

### Barra Inferior
- Compacta y centrada
- 5 botones circulares con hover effects
- Badge con contador de filtros activos

### Panel de Filtros
- Lateral derecho (estilo FlightRadar24)
- Backdrop oscuro semi-transparente
- Scrolleable
- Filtros con checkboxes
- Disabled cuando "Militar/Gobierno" está OFF

### Marcadores de Avión
- Icono `<Plane />` simple
- Rotación según rumbo
- Colores por categoría
- Tooltip en hover
- Click para detalles completos

---

## 🐛 Troubleshooting

### Los aviones no aparecen

1. Verificar consola del navegador:
   ```
   ✅ FlightRadar24: X vuelos militares detectados
   ```

2. Revisar filtros:
   - Click en botón "Filters"
   - Verificar que "Militar o gobierno" está activo
   - Verificar categorías específicas

3. Comprobar Edge Function:
   - Ir a Supabase Dashboard → Edge Functions
   - Verificar que `flightradar-proxy` está ACTIVE

### Performance lento

- Reducir límite de 100 vuelos si es necesario
- Desactivar actualización automática (botón Pausar)
- Filtrar solo categorías específicas

---

## 📝 Próximas Mejoras

- [ ] Playback histórico de rutas
- [ ] Alertas de vuelos militares específicos
- [ ] Estadísticas de tráfico aéreo militar
- [ ] Exportar datos de vuelos a CSV
- [ ] Integración con bases de datos de aeronaves

---

## 📚 Referencias

- [FlightRadar24](https://www.flightradar24.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Lucide React Icons](https://lucide.dev/)

---

**Última actualización**: 27 de noviembre de 2025  
**Rama**: `feature/flightradar24-integration`  
**Estado**: ✅ Completado y funcional

