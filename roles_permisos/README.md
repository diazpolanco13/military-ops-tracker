# Sistema de Roles y Permisos Dinámicos

## 📋 Descripción General

Sistema de control de acceso basado en roles (RBAC) que permite gestionar permisos de forma dinámica mediante una interfaz de administración. Los permisos se almacenan en la base de datos y se aplican en tiempo real en toda la aplicación.

## 🗄️ Estructura de Base de Datos

### Tabla: `role_permissions`

```sql
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `role`: Identificador del rol ('admin', 'colaborador', 'viewer')
- `permissions`: Objeto JSONB con todos los permisos del rol (clave-valor boolean)

**Ejemplo de datos:**
```json
{
  "view_entities": true,
  "create_entities": true,
  "edit_entities": true,
  "delete_entities": false,
  "view_events": true,
  "create_events": true,
  "edit_events": true,
  "delete_events": false,
  "view_templates": true,
  "create_templates": false,
  "manage_templates": false,
  "manage_users": false,
  "access_settings": false
}
```

## 👥 Roles Disponibles

1. **admin**: Administrador con todos los permisos activados por defecto
2. **colaborador**: Puede crear y editar, pero no eliminar ni administrar
3. **viewer**: Solo lectura, no puede crear, editar ni eliminar

## 🔐 Permisos Disponibles

### Entidades
- `view_entities`: Ver entidades en el mapa
- `create_entities`: Crear nuevas entidades
- `edit_entities`: Editar entidades existentes
- `delete_entities`: Eliminar/archivar entidades

### Eventos
- `view_events`: Ver eventos en el timeline
- `create_events`: Crear nuevos eventos
- `edit_events`: Editar eventos existentes
- `delete_events`: Eliminar eventos

### Plantillas
- `view_templates`: Ver y usar plantillas
- `create_templates`: Crear nuevas plantillas
- `manage_templates`: Editar y eliminar plantillas

### Sistema
- `manage_users`: Crear, editar y eliminar usuarios
- `access_settings`: Acceder al panel de configuración

## 🎣 Hook: `useUserRole`

**Ubicación:** `src/hooks/useUserRole.js`

### Funcionalidad

1. **Carga el rol del usuario** desde `user_profiles`
2. **Carga los permisos dinámicos** desde `role_permissions`
3. **Proporciona funciones helper** para verificar permisos

### Uso

```javascript
import { useUserRole } from '../hooks/useUserRole';

function MyComponent() {
  const { 
    userRole,           // 'admin' | 'colaborador' | 'viewer'
    permissions,        // Objeto con todos los permisos
    canEdit,            // () => boolean
    canCreate,          // () => boolean
    canDelete,          // () => boolean
    canCreateTemplates, // () => boolean
    canManageTemplates, // () => boolean
    canAccessSettings,  // () => boolean
    canCreateEvents,    // () => boolean
    canEditEvents,      // () => boolean
    canDeleteEvents,    // () => boolean
    hasPermission       // (key: string) => boolean
  } = useUserRole();

  // Verificar permiso específico
  if (hasPermission('create_entities')) {
    // Mostrar botón crear
  }

  // Usar helpers
  if (canEdit()) {
    // Mostrar opciones de edición
  }
}
```

### Funciones Helper

- `hasPermission(permissionKey)`: Verifica un permiso específico
- `canEdit()`: Verifica `edit_entities`
- `canCreate()`: Verifica `create_entities`
- `canDelete()`: Verifica `delete_entities`
- `canCreateTemplates()`: Verifica `create_templates`
- `canManageTemplates()`: Verifica `manage_templates`
- `canAccessSettings()`: Verifica `access_settings`
- `canCreateEvents()`: Verifica `create_events`
- `canEditEvents()`: Verifica `edit_events`
- `canDeleteEvents()`: Verifica `delete_events`

## 🎨 Componente: `RolePermissionsEditor`

**Ubicación:** `src/components/Settings/RolePermissionsEditor.jsx`

### Funcionalidad

Editor visual para gestionar permisos de cada rol mediante toggles.

### Características

- Selector de rol (Administrador, Colaborador, Solo Lectura)
- Toggles para cada permiso agrupados por categorías
- Botón "Guardar Permisos" que actualiza la BD
- Botón "Restablecer" para volver a valores por defecto
- Mensajes de éxito/error

### Integración

Se integra en `SettingsPanel` bajo el tab "Permisos" y solo es accesible para administradores.

## 🔄 Flujo de Aplicación de Permisos

1. **Usuario inicia sesión** → `useUserRole` carga su rol desde `user_profiles`
2. **Hook carga permisos** → Consulta `role_permissions` con el rol del usuario
3. **Permisos se almacenan** → En el estado del hook
4. **Componentes verifican permisos** → Usan `hasPermission()` o helpers
5. **UI se actualiza** → Botones/opciones se muestran/ocultan según permisos

## 📝 Cómo Agregar un Nuevo Permiso

### 1. Agregar el permiso a la base de datos

```sql
-- Actualizar permisos de cada rol
UPDATE role_permissions 
SET permissions = jsonb_set(
  permissions, 
  '{nuevo_permiso}', 
  'true'::jsonb
)
WHERE role = 'admin';
```

### 2. Agregar el permiso a los valores por defecto

En `src/hooks/useUserRole.js`, función `getDefaultPermissions()`:

```javascript
admin: {
  // ... permisos existentes
  nuevo_permiso: true
}
```

### 3. Agregar al editor visual

En `src/components/Settings/RolePermissionsEditor.jsx`, agregar a `PERMISSION_GROUPS`:

```javascript
{
  title: 'Nueva Categoría',
  icon: Shield,
  permissions: [
    { 
      key: 'nuevo_permiso', 
      label: 'Nuevo Permiso', 
      description: 'Descripción del permiso' 
    }
  ]
}
```

### 4. Crear función helper (opcional)

En `src/hooks/useUserRole.js`:

```javascript
const canNuevoPermiso = () => hasPermission('nuevo_permiso');

