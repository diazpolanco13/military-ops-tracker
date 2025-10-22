# 🎯 Sistema de Radar Visual - Feature Documentation

## Descripción
Sistema de radar militar profesional con detección en tiempo real de entidades en el mapa.

## Características Implementadas

### ✅ Radar Visual Animado
- **Barrido circular** de 360° con animación suave (CSS puro)
- **Grid circular** con 5 anillos concéntricos
- **Líneas cardinales** (N, S, E, W) con marcadores
- **Efecto trail** (estela verde) que sigue al haz del radar
- **Centro luminoso** con sombra verde brillante

### ✅ Detección de Entidades en Tiempo Real
- **Detección automática** cuando el radar "escanea" sobre una entidad
- **Tolerancia de 15°** para el ancho del haz
- **Colores por tipo**:
  - 🔴 Rojo: Destructores
  - 🔵 Azul: Fragatas
  - 🟡 Amarillo: Aviones
  - 🟢 Verde: Tropas
  - 🟣 Púrpura: Submarinos
- **Animación ping** cuando se detecta contacto
- **Alerta visual** roja en la parte superior con nombre de la entidad

### ✅ Panel de Control
- **Botón ON/OFF** para activar/pausar radar
- **Slider de velocidad** (1-5 °/frame) ajustable en tiempo real
- **Estadísticas en vivo**:
  - Radio de alcance (300 km)
  - Ángulo de barrido actual
  - Entidades en rango
  - Contactos detectados (en rojo)

### ✅ Lista de Contactos Activos
- **Scroll vertical** con hasta 10 entidades visibles
- **Información por contacto**:
  - Nombre de la entidad
  - Distancia en km
  - Bearing (rumbo) en grados
- **Hover effect** para mejor UX

### ✅ Integración con el Sistema
- **Menú "Ver"** en TopNavigationBar incluye botón "Mostrar Radar"
- **Toggle visual** (verde cuando activo, gris cuando inactivo)
- **Estado persistente** durante la sesión
- **Callback onDetection** para extender funcionalidad (sonidos, notificaciones)

## Uso

### Activar el Radar
1. Click en **"Ver"** en la barra de navegación superior
2. Click en **"Mostrar Radar"** (icono de radar)
3. El radar aparecerá en la esquina inferior izquierda

### Controles
- **Pausar/Activar**: Click en el botón "ACTIVO" / "PAUSADO"
- **Ajustar velocidad**: Mover el slider de velocidad de barrido
- **Ver contactos**: La lista inferior muestra entidades en rango

### Detección
- Cuando el **haz verde** del radar pasa sobre una entidad:
  - El punto de la entidad se hace más grande
  - Aparece animación **ping**
  - Se muestra alerta roja arriba: "⚠ CONTACTO DETECTADO"
  - El nombre aparece en la alerta

## Archivos Modificados

```
src/
├── components/
│   ├── Radar/
│   │   └── RadarOverlay.jsx          ← NUEVO (360 líneas)
│   └── Navigation/
│       └── TopNavigationBar.jsx      ← Modificado (+40 líneas)
└── App.jsx                            ← Modificado (+15 líneas)
```

## Parámetros Configurables

### RadarOverlay Props
```jsx
<RadarOverlay
  center={{ lat: 18.4, lng: -66.1 }}  // Centro del radar
  radius={300}                          // Radio en kilómetros
  onDetection={(entities) => {}}        // Callback cuando detecta
/>
```

### Configuración Interna
- **scanSpeed**: 1-5 grados por frame (ajustable con slider)
- **tolerance**: 15° (ancho del haz de detección)
- **maxRadius**: 300 km (filtro de entidades fuera de rango)

## Mejoras Futuras (Opcionales)

### 🔊 Efectos de Sonido
```javascript
const radarPing = new Audio('/sounds/radar-ping.mp3');
radarPing.play();
```

### 🎯 Click para Centrar Mapa
```javascript
const handleEntityClick = (entity) => {
  map.flyTo({
    center: [entity.longitude, entity.latitude],
    zoom: 10
  });
};
```

### 📡 Múltiples Radares
Agregar propiedad para mostrar varios radares en diferentes ubicaciones (bases militares).

### 🌐 Sincronización Realtime
Integrar con Supabase Realtime para que las detecciones se compartan entre usuarios.

### 🎨 Modos de Radar
- **Sweep Mode** (actual): Barrido continuo
- **Pulse Mode**: Pulsos concéntricos desde el centro
- **Sector Mode**: Escaneo de sector específico

## Créditos
- **Diseño**: Inspirado en sistemas de radar militar reales
- **Stack**: React 18 + Lucide Icons + Tailwind CSS
- **Performance**: 60fps con CSS animations nativas
- **Compatibilidad**: Funciona con Mapbox GL JS (no requiere Leaflet)

## Notas Técnicas

### Cálculos Geoespaciales
- **Haversine Formula**: Para distancias precisas en km
- **Bearing Calculation**: Rumbo desde el centro del radar
- **Proyección Cartesiana**: Conversión de lat/lng a coordenadas X,Y del radar

### Performance
- **Sin re-renders pesados**: Solo actualiza ángulo de rotación
- **CSS transform**: Hardware accelerated
- **Filtrado optimizado**: Solo entidades visibles y en rango
- **Scroll virtual**: Lista de contactos con max-height

### Accesibilidad
- **Tooltips**: Nombre de entidad al hacer hover
- **Color-blind friendly**: Colores distinguibles
- **Keyboard accessible**: Controles navegables con Tab

---

**Fecha de implementación**: 22 Octubre 2025  
**Rama**: `feature/radar-visual`  
**Estado**: ✅ Funcional y listo para merge

