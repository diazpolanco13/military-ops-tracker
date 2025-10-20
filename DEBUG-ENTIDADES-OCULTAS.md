# 🐛 DEBUG: Entidades Ocultas No Se Muestran

## 📋 Resumen del Problema

El modal "Entidades Ocultas" muestra correctamente el conteo de entidades ocultas (1 entidad) pero no lista las entidades en el área principal. En su lugar muestra "No hay entidades" y "Mostrando 0 de 1 entidades".

## 🔍 Estado Actual

### ✅ Lo que funciona:
- Contador de entidades ocultas en el badge de navegación
- Modal se abre correctamente
- Estadísticas por tipo muestran "Destructor: 1"
- Botón "Mostrar Todas (1)" aparece correctamente

### ❌ Lo que NO funciona:
- Lista de entidades está vacía
- Área principal muestra "No hay entidades"
- "Mostrando 0 de 1 entidades" en lugar de "Mostrando 1 de 1 entidades"

## 🔧 Intentos de Solución Realizados

### 1. Problema de Variables de Entorno
- **Problema**: `.env.local` estaba mal nombrado como `env.local`
- **Solución**: Renombrado a `.env.local`
- **Resultado**: Contador funcionó, pero lista siguió vacía

### 2. Problema de Estado del Modal
- **Problema**: Modal se abría y cerraba inmediatamente
- **Solución**: Corregida comunicación entre `ViewPanel` y `TopNavigationBar`
- **Resultado**: Modal se mantiene abierto, pero lista sigue vacía

### 3. Problema de Refetch de Entidades
- **Problema**: Entidades no reaparecían en el mapa después de mostrar
- **Solución**: Agregado `window.refetchEntities()` en hooks
- **Resultado**: Entidades reaparecen en mapa, pero modal sigue con lista vacía

### 4. Problema de Dependencias
- **Problema**: `date-fns` faltaba causando errores de importación
- **Solución**: `npm install date-fns`
- **Resultado**: Errores de importación resueltos, lista sigue vacía

### 5. Problema de Unificación de Modales
- **Problema**: Modal se quedaba en "Cargando entidades..."
- **Solución**: Agregada función `getEntityCountsByType` faltante en `useHiddenEntities`
- **Resultado**: Modal carga, pero lista sigue vacía

### 6. Problema de Desestructuración de Datos
- **Problema**: `useHiddenEntities` devuelve `hiddenEntities` pero componente esperaba `entities`
- **Solución**: Corregida desestructuración en `EntitiesManagementModal.jsx`
- **Resultado**: **LISTA SIGUE VACÍA** ⚠️

## 📊 Logs de Debug Obtenidos

### Hook useHiddenEntities:
```javascript
DEBUG useHiddenEntities - Datos recibidos: {
  dataLength: 1,
  data: Array(1),
  isVisible: [false],
  archivedAt: [null]
}
```

### Componente EntitiesManagementModal:
```javascript
DEBUG EntitiesManagementModal: {
  type: "hidden",
  entitiesLength: undefined,  // ⚠️ PROBLEMA
  entities: undefined,        // ⚠️ PROBLEMA
  loading: false,
  error: null,
  isHidden: true,
  isArchived: false
}
```

## 🎯 Problema Identificado

**Los datos llegan correctamente al hook `useHiddenEntities` pero NO llegan al componente `EntitiesManagementModal`.**

La desestructuración fue corregida pero el problema persiste. Esto sugiere que hay un problema más profundo en la comunicación entre el hook y el componente.

## 📁 Archivos Modificados

### Hooks:
- `src/hooks/useHiddenEntities.js` - Hook para entidades ocultas
- `src/hooks/useArchivedEntities.js` - Hook para entidades archivadas
- `src/hooks/useHiddenCount.js` - Hook para conteo de ocultas
- `src/hooks/useArchivedCount.js` - Hook para conteo de archivadas

### Componentes:
- `src/components/Sidebar/EntitiesManagementModal.jsx` - Modal unificado
- `src/components/Navigation/TopNavigationBar.jsx` - Barra de navegación
- `src/components/Sidebar/ViewPanel.jsx` - Panel de vista

### Archivos Eliminados:
- `src/components/Sidebar/HiddenEntitiesPanel.jsx`
- `src/components/Sidebar/ArchivedEntitiesPanel.jsx`

## 🔍 Próximos Pasos Sugeridos

1. **Verificar la estructura de datos del hook**: Confirmar que `useHiddenEntities` devuelve exactamente lo que espera el componente
2. **Revisar la lógica de filtrado**: El filtro puede estar eliminando todas las entidades
3. **Verificar el estado de loading**: El componente puede estar renderizando antes de que los datos estén disponibles
4. **Revisar la lógica de renderizado condicional**: El componente puede estar mostrando "No hay entidades" cuando sí hay datos

## ✅ PROBLEMA RESUELTO

**Causa raíz identificada y corregida:**

El problema estaba en la desestructuración del modal `EntitiesManagementModal.jsx` en las líneas 22-43. El componente intentaba extraer una propiedad `entities` que NO existía:

```javascript
// ❌ INCORRECTO
const {
  entities: hiddenEntities,  // Intenta extraer 'entities' pero NO existe
  ...
} = hiddenData;
```

El hook `useHiddenEntities` retorna `hiddenEntities` como propiedad, no `entities`. La desestructuración con alias solo funciona si la propiedad original existe.

**Solución aplicada:**
```javascript
// ✅ CORRECTO
const {
  hiddenEntities,  // Extraer directamente la propiedad correcta
  ...
} = hiddenData;
```

**Fecha de resolución**: 20 de Octubre, 2025

## 📝 Commits Realizados

1. `4a642ff` - debug: Agregar logs para investigar filtrado de entidades
2. `c48355e` - debug: Agregar logs detallados para investigar datos
3. `36b6720` - fix: Corregir desestructuración de datos en EntitiesManagementModal

## 🎯 Objetivo

**Hacer que el modal "Entidades Ocultas" muestre correctamente la lista de entidades ocultas en lugar de "No hay entidades".**

---

*Documento creado para facilitar la continuación del debugging por otra IA.*
