# 🗺️ Sistema de Mapas Tácticos con Timeline de Inteligencia

## 📋 Descripción General

Sistema de análisis de inteligencia militar/táctica tipo **IBM i2 Analyst's Notebook** con mapa interactivo (Mapbox) y timeline de eventos. Permite visualizar entidades militares (buques, aviones, tropas, vehículos) en un mapa, crear eventos temporales asociados a estas entidades, y realizar análisis complejos mediante filtrado multi-entidad.

---

## 🏗️ Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Mapbox GL JS** - Mapa interactivo
- **Lucide React** - Iconos

### Backend
- **Supabase** - Base de datos PostgreSQL + PostGIS
- **Supabase Storage** - Almacenamiento de imágenes y PDFs
- **Row Level Security (RLS)** - Seguridad a nivel de fila

### Herramientas
- **MCPs (Model Context Protocols)**:
  - Supabase MCP - Gestión de base de datos
  - Context7 MCP - Búsquedas web
  - GitHub MCP - Control de versiones

---

## 📁 Estructura del Proyecto

```
app-mapas/
├── public/
│   └── Icons/
│       └── i2/                    # 610 iconos profesionales tipo IBM i2
│           ├── Ship.png
│           ├── Aircraft.png
│           ├── Patrol.png
│           └── ...
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapComponent.jsx       # Mapa Mapbox principal
│   │   │   └── EntityMarker.jsx       # Marcadores de entidades
│   │   ├── Templates/
│   │   │   ├── EntityPalette.jsx      # Paleta lateral de plantillas
│   │   │   ├── TemplateCard.jsx       # Card de plantilla (vista lista)
│   │   │   ├── TemplateGridItem.jsx   # Card de plantilla (vista grid)
│   │   │   └── TemplateAdminPanel.jsx # Panel de administración
│   │   ├── Timeline/
│   │   │   ├── EventTimeline.jsx      # ⭐ Timeline principal (sidebar derecho)
│   │   │   ├── EventCard.jsx          # Card de evento individual
│   │   │   ├── AddEventModal.jsx      # ⭐ Modal crear/editar evento
│   │   │   ├── EntitySelector.jsx     # ⭐ Selector de entidades para eventos
│   │   │   └── PDFUploader.jsx        # ⭐ Uploader de PDFs a Supabase
│   │   ├── Navigation/
│   │   │   └── TopNavigationBar.jsx   # Navbar superior
│   │   └── ImageUploader.jsx          # Uploader de imágenes
│   ├── config/
│   │   ├── i2Icons.js                 # ⭐ Mapeo de iconos i2
│   │   └── intelligenceClassification.js  # ⭐ Sistema de clasificación A-F, 1-6
│   ├── hooks/
│   │   ├── useEvents.js               # ⭐ Hook para CRUD de eventos
│   │   └── useEntities.js             # Hook para CRUD de entidades
│   ├── lib/
│   │   └── supabase.js                # Cliente de Supabase
│   ├── App.jsx                        # Componente principal
│   ├── index.css                      # Estilos globales
│   └── main.jsx                       # Entry point
├── .env                               # Variables de entorno (NO commitear)
└── README.md                          # Este archivo
```

---

## 🗄️ Esquema de Base de Datos (Supabase)

