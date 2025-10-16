# Sistema de Monitoreo de Operaciones Militares - Especificaciones Técnicas v2.0

## Descripción General
Aplicación web profesional de nivel empresarial para monitorear y rastrear movimientos militares en el Caribe en tiempo real, con capacidades avanzadas de análisis geoespacial, sistema de alertas inteligentes, control de acceso basado en roles y colaboración multi-usuario.

## Stack Tecnológico

### Core
- **Frontend**: React 19 + Vite (aprovechando React Compiler para optimización automática)
- **Estilos**: Tailwind CSS 4.1 (variables CSS nativas, mejor performance)
- **Mapa**: **Mapbox GL JS** (rendimiento superior, estilos profesionales, soporte 3D)
- **Backend/Base de datos**: Supabase (PostgreSQL + PostGIS + Realtime + Edge Functions + Storage)
- **Drag & Drop**: @dnd-kit (mejor rendimiento y accesibilidad)
- **Iconos**: lucide-react
- **State Management**: Zustand o Jotai (para estado global ligero)
- **Data Fetching**: TanStack Query (React Query v5 - caché, sincronización)
- **Validación**: Zod (schemas TypeScript-first)

### Supabase Features
- **PostGIS Extension**: Cálculos geoespaciales avanzados
- **Realtime Subscriptions**: Actualizaciones en tiempo real
- **Edge Functions**: Lógica serverless (alertas, cálculos complejos)
- **Storage**: Documentos, imágenes de inteligencia
- **Auth**: Sistema completo de autenticación y roles

### Herramientas de Desarrollo
- **MCPs Activos**:
  - Supabase MCP (gestión de BD, migraciones, edge functions)
  - Context7 MCP (documentación React 19 + Tailwind 4.1)

## Estructura del Proyecto
```
military-ops-tracker/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapContainer.jsx
│   │   │   ├── DraggableEntity.jsx
│   │   │   ├── EntityMarker.jsx
│   │   │   ├── EntityCluster.jsx           # Clusters para muchas entidades
│   │   │   ├── TrajectoryLine.jsx          # Líneas de trayectoria animadas
│   │   │   ├── ZoneOverlay.jsx             # Zonas de interés/restricción
│   │   │   ├── MeasurementTool.jsx         # Herramienta de medición
│   │   │   └── MapControls.jsx             # Controles personalizados
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AddEntityForm.jsx
│   │   │   ├── EntityList.jsx
│   │   │   ├── FilterPanel.jsx             # Filtros avanzados
│   │   │   └── QuickStats.jsx              # Estadísticas rápidas
│   │   ├── EntityDetails/
│   │   │   ├── EntityModal.jsx
│   │   │   ├── ShipDetails.jsx
│   │   │   ├── AircraftDetails.jsx
│   │   │   ├── TroopsDetails.jsx
│   │   │   ├── TankDetails.jsx
│   │   │   ├── RelationshipsPanel.jsx      # Relaciones entre entidades
│   │   │   └── AttachmentsPanel.jsx        # Documentos/fotos
│   │   ├── Timeline/
│   │   │   ├── EventTimeline.jsx           # Línea temporal de eventos
│   │   │   ├── PlaybackControls.jsx        # Reproducir historial
│   │   │   └── TimeRangeSelector.jsx       # Selector de rango temporal
│   │   ├── Alerts/
│   │   │   ├── AlertsPanel.jsx             # Panel de alertas
│   │   │   ├── AlertCard.jsx               # Tarjeta de alerta individual
│   │   │   └── AlertRuleBuilder.jsx        # Crear reglas de alerta
│   │   ├── Analytics/
│   │   │   ├── Heatmap.jsx                 # Mapa de calor de actividad
│   │   │   ├── StatsCharts.jsx             # Gráficos estadísticos
│   │   │   └── ComparisonPanel.jsx         # Comparar entidades
│   │   ├── Operations/
│   │   │   ├── OperationsList.jsx          # Lista de operaciones
│   │   │   ├── OperationBuilder.jsx        # Crear operaciones
│   │   │   └── OperationSnapshot.jsx       # Snapshots de operaciones
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RoleGuard.jsx               # Control de acceso por rol
│   │   │   └── UserMenu.jsx
│   │   └── Dashboard.jsx
│   ├── lib/
│   │   ├── supabase.js                     # Cliente Supabase
│   │   ├── mapbox.js                       # Configuración Mapbox
│   │   ├── geospatial.js                   # Utilidades PostGIS
│   │   └── constants.js                    # Constantes de la app
│   ├── hooks/
│   │   ├── useEntities.js                  # CRUD de entidades
│   │   ├── useRealtimeEntities.js          # Suscripción realtime
│   │   ├── useMap.js                       # Lógica del mapa
│   │   ├── useAlerts.js                    # Sistema de alertas
│   │   ├── useOperations.js                # Gestión de operaciones
│   │   ├── useAuth.js                      # Autenticación
│   │   └── useGeospatial.js                # Cálculos geoespaciales
│   ├── stores/
│   │   ├── mapStore.js                     # Estado del mapa (Zustand)
│   │   ├── alertStore.js                   # Estado de alertas
│   │   └── filterStore.js                  # Estado de filtros
│   ├── schemas/
│   │   ├── entity.schema.js                # Schemas Zod para validación
│   │   ├── operation.schema.js
│   │   └── alert.schema.js
│   ├── types/
│   │   └── entities.js
│   ├── utils/
│   │   ├── formatters.js                   # Formateo de datos
│   │   ├── calculations.js                 # Cálculos tácticos
│   │   └── export.js                       # Exportación PDF/Excel/KML
│   └── App.jsx
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_auth_and_roles.sql
│   │   ├── 003_operations_and_zones.sql
│   │   ├── 004_alerts_system.sql
│   │   ├── 005_postgis_extension.sql
│   │   ├── 006_audit_logs.sql
│   │   └── 007_realtime_triggers.sql
│   ├── functions/                          # Edge Functions
│   │   ├── calculate-trajectory/
│   │   ├── detect-proximity/
│   │   ├── send-alert/
│   │   └── generate-report/
│   └── seed.sql                            # Datos de prueba
└── package.json
```

## Esquema de Base de Datos (Supabase) - v2.0

