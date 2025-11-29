import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { getCategoryColor } from '../../services/flightRadarService';

/**
 * 🛩️ COMPONENTE FLIGHTMARKER - VERSIÓN OPTIMIZADA
 * 
 * Marcador simple de avión usando HTML/CSS puro (sin createRoot)
 * - Solo icono SVG rotado
 * - Hover → Tooltip con nombre
 * - Click → Panel con detalles
 */
export default function FlightMarker({ flight, map, onSelect }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !flight) return;

    const color = getCategoryColor(flight.category || 'otros');
    const heading = flight.heading || 0;

    // Crear elemento del marcador con SVG puro
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
      transform: rotate(${heading}deg);
      transition: transform 0.3s ease;
    `;

    // SVG del avión (icono Plane de Lucide)
    el.innerHTML = `
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="${color}" 
        stroke="${color}" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
      >
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>
      <div class="flight-tooltip" style="
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%) rotate(-${heading}deg);
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
  }, [flight.id, flight.latitude, flight.longitude, flight.heading, flight.callsign, flight.category, map, onSelect]);

  return null;
}