### Tabla: `entities`
Entidades militares en el mapa (buques, aviones, tropas, vehículos, insurgentes)

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Ej: "USS Iwo Jima"
  class TEXT,                            -- Ej: "LHD-7 Wasp"
  type TEXT NOT NULL,                    -- destructor, portaaviones, caza, tropas, etc.
  status TEXT,
  position GEOMETRY(Point, 4326),        -- PostGIS
  latitude NUMERIC,
  longitude NUMERIC,
  heading INTEGER,
  speed NUMERIC,
  altitude INTEGER,
  image_url TEXT,                        -- URL de imagen en Supabase Storage
  icon_url TEXT,                         -- URL de icono i2
  template_id UUID,                      -- FK a entity_templates
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Campos específicos por tipo
  armamento TEXT,
  displacement_tons INTEGER,
  crew_count INTEGER,
  length_meters NUMERIC,
  -- ... más campos
);
```

**Tipos de entidad permitidos:**
- `destructor`, `fragata`, `portaaviones`, `submarino`
- `avion`, `caza`, `helicoptero`, `drone`
- `tropas`, `insurgente`
- `vehiculo`, `tanque`

### Tabla: `entity_templates`
Plantillas genéricas para tipos de entidades

```sql
CREATE TABLE entity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,     -- Ej: "destructor-general"
  name VARCHAR(255) NOT NULL,            -- Ej: "Destructor (Plantilla General)"
  entity_type VARCHAR(50) NOT NULL,      -- destructor, caza, tropas, etc.
  icon_url TEXT,
  fields JSONB,                          -- Definición de campos
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `events`
Eventos temporales en el timeline

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                   -- Ej: "Operación Caribe 2025"
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,       -- Fecha/hora del evento
  type VARCHAR(20) NOT NULL,             -- 'evento', 'noticia', 'informe'
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Multimedia
  image_url TEXT,                        -- URL de imagen
  link_url TEXT,                         -- Link externo (noticias)
  link_title VARCHAR(255),
  file_url TEXT,                         -- URL de PDF (informes)
  file_name VARCHAR(255),
  file_size INTEGER,
  
  -- Clasificación de Inteligencia (OTAN)
  source_reliability VARCHAR(1),         -- A-F (A=confiable, F=no se puede juzgar)
  info_credibility VARCHAR(1),           -- 1-6 (1=confirmada, 6=no se puede juzgar)
  priority_level VARCHAR(20),            -- 'normal', 'importante', 'urgente'
  
  tags TEXT[],                           -- Array de etiquetas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT events_type_check CHECK (type IN ('evento', 'noticia', 'informe')),
  CONSTRAINT events_source_reliability_check CHECK (source_reliability IN ('A', 'B', 'C', 'D', 'E', 'F')),
  CONSTRAINT events_info_credibility_check CHECK (info_credibility IN ('1', '2', '3', '4', '5', '6')),
  CONSTRAINT events_priority_level_check CHECK (priority_level IN ('normal', 'importante', 'urgente'))
);
```

### Tabla: `event_entities` ⭐ CLAVE
Relación many-to-many entre eventos y entidades

```sql
CREATE TABLE event_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50),         -- 'mentioned', 'involved', 'location', 'subject'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, entity_id)
);

CREATE INDEX idx_event_entities_event_id ON event_entities(event_id);
CREATE INDEX idx_event_entities_entity_id ON event_entities(entity_id);
```

**Esta tabla es fundamental para:**
- Asociar eventos con múltiples entidades
- Filtrar el timeline por entidad (ver historial de un barco)
- Análisis multi-entidad (eventos con 2+ entidades específicas)

---

## 🎯 Funcionalidades Principales

### 1. Mapa Interactivo
- **Visualización de entidades** con iconos i2 profesionales
- **Drag & drop** desde paleta lateral para agregar entidades
- **Edición in-place** de propiedades
- **Controles de tamaño** de iconos (configuración)
- **Vista satelital/calles** (Mapbox)

### 2. Sistema de Plantillas
- **Plantillas genéricas** por tipo (no por entidad específica)
- **Paleta lateral** organizada jerárquicamente (5 grupos, subgrupos)
- **Vista lista/grid** toggle
- **Tabs**: Todas / Favoritas / Usadas
- **Panel de administración** con CRUD completo

### 3. Timeline de Eventos ⭐ NUEVO
**Ubicación:** Sidebar derecho, toggle desde navbar

#### Características principales:
- **3 tipos de eventos:**
  - 🎯 **Evento** - Fuentes cerradas vinculadas al hecho
  - 📰 **Noticia** - Soporta links externos y fotos
  - 📄 **Informe** - Soporta archivos PDF con previsualización

#### Clasificación de Inteligencia (OTAN):
- **Confiabilidad de la Fuente (A-F):**
  - A = Completamente confiable
  - B = Usualmente confiable
  - C = Regularmente confiable
  - D = No usualmente confiable
  - E = No confiable
  - F = No se puede juzgar

- **Credibilidad de la Información (1-6):**
  - 1 = Confirmada
  - 2 = Probablemente cierta
  - 3 = Posiblemente cierta
  - 4 = Dudosa
  - 5 = Improbable
  - 6 = No se puede juzgar

- **Niveles de Prioridad:**
  - 📋 Normal
  - ⚠️ Importante
  - 🚨 Urgente (con animación pulse)

#### Asociación de Entidades:
- **EntitySelector** - Busca y asocia múltiples entidades a un evento
- Las entidades aparecen como **chips azules** en el evento
- Permite crear el "historial" de cada entidad

#### Filtrado Avanzado: ⭐ FEATURE CLAVE
- **Búsqueda de texto** - Busca en título/descripción
- **Filtro por tipo** - Evento/Noticia/Informe
- **Filtro multi-entidad** - Selecciona múltiples entidades
  - Lógica **AND** (muestra eventos con TODAS las entidades)
  - Perfecto para análisis de operaciones conjuntas
  - Ejemplo: USS Iwo Jima + USS Mahan = eventos donde ambos participan

#### Multimedia:
- **Imágenes** - Upload a Supabase Storage (bucket: entity-images)
- **PDFs** - Upload a Supabase Storage (bucket: event-files)
- **Links externos** - Noticias, redes sociales

---

## 🚀 Casos de Uso Reales

### Caso 1: Rastrear Actividades del USS Iwo Jima
1. Crear evento: "USS Iwo Jima zarpa de puerto"
2. Asociar entidad: USS Iwo Jima
3. Crear evento: "Ejercicio de entrenamiento en Caribe"
4. Asociar entidad: USS Iwo Jima
5. **Filtrar timeline por USS Iwo Jima**
6. **Ver historial completo de actividades del barco**

### Caso 2: Análisis de Operación Conjunta
1. Crear evento: "Operación Caribe 2025"
2. Asociar múltiples entidades:
   - USS Iwo Jima
   - USS Mahan
   - Marines SOUTHCOM
3. Clasificar: A1 (fuente confiable + info confirmada)
4. Prioridad: Urgente
5. **Filtrar por USS Iwo Jima Y USS Mahan**
6. **Ver solo eventos donde ambos participan**

### Caso 3: Seguimiento de Insurgentes
1. Crear entidad: "Célula Insurgente Alpha"
2. Crear eventos: "Emboscada", "IED detectado", etc.
3. Asociar la célula a cada evento
4. **Filtrar por "Célula Insurgente Alpha"**
5. **Ver patrón de actividad temporal**

---

## 🔧 Configuración Inicial

### Variables de Entorno (.env)
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_MAPBOX_TOKEN=tu-mapbox-token
```