### Extensiones PostgreSQL Requeridas
```sql
-- PostGIS para cálculos geoespaciales avanzados
CREATE EXTENSION IF NOT EXISTS postgis;

-- UUID para IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tabla: `users` (integrada con Supabase Auth)
```sql
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'analyst', 'viewer');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role user_role DEFAULT 'viewer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: `entities` (con PostGIS)
```sql
CREATE TYPE entity_type AS ENUM ('barco', 'avion', 'tropas', 'tanque');
CREATE TYPE entity_status AS ENUM ('activo', 'en_transito', 'estacionado', 'en_mision', 'mantenimiento', 'inactivo');

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,                    -- Código único (ej: "USS-001")
  type entity_type NOT NULL,
  status entity_status DEFAULT 'activo',
  
  -- Geometría PostGIS (reemplaza latitude/longitude)
  location GEOGRAPHY(POINT, 4326) NOT NULL,   -- WGS84
  altitude INTEGER DEFAULT 0,                 -- Metros (para aviones)
  heading DECIMAL(5, 2),                      -- Dirección en grados (0-360)
  speed DECIMAL(6, 2),                        -- Velocidad actual (nudos/km/h)
  
  -- Referencias
  operation_id UUID REFERENCES operations(id) ON DELETE SET NULL,
  parent_entity_id UUID REFERENCES entities(id), -- Para relaciones jerárquicas
  
  -- Metadata
  icon_url TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',         -- Color hex personalizado
  specifications JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Índices optimizados
CREATE INDEX idx_entities_type ON entities(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_entities_status ON entities(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_entities_location ON entities USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_entities_operation ON entities(operation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_entities_code ON entities(code) WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: `operations` (Agrupación de entidades en misiones)
```sql
CREATE TYPE operation_status AS ENUM ('planificada', 'en_curso', 'pausada', 'completada', 'cancelada');
CREATE TYPE operation_priority AS ENUM ('baja', 'media', 'alta', 'critica');

