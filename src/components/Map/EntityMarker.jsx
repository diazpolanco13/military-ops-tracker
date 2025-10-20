import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Ship, Anchor, Plane, Users } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { useSelection } from '../../stores/SelectionContext';
import { useLock } from '../../stores/LockContext';

/**
 * 🎯 Componente de marcador de entidad militar
 * Renderiza iconos personalizados en el mapa
 * 
 * ESTRATEGIA:
 * - Usa image_thumbnail_url como icono si existe
 * - Si no, usa icono por defecto según tipo
 * - Click abre sidebar con detalles
 * - Sin popup redundante (info completa en sidebar)
 */

// Función para obtener el icono según el tipo
function getEntityIcon(type) {
  switch (type) {
    case 'destructor':
      return Ship;
    case 'fragata':
      return Anchor;
    case 'avion':
      return Plane;
    case 'tropas':
      return Users;
    default:
      return Ship;
  }
}

// Función para obtener el color según el tipo
function getEntityColor(type) {
  switch (type) {
    case 'destructor':
      return '#ef4444'; // Rojo
    case 'fragata':
      return '#3b82f6'; // Azul
    case 'avion':
      return '#6b7280'; // Gris
    case 'tropas':
      return '#22c55e'; // Verde
    default:
      return '#10b981'; // Verde
  }
}

// Función para obtener el tamaño según el tipo y configuración
function getEntitySize(type) {
  // Obtener tamaño base de la configuración (default: 48)
  const baseSize = parseInt(localStorage.getItem('iconSize') || '48');
  
  // Ajustar proporcionalmente según el tipo
  switch (type) {
    case 'destructor':
      return baseSize * 1.33; // ~64px con base 48
    case 'fragata':
      return baseSize * 1.17; // ~56px con base 48
    case 'avion':
      return baseSize; // 48px con base 48
    case 'tropas':
      return baseSize * 1.17; // Mismo que fragatas
    default:
      return baseSize;
  }
}

// Función para obtener el texto de la etiqueta
function getEntityLabel(entity) {
  // Para tropas, mostrar nombre Y cantidad de efectivos en 2 líneas
  if (entity.type === 'tropas') {
    return entity.name; // Solo el nombre, el contador irá en el icono
  }
  return entity.name;
}

/**
 * Componente de marcador individual
 */