### Buckets de Supabase Storage
```sql
-- Bucket para imágenes de entidades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entity-images',
  'entity-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Bucket para archivos PDF de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-files',
  'event-files',
  true,
  10485760,  -- 10MB
  ARRAY['application/pdf']
);
```

### Políticas RLS
```sql
-- Permitir acceso público a eventos
CREATE POLICY "Allow public read access to events"
ON events FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to events"
ON events FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to events"
ON events FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete from events"
ON events FOR DELETE TO public USING (true);

-- Igual para event_entities
CREATE POLICY "Allow public read access to event_entities"
ON event_entities FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to event_entities"
ON event_entities FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public delete from event_entities"
ON event_entities FOR DELETE TO public USING (true);

-- Storage policies (configurar desde Supabase Dashboard)
```

---

## 📝 Comandos Útiles

### Desarrollo
```bash
npm install          # Instalar dependencias
npm run dev          # Iniciar servidor de desarrollo (puerto 5173)
npm run build        # Build de producción
npm run preview      # Preview del build
```

### Base de Datos (via Supabase MCP)
```bash
# Ver estructura de tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events';

# Verificar eventos con entidades
SELECT e.title, COUNT(ee.entity_id) as entity_count
FROM events e
LEFT JOIN event_entities ee ON e.id = ee.event_id
GROUP BY e.id, e.title;
```

---

## 🐛 Problemas Conocidos y Soluciones

### 1. Error: "Tank icon not found"
**Causa:** `Tank` no existe en lucide-react
**Solución:** Usar `Truck` en su lugar
```javascript
import { Truck } from 'lucide-react';  // ✅ Correcto
```

### 2. Error: "column 'code' does not exist"
**Causa:** La tabla `entities` usa `class`, no `code`
**Solución:** 
```javascript
// ❌ Incorrecto
.select('id, name, code, type')

// ✅ Correcto
.select('id, name, class, type')
```

### 3. PDFs no se suben (406 error)
**Causa:** RLS policies muy restrictivas
**Solución:** Configurar políticas públicas en bucket `event-files`

### 4. Entidades no aparecen en EventCard
**Causa:** Query mal formado en join
**Solución:**
```javascript
// ✅ Correcto
.select(`
  entities:entity_id (
    id,
    name,
    type
  )
`)
```

---

## 🎨 Guía de Estilos y Convenciones

### Colores (Tailwind)
- **Fondo principal:** `slate-900`, `slate-800`
- **Bordes:** `slate-700`, `slate-600`
- **Texto:** `white`, `slate-300`, `slate-400`
- **Primario (acciones):** `blue-600`, `blue-500`
- **Eventos:** `blue-500`
- **Noticias:** `amber-500`
- **Informes:** `purple-500`
- **Urgente:** `red-600` con `animate-pulse`
- **Importante:** `yellow-600`