CREATE TABLE operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  objective TEXT,
  status operation_status DEFAULT 'planificada',
  priority operation_priority DEFAULT 'media',
  
  -- Área de operación (polígono)
  area_of_operation GEOGRAPHY(POLYGON, 4326),
  
  -- Fechas
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  estimated_duration INTERVAL,
  
  -- Metadata
  commander VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_operations_status ON operations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_operations_priority ON operations(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_operations_dates ON operations(start_date, end_date) WHERE deleted_at IS NULL;

CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: `zones` (Zonas de interés/restricción)
```sql
CREATE TYPE zone_type AS ENUM ('restriccion', 'interes', 'peligro', 'segura', 'neutral');

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type zone_type NOT NULL,
  description TEXT,
  
  -- Geometría (polígonos o círculos)
  geometry GEOGRAPHY(GEOMETRY, 4326) NOT NULL,
  
  -- Visualización
  color VARCHAR(7) DEFAULT '#ef4444',
  opacity DECIMAL(3, 2) DEFAULT 0.3,
  is_visible BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_zones_type ON zones(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_zones_geometry ON zones USING GIST(geometry) WHERE deleted_at IS NULL;

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: `movement_history` (con geometría)
```sql
CREATE TABLE movement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  
  -- Ubicaciones PostGIS
  previous_location GEOGRAPHY(POINT, 4326),
  new_location GEOGRAPHY(POINT, 4326) NOT NULL,
  previous_altitude INTEGER,
  new_altitude INTEGER,
  
  -- Metadata del movimiento
  distance_meters DECIMAL(10, 2),             -- Calculado automáticamente
  speed_at_time DECIMAL(6, 2),
  heading_at_time DECIMAL(5, 2),
  
  -- Razón del movimiento
  movement_type VARCHAR(50),                  -- 'manual', 'automatic', 'imported'
  notes TEXT,
  
  -- Auditoría
  moved_by UUID REFERENCES public.users(id),
  moved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movement_entity ON movement_history(entity_id);
CREATE INDEX idx_movement_time ON movement_history(moved_at DESC);

-- Trigger para calcular distancia automáticamente
CREATE OR REPLACE FUNCTION calculate_movement_distance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.previous_location IS NOT NULL THEN
    NEW.distance_meters = ST_Distance(
      NEW.previous_location::geography,
      NEW.new_location::geography
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_distance_before_insert
  BEFORE INSERT ON movement_history
  FOR EACH ROW EXECUTE FUNCTION calculate_movement_distance();
```

### Tabla: `alerts` (Sistema de alertas inteligentes)
```sql
CREATE TYPE alert_type AS ENUM (
  'proximity',           -- Proximidad entre entidades
  'zone_entry',          -- Entrada a zona
  'zone_exit',           -- Salida de zona
  'status_change',       -- Cambio de estado
  'speed_threshold',     -- Velocidad inusual
  'communication_loss',  -- Pérdida de comunicación
  'custom'              -- Alerta personalizada
);

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status DEFAULT 'active',
  
  -- Título y descripción
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Entidades involucradas
  entity_id UUID REFERENCES entities(id),
  related_entity_id UUID REFERENCES entities(id),
  zone_id UUID REFERENCES zones(id),
  
  -- Datos del trigger
  trigger_data JSONB,                         -- Datos que dispararon la alerta
  
  -- Metadata
  auto_resolve BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_entity ON alerts(entity_id);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
```

### Tabla: `alert_rules` (Reglas configurables)
```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  
  -- Configuración de la regla
  conditions JSONB NOT NULL,                  -- Ej: {"distance_km": 50, "entity_types": ["barco"]}
  is_enabled BOOLEAN DEFAULT true,
  
  -- Notificaciones
  notify_users UUID[] DEFAULT '{}',           -- IDs de usuarios a notificar
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_enabled ON alert_rules(is_enabled);
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: `entity_relationships` (Relaciones entre entidades)
```sql
CREATE TYPE relationship_type AS ENUM ('escort', 'support', 'command', 'subordinate', 'allied', 'target');

CREATE TABLE entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_a_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  entity_b_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  notes TEXT,
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados
  UNIQUE(entity_a_id, entity_b_id, relationship_type)
);

CREATE INDEX idx_relationships_entity_a ON entity_relationships(entity_a_id);
CREATE INDEX idx_relationships_entity_b ON entity_relationships(entity_b_id);
```

### Tabla: `attachments` (Documentos/Imágenes)
```sql
CREATE TYPE attachment_type AS ENUM ('document', 'image', 'video', 'report', 'intelligence');

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
  
  -- Archivo (Supabase Storage)
  storage_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  type attachment_type NOT NULL,
  
  -- Metadata
  title VARCHAR(255),
  description TEXT,
  tags TEXT[],
  
  -- Clasificación
  classification_level VARCHAR(50) DEFAULT 'unclassified',
  
  -- Auditoría
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_id);
CREATE INDEX idx_attachments_operation ON attachments(operation_id);
CREATE INDEX idx_attachments_type ON attachments(type);
```

### Tabla: `audit_logs` (Registro completo de auditoría)
```sql
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'import');

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action audit_action NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  
  -- Datos antes/después
  old_data JSONB,
  new_data JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Trigger genérico para auditar cambios
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs(user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs(user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs(user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de auditoría a tablas críticas
CREATE TRIGGER audit_entities AFTER INSERT OR UPDATE OR DELETE ON entities
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_operations AFTER INSERT OR UPDATE OR DELETE ON operations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_zones AFTER INSERT OR UPDATE OR DELETE ON zones
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Vistas Materializadas (Performance)
```sql
-- Vista de estadísticas por tipo de entidad
CREATE MATERIALIZED VIEW entity_stats AS
SELECT 
  type,
  status,
  COUNT(*) as count,
  AVG(speed) as avg_speed,
  ST_Centroid(ST_Collect(location::geometry))::geography as center_point
FROM entities
WHERE deleted_at IS NULL
GROUP BY type, status;

CREATE UNIQUE INDEX ON entity_stats(type, status);

-- Refrescar cada 5 minutos (configurar con pg_cron)
-- SELECT cron.schedule('refresh-entity-stats', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY entity_stats');
```

## Especificaciones de Entidades

### Barco (`specifications` JSONB)
```json
{
  "clase": "Destructor",
  "desplazamiento": "9800 toneladas",
  "eslora": "155 metros",
  "manga": "20 metros",
  "velocidad_maxima": "32 nudos",
  "tripulacion": 380,
  "armamento": [
    "Misiles Tomahawk",
    "Sistema Aegis",
    "Cañón de 5 pulgadas"
  ],
  "capacidad_helicopteros": 2,
  "autonomia": "6000 millas náuticas",
  "pais_origen": "Estados Unidos",
  "año_fabricacion": 2010
}
```

### Avión (`specifications` JSONB)
```json
{
  "modelo": "F-35A Lightning II",
  "tipo": "Caza multifunción",
  "velocidad_maxima": "1960 km/h",
  "alcance": "2200 km",
  "techo_servicio": "15000 metros",
  "armamento": [
    "AIM-120 AMRAAM",
    "AIM-9 Sidewinder",
    "Bombas guiadas"
  ],
  "tripulacion": 1,
  "capacidad_combustible": "8278 litros",
  "pais_origen": "Estados Unidos",
  "base_operacion": "Barranquilla"
}
```

### Tropas (`specifications` JSONB)
```json
{
  "unidad": "75º Regimiento Ranger",
  "tipo": "Fuerzas Especiales",
  "efectivos": 500,
  "comandante": "Col. John Smith",
  "equipamiento": [
    "Rifles M4A1",
    "Sistemas de comunicación",
    "Equipos de visión nocturna"
  ],
  "vehiculos": 25,
  "estado_preparacion": "Alto",
  "especializacion": "Operaciones directas",
  "ubicacion_base": "Aruba"
}
```

### Tanque (`specifications` JSONB)
```json
{
  "modelo": "M1A2 Abrams",
  "cantidad": 12,
  "peso": "62 toneladas",
  "velocidad_maxima": "67 km/h",
  "tripulacion": 4,
  "armamento_principal": "Cañón de 120mm",
  "armamento_secundario": [
    "Ametralladora M2 de 12.7mm",
    "Ametralladora M240 de 7.62mm"
  ],
  "blindaje": "Compuesto avanzado",
  "autonomia": "426 km",
  "pais_origen": "Estados Unidos"
}
```

## Funcionalidades Principales - v2.0

### 1. Dashboard Principal
**Mapa Avanzado (Mapbox GL JS)**
- Vista centrada en el Caribe (15°N, 75°W)
- Estilos profesionales personalizados (modo oscuro militar)
- Capas configurables:
  - Entidades militares (con clustering dinámico)
  - Zonas de interés/restricción
  - Tráfico marítimo comercial (opcional)
  - Bases militares (marcadores fijos)
  - Rutas aéreas/marítimas
  - Clima y condiciones meteorológicas

**Panel de Estado**
- Contador de entidades por tipo/estado (tiempo real)
- Alertas activas (con severidad visual)
- Estado de operaciones en curso
- Reloj con timezone del Caribe

### 2. Sidebar de Control Avanzado
**Sección de Gestión de Entidades**
- Selector de tipo con previsualización
- Formularios dinámicos validados con Zod
- Búsqueda avanzada con filtros múltiples:
  - Por tipo, estado, operación
  - Por rango de velocidad
  - Por distancia desde un punto
  - Por tags personalizados
- Vista de lista vs vista de tarjetas
- Exportar selección a CSV/JSON

**Sección de Operaciones**
- Crear/editar operaciones militares
- Asignar entidades a operaciones
- Definir áreas de operación (dibujar polígonos)
- Línea temporal de la operación
- Estado y prioridad visual

**Sección de Alertas**
- Panel de alertas activas
- Configurador de reglas de alerta
- Historial de alertas
- Filtros por severidad
- Botón de "silenciar" temporalmente

### 3. Interacción con Mapa Mejorada
**Drag & Drop Inteligente**
- Arrastrar entidades con previsualización de trayectoria
- Snap to grid opcional
- Validación de zonas (prevenir arrastre a zonas prohibidas)
- Cálculo automático de distancia/tiempo
- Confirmación para movimientos grandes

**Click en Entidad - Popup Rápido**
- Información resumida en popup
- Botones de acción rápida:
  - Ver detalles completos
  - Crear alerta
  - Añadir a operación
  - Centrar en mapa
  - Mostrar historial

**Herramientas de Mapa**
- Ruler (medir distancias)
- Dibujar zonas personalizadas
- Calcular áreas de influencia (círculos de radio)
- Exportar vista actual a PNG
- Compartir vista con URL

**Iconos Dinámicos Avanzados**
- SVG vectoriales (no emojis)
- Rotación según heading (dirección)
- Tamaño según zoom
- Color personalizado por entidad
- Indicador de velocidad (estela animada)
- Badge de estado (activo, en misión, etc.)

### 4. Modal de Detalles Completo
**Tabs Organizados**
1. **Información General**
   - Todos los campos de la entidad
   - Estado en tiempo real
   - Última actualización

2. **Especificaciones Técnicas**
   - Detalles según tipo (barco/avión/tropas/tanque)
   - Capacidades y armamento
   - Editor inline para admins

3. **Historial de Movimientos**
   - Tabla paginada con todos los movimientos
   - Gráfico de trayectoria
   - Filtros por fecha
   - Exportar historial

4. **Relaciones**
   - Entidades relacionadas (escorts, support, etc.)
   - Visualización de grafo de relaciones
   - Crear/eliminar relaciones

5. **Adjuntos**
   - Galería de imágenes
   - Documentos de inteligencia
   - Upload drag & drop
   - Clasificación de seguridad

6. **Actividad y Auditoría**
   - Log completo de cambios
   - Quién modificó qué y cuándo
   - Revertir cambios (para admins)

### 5. Timeline y Reproducción
**Línea Temporal de Eventos**
- Vista cronológica de todos los movimientos
- Filtrar por entidad, operación, fecha
- Marcadores de eventos importantes
- Exportar línea temporal

**Modo Playback**
- Reproducir movimientos históricos
- Controles: play, pause, speed (1x, 2x, 5x)
- Selector de rango temporal
- Ver múltiples entidades simultáneamente
- Exportar animación a video (futuro)

### 6. Sistema de Alertas Inteligentes
**Tipos de Alertas Automáticas**
- **Proximidad**: Dos entidades a menos de X km
- **Entrada a Zona**: Entidad entra en zona restringida
- **Salida de Zona**: Entidad sale de zona segura
- **Velocidad Anormal**: Velocidad fuera de rango esperado
- **Cambio de Estado**: Entidad cambia a estado crítico
- **Pérdida de Comunicación**: Sin actualizaciones hace X tiempo

**Configurador de Reglas**
- Builder visual de condiciones
- Múltiples condiciones con AND/OR
- Asignar severidad
- Notificar a usuarios específicos
- Activar/desactivar reglas

**Panel de Alertas**
- Vista de lista con filtros
- Acción: Acknowledge, Resolver, Dismiss
- Notas en cada alerta
- Exportar reporte de alertas

### 7. Analytics y Estadísticas
**Heatmap de Actividad**
- Mapa de calor de movimientos históricos
- Configurar período de análisis
- Identificar zonas de alta actividad

**Gráficos y Métricas**
- Entidades por tipo (pie chart)
- Movimientos en el tiempo (línea)
- Velocidad promedio por tipo
- Operaciones activas vs completadas
- Alertas por severidad

**Panel de Comparación**
- Comparar 2-4 entidades lado a lado
- Métricas clave
- Historial de movimientos superpuesto

### 8. Colaboración en Tiempo Real
**Supabase Realtime**
- Cursores de otros usuarios en el mapa
- Actualizaciones instantáneas de entidades
- Notificaciones push de alertas
- Indicador "Usuario X está editando entidad Y"

**Chat de Operación (futuro)**
- Chat por operación
- Menciones y notificaciones
- Historial persistente

## Requisitos de UI/UX

### Paleta de Colores (Estilo Militar Profesional)
```css
:root {
  --bg-primary: #0f172a;        /* Azul marino oscuro */
  --bg-secondary: #1e293b;      /* Azul gris */
  --bg-sidebar: #334155;        /* Gris medio */
  --accent-primary: #3b82f6;    /* Azul brillante */
  --accent-danger: #ef4444;     /* Rojo */
  --accent-success: #10b981;    /* Verde */
  --text-primary: #f1f5f9;      /* Blanco hueso */
  --text-secondary: #94a3b8;    /* Gris claro */
}
```

### Estilos del Dashboard
- Header oscuro con título "Monitoreo de Operaciones - Caribe"
- Sidebar colapsable (300px expandido, 60px colapsado)
- Mapa ocupa el resto del viewport
- Botones con efectos hover y estados activos
- Tooltips informativos

### Componentes de Formulario
- Inputs con validación en tiempo real
- Select estilizados con Tailwind
- Textarea para notas y observaciones
- Botones de acción con iconos (Guardar, Cancelar, Eliminar)

## Configuración de Supabase

### Variables de Entorno (.env)
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Solo backend/edge functions

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=tu_mapbox_token

# App Config
VITE_APP_NAME="Military Ops Tracker"
VITE_APP_VERSION="2.0.0"
VITE_MAP_CENTER_LAT=15
VITE_MAP_CENTER_LNG=-75
VITE_MAP_DEFAULT_ZOOM=6

# Features Flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=false  # Futuro

# Edge Functions URLs
VITE_EDGE_FUNCTION_URL=https://tu-proyecto.supabase.co/functions/v1
```

### Políticas de Seguridad (RLS) - Sistema de Roles

```sql
-- ============================================================================
-- POLÍTICAS RLS BASADAS EN ROLES
-- ============================================================================

-- Función auxiliar para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- TABLA: users
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (get_user_role() = 'admin');

-- Usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM public.users WHERE id = auth.uid()) -- No pueden cambiar su rol
  );

-- Solo admins pueden crear/eliminar usuarios
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (get_user_role() = 'admin');

-- ============================================================================
-- TABLA: entities
-- ============================================================================
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden ver entidades
CREATE POLICY "Authenticated users can view entities" ON entities
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    deleted_at IS NULL
  );

-- Operators y Admins pueden crear entidades
CREATE POLICY "Operators can create entities" ON entities
  FOR INSERT WITH CHECK (
    get_user_role() IN ('operator', 'admin')
  );

-- Operators y Admins pueden actualizar entidades
CREATE POLICY "Operators can update entities" ON entities
  FOR UPDATE USING (
    get_user_role() IN ('operator', 'admin') AND
    deleted_at IS NULL
  );

-- Solo Admins pueden eliminar (soft delete)
CREATE POLICY "Admins can delete entities" ON entities
  FOR UPDATE USING (
    get_user_role() = 'admin'
  )
  WITH CHECK (deleted_at IS NOT NULL);

-- ============================================================================
-- TABLA: operations
-- ============================================================================
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver operaciones
CREATE POLICY "Authenticated users can view operations" ON operations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    deleted_at IS NULL
  );

-- Analysts, Operators y Admins pueden crear operaciones
CREATE POLICY "Analysts can create operations" ON operations
  FOR INSERT WITH CHECK (
    get_user_role() IN ('analyst', 'operator', 'admin')
  );

-- Analysts, Operators y Admins pueden actualizar
CREATE POLICY "Analysts can update operations" ON operations
  FOR UPDATE USING (
    get_user_role() IN ('analyst', 'operator', 'admin') AND
    deleted_at IS NULL
  );

-- Solo Admins pueden eliminar
CREATE POLICY "Admins can delete operations" ON operations
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================================
-- TABLA: zones
-- ============================================================================
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view zones" ON zones
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Analysts can create zones" ON zones
  FOR INSERT WITH CHECK (get_user_role() IN ('analyst', 'operator', 'admin'));

CREATE POLICY "Analysts can update zones" ON zones
  FOR UPDATE USING (
    get_user_role() IN ('analyst', 'operator', 'admin') AND
    deleted_at IS NULL
  );

CREATE POLICY "Admins can delete zones" ON zones
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================================
-- TABLA: movement_history
-- ============================================================================
ALTER TABLE movement_history ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver historial
CREATE POLICY "Authenticated users can view movement history" ON movement_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sistema puede insertar (triggers automáticos) + Operators
CREATE POLICY "System can insert movement history" ON movement_history
  FOR INSERT WITH CHECK (true);  -- Controlado por triggers

-- Solo admins pueden eliminar historial
CREATE POLICY "Admins can delete movement history" ON movement_history
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================================
-- TABLA: alerts
-- ============================================================================
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver alertas
CREATE POLICY "Authenticated users can view alerts" ON alerts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sistema puede crear alertas (triggers automáticos)
CREATE POLICY "System can create alerts" ON alerts
  FOR INSERT WITH CHECK (true);

-- Todos pueden actualizar alertas (acknowledge, resolve)
CREATE POLICY "Users can update alerts" ON alerts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Solo admins pueden eliminar alertas
CREATE POLICY "Admins can delete alerts" ON alerts
  FOR DELETE USING (get_user_role() = 'admin');

-- ============================================================================
-- TABLA: alert_rules
-- ============================================================================
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alert rules" ON alert_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Analysts can manage alert rules" ON alert_rules
  FOR ALL USING (get_user_role() IN ('analyst', 'operator', 'admin'));

-- ============================================================================
-- TABLA: entity_relationships
-- ============================================================================
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view relationships" ON entity_relationships
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Operators can manage relationships" ON entity_relationships
  FOR ALL USING (get_user_role() IN ('operator', 'admin'));

-- ============================================================================
-- TABLA: attachments
-- ============================================================================
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attachments" ON attachments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Operators can manage attachments" ON attachments
  FOR ALL USING (get_user_role() IN ('operator', 'admin'));

-- ============================================================================
-- TABLA: audit_logs
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo Admins pueden ver audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (get_user_role() = 'admin');

-- Sistema puede insertar (SECURITY DEFINER en trigger)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
```

### Supabase Storage - Configuración de Buckets

```sql
-- Crear bucket para attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- Políticas de Storage
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Operators can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('operator', 'admin')
  )
);

CREATE POLICY "Admins can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);
```

### Supabase Realtime - Configuración

```sql
-- Habilitar Realtime en tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE entities;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE operations;
ALTER PUBLICATION supabase_realtime ADD TABLE movement_history;
```

## Instrucciones de Implementación - Roadmap v2.0

### Fase 0: Preparación del Entorno
```bash
# 1. Crear proyecto React 19 con Vite
npm create vite@latest military-ops-tracker -- --template react
cd military-ops-tracker

# 2. Instalar dependencias core
npm install

# 3. Instalar Supabase
npm install @supabase/supabase-js

# 4. Instalar Mapbox GL JS (en lugar de Leaflet)
npm install mapbox-gl
npm install @types/mapbox-gl -D

# 5. Instalar Tailwind CSS 4.1
npm install -D tailwindcss@next postcss autoprefixer
npx tailwindcss init -p

# 6. Instalar UI y utilidades
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install lucide-react
npm install clsx tailwind-merge

# 7. Instalar state management y data fetching
npm install zustand
npm install @tanstack/react-query

# 8. Instalar validación
npm install zod react-hook-form @hookform/resolvers

# 9. Instalar gráficos (para analytics)
npm install recharts

# 10. Instalar date utilities
npm install date-fns

# 11. Instalar exportación
npm install jspdf xlsx
```

### Fase 1: Setup de Base de Datos (usando MCP Supabase)
**Objetivo**: Base de datos completa con PostGIS, roles y triggers

1. **Crear proyecto en Supabase Dashboard**
   - Ir a supabase.com y crear nuevo proyecto
   - Guardar URL y Anon Key

2. **Aplicar migraciones usando MCP**
   ```
   - 001_extensions.sql (PostGIS, UUID)
   - 002_users_and_roles.sql
   - 003_entities_postgis.sql
   - 004_operations.sql
   - 005_zones.sql
   - 006_movement_history.sql
   - 007_alerts_system.sql
   - 008_audit_logs.sql
   - 009_rls_policies.sql
   - 010_realtime_config.sql
   ```

3. **Configurar Storage Bucket**
   - Crear bucket 'attachments'
   - Aplicar políticas de storage

4. **Poblar datos de prueba**
   - Ejecutar seed.sql
   - Crear usuarios de prueba con diferentes roles

**Resultado Esperado**: Base de datos completa, segura y lista para desarrollo.

---

### Fase 2: Infraestructura Frontend Base
**Objetivo**: Proyecto React configurado con Mapbox y Tailwind

1. **Configurar Tailwind CSS 4.1**
   ```javascript
   // tailwind.config.js - Paleta militar profesional
   // Configurar darkMode, variables CSS, utilidades custom
   ```

2. **Configurar cliente Supabase**
   ```javascript
   // src/lib/supabase.js
   // Cliente con auth, realtime y storage configurados
   ```

3. **Configurar Mapbox**
   ```javascript
   // src/lib/mapbox.js
   // Estilos custom, configuración de tokens
   ```

4. **Setup de React Query**
   ```javascript
   // src/App.jsx
   // QueryClientProvider configurado
   ```

5. **Crear layout principal**
   ```
   - Header con logo y user menu
   - Sidebar colapsable
   - Área de mapa (100% viewport)
   ```

**Resultado Esperado**: App carga con mapa del Caribe visible y sidebar funcional.

---

### Fase 3: Sistema de Autenticación
**Objetivo**: Login, registro y control de roles

1. **Componentes de Auth**
   - LoginForm con email/password
   - Integración con Supabase Auth
   - RoleGuard HOC para proteger rutas

2. **Hook useAuth personalizado**
   ```javascript
   // src/hooks/useAuth.js
   // login, logout, signup, getProfile, checkRole
   ```

3. **Integración con tabla users**
   - Trigger automático para crear perfil en public.users
   - Asignar rol por defecto (viewer)

4. **UI de perfil de usuario**
   - Dropdown con nombre, rol, avatar
   - Botón de logout
   - Link a configuración (futuro)

**Resultado Esperado**: Sistema de login funcional con roles aplicados.

---

### Fase 4: Mapa Interactivo Base (Mapbox)
**Objetivo**: Mapa del Caribe con marcadores de entidades

1. **Componente MapContainer**
   - Inicializar Mapbox con estilo oscuro militar
   - Centrado en Caribe (15°N, 75°W)
   - Controles de navegación

2. **Marcadores de Entidades**
   - Leer entities desde Supabase
   - Renderizar como marcadores SVG
   - Rotación según heading
   - Color según tipo

3. **Popup al hacer click**
   - Información resumida de entidad
   - Botones de acción rápida

4. **Hook useEntities**
   ```javascript
   // src/hooks/useEntities.js
   // CRUD completo con React Query
   ```

**Resultado Esperado**: Mapa muestra entidades de BD como marcadores interactivos.

---

### Fase 5: Drag & Drop de Entidades
**Objetivo**: Arrastrar entidades para cambiar posición

1. **Configurar @dnd-kit**
   - DndContext en MapContainer
   - Draggable en cada marcador

2. **Actualizar posición en BD**
   - Al soltar, calcular nuevas coordenadas
   - Actualizar campo `location` (PostGIS POINT)
   - Crear entrada en movement_history

3. **Validaciones**
   - Confirmar movimientos > 100km
   - Prevenir arrastre a zonas prohibidas
   - Solo operators/admins pueden mover

4. **Feedback visual**
   - Línea punteada de trayectoria al arrastrar
   - Calcular y mostrar distancia

**Resultado Esperado**: Drag & drop funcional con validaciones y persistencia.

---

### Fase 6: Sidebar de Gestión de Entidades
**Objetivo**: CRUD completo de entidades desde sidebar

1. **Lista de Entidades**
   - Tarjetas con info resumida
   - Scroll virtual (react-window) para performance
   - Click para centrar en mapa

2. **Formulario de Crear Entidad**
   - Selector de tipo (barco/avión/tropas/tanque)
   - Formulario dinámico con react-hook-form + Zod
   - Validación en tiempo real

3. **Filtros Avanzados**
   - Por tipo, estado, operación
   - Búsqueda por nombre/código
   - Slider de velocidad

4. **Acciones en Batch**
   - Selección múltiple
   - Asignar a operación
   - Exportar selección

**Resultado Esperado**: CRUD completo de entidades con UX profesional.

---

### Fase 7: Modal de Detalles con Tabs
**Objetivo**: Ver/editar toda la información de una entidad

1. **Modal con 6 tabs**
   - Info General (editable inline)
   - Especificaciones técnicas
   - Historial de movimientos (tabla paginada)
   - Relaciones (diagrama)
   - Adjuntos (galería)
   - Auditoría (solo admins)

2. **Editor de especificaciones**
   - JSON editor con syntax highlighting
   - Validación de schema según tipo

3. **Timeline de movimientos**
   - Gráfico de trayectoria con Recharts
   - Filtros por fecha

**Resultado Esperado**: Modal completo con toda la info de la entidad.

---

### Fase 8: Sistema de Zonas
**Objetivo**: Crear y visualizar zonas en el mapa

1. **Drawing Tools**
   - Mapbox Draw para dibujar polígonos/círculos
   - Guardar en tabla zones

2. **Visualización de Zonas**
   - Capas de Mapbox con polígonos coloreados
   - Opacidad y color configurables
   - Toggle de visibilidad

3. **CRUD de Zonas**
   - Lista en sidebar
   - Editar geometría
   - Tipos: restricción, interés, peligro, segura

**Resultado Esperado**: Sistema completo de zonas dibujables en mapa.

---

### Fase 9: Sistema de Alertas Básico
**Objetivo**: Alertas automáticas configurables

1. **Edge Function: detect-proximity**
   ```typescript
   // Ejecutar cada 5 minutos (Supabase Cron)
   // Detectar entidades a < X km
   // Crear alerta automática
   ```

2. **Edge Function: detect-zone-entry**
   ```typescript
   // Trigger en movement_history
   // Detectar si nueva posición está en zona
   ```

3. **Panel de Alertas**
   - Lista de alertas activas
   - Badge con severidad (info/warning/critical)
   - Botones: Acknowledge, Resolve, Dismiss

4. **Notificaciones UI**
   - Toast cuando aparece nueva alerta
   - Sonido opcional
   - Badge en header

**Resultado Esperado**: Alertas automáticas funcionando.

---

### Fase 10: Realtime con Supabase
**Objetivo**: Actualizaciones en tiempo real

1. **Hook useRealtimeEntities**
   ```javascript
   // Suscripción a cambios en tabla entities
   // Actualizar React Query cache automáticamente
   ```

2. **Indicadores de otros usuarios**
   - Cursores de otros usuarios en mapa
   - "Usuario X está editando entidad Y"

3. **Sincronización de Alertas**
   - Nuevas alertas aparecen instantáneamente

**Resultado Esperado**: Multi-usuario en tiempo real funcionando.

---

### Fase 11: Operaciones Militares
**Objetivo**: Agrupar entidades en misiones

1. **CRUD de Operaciones**
   - Formulario con nombre, objetivo, fechas
   - Dibujar área de operación (polígono)
   - Asignar prioridad

2. **Asignar Entidades**
   - Drag & drop de entidades a operación
   - Vista de operación con todas sus entidades

3. **Timeline de Operación**
   - Línea temporal con eventos
   - Estado: planificada → en curso → completada

**Resultado Esperado**: Sistema completo de operaciones.

---

### Fase 12: Analytics y Estadísticas
**Objetivo**: Dashboards con métricas

1. **Heatmap de Actividad**
   - Usar datos de movement_history
   - Heatmap layer en Mapbox
   - Selector de período

2. **Gráficos con Recharts**
   - Entidades por tipo (pie)
   - Movimientos en el tiempo (área)
   - Alertas por día (barras)

3. **Vista materializada de stats**
   - Consumir entity_stats
   - Refrescar cada 5 minutos

**Resultado Esperado**: Dashboard de analytics visual.

---

### Fase 13: Timeline y Playback
**Objetivo**: Reproducir movimientos históricos

1. **Componente Timeline**
   - Slider temporal con rangos
   - Lista de eventos

2. **Modo Playback**
   - Botones: play, pause, step forward/back
   - Velocidad configurable (1x, 2x, 5x)
   - Renderizar entidades en posición histórica

3. **Exportar Animación**
   - Capturar frames con html2canvas
   - Generar GIF/video (futuro)

**Resultado Esperado**: Playback histórico funcional.

---

### Fase 14: Exportación y Reporting
**Objetivo**: Exportar datos en múltiples formatos

1. **Exportar a Excel**
   ```javascript
   // Usar xlsx para generar .xlsx
   // Incluir todas las entidades con specs
   ```

2. **Exportar a PDF**
   ```javascript
   // Usar jsPDF
   // Incluir mapa estático (snapshot)
   // Tabla de entidades
   ```

3. **Exportar a KML**
   ```javascript
   // Para importar en Google Earth
   // Incluir entidades y zonas
   ```

**Resultado Esperado**: Exportación en 3 formatos.

---

### Fase 15: Optimización y Performance
**Objetivo**: App rápida con 100+ entidades

1. **Clustering de Marcadores**
   - Usar Mapbox supercluster
   - Agrupar entidades cercanas en alto zoom

2. **Virtualización de Listas**
   - react-window en sidebar

3. **Lazy Loading de Componentes**
   - React.lazy() en modales pesados
   - Suspense con skeletons

4. **Optimización de Queries**
   - Índices en BD verificados
   - Usar vistas materializadas

5. **React Compiler**
   - Aprovechar optimizaciones automáticas de React 19

**Resultado Esperado**: App renderiza 100+ entidades sin lag.

---

### Fase 16: Testing y Documentación
**Objetivo**: Código testeado y documentado

1. **Unit Tests**
   - Vitest para funciones críticas
   - Testing Library para componentes

2. **E2E Tests**
   - Playwright para flujos críticos
   - Login → Crear entidad → Mover → Verificar

3. **Documentación**
   - README completo
   - Diagramas de arquitectura
   - Guía de deployment

**Resultado Esperado**: Cobertura de tests > 70%.

---

### Fase 17: Deployment
**Objetivo**: App en producción

1. **Build optimizado**
   ```bash
   npm run build
   # Verificar bundle size
   ```

2. **Deploy en Vercel/Netlify**
   - Variables de entorno configuradas
   - Preview deployments en PRs

3. **Configurar dominio**
   - SSL automático
   - CDN para assets

4. **Monitoring**
   - Sentry para error tracking
   - Analytics de uso

**Resultado Esperado**: App en producción accesible.

## Características Avanzadas (Roadmap Futuro)

### Fase 18: IA y Predicciones (Futuro)
- [ ] **Predicción de Trayectorias**: ML para predecir movimientos futuros
- [ ] **Detección de Patrones Anómalos**: Identificar comportamientos inusuales
- [ ] **Sugerencias de Operaciones**: IA sugiere reagrupamientos tácticos
- [ ] **Análisis de Riesgo Automático**: Evaluar situaciones peligrosas
- [ ] **Chatbot de Inteligencia**: Hacer preguntas sobre el estado del mapa

### Fase 19: Integración con Sistemas Externos (Futuro)
- [ ] **AIS (Automatic Identification System)**: Datos reales de barcos
- [ ] **ADS-B**: Datos reales de aviones en vuelo
- [ ] **API Meteorológica**: Integrar condiciones climáticas
- [ ] **Satelitales**: Imágenes satelitales en tiempo real
- [ ] **Feeds de Inteligencia**: Fuentes externas de datos militares

### Fase 20: Modo Offline y PWA (Futuro)
- [ ] **Progressive Web App**: Instalar como app nativa
- [ ] **Offline Mode**: Service Workers para funcionar sin internet
- [ ] **Sincronización**: Sync cuando se recupera conexión
- [ ] **Mapas Offline**: Cachear tiles de Mapbox

### Fase 21: Comunicaciones Internas (Futuro)
- [ ] **Chat por Operación**: Comunicación en tiempo real
- [ ] **Videollamadas**: Integrar WebRTC para conferencias
- [ ] **Compartir Pantalla**: Mostrar mapa a otros usuarios
- [ ] **Notificaciones Push**: Alertas fuera de la app
- [ ] **Email Notifications**: Alertas críticas por email

### Fase 22: Modo Presentación y Comando (Futuro)
- [ ] **Modo Pantalla Grande**: Para salas de comando
- [ ] **Multi-Monitor**: Mapas en múltiples pantallas
- [ ] **Modo Solo Lectura**: Para presentaciones
- [ ] **Snapshot Automáticos**: Capturar estado cada X minutos
- [ ] **Replay Automático**: Loop de últimas 24 horas

### Fase 23: Gamificación y Simulación (Futuro)
- [ ] **Modo Simulación**: Crear escenarios hipotéticos
- [ ] **War Games**: Simular enfrentamientos
- [ ] **Análisis de Escenarios**: "Qué pasaría si..."
- [ ] **Sandbox Mode**: Entorno de pruebas sin consecuencias

## Notas Importantes y Mejores Prácticas

### Performance y Escalabilidad
- **Responsive**: Optimizado para pantallas 1920x1080+, pero funcional desde 1366x768
- **Performance Target**: 
  - Cargar mapa inicial < 2 segundos
  - Renderizar 500+ entidades sin lag (con clustering)
  - Drag & drop < 16ms latencia (60fps)
- **Tiempo Real**: Supabase Realtime habilitado desde Fase 10
- **Clustering**: Obligatorio para > 50 entidades en vista
- **Virtual Scrolling**: En listas de > 20 items

### Seguridad
- **Autenticación**: Obligatoria desde Fase 3
- **RLS (Row Level Security)**: Aplicado a todas las tablas
- **Roles Estrictos**: 
  - Viewer: Solo lectura
  - Analyst: Lectura + alertas + operaciones
  - Operator: Todo menos eliminar
  - Admin: Control total + auditoría
- **Audit Logs**: Registrar TODAS las acciones críticas
- **HTTPS Only**: En producción
- **Secrets**: NUNCA commitear .env

### Backup y Disaster Recovery
- **Backups Automáticos**: Supabase hace backup diario automático
- **Exportación Manual**: Botón para exportar todo a JSON
- **Snapshots de Estado**: Guardar estado del mapa en momentos clave
- **Versionado de Operaciones**: No eliminar, solo marcar como completadas

### Optimización de Costos
- **Supabase Free Tier**: Suficiente para desarrollo y demo
  - 500MB DB
  - 1GB Storage
  - 2GB Bandwidth
- **Mapbox**: 50k map loads gratis/mes
- **Optimizar Queries**:
  - Usar índices adecuados
  - Límites y paginación en todas las queries
  - Caché con React Query (staleTime: 5 minutos para entities)
- **Edge Functions**: Solo las necesarias (facturan por invocaciones)

### Experiencia de Usuario
- **Loading States**: Skeletons en lugar de spinners
- **Error Boundaries**: Capturar errores sin romper toda la app
- **Feedback Visual**: 
  - Confirmaciones para acciones destructivas
  - Toast notifications para éxitos
  - Inline errors en formularios
- **Shortcuts de Teclado**:
  - `Cmd/Ctrl + K`: Command palette
  - `Esc`: Cerrar modales
  - `Space`: Toggle sidebar
  - `F`: Centrar en entidad seleccionada
- **Accessibility**: 
  - ARIA labels
  - Keyboard navigation
  - Contraste WCAG AA

### DevOps y Monitoring
- **Git Workflow**:
  - `main` → producción
  - `develop` → desarrollo
  - Feature branches → `feat/nombre`
- **CI/CD**: 
  - Tests automáticos en cada PR
  - Deploy preview en Vercel
  - Deploy a prod solo desde `main`
- **Monitoring**:
  - Sentry para errores
  - PostHog/Mixpanel para analytics
  - Uptime monitoring (Ping/UptimeRobot)
- **Performance Monitoring**:
  - Web Vitals
  - Lighthouse CI en cada build
  - Bundle size tracking

### Documentación
- **README.md**: Instrucciones de setup
- **ARCHITECTURE.md**: Este documento
- **API.md**: Endpoints de Edge Functions
- **DEPLOYMENT.md**: Guía de deployment
- **CONTRIBUTING.md**: Guía para contributors
- **Storybook**: Componentes UI documentados (opcional)

### Testing Strategy
- **Unit Tests**: Funciones críticas (utils, hooks)
- **Integration Tests**: Flujos de usuario completos
- **E2E Tests**: Casos de uso críticos
- **Visual Regression**: Screenshots automáticos (Percy/Chromatic)
- **Coverage Target**: > 70% para código crítico

## Funciones Auxiliares de PostgreSQL (Utilidades)

### Cálculos Geoespaciales con PostGIS
```sql
-- Función para calcular distancia entre dos entidades (en kilómetros)
CREATE OR REPLACE FUNCTION distance_between_entities(
  entity_a_id UUID,
  entity_b_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  distance_km DECIMAL;
BEGIN
  SELECT ST_Distance(
    (SELECT location FROM entities WHERE id = entity_a_id),
    (SELECT location FROM entities WHERE id = entity_b_id)
  ) / 1000 INTO distance_km;
  
  RETURN distance_km;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar entidades dentro de un radio (km)
CREATE OR REPLACE FUNCTION entities_within_radius(
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_km DECIMAL
) RETURNS TABLE (
  entity_id UUID,
  entity_name VARCHAR,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    name,
    ST_Distance(
      location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM entities
  WHERE deleted_at IS NULL
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si entidad está en zona
CREATE OR REPLACE FUNCTION entity_in_zone(
  entity_id UUID,
  zone_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM entities e, zones z
    WHERE e.id = entity_id
      AND z.id = zone_id
      AND ST_Within(e.location::geometry, z.geometry::geometry)
  );
END;
$$ LANGUAGE plpgsql;
```

## Comandos de Desarrollo

```bash
# Desarrollo
npm run dev                    # Iniciar servidor desarrollo (localhost:5173)

# Build
npm run build                  # Build de producción
npm run build:analyze          # Analizar tamaño del bundle

# Preview
npm run preview                # Preview del build de producción

# Testing
npm run test                   # Ejecutar unit tests
npm run test:watch             # Tests en modo watch
npm run test:coverage          # Generar reporte de cobertura
npm run test:e2e               # Tests E2E con Playwright

# Linting y Formatting
npm run lint                   # ESLint
npm run lint:fix               # Fix automático
npm run format                 # Prettier

# Base de Datos (local con Supabase CLI)
npx supabase init              # Inicializar Supabase local
npx supabase start             # Levantar Supabase local
npx supabase db reset          # Reset DB (ejecuta todas las migrations)
npx supabase db diff           # Generar nueva migration desde cambios
npx supabase functions serve   # Servir Edge Functions localmente

# Utilidades
npm run type-check             # TypeScript type checking
npm run analyze                # Analizar bundle con visualizaciones
```

## Edge Functions Clave

### 1. detect-proximity
**Trigger**: Cron cada 5 minutos  
**Propósito**: Detectar entidades cercanas y crear alertas

```typescript
// supabase/functions/detect-proximity/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Lógica de detección de proximidad
  // Query: SELECT * FROM entities WHERE ST_DWithin(...)
  // Crear alertas automáticamente
})
```

### 2. detect-zone-entry
**Trigger**: Database trigger en `movement_history`  
**Propósito**: Detectar cuando entidad entra/sale de zona

```typescript
// Edge Function activada por trigger
// Verifica si nueva ubicación está en zona restringida
```

### 3. generate-report
**Trigger**: Manual (botón en UI)  
**Propósito**: Generar PDF con snapshot del mapa y datos

```typescript
// Usar jsPDF o Puppeteer
// Incluir mapa estático, tablas, gráficos
```

## Estructura de Archivo de Configuración

### tailwind.config.js
```javascript
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        military: {
          bg: {
            primary: '#0f172a',
            secondary: '#1e293b',
            sidebar: '#334155',
          },
          accent: {
            primary: '#3b82f6',
            danger: '#ef4444',
            success: '#10b981',
            warning: '#f59e0b',
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          },
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react({
      // Habilitar React Compiler
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    visualizer(), // Bundle analyzer
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl'],
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

## Resumen Ejecutivo

### MVP (Fases 1-6) - ~2-3 semanas
**Objetivo**: Mapa funcional con CRUD de entidades y drag & drop
- ✅ Base de datos completa con PostGIS
- ✅ Autenticación con roles
- ✅ Mapa interactivo (Mapbox)
- ✅ CRUD de entidades
- ✅ Drag & drop con persistencia
- ✅ Sidebar de gestión

**Resultado**: Demo presentable para stakeholders

---

### MVP+ (Fases 7-10) - ~2-3 semanas adicionales
**Objetivo**: Features avanzadas y tiempo real
- ✅ Modal de detalles completo
- ✅ Sistema de zonas
- ✅ Alertas automáticas
- ✅ Realtime multi-usuario

**Resultado**: Producto funcional para uso interno

---

### Producto Completo (Fases 11-17) - ~4-6 semanas adicionales
**Objetivo**: Producción con analytics, testing y deployment
- ✅ Operaciones militares
- ✅ Analytics y estadísticas
- ✅ Timeline y playback
- ✅ Exportación multi-formato
- ✅ Optimización de performance
- ✅ Testing completo
- ✅ Deployment en producción

**Resultado**: Aplicación enterprise-ready

---

## Ventajas Competitivas de Esta Arquitectura

1. **PostGIS**: Cálculos geoespaciales en BD (no en frontend)
2. **Mapbox**: Mejor performance que Leaflet para muchas entidades
3. **Supabase Realtime**: Multi-usuario sin configuración de WebSockets
4. **React 19 Compiler**: Optimización automática sin memoización manual
5. **Roles Granulares**: Seguridad a nivel de base de datos
6. **Audit Completo**: Trazabilidad de TODAS las acciones
7. **Edge Functions**: Lógica serverless escalable
8. **Sistema de Alertas**: Proactivo, no reactivo
9. **Historial Completo**: Playback de cualquier operación
10. **Exportación Universal**: PDF, Excel, KML para integración

---

**Versión**: 2.0.0  
**Última Actualización**: Octubre 2025  
**Stack**: React 19 + Vite + Tailwind 4.1 + Mapbox GL JS + Supabase (PostgreSQL + PostGIS + Realtime + Edge Functions)  
**Prioridad**: MVP (Fases 1-6) → MVP+ (Fases 7-10) → Producción (Fases 11-17) → Futuro (Fases 18+)