import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Users, Ship, Plane } from 'lucide-react';
import { createRoot } from 'react-dom/client';

/**
 * 🎯 Marcador de Grupo de Entidades
 * Muestra un icono con contador para grupos de formación
 * Arrastrable - mueve todas las entidades del grupo manteniendo formación
 */
export default function GroupMarker({ group, map, onGroupClick, onGroupMove }) {
  const markerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [iconSize, setIconSize] = useState(() => parseInt(localStorage.getItem('iconSize') || '48'));

  // Escuchar cambios de configuración
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail.iconSize !== undefined) {
        setIconSize(e.detail.iconSize);
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  useEffect(() => {
    if (!map || !group || !group.members || group.members.length === 0) return;

    // Calcular centro del grupo
    const centerLat = group.members.reduce((sum, m) => sum + parseFloat(m.entity.latitude), 0) / group.members.length;
    const centerLng = group.members.reduce((sum, m) => sum + parseFloat(m.entity.longitude), 0) / group.members.length;

    // Determinar tipo de icono según las entidades del grupo
    const firstEntity = group.members[0]?.entity;
    const Icon = firstEntity?.type === 'avion' ? Plane : Ship;
    const color = group.icon_color || '#3b82f6';
    
    // Tamaño dinámico del grupo (1.5x el tamaño de icono individual)
    const groupSize = iconSize * 1.5; // Si iconSize es 48, grupo es 72px
    const badgeSize = groupSize * 0.35; // Badge proporcional

    // Crear elemento del marcador
    const el = document.createElement('div');
    el.className = 'group-marker-container';
    el.style.cursor = 'grab';

    // Renderizar icono de grupo con contador
    const root = createRoot(el);
    root.render(
      <div className="flex flex-col items-center gap-1">
        {/* Icono del grupo con contador */}
          <div
            className="group-marker-icon flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm rounded-lg border-4 shadow-xl transition-all hover:scale-110"
            style={{ 
              borderColor: color,
              width: `${groupSize}px`,
              height: `${groupSize}px`,
              position: 'relative'
            }}
          >
            {/* Icono */}
            <Icon size={groupSize * 0.5} color={color} strokeWidth={2.5} />
            
            {/* Contador */}
            <div 
              className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white font-bold shadow-lg"
              style={{
                width: `${badgeSize}px`,
                height: `${badgeSize}px`,
                fontSize: `${badgeSize * 0.45}px`
              }}
            >
              {group.count}
            </div>
          </div>
        
        {/* Etiqueta con nombre del grupo */}
        <div 
          className="px-3 py-1 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-semibold rounded shadow-lg border-2"
          style={{ 
            borderColor: color,
            maxWidth: '200px',
            textAlign: 'center'
          }}
        >
          {group.name}
        </div>
      </div>
    );

    // Click listener (solo si no está arrastrando)
    el.addEventListener('click', () => {
      if (!isDraggingRef.current && onGroupClick) {
        onGroupClick(group);
      }
    });

    // Crear marcador de Mapbox ARRASTRABLE
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      draggable: true, // ✅ Grupo arrastrable
    })
      .setLngLat([centerLng, centerLat])
      .addTo(map);

    // Cuando empieza a arrastrar
    marker.on('dragstart', () => {
      isDraggingRef.current = true;
      el.style.cursor = 'grabbing';
    });

    // Cuando termina de arrastrar
    marker.on('dragend', async () => {
      const newLngLat = marker.getLngLat();
      
      // Calcular desplazamiento
      const deltaLat = newLngLat.lat - centerLat;
      const deltaLng = newLngLat.lng - centerLng;

      // Notificar al padre para mover todas las entidades del grupo
      if (onGroupMove) {
        await onGroupMove(group, deltaLat, deltaLng);
      }

      // Restaurar cursor después de un delay
      setTimeout(() => {
        el.style.cursor = 'grab';
        isDraggingRef.current = false;
      }, 100);
    });

    markerRef.current = marker;

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, group, onGroupClick, onGroupMove, iconSize]); // Recrear cuando cambia tamaño

  return null;
}