### Iconos i2
- Ubicación: `/public/Icons/i2/`
- Formato: PNG, 64x64px
- Mapeo: `src/config/i2Icons.js`

### Componentes
- **Funcionales** con hooks (no class components)
- **Props destructuring** en parámetros
- **useState/useEffect** para estado local
- **Custom hooks** para lógica reutilizable

---

## 📚 Recursos y Referencias

### Documentación
- [Supabase Docs](https://supabase.com/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

### Estándares de Inteligencia
- Sistema de clasificación A-F / 1-6 basado en OTAN
- [NATO Intelligence Standards](https://www.nato.int/)

---

## 🔄 Estado Actual del Proyecto (31 Oct 2025)

### ✅ Completado
- [x] Sistema de mapa interactivo con Mapbox
- [x] Paleta de plantillas con iconos i2 profesionales
- [x] Sistema de entidades (CRUD completo)
- [x] Vista lista/grid para plantillas
- [x] Panel de administración de plantillas
- [x] Timeline de eventos (sidebar derecho)
- [x] 3 tipos de eventos (evento, noticia, informe)
- [x] Sistema de clasificación de inteligencia (A-F, 1-6)
- [x] Niveles de prioridad (normal, importante, urgente)
- [x] Upload de imágenes a Supabase Storage
- [x] Upload de PDFs a Supabase Storage
- [x] Asociación de entidades a eventos (many-to-many)
- [x] EntitySelector con búsqueda
- [x] Filtro multi-entidad en timeline
- [x] EventCard con entidades relacionadas
- [x] Sistema de badges para clasificación y prioridad

### 🚧 En Progreso
- [ ] Click en entidad del mapa → Abrir timeline filtrado
- [ ] Estadísticas por entidad (X eventos totales)
- [ ] Export de timeline a PDF/Excel
- [ ] Gráficos de análisis temporal

### 💡 Ideas para Implementar
- [ ] Integración con APIs de noticias en tiempo real
- [ ] Sistema de alertas automáticas
- [ ] Análisis de patrones con IA
- [ ] Modo colaborativo (múltiples usuarios)
- [ ] Timeline 3D con Three.js
- [ ] Exportar eventos a formato i2
- [ ] Integración con sistemas OSINT

---

## 🤝 Para la Próxima Sesión (IA o Desarrollador)

### Contexto Rápido
Este proyecto es un **sistema de análisis de inteligencia militar** con:
1. **Mapa** (izquierda) - Entidades militares
2. **Paleta** (izquierda) - Plantillas para agregar entidades
3. **Timeline** (derecha) - Eventos temporales asociados a entidades

### Lo Más Importante
- **event_entities** es la tabla clave para relacionar eventos con entidades
- El timeline permite **filtrar por múltiples entidades** (lógica AND)
- Cada evento tiene **clasificación de inteligencia** (A1, C3, etc.)
- Los **iconos i2** están en `/public/Icons/i2/`

### Archivos Clave para Modificar
1. `src/components/Timeline/EventTimeline.jsx` - Timeline principal
2. `src/components/Timeline/AddEventModal.jsx` - Crear/editar eventos
3. `src/components/Timeline/EntitySelector.jsx` - Selector de entidades
4. `src/config/intelligenceClassification.js` - Sistema de clasificación

### Próximos Pasos Sugeridos
1. **Click en entidad del mapa → Filtrar timeline automáticamente**
   - Pasar `entityId` desde `EntityMarker` a `EventTimeline`
   - Pre-seleccionar entidad en el filtro multi-entidad

2. **Estadísticas en EntityCard**
   - Mostrar "24 eventos" en la card de la entidad
   - Botón "Ver Timeline" en EntityMarker

3. **Export de Timeline**
   - Botón "Exportar a PDF" en EventTimeline
   - Generar reporte con eventos filtrados

### Comandos para Empezar
```bash
cd /root/app-mapas
npm run dev
# Abrir http://localhost:5173
```

---

## 📞 Contacto y Soporte

- **Proyecto:** Sistema de Mapas Tácticos con Timeline de Inteligencia
- **Framework:** React + Vite + Supabase
- **Última actualización:** 31 Octubre 2025
- **Versión:** 1.0.0 (Timeline Multi-Entidad)

---

**🎯 Este README contiene TODO lo necesario para que otra IA o desarrollador pueda continuar el proyecto sin contexto previo.**

**¡Proyecto en producción y funcionando al 100%!** 🚀

