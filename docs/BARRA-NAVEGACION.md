# 🧭 BARRA DE NAVEGACIÓN LATERAL

## 📋 Descripción General

Implementación de la **barra de navegación lateral izquierda** estilo VesselFinder, con iconos verticales y paneles desplegables para navegación y filtrado.

---

## 🎨 Arquitectura Visual

```
┌────┬──────────┬──────────────────────┐
│    │          │                      │
│ 🧭 │  PANEL   │       MAPA           │
│    │ DESPLEG. │                      │
│ NAV│   (320px)│     Click marcador   │
│    │          │     → Sidebar Info   │
│ 64px  380px   │                      │
│    │          │                      │
│ ⭐ │ [Items]  │  [Marcadores]        │
│ 🚢 │          │                      │
│ 📍 │ [Filtros]│                      │
│ 🔍 │          │                      │
│ 🎛️ │          │                      │
│    │          │                      │
│ ⚙️ │          │                      │
└────┴──────────┴──────────────────────┘
```

---

## 🎯 Componentes Implementados

### 1. **NavigationBar** (`NavigationBar.jsx`)

Barra vertical fija con iconos de navegación:

| Icono | Función | Panel Asociado |
|-------|---------|----------------|
| ⚓ | Logo/Inicio | - |
| ⭐ | Favoritos | Lista de entidades favoritas |
| 🚢 | Tipos | **Categorías desplegables** |
| 📍 | Ubicaciones | Filtro por región |
| 🔍 | Búsqueda | Input de búsqueda |
| 🎛️ | Filtros | Filtros avanzados |
| ⚙️ | Configuración | Ajustes de visualización |

---

### 2. **Paneles Desplegables (SidePanel)**

- **Ancho:** 320px
- **Posición:** Left: 64px (al lado de barra de navegación)
- **Animación:** Slide-in desde la izquierda
- **Scrollbar:** Personalizado con estilo militar

#### 📦 Panel de Tipos de Embarcaciones

```jsx
🚢 Buques de Guerra
  ├── Destructores (1)
  ├── Fragatas (0)
  ├── Corbetas (0)
  └── Submarinos (0)

✈️ Aeronaves
  ├── Cazas (0)
  ├── Helicópteros (0)
  └── Drones (0)

🚛 Fuerzas Terrestres
  ├── Tanques (0)
  └── Vehículos (0)
```

**Característica especial:** Categorías desplegables con animación `slideDown`

---

## 🎨 Estilos CSS

### Animaciones

```css
/* Slide-in desde la izquierda */
@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Desplegar hacia abajo */
@keyframes slideDown {
  from { max-height: 0; opacity: 0; }
  to { max-height: 500px; opacity: 1; }
}
```

### Estados de Botones

| Estado | Efecto |
|--------|--------|
| Normal | `text-slate-400` |
| Hover | `hover:bg-slate-700/50` + `hover:text-white` |
| Activo | `bg-cyan-600` + `shadow-lg shadow-cyan-600/50` |
| Con submenú | Badge cyan pulsante |

---

## 🔧 Integración en MapContainer

```jsx
// Estructura de márgenes
<div className="w-screen h-screen relative">
  {/* Barra de navegación: 64px fijo */}
  <NavigationBar />
  
  {/* Panel desplegable: 320px (si está abierto) */}
  {activePanel && <SidePanel />}
  
  {/* Sidebar de detalles: 380px (si está abierto) */}
  {selectedEntity && <EntityDetailsSidebar />}
  
  {/* Mapa: se ajusta automáticamente */}
  <div style={{
    marginLeft: '64px',
    width: selectedEntity 
      ? 'calc(100vw - 64px - 380px)' 
      : 'calc(100vw - 64px)'
  }} />
</div>
```

---

## 📊 Estados Interactivos

### Panel de Navegación

```javascript
const [activePanel, setActivePanel] = useState(null);

// Toggle panel
togglePanel('vessels'); // Abre/cierra panel de tipos
```

### Panel de Tipos Desplegable

```javascript
const [expandedCategory, setExpandedCategory] = useState(null);

// Expandir categoría
setExpandedCategory('naval'); // Muestra destructores, fragatas, etc.
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Navegación Principal
- 7 secciones con iconos
- Toggle de paneles
- Estado activo visual

### ✅ Panel de Tipos (con submenús)
- 3 categorías principales
- Desplegables animados
- Contador de entidades por tipo

### ✅ Panel de Ubicaciones
- Lista de regiones
- Contador por zona

### ✅ Panel de Búsqueda
- Input de búsqueda
- Placeholder descriptivo

### ✅ Panel de Filtros
- Filtro por estado
- Slider de velocidad

### ✅ Panel de Configuración
- Toggles para ajustes
- Estados persistentes

---

## 🚀 Próximas Mejoras

### 🔄 Funcionalidad (MVP-1)
- [ ] Conectar filtros con datos reales
- [ ] Implementar búsqueda funcional
- [ ] Guardar favoritos en localStorage
- [ ] Filtrado por tipo de entidad
- [ ] Historial de ubicaciones

### 🎨 Visual
- [ ] Tooltips en iconos
- [ ] Badges de notificación
- [ ] Modo compacto (barra colapsable)
- [ ] Temas de color personalizables

### ⚡ Performance
- [ ] Lazy loading de paneles
- [ ] Memoización de componentes
- [ ] Virtualización de listas largas

---

## 📱 Responsive (Futuro)

Para dispositivos móviles:
- Barra de navegación en bottom nav
- Paneles como bottom sheets
- Gestos de swipe

---

## 🎓 Inspiración

Basado en **VesselFinder.com**:
- Navegación intuitiva con iconos
- Paneles laterales superpuestos
- Filtrado por categorías jerárquicas
- Diseño profesional marítimo

---

## 📝 Notas Técnicas

### Componentes Clave

1. **NavButton**: Botón individual con estado activo
2. **SidePanel**: Contenedor de panel desplegable
3. **VesselsPanel**: Panel de tipos con categorías desplegables
4. **SettingToggle**: Toggle switch personalizado

### Props Importantes

```jsx
<NavigationBar 
  onFilterChange={(filter) => console.log(filter)}
/>
```

### Z-Index Hierarchy

```
NavigationBar:    z-50
SidePanel:        z-40
EntityDetailsSidebar: z-30
Map:              z-10
```

---

**Última actualización:** 16 octubre 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Funcional - Listo para MVP

