import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { getCategoryColor } from '../../services/flightRadarService';

// Determinar si es helicóptero basado en el tipo
const isHelicopter = (type) => {
  const heliTypes = ['H60', 'H47', 'H64', 'H53', 'UH60', 'CH47', 'AH64', 'MH60', 'HH60', 'S76', 'S92', 'EC', 'AS'];
  return heliTypes.some(h => (type || '').toUpperCase().includes(h));
};

/**
 * 🛩️ COMPONENTE FLIGHTMARKER - VERSIÓN OPTIMIZADA
 * 
 * Marcador de avión/helicóptero usando HTML/CSS puro
 * - Icono según tipo (avión o helicóptero)
 * - Hover → Tooltip con nombre
 * - Click → Panel con detalles
 */
export default function FlightMarker({ flight, map, onSelect, isSelected = false }) {
  const markerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!map || !flight) return;

    if (!flight.latitude || !flight.longitude) {
      return;
    }

    // Color según categoría - ROJO si está seleccionado
    const color = isSelected ? '#ef4444' : (getCategoryColor(flight.category) || '#FFC107');
    const heading = flight.heading || 0;
    const isHeli = isHelicopter(flight.aircraft?.type);

    // Crear elemento del marcador - CONTENEDOR SIN ROTACIÓN
    const el = document.createElement('div');
    el.className = 'flight-marker-simple';
    el.style.cssText = `
      width: 32px;
      height: 32px;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(${isSelected ? 1.3 : 1});
      transition: transform 0.3s ease;
      z-index: ${isSelected ? 1000 : 1};
    `;

    elementRef.current = el;

    // SVG del avión o helicóptero según tipo
    const svgContent = isHeli ? `
      <!-- Helicóptero - Icono más grande y visible -->
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 512 512" 
        fill="${color}" 
        stroke="#000000" 
        stroke-width="8"
        style="
          transform: rotate(${heading}deg);
          transform-origin: center center;
          transition: transform 0.5s ease;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));
        "
      >
        <!-- Rotor principal -->
        <rect x="40" y="100" width="432" height="24" rx="12" fill="${color}" stroke="#000"/>
        <!-- Mástil rotor -->
        <rect x="240" y="120" width="32" height="60" fill="${color}" stroke="#000"/>
        <!-- Cabina principal -->
        <ellipse cx="256" cy="240" rx="100" ry="70" fill="${color}" stroke="#000"/>
        <!-- Ventana cabina -->
        <ellipse cx="256" cy="220" rx="50" ry="30" fill="#1e293b" stroke="#000" stroke-width="4"/>
        <!-- Cola -->
        <rect x="240" y="300" width="32" height="140" fill="${color}" stroke="#000"/>
        <!-- Rotor cola -->
        <ellipse cx="256" cy="440" rx="50" ry="16" fill="${color}" stroke="#000"/>
        <!-- Patines izquierdo -->
        <rect x="130" y="290" width="16" height="50" fill="${color}" stroke="#000"/>
        <rect x="100" y="335" width="80" height="12" rx="6" fill="${color}" stroke="#000"/>
        <!-- Patines derecho -->
        <rect x="366" y="290" width="16" height="50" fill="${color}" stroke="#000"/>
        <rect x="332" y="335" width="80" height="12" rx="6" fill="${color}" stroke="#000"/>
      </svg>
    ` : `
      <!-- Avión apuntando arriba (Lucide Plane rotado -45°) -->
      <svg 
        width="26" 
        height="26" 
        viewBox="0 0 24 24" 
        fill="${color}" 
        stroke="#000000" 
        stroke-width="0.5" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        style="
          transform: rotate(${heading - 45}deg);
          transform-origin: center center;
          transition: transform 0.5s ease;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        "
      >
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>
    `;

    el.innerHTML = svgContent + `
      <div class="flight-tooltip" style="
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(8px);
        color: white;
        font-size: 11px;
        font-family: monospace;
        border-radius: 4px;
        border: 1px solid rgba(71, 85, 105, 1);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      ">${flight.callsign || 'UNKNOWN'}</div>
    `;

    // Hover events
    el.addEventListener('mouseenter', () => {
      const tooltip = el.querySelector('.flight-tooltip');
      if (tooltip) tooltip.style.opacity = '1';
      el.style.zIndex = '1000';
    });

    el.addEventListener('mouseleave', () => {
      const tooltip = el.querySelector('.flight-tooltip');
      if (tooltip) tooltip.style.opacity = '0';
      el.style.zIndex = '1';
    });

    // Click → Abrir panel con detalles
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(flight);
      }
    });

    // Crear marcador de Mapbox
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([flight.longitude, flight.latitude])
      .addTo(map);

    markerRef.current = marker;

    // Cleanup
    return () => {
      marker.remove();
    };
  }, [flight.id, flight.latitude, flight.longitude, flight.heading, flight.callsign, flight.category, isSelected, map, onSelect]);

  return null;
}