export default function EntityMarker({ entity, template, map, onPositionChange, onEntityClick }) {
  const markerRef = useRef(null);
  const elementRef = useRef(null); // Referencia al elemento DOM
  const isDraggingRef = useRef(false);
  const [iconSize, setIconSize] = useState(() => parseInt(localStorage.getItem('iconSize') || '48'));
  const [useImages, setUseImages] = useState(() => localStorage.getItem('useImages') === 'true');
  const { isCtrlPressed, isSelected, selectEntity, addToSelection } = useSelection();
  const { isLocked } = useLock();
  
  // Template ahora viene como prop desde MapContainer (cacheado)

  // Escuchar cambios de configuración
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail.iconSize !== undefined) {
        setIconSize(e.detail.iconSize);
      }
      if (e.detail.useImages !== undefined) {
        setUseImages(e.detail.useImages);
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  // Verificar si esta entidad está seleccionada
  const selected = isSelected(entity.id);

  // 🎯 CREAR EL MARCADOR (solo una vez)
  useEffect(() => {
    if (!map || !entity) return;

    // Crear elemento del marcador (contenedor principal)
    const el = document.createElement('div');
    el.className = 'entity-marker-container';
    el.style.cursor = 'grab';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.gap = '4px';

    // Renderizar icono o imagen del barco con etiqueta
    const color = getEntityColor(entity.type);
    const size = getEntitySize(entity.type);

    // Determinar si usar imagen o icono según configuración
    // Buscar imagen en: entity, o heredar de template (icon_url o image_url)
    const imageUrl = entity.image_thumbnail_url || template?.icon_url || template?.image_url;
    const shouldUseImage = useImages && imageUrl;

    // Si configuración permite y tiene imagen, usar imagen
    if (shouldUseImage) {
      const root = createRoot(el);
      root.render(
        <div className="flex flex-col items-center gap-1">
          {/* Icono/Imagen */}
          <div
            className="entity-marker-icon flex items-center justify-center bg-military-bg-secondary/90 backdrop-blur-sm rounded-full border-2 shadow-lg transition-all hover:scale-110 overflow-hidden"
            style={{ 
              borderColor: color,
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            <img 
              src={imageUrl}
              alt={entity.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Etiqueta con nombre */}
          <div 
            className="px-2 py-0.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-semibold rounded shadow-lg border whitespace-nowrap"
            style={{ 
              borderColor: color,
              borderWidth: '1px',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {getEntityLabel(entity)}
          </div>
        </div>
      );
    } else {
      // Icono por defecto si no hay imagen
      const Icon = getEntityIcon(entity.type);
      const root = createRoot(el);
      root.render(
        <div className="flex flex-col items-center gap-1">
          {/* Icono con badge de efectivos para tropas */}
          <div style={{ position: 'relative' }}>
            <div
              className="entity-marker-icon flex items-center justify-center bg-military-bg-secondary/90 backdrop-blur-sm rounded-full border-2 shadow-lg transition-all hover:scale-110"
              style={{ 
                borderColor: color,
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              <Icon size={size * 0.6} color={color} strokeWidth={2.5} />
            </div>
            
            {/* Badge con número de efectivos (solo para tropas) - posicionado a la derecha */}
            {entity.type === 'tropas' && entity.crew_count && (
              <div
                className="absolute top-0 -right-2 translate-x-full bg-green-600 text-white rounded-full px-2 py-1 text-xs font-bold border-2 border-slate-900 shadow-lg whitespace-nowrap"
              >
                {entity.crew_count >= 1000 
                  ? `${(entity.crew_count / 1000).toFixed(1)}k`
                  : entity.crew_count}
              </div>
            )}
          </div>
          
          {/* Etiqueta con nombre */}
          <div 
            className="px-2 py-0.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-semibold rounded shadow-lg border whitespace-nowrap"
            style={{ 
              borderColor: color,
              borderWidth: '1px',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {getEntityLabel(entity)}
          </div>
        </div>
      );
    }

    // 🎯 Event listener para click en el marcador (selección o sidebar)
    el.addEventListener('click', (e) => {
      if (isDraggingRef.current) return; // Ignorar si es drag
      
      // Detectar Ctrl/Cmd directamente del evento del mouse
      const ctrlPressed = e.ctrlKey || e.metaKey;
      
      if (ctrlPressed) {
        // Ctrl+Click: Agregar/quitar de selección múltiple
        addToSelection(entity.id);
        e.stopPropagation();
      } else {
        // Click normal: Seleccionar solo esta + abrir sidebar
        selectEntity(entity.id);
        if (onEntityClick) {
          onEntityClick();
        }
      }
    });

    // Crear marcador de Mapbox SIN POPUP (redundante)
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      draggable: !isLocked, // Respetar estado de bloqueo
    })
      .setLngLat([entity.longitude, entity.latitude])
      .addTo(map);

    // 🎯 EVENT LISTENERS PARA DRAG & DROP

    // Cuando empieza a arrastrar
    marker.on('dragstart', () => {
      isDraggingRef.current = true;
      el.style.cursor = 'grabbing';
    });

    // Cuando termina de arrastrar
    marker.on('dragend', async () => {
      const newLngLat = marker.getLngLat();

      // 🚀 ACTUALIZAR POSICIÓN EN SUPABASE
      if (onPositionChange) {
        try {
          await onPositionChange(entity.id, {
            latitude: newLngLat.lat,
            longitude: newLngLat.lng,
          });
        } catch (error) {
          console.error(`❌ Error al guardar posición:`, error);
          // Revertir posición si falla
          marker.setLngLat([entity.longitude, entity.latitude]);
        }
      }

      // Restaurar cursor y estado DESPUÉS de guardar
      setTimeout(() => {
        el.style.cursor = 'grab';
        isDraggingRef.current = false;
      }, 100); // Pequeño delay para evitar click accidental
    });

    // Guardar referencias
    markerRef.current = marker;
    elementRef.current = el;

    // CLEANUP: Remover marcador cuando el componente se desmonta
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, iconSize, useImages, template]); // Recrear cuando cambia tamaño, toggle o template

  // 🔄 ACTUALIZAR POSICIÓN (cuando cambia desde Realtime)
  useEffect(() => {
    if (!markerRef.current || !entity) return;
    
    // NO actualizar si estamos arrastrando
    if (isDraggingRef.current) {
      return;
    }

    // ⚠️ VALIDAR que las coordenadas sean válidas (no null, no undefined, no NaN)
    if (!entity.latitude || !entity.longitude || 
        isNaN(entity.latitude) || isNaN(entity.longitude)) {
      console.warn(`⚠️ Coordenadas inválidas para ${entity.name}, ignorando actualización`);
      return;
    }

    const marker = markerRef.current;
    const currentLngLat = marker.getLngLat();

    // Solo actualizar si la posición cambió significativamente
    const hasChanged = 
      Math.abs(currentLngLat.lat - entity.latitude) > 0.0001 ||
      Math.abs(currentLngLat.lng - entity.longitude) > 0.0001;

    if (hasChanged) {
      marker.setLngLat([entity.longitude, entity.latitude]);
    }
  }, [entity.latitude, entity.longitude, entity.name]);

  // 🔒 ACTUALIZAR DRAGGABLE SEGÚN ESTADO DE BLOQUEO
  useEffect(() => {
    if (!markerRef.current) return;
    
    const marker = markerRef.current;
    const el = elementRef.current;
    
    // Actualizar draggable
    marker.setDraggable(!isLocked);
    
    // Actualizar cursor
    if (el) {
      el.style.cursor = isLocked ? 'not-allowed' : 'grab';
    }
  }, [isLocked]);

  // 🎨 ACTUALIZAR ESTILOS SEGÚN SELECCIÓN
  useEffect(() => {
    if (!elementRef.current) return;

    const el = elementRef.current;
    const iconElement = el.querySelector('.entity-marker-icon');
    
    if (selected) {
      // Estilos de selección
      if (iconElement) {
        iconElement.style.borderColor = '#fbbf24'; // Amarillo
        iconElement.style.borderWidth = '4px';
        iconElement.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)';
        iconElement.style.transform = 'scale(1.15)';
      }
    } else {
      // Estilos normales
      if (iconElement) {
        const color = getEntityColor(entity.type);
        iconElement.style.borderColor = color;
        iconElement.style.borderWidth = '2px';
        iconElement.style.boxShadow = '';
        iconElement.style.transform = 'scale(1)';
      }
    }
  }, [selected, entity.type]);

  return null; // Este componente no renderiza nada en React, solo en Mapbox
}