return {
  // ... funciones existentes
  canNuevoPermiso
};
```

### 5. Usar en componentes

```javascript
const { canNuevoPermiso } = useUserRole();

{canNuevoPermiso() && (
  <button>Acción permitida</button>
)}
```

## 🔒 Seguridad (RLS)

La tabla `role_permissions` tiene RLS habilitado:

- **Política SELECT**: Solo administradores pueden ver permisos
- **Política ALL**: Solo administradores pueden modificar permisos

```sql
CREATE POLICY "Admins can view role permissions" 
ON public.role_permissions
FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions
FOR ALL USING (get_user_role() = 'admin');
```

## 🎯 Componentes que Usan Permisos

- `TopNavigationBar`: Botón Config y Plantillas
- `EntityPalette`: Crear/Administrar plantillas
- `EntityQuickCard`: Editar/Eliminar entidades
- `EventTimeline`: Crear eventos
- `EventCard`: Editar/Eliminar eventos
- `CalendarView`: Crear eventos desde calendario
- `EventDetailsModal`: Editar/Eliminar eventos
- `SettingsPanel`: Acceso al panel completo

## ⚡ Eventos Personalizados

El sistema dispara eventos para actualizar permisos en tiempo real:

```javascript
// Cuando se actualizan permisos
window.dispatchEvent(new CustomEvent('permissionsUpdated'));

// El hook escucha este evento y recarga permisos
useEffect(() => {
  window.addEventListener('permissionsUpdated', loadUserRole);
  return () => window.removeEventListener('permissionsUpdated', loadUserRole);
}, []);
```

## 📌 Notas Importantes

1. **Permisos por defecto**: Si un rol no tiene registro en `role_permissions`, se usan los valores por defecto del hook
2. **Admin siempre tiene todo**: El administrador tiene todos los permisos activados por defecto
3. **Permisos en cascada**: Algunos permisos dependen de otros (ej: no puedes editar sin ver)
4. **Actualización en tiempo real**: Los cambios se aplican inmediatamente sin recargar la página
5. **Fallback seguro**: Si hay error cargando permisos, se usan los valores por defecto del rol

## 🚀 Extensión Futura

Para agregar nuevos roles:

1. Crear registro en `role_permissions` con el nuevo rol
2. Agregar valores por defecto en `getDefaultPermissions()`
3. Agregar opción en `ROLES` del `RolePermissionsEditor`
4. Actualizar `user_profiles` para permitir el nuevo rol

