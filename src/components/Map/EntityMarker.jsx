import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Ship, Anchor, Plane } from 'lucide-react';
import { createRoot } from 'react-dom/client';

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
    default:
      return '#10b981'; // Verde
  }
}

// Función para obtener el tamaño según el tipo
function getEntitySize(type) {
  switch (type) {
    case 'destructor':
      return 64; // Aumentado de 32
    case 'fragata':
      return 56; // Aumentado de 28
    case 'avion':
      return 48; // Aumentado de 24
    default:
      return 48; // Aumentado de 24
  }
}

/**
 * Componente de marcador individual
 */
export default function EntityMarker({ entity, map, onPositionChange, onEntityClick }) {
  const markerRef = useRef(null);
  const isDraggingRef = useRef(false);

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

    // Si tiene imagen thumbnail, usar esa como icono
    if (entity.image_thumbnail_url) {
      const root = createRoot(el);
      root.render(
        <div className="flex flex-col items-center gap-1">
          {/* Icono/Imagen */}
          <div
            className="flex items-center justify-center bg-military-bg-secondary/90 backdrop-blur-sm rounded-full border-2 shadow-lg transition-all hover:scale-110 overflow-hidden"
            style={{ 
              borderColor: color,
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            <img 
              src={entity.image_thumbnail_url}
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
            {entity.name}
          </div>
        </div>
      );
    } else {
      // Icono por defecto si no hay imagen
      const Icon = getEntityIcon(entity.type);
      const root = createRoot(el);
      root.render(
        <div className="flex flex-col items-center gap-1">
          {/* Icono */}
          <div
            className="flex items-center justify-center bg-military-bg-secondary/90 backdrop-blur-sm rounded-full border-2 shadow-lg transition-all hover:scale-110"
            style={{ 
              borderColor: color,
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            <Icon size={size * 0.6} color={color} strokeWidth={2.5} />
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
            {entity.name}
          </div>
        </div>
      );
    }

    // 🎯 Event listener para click en el marcador (abrir sidebar)
    el.addEventListener('click', () => {
      if (onEntityClick && !isDraggingRef.current) {
        onEntityClick();
      }
    });

    // Crear marcador de Mapbox SIN POPUP (redundante)
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      draggable: true,
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

    // Guardar referencia
    markerRef.current = marker;

    // CLEANUP: Remover marcador cuando el componente se desmonta
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map]); // ⚠️ Solo depende de 'map'

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

  return null; // Este componente no renderiza nada en React, solo en Mapbox
}
