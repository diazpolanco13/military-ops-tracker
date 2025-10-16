import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Ship, Anchor, Plane } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import EntityPopup from './EntityPopup';

/**
 * 🎯 Componente de marcador de entidad militar
 * Renderiza iconos personalizados en el mapa con popups interactivos
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
      return '#ef4444'; // Rojo (más grande y peligroso)
    case 'fragata':
      return '#3b82f6'; // Azul (más ágil)
    case 'avion':
      return '#6b7280'; // Gris (aire)
    default:
      return '#10b981'; // Verde
  }
}

// Función para obtener el tamaño según el tipo
function getEntitySize(type) {
  switch (type) {
    case 'destructor':
      return 32;
    case 'fragata':
      return 28;
    case 'avion':
      return 24;
    default:
      return 24;
  }
}

/**
 * Componente de marcador individual
 */
export default function EntityMarker({ entity, map, onPositionChange }) {
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!map || !entity) return;

    // Crear elemento del marcador
    const el = document.createElement('div');
    el.className = 'entity-marker';
    el.style.cursor = 'grab';
    el.style.width = `${getEntitySize(entity.type)}px`;
    el.style.height = `${getEntitySize(entity.type)}px`;

    // Renderizar icono de React en el elemento
    const Icon = getEntityIcon(entity.type);
    const color = getEntityColor(entity.type);
    const size = getEntitySize(entity.type);

    const root = createRoot(el);
    root.render(
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
    );

    // Crear elemento del popup
    const popupEl = document.createElement('div');
    const popupRoot = createRoot(popupEl);
    popupRoot.render(<EntityPopup entity={entity} />);

    // Crear popup de Mapbox
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: 'none',
      className: 'entity-popup',
    }).setDOMContent(popupEl);

    // Crear marcador de Mapbox con popup y DRAGGABLE
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      draggable: true, // 🎯 ACTIVAR DRAG & DROP
    })
      .setLngLat([entity.longitude, entity.latitude])
      .setPopup(popup)
      .addTo(map);

    // 🎯 EVENT LISTENERS PARA DRAG & DROP

    // Cuando empieza a arrastrar
    marker.on('dragstart', () => {
      isDraggingRef.current = true;
      el.style.cursor = 'grabbing';
      // Cerrar popup mientras arrastra
      if (popup.isOpen()) {
        popup.remove();
      }
      // Efecto visual de arrastre
      el.style.transform = 'scale(1.2)';
      el.style.filter = 'brightness(1.3) drop-shadow(0 0 20px currentColor)';
    });

    // Mientras está arrastrando
    marker.on('drag', () => {
      // Aquí podríamos mostrar coordenadas en tiempo real
      const lngLat = marker.getLngLat();
      console.log('📍 Arrastrando:', lngLat.lat.toFixed(4), lngLat.lng.toFixed(4));
    });

    // Cuando termina de arrastrar
    marker.on('dragend', async () => {
      const newLngLat = marker.getLngLat();
      
      // Restaurar estilo
      el.style.cursor = 'grab';
      el.style.transform = 'scale(1)';
      el.style.filter = 'none';

      // 🚀 ACTUALIZAR POSICIÓN EN SUPABASE
      if (onPositionChange) {
        console.log('🔄 Actualizando posición en Supabase...');
        await onPositionChange(entity.id, {
          latitude: newLngLat.lat,
          longitude: newLngLat.lng,
        });
      }

      isDraggingRef.current = false;
    });

    // Guardar referencias
    markerRef.current = marker;
    popupRef.current = popup;

    // Cleanup
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [entity, map, onPositionChange]);

  return null; // Este componente no renderiza nada en React, solo en Mapbox
}

