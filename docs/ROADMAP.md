# 🗺️ Military Ops Tracker - Roadmap de Desarrollo Visual

> **Filosofía**: Desarrollo iterativo con resultados visuales desde el minuto 1.  
> Cada iteración añade funcionalidad que puedes **VER y TESTEAR** inmediatamente.

---

## 📋 Tabla de Contenidos
- [Iteración 0: Setup Base](#iteración-0-setup-base)
- [Iteración 1: Mapa Visible](#iteración-1-mapa-visible-⭐)
- [Iteración 2: Marcadores Básicos](#iteración-2-marcadores-básicos)
- [Iteración 3: Interacción con Popup](#iteración-3-interacción-con-popup)
- [Iteración 4: Supabase + Datos Reales](#iteración-4-supabase--datos-reales)
- [Iteración 5: Drag & Drop](#iteración-5-drag--drop-core-funcional)
- [Fase MVP: Funcionalidades Esenciales](#fase-mvp-funcionalidades-esenciales)
- [Fase MVP+: Features Avanzadas](#fase-mvp-features-avanzadas)
- [Fase Producción: Enterprise Ready](#fase-producción-enterprise-ready)
- [Fase Futuro: Innovación](#fase-futuro-innovación)

---

## Iteración 0: Setup Base
**⏱️ Tiempo**: 10-15 minutos  
**🎯 Objetivo**: Proyecto funcionando con estructura básica  
**👁️ Resultado Visual**: Pantalla negra con "Vite + React"

### Tareas
```bash
# Usuario ejecuta:
npm create vite@latest military-ops-tracker -- --template react
cd military-ops-tracker
npm install
npm install -D tailwindcss@next postcss autoprefixer
npx tailwindcss init -p
```

### Archivos a Crear
- [ ] `tailwind.config.js` - Configuración básica
- [ ] `src/index.css` - Importar Tailwind
- [ ] `.env` - Variables de entorno vacías por ahora

### ✅ Criterio de Éxito
- `npm run dev` levanta servidor en localhost:5173
- Ves la pantalla de bienvenida de Vite

---

## Iteración 1: Mapa Visible ⭐
**⏱️ Tiempo**: 30-40 minutos  
**🎯 Objetivo**: Ver el mapa del Caribe funcionando  
**👁️ Resultado Visual**: Mapa interactivo oscuro centrado en el Caribe

### Dependencias
```bash
# Usuario ejecuta:
npm install mapbox-gl
```

### Tareas
- [ ] Crear cuenta gratuita en [Mapbox](https://mapbox.com)
- [ ] Obtener Access Token
- [ ] Añadir token a `.env`
- [ ] Crear componente `MapContainer.jsx`
- [ ] Configurar Mapbox con estilo oscuro
- [ ] Centrar en Caribe (15°N, 75°W)
- [ ] Zoom inicial 6

### Archivos a Crear
```
src/
├── components/
│   └── Map/
│       └── MapContainer.jsx
├── lib/
│   └── mapbox.js
└── App.jsx (modificar)
```

### Código Mínimo Viable
**`src/lib/mapbox.js`**
```javascript
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const MAP_CONFIG = {
  center: [-75, 15], // Caribe
  zoom: 6,
  style: 'mapbox://styles/mapbox/dark-v11',
};
```

**`src/components/Map/MapContainer.jsx`**
```javascript
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, MAP_CONFIG } from '../../lib/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapContainer() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
    });

    // Controles de navegación
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  return (
    <div className="h-screen w-screen">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
```

**`.env`**
```env
VITE_MAPBOX_ACCESS_TOKEN=tu_token_aqui
```

### ✅ Criterio de Éxito
- ✅ Ves el mapa del Caribe en modo oscuro
- ✅ Puedes hacer zoom y pan
- ✅ Controles de navegación visibles

---

## Iteración 2: Marcadores Básicos
**⏱️ Tiempo**: 20-30 minutos  
**🎯 Objetivo**: Ver iconos de entidades en el mapa  
**👁️ Resultado Visual**: 4 iconos (barco, avión, tanque, tropas) en diferentes ubicaciones

### Dependencias
```bash
# Usuario ejecuta:
npm install lucide-react
```

### Tareas
- [ ] Crear datos hardcodeados de 4 entidades
- [ ] Añadir marcadores al mapa
- [ ] Usar iconos de `lucide-react`
- [ ] Colorear según tipo

### Datos Hardcodeados
**`src/data/mockEntities.js`**
```javascript
export const MOCK_ENTITIES = [
  {
    id: '1',
    name: 'USS Gerald R. Ford',
    type: 'barco',
    latitude: 18.4655,
    longitude: -66.1057, // Puerto Rico
    status: 'activo',
  },
  {
    id: '2',
    name: 'F-35A Escuadrón Alpha',
    type: 'avion',
    latitude: 12.5844,
    longitude: -81.7006, // Caribe Sur
    status: 'en_transito',
  },
  {
    id: '3',
    name: '75º Regimiento Ranger',
    type: 'tropas',
    latitude: 12.5211,
    longitude: -69.9683, // Aruba
    status: 'estacionado',
  },
  {
    id: '4',
    name: 'Batallón M1 Abrams',
    type: 'tanque',
    latitude: 10.4806,
    longitude: -66.9036, // Venezuela Norte
    status: 'activo',
  },
];
```

### Componente de Marcador
**`src/components/Map/EntityMarker.jsx`**
```javascript
import { Ship, Plane, Users, Shield } from 'lucide-react';

const ENTITY_ICONS = {
  barco: Ship,
  avion: Plane,
  tropas: Users,
  tanque: Shield,
};

const ENTITY_COLORS = {
  barco: '#3b82f6',   // Azul
  avion: '#6b7280',   // Gris
  tropas: '#10b981',  // Verde
  tanque: '#d97706',  // Naranja
};

export function getEntityIcon(type) {
  const Icon = ENTITY_ICONS[type] || Ship;
  const color = ENTITY_COLORS[type] || '#ffffff';
  
  // Crear SVG como string
  const svgString = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="${color}" opacity="0.3"/>
      <circle cx="12" cy="12" r="8" fill="${color}"/>
    </svg>
  `;
  
  return svgString;
}
```

### Actualizar MapContainer
**`src/components/Map/MapContainer.jsx`** (añadir)
```javascript
import { MOCK_ENTITIES } from '../../data/mockEntities';
import { getEntityIcon } from './EntityMarker';

// Dentro del useEffect, después de crear el mapa:
useEffect(() => {
  // ... código anterior del mapa

  map.current.on('load', () => {
    // Añadir marcadores hardcodeados
    MOCK_ENTITIES.forEach((entity) => {
      const el = document.createElement('div');
      el.className = 'entity-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';
      el.innerHTML = getEntityIcon(entity.type);

      new mapboxgl.Marker(el)
        .setLngLat([entity.longitude, entity.latitude])
        .addTo(map.current);
    });
  });
}, []);
```

### ✅ Criterio de Éxito
- ✅ Ves 4 iconos circulares de colores en el mapa
- ✅ Cada tipo tiene su color distintivo
- ✅ Los marcadores están en posiciones correctas del Caribe

---

## Iteración 3: Interacción con Popup
**⏱️ Tiempo**: 15-20 minutos  
**🎯 Objetivo**: Hacer click en marcador y ver información  
**👁️ Resultado Visual**: Popup con nombre y tipo de entidad

### Tareas
- [ ] Añadir evento click a marcadores
- [ ] Crear popup de Mapbox
- [ ] Mostrar info básica

### Actualizar MapContainer
**`src/components/Map/MapContainer.jsx`** (modificar bucle de marcadores)
```javascript
MOCK_ENTITIES.forEach((entity) => {
  const el = document.createElement('div');
  el.className = 'entity-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.cursor = 'pointer';
  el.innerHTML = getEntityIcon(entity.type);

  // Crear popup
  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
    <div class="p-3 bg-slate-800 text-white rounded">
      <h3 class="font-bold text-lg mb-1">${entity.name}</h3>
      <p class="text-sm text-slate-300">Tipo: ${entity.type}</p>
      <p class="text-sm text-slate-300">Estado: ${entity.status}</p>
    </div>
  `);

  new mapboxgl.Marker(el)
    .setLngLat([entity.longitude, entity.latitude])
    .setPopup(popup)
    .addTo(map.current);
});
```

### CSS para Popups
**`src/index.css`** (añadir)
```css
.mapboxgl-popup-content {
  @apply bg-slate-800 text-white border border-slate-700 rounded-lg shadow-xl;
  padding: 0;
}

.mapboxgl-popup-close-button {
  @apply text-white hover:text-slate-300;
  font-size: 20px;
}
```

### ✅ Criterio de Éxito
- ✅ Click en marcador abre popup
- ✅ Popup muestra nombre, tipo y estado
- ✅ Popup tiene estilo oscuro militar

---

## Iteración 4: Supabase + Datos Reales
**⏱️ Tiempo**: 45-60 minutos  
**🎯 Objetivo**: Datos desde base de datos real  
**👁️ Resultado Visual**: Los mismos marcadores pero desde Supabase

### Dependencias
```bash
# Usuario ejecuta:
npm install @supabase/supabase-js
```

### Tareas en Supabase Dashboard
1. [ ] Ir a [supabase.com](https://supabase.com)
2. [ ] Crear nuevo proyecto
3. [ ] Copiar URL y Anon Key
4. [ ] Ir al SQL Editor

### Migración Inicial
**SQL a ejecutar en Supabase SQL Editor:**
```sql
-- Crear tabla básica de entidades
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'activo',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar datos de prueba
INSERT INTO entities (name, type, latitude, longitude, status) VALUES
  ('USS Gerald R. Ford', 'barco', 18.4655, -66.1057, 'activo'),
  ('F-35A Escuadrón Alpha', 'avion', 12.5844, -81.7006, 'en_transito'),
  ('75º Regimiento Ranger', 'tropas', 12.5211, -69.9683, 'estacionado'),
  ('Batallón M1 Abrams', 'tanque', 10.4806, -66.9036, 'activo');

-- Habilitar Row Level Security (temporal - permitir todo)
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON entities
  FOR ALL USING (true);
```

### Configurar Cliente Supabase
**`.env`**
```env
VITE_MAPBOX_ACCESS_TOKEN=tu_token_mapbox
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

**`src/lib/supabase.js`**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Hook para Entidades
**`src/hooks/useEntities.js`**
```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useEntities() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  async function fetchEntities() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching entities:', err);
    } finally {
      setLoading(false);
    }
  }

  return { entities, loading, error, refetch: fetchEntities };
}
```

### Actualizar MapContainer
**`src/components/Map/MapContainer.jsx`**
```javascript
import { useEntities } from '../../hooks/useEntities';

export default function MapContainer() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const { entities, loading } = useEntities();

  useEffect(() => {
    if (map.current) return;
    // ... inicializar mapa
  }, []);

  // Nuevo useEffect para marcadores
  useEffect(() => {
    if (!map.current || loading || entities.length === 0) return;

    // Limpiar marcadores previos
    const markers = [];

    entities.forEach((entity) => {
      const el = document.createElement('div');
      el.className = 'entity-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';
      el.innerHTML = getEntityIcon(entity.type);

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 bg-slate-800 text-white rounded">
          <h3 class="font-bold text-lg mb-1">${entity.name}</h3>
          <p class="text-sm text-slate-300">Tipo: ${entity.type}</p>
          <p class="text-sm text-slate-300">Estado: ${entity.status}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([entity.longitude, entity.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markers.push(marker);
    });

    // Cleanup
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [entities, loading]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-xl">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
```

### ✅ Criterio de Éxito
- ✅ Marcadores se cargan desde Supabase
- ✅ Añadir una entidad en Supabase SQL Editor aparece en el mapa al refrescar
- ✅ No hay errores en consola

---

## Iteración 5: Drag & Drop (CORE FUNCIONAL)
**⏱️ Tiempo**: 60-90 minutos  
**🎯 Objetivo**: Arrastrar marcadores y actualizar BD  
**👁️ Resultado Visual**: Arrastra un barco, se actualiza su posición en BD

### Dependencias
```bash
# Usuario ejecuta:
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Tareas
- [ ] Hacer marcadores arrastrables
- [ ] Capturar nueva posición
- [ ] Actualizar en Supabase
- [ ] Mostrar feedback visual

### Actualizar Hook useEntities
**`src/hooks/useEntities.js`** (añadir función)
```javascript
export function useEntities() {
  // ... código anterior

  async function updateEntityPosition(id, latitude, longitude) {
    try {
      const { error } = await supabase
        .from('entities')
        .update({ latitude, longitude })
        .eq('id', id);

      if (error) throw error;
      
      // Refetch para actualizar estado
      await fetchEntities();
      return true;
    } catch (err) {
      console.error('Error updating position:', err);
      return false;
    }
  }

  return { 
    entities, 
    loading, 
    error, 
    refetch: fetchEntities,
    updateEntityPosition 
  };
}
```

### Marcadores Arrastrables
**`src/components/Map/MapContainer.jsx`** (modificar creación de marcadores)
```javascript
export default function MapContainer() {
  const { entities, loading, updateEntityPosition } = useEntities();
  
  // ... código anterior

  useEffect(() => {
    if (!map.current || loading || entities.length === 0) return;

    const markers = [];

    entities.forEach((entity) => {
      const el = document.createElement('div');
      el.className = 'entity-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'grab';
      el.innerHTML = getEntityIcon(entity.type);

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 bg-slate-800 text-white rounded">
          <h3 class="font-bold text-lg mb-1">${entity.name}</h3>
          <p class="text-sm text-slate-300">Tipo: ${entity.type}</p>
          <p class="text-sm text-slate-300">Estado: ${entity.status}</p>
          <p class="text-xs text-slate-400 mt-2">Arrastra para mover</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el, { draggable: true })
        .setLngLat([entity.longitude, entity.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Evento al terminar de arrastrar
      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        console.log(`Moving ${entity.name} to:`, lngLat);
        
        const success = await updateEntityPosition(
          entity.id,
          lngLat.lat,
          lngLat.lng
        );

        if (success) {
          // Feedback visual
          el.style.filter = 'brightness(1.5)';
          setTimeout(() => {
            el.style.filter = 'brightness(1)';
          }, 500);
        } else {
          // Revertir si falla
          marker.setLngLat([entity.longitude, entity.latitude]);
          alert('Error al actualizar posición');
        }
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [entities, loading, updateEntityPosition]);

  // ... resto del componente
}
```

### CSS para Drag
**`src/index.css`** (añadir)
```css
.entity-marker {
  transition: filter 0.3s ease;
}

.entity-marker:active {
  cursor: grabbing;
  filter: brightness(1.3);
}
```

### ✅ Criterio de Éxito
- ✅ Puedes arrastrar cualquier marcador
- ✅ Al soltar, se actualiza en Supabase
- ✅ Refrescas la página y mantiene nueva posición
- ✅ Feedback visual (brillo) al mover

---

## 🎉 CHECKPOINT: MVP Ultra-Lean Completo

**Has completado el CORE de la aplicación:**
- ✅ Mapa interactivo profesional
- ✅ Datos desde base de datos
- ✅ Visualización de entidades
- ✅ Drag & Drop funcional
- ✅ Persistencia en BD

**Tiempo total estimado**: 3-4 horas  
**Resultado**: Demo funcional que impresiona

---

## Fase MVP: Funcionalidades Esenciales
**⏱️ Tiempo Total**: 2-3 semanas  
**🎯 Objetivo**: App usable con todas las funciones básicas

### MVP-1: Sidebar de Gestión (Prioridad: ALTA)
**⏱️ Tiempo**: 1-2 días

**Tareas:**
- [ ] Componente Sidebar colapsable
- [ ] Lista de entidades
- [ ] Filtros básicos (por tipo)
- [ ] Búsqueda por nombre

**Resultado Visual**: Panel lateral con lista de entidades

---

### MVP-2: Formulario de Crear Entidad (Prioridad: ALTA)
**⏱️ Tiempo**: 2-3 días

**Tareas:**
- [ ] Formulario con validación
- [ ] Campos dinámicos según tipo
- [ ] Crear en Supabase
- [ ] Actualizar mapa en tiempo real

**Resultado Visual**: Botón "+" → Form → Nueva entidad aparece en mapa

---

### MVP-3: Modal de Detalles (Prioridad: MEDIA)
**⏱️ Tiempo**: 1-2 días

**Tareas:**
- [ ] Modal full-screen
- [ ] Mostrar todos los campos
- [ ] Botón editar
- [ ] Botón eliminar

**Resultado Visual**: Click en entidad → Modal con info completa

---

### MVP-4: Editar y Eliminar (Prioridad: ALTA)
**⏱️ Tiempo**: 1 día

**Tareas:**
- [ ] Formulario de edición
- [ ] Confirmación de eliminación
- [ ] Actualizar/eliminar en Supabase

**Resultado Visual**: CRUD completo

---

### MVP-5: Iconos SVG Profesionales (Prioridad: MEDIA)
**⏱️ Tiempo**: 1 día

**Tareas:**
- [ ] Diseñar/encontrar iconos militares SVG
- [ ] Rotación según dirección
- [ ] Diferentes tamaños según zoom
- [ ] Colores configurables

**Resultado Visual**: Iconos profesionales en lugar de círculos

---

### MVP-6: Header y UI Básica (Prioridad: BAJA)
**⏱️ Tiempo**: 1 día

**Tareas:**
- [ ] Header con título
- [ ] Contador de entidades
- [ ] Botones de acción global
- [ ] Paleta de colores militar aplicada

**Resultado Visual**: UI completa y profesional

---

## Fase MVP+: Features Avanzadas
**⏱️ Tiempo Total**: 2-3 semanas  
**🎯 Objetivo**: Superar a Map.army

### MVP+-1: Sistema de Autenticación (Prioridad: ALTA)
**⏱️ Tiempo**: 2-3 días

**Tareas:**
- [ ] Supabase Auth configurado
- [ ] LoginForm
- [ ] Registro
- [ ] Protected routes

**Resultado Visual**: Login antes de acceder al mapa

---

### MVP+-2: Roles Básicos (Prioridad: MEDIA)
**⏱️ Tiempo**: 2 días

**Tareas:**
- [ ] Tabla users con roles
- [ ] RLS policies
- [ ] Viewer vs Operator

**Resultado Visual**: Permisos según rol

---

### MVP+-3: Historial de Movimientos (Prioridad: MEDIA)
**⏱️ Tiempo**: 2-3 días

**Tareas:**
- [ ] Tabla movement_history
- [ ] Trigger automático al mover
- [ ] Ver historial en modal

**Resultado Visual**: Lista de movimientos previos

---

### MVP+-4: Líneas de Trayectoria (Prioridad: BAJA)
**⏱️ Tiempo**: 2 días

**Tareas:**
- [ ] Dibujar línea entre movimientos
- [ ] Animación de trayectoria
- [ ] Toggle on/off

**Resultado Visual**: Líneas conectando posiciones históricas

---

### MVP+-5: Zonas Básicas (Prioridad: MEDIA)
**⏱️ Tiempo**: 3-4 días

**Tareas:**
- [ ] Tabla zones
- [ ] Dibujar polígonos con Mapbox Draw
- [ ] Guardar en BD
- [ ] Visualizar en mapa

**Resultado Visual**: Zonas coloreadas en el mapa

---

### MVP+-6: Alertas Básicas (Prioridad: ALTA)
**⏱️ Tiempo**: 3-4 días

**Tareas:**
- [ ] Tabla alerts
- [ ] Edge Function de proximidad
- [ ] Panel de alertas
- [ ] Toast notifications

**Resultado Visual**: Alerta cuando 2 entidades están cerca

---

### MVP+-7: Realtime (Prioridad: ALTA)
**⏱️ Tiempo**: 2 días

**Tareas:**
- [ ] Habilitar Realtime en Supabase
- [ ] Suscripción a cambios
- [ ] Actualizar mapa automáticamente

**Resultado Visual**: Cambios de otro usuario aparecen en tiempo real

---

## Fase Producción: Enterprise Ready
**⏱️ Tiempo Total**: 4-6 semanas  
**🎯 Objetivo**: Aplicación lista para producción

### PROD-1: Operaciones Militares
**⏱️ Tiempo**: 1 semana
- [ ] CRUD de operaciones
- [ ] Asignar entidades
- [ ] Áreas de operación

---

### PROD-2: Analytics Dashboard
**⏱️ Tiempo**: 1 semana
- [ ] Gráficos con Recharts
- [ ] Heatmap de actividad
- [ ] Estadísticas

---

### PROD-3: Timeline y Playback
**⏱️ Tiempo**: 1-2 semanas
- [ ] Slider temporal
- [ ] Reproducir movimientos
- [ ] Controles de velocidad

---

### PROD-4: Exportación
**⏱️ Tiempo**: 1 semana
- [ ] PDF con jsPDF
- [ ] Excel con xlsx
- [ ] KML para Google Earth

---

### PROD-5: PostGIS Migration
**⏱️ Tiempo**: 1 semana
- [ ] Migrar a Geography type
- [ ] Funciones geoespaciales
- [ ] Optimizar queries

---

### PROD-6: Testing
**⏱️ Tiempo**: 1 semana
- [ ] Vitest setup
- [ ] Unit tests críticos
- [ ] E2E con Playwright

---

### PROD-7: Deployment
**⏱️ Tiempo**: 3-4 días
- [ ] Build optimizado
- [ ] Deploy a Vercel
- [ ] Dominio custom
- [ ] Monitoring (Sentry)

---

## Fase Futuro: Innovación
**🎯 Objetivo**: Features que nos diferencian completamente

### FUT-1: IA y Predicciones
- [ ] Predecir trayectorias con ML
- [ ] Detectar patrones anómalos

### FUT-2: Integración Externa
- [ ] AIS para barcos reales
- [ ] ADS-B para aviones reales
- [ ] API meteorológica

### FUT-3: PWA y Offline
- [ ] Service Workers
- [ ] Sincronización offline
- [ ] Instalar como app

### FUT-4: Comunicaciones
- [ ] Chat en tiempo real
- [ ] Videollamadas WebRTC
- [ ] Notificaciones push

---

## 📊 Resumen de Prioridades

### 🔥 CRÍTICO (Hacer primero)
1. Iteraciones 0-5: MVP Ultra-Lean
2. MVP-1: Sidebar
3. MVP-2: Formulario crear
4. MVP-4: Editar/Eliminar
5. MVP+-1: Autenticación
6. MVP+-6: Alertas
7. MVP+-7: Realtime

### ⚠️ IMPORTANTE (Hacer después)
1. MVP-3: Modal detalles
2. MVP-5: Iconos profesionales
3. MVP+-2: Roles
4. MVP+-3: Historial
5. MVP+-5: Zonas
6. PROD-1: Operaciones

### ℹ️ NICE TO HAVE (Cuando haya tiempo)
1. MVP-6: Header UI
2. MVP+-4: Líneas trayectoria
3. PROD-2: Analytics
4. PROD-3: Timeline
5. PROD-4: Exportación

---

## 🎯 Hitos Clave

| Hito | Duración | Descripción |
|------|----------|-------------|
| **Alpha** | 1 día | Iteraciones 0-5 completas |
| **Beta MVP** | 2 semanas | MVP-1 a MVP-6 completos |
| **Beta MVP+** | 1 mes | MVP+ completo con realtime |
| **RC (Release Candidate)** | 2 meses | PROD-1 a PROD-5 completos |
| **v1.0 Production** | 2.5 meses | Testing y deployment |
| **v2.0 Future** | 6+ meses | Features de innovación |

---

## 📝 Notas de Desarrollo

### Filosofía de Desarrollo
1. **Visual First**: Si no se ve, no existe
2. **Iterativo**: Cada feature en su propia rama
3. **Testing Manual**: Testear cada iteración antes de continuar
4. **Git Commits**: Commit al final de cada iteración exitosa
5. **No Perfección**: MVP significa "suficientemente bueno"

### Comandos Git Recomendados
```bash
# Al iniciar iteración
git checkout -b iteracion-X-nombre

# Al completar iteración
git add .
git commit -m "feat: iteración X - descripción"
git checkout main
git merge iteracion-X-nombre
```

### Criterios de "Completado"
✅ Funciona visualmente  
✅ No rompe nada anterior  
✅ Se puede demostrar a alguien  
✅ Está commiteado en git  

---

**Última Actualización**: Octubre 2025  
**Versión del Roadmap**: 1.0  
**Próxima Revisión**: Después de completar Iteración 5

