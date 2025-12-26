import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { getCategoryColor } from '../../services/flightRadarService';

// Determinar si es helicóptero basado en el tipo
const isHelicopter = (type) => {
  const heliTypes = ['H60', 'H47', 'H64', 'H53', 'UH60', 'CH47', 'AH64', 'MH60', 'HH60', 'S76', 'S92', 'EC', 'AS'];
  return heliTypes.some(h => (type || '').toUpperCase().includes(h));
};

/**
 * 🎨 ICONOS SVG POR CATEGORÍA MILITAR
 * Estilo FlightRadar24 - Cada tipo tiene su silueta distintiva
 */
const getAircraftSVG = (category, color, heading) => {
  const baseStyle = `
    transform: rotate(${heading}deg);
    transform-origin: center center;
    transition: transform 0.5s ease;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
  `;

  switch (category) {
    // ✈️ CAZA / COMBAT - Silueta compacta estilo FlightRadar24 (idéntico)
    case 'combat':
      return `
        <svg width="28" height="28" viewBox="0 0 32 32" style="${baseStyle}">
          <!-- Fuselaje central -->
          <path d="M16 2 L18 8 L18 24 L16 30 L14 24 L14 8 Z" 
                fill="${color}" stroke="#000" stroke-width="0.8"/>
          <!-- Alas delta principales -->
          <path d="M16 10 L28 20 L26 22 L18 16 L14 16 L6 22 L4 20 Z" 
                fill="${color}" stroke="#000" stroke-width="0.8"/>
          <!-- Estabilizadores traseros pequeños -->
          <path d="M16 24 L20 28 L19 29 L16 27 L13 29 L12 28 Z" 
                fill="${color}" stroke="#000" stroke-width="0.6"/>
          <!-- Cabina (cristal oscuro) -->
          <ellipse cx="16" cy="7" rx="1.5" ry="3" fill="#1a1a2e" stroke="#000" stroke-width="0.4"/>
        </svg>
      `;

    // 💣 BOMBARDERO - Silueta grande tipo B-52
    case 'bomber':
      return `
        <svg width="32" height="32" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje largo -->
          <path d="M50 2 L54 20 L54 80 L50 98 L46 80 L46 20 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Alas largas (bombardero) -->
          <path d="M50 30 L95 55 L92 60 L54 45 L46 45 L8 60 L5 55 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Estabilizador vertical -->
          <path d="M50 70 L50 85 L55 95 L50 90 L45 95 L50 85 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Motores (4) -->
          <ellipse cx="30" cy="48" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
          <ellipse cx="40" cy="42" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
          <ellipse cx="60" cy="42" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
          <ellipse cx="70" cy="48" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
        </svg>
      `;

    // ⛽ TANQUERO / REABASTECIMIENTO - Silueta KC-135
    case 'tanker':
      return `
        <svg width="28" height="28" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje ancho -->
          <ellipse cx="50" cy="50" rx="8" ry="40" fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Alas -->
          <path d="M50 35 L90 55 L88 60 L52 45 L48 45 L12 60 L10 55 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Cola T -->
          <path d="M50 80 L50 95 L60 92 L50 88 L40 92 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Estabilizador horizontal -->
          <path d="M40 88 L60 88 L58 92 L42 92 Z" 
                fill="${color}" stroke="#000" stroke-width="1"/>
          <!-- Boom de reabastecimiento -->
          <line x1="50" y1="95" x2="50" y2="100" stroke="#333" stroke-width="3"/>
        </svg>
      `;

    // 👁️ VIGILANCIA / AWACS / P-8 - Silueta con radome
    case 'surveillance':
      return `
        <svg width="28" height="28" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje -->
          <ellipse cx="50" cy="50" rx="7" ry="38" fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Alas -->
          <path d="M50 38 L88 55 L85 60 L52 48 L48 48 L15 60 L12 55 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Cola -->
          <path d="M50 82 L50 95 L55 92 L50 88 L45 92 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Radome/Disco AWACS (distintivo) -->
          <ellipse cx="50" cy="45" rx="18" ry="4" fill="#1e3a5f" stroke="#000" stroke-width="2"/>
          <ellipse cx="50" cy="45" rx="14" ry="2" fill="#3b82f6" stroke="none"/>
        </svg>
      `;

    // 🚁 HELICÓPTERO
    case 'helicopter':
      return `
        <svg width="32" height="32" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Rotor principal -->
          <line x1="10" y1="25" x2="90" y2="25" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
          <circle cx="50" cy="25" r="5" fill="${color}" stroke="#000" stroke-width="1"/>
          <!-- Cabina -->
          <ellipse cx="50" cy="45" rx="18" ry="15" fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Ventana -->
          <ellipse cx="50" cy="42" rx="10" ry="7" fill="#1e3a5f" stroke="#000" stroke-width="1"/>
          <!-- Cola -->
          <rect x="47" y="58" width="6" height="30" fill="${color}" stroke="#000" stroke-width="1"/>
          <!-- Rotor cola -->
          <ellipse cx="50" cy="90" rx="10" ry="3" fill="${color}" stroke="#000" stroke-width="1"/>
          <!-- Patines -->
          <line x1="30" y1="58" x2="30" y2="68" stroke="${color}" stroke-width="3"/>
          <line x1="70" y1="58" x2="70" y2="68" stroke="${color}" stroke-width="3"/>
          <line x1="22" y1="68" x2="40" y2="68" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
          <line x1="60" y1="68" x2="78" y2="68" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;

    // 👔 VIP - Jet ejecutivo
    case 'vip':
      return `
        <svg width="26" height="26" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje elegante -->
          <path d="M50 5 L54 25 L54 75 L50 95 L46 75 L46 25 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Alas swept-back -->
          <path d="M50 40 L80 60 L75 63 L52 50 L48 50 L25 63 L20 60 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <!-- Cola T elegante -->
          <path d="M50 78 L50 92 L56 88 L50 85 L44 88 Z" 
                fill="${color}" stroke="#000" stroke-width="2"/>
          <path d="M42 85 L58 85 L56 88 L44 88 Z" 
                fill="${color}" stroke="#000" stroke-width="1"/>
          <!-- Ventanas (línea) -->
          <line x1="48" y1="30" x2="48" y2="60" stroke="#3b82f6" stroke-width="2"/>
          <line x1="52" y1="30" x2="52" y2="60" stroke="#3b82f6" stroke-width="2"/>
        </svg>
      `;

    // ✈️ TRANSPORTE / DEFAULT - Avión genérico estilo FlightRadar24
    case 'transport':
    default:
      return `
        <svg width="26" height="26" viewBox="0 0 24 24" 
             fill="${color}" stroke="#000" stroke-width="0.5" 
             stroke-linecap="round" stroke-linejoin="round"
             style="${baseStyle.replace(heading, heading - 45)}">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
      `;
  }
};

/**
 * 🛩️ COMPONENTE FLIGHTMARKER - VERSIÓN CON ICONOS POR CATEGORÍA
 * 
 * Marcadores diferenciados por tipo de aeronave militar:
 * - combat: Silueta de caza (F-16 style)
 * - bomber: Silueta de bombardero (B-52 style)
 * - tanker: Silueta de tanquero (KC-135 style)
 * - surveillance: Silueta con radome AWACS
 * - helicopter: Helicóptero
 * - vip: Jet ejecutivo
 * - transport: Avión genérico (default)
 */
export default function FlightMarker({ flight, map, onSelect, isSelected = false }) {
  const markerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!map || !flight) return;

    if (!flight.latitude || !flight.longitude) {
      return;
    }

    // Color según categoría - ROJO brillante si está seleccionado
    const color = isSelected ? '#ef4444' : (getCategoryColor(flight.category) || '#FFC107');
    const heading = flight.heading || 0;
    const category = flight.category || 'transport';
    const isHeli = isHelicopter(flight.aircraft?.type);
    
    // Detectar si la posición es estimada (transponder apagado)
    const isEstimated = flight.signal?.isTransponderActive === false;

    // Crear elemento del marcador
    const el = document.createElement('div');
    el.className = `flight-marker-simple ${isEstimated ? 'estimated' : ''}`;
    el.style.cssText = `
      width: 32px;
      height: 32px;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(${isSelected ? 1.4 : 1});
      transition: transform 0.3s ease, opacity 0.3s ease;
      z-index: ${isSelected ? 1000 : 1};
      opacity: ${isEstimated ? 0.6 : 1};
      ${isEstimated ? 'animation: pulse-estimated 2s ease-in-out infinite;' : ''}
    `;
    
    // Añadir keyframes para el pulso si no existen
    if (isEstimated && !document.getElementById('estimated-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'estimated-pulse-style';
      style.textContent = `
        @keyframes pulse-estimated {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }

    elementRef.current = el;

    // Obtener SVG según categoría (helicóptero tiene prioridad)
    const svgContent = isHeli 
      ? getAircraftSVG('helicopter', color, heading)
      : getAircraftSVG(category, color, heading);

    // Tooltip con indicador de posición estimada
    const tooltipContent = isEstimated 
      ? `<span style="color: #fca5a5;">📍</span> ${flight.callsign || 'UNKNOWN'}`
      : flight.callsign || 'UNKNOWN';
    
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
        border: 1px solid ${isEstimated ? 'rgba(239, 68, 68, 0.5)' : 'rgba(71, 85, 105, 1)'};
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      ">${tooltipContent}</div>
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
  }, [flight.id, flight.latitude, flight.longitude, flight.heading, flight.callsign, flight.category, flight.signal?.isTransponderActive, isSelected, map, onSelect]);

  return null;
}
