import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/maplibre';
import { supabase } from '../../lib/supabase';
import { getFlightDetails } from '../../services/flightRadarService';
import { Plane, Gauge, Navigation, MapPin, Shield, Compass } from 'lucide-react';

// Colores para el gradiente de altitud del trail
const ALTITUDE_COLORS = {
  low: '#ef4444',      // Rojo - baja altitud
  medium: '#f59e0b',   // Naranja - media
  high: '#22c55e',     // Verde - alta
};

/**
 * Convertir trail a GeoJSON con segmentos coloreados por altitud
 */
function trailToGeoJSON(trail) {
  if (!trail || trail.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  const coordinates = trail
    .filter(point => point.lat && point.lng)
    .map(point => [point.lng, point.lat, point.alt || 0]);

  if (coordinates.length < 2) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features = [];
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    const avgAlt = ((start[2] || 0) + (end[2] || 0)) / 2;
    
    let color;
    if (avgAlt < 10000) {
      color = ALTITUDE_COLORS.low;
    } else if (avgAlt < 25000) {
      color = ALTITUDE_COLORS.medium;
    } else {
      color = ALTITUDE_COLORS.high;
    }

    features.push({
      type: 'Feature',
      properties: { altitude: avgAlt, color, index: i },
      geometry: {
        type: 'LineString',
        coordinates: [[start[0], start[1]], [end[0], end[1]]]
      }
    });
  }

  return { type: 'FeatureCollection', features };
}

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

// Colores para Venezuela
const VEN_COLOR = '#ef4444'; // Rojo

// Nombre del país por prefijo ICAO24
const getCountryByICAO24 = (icao24) => {
  if (!icao24) return { name: 'Desconocido', flag: '🏳️' };
  const prefix = icao24.substring(0, 2).toUpperCase();
  // Prefijos A0-AF son de Estados Unidos
  if (prefix.match(/^A[0-9A-F]$/)) {
    return { name: 'Estados Unidos', flag: '🇺🇸', military: true };
  }
  return { name: 'Desconocido', flag: '🏳️' };
};

// Obtener dirección cardinal desde grados
const getCardinal = (degrees) => {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return cardinals[index];
};

/**
 * 🎨 ICONOS SVG POR CATEGORÍA MILITAR - VERSIÓN SCREENSHOT
 * Estilo FlightRadar24 - Cada tipo tiene su silueta distintiva
 * Tamaños más grandes para visibilidad en screenshots
 */
const getAircraftSVGForScreenshot = (category, heading) => {
  const color = '#ef4444'; // Rojo para alertas
  const size = 48; // Tamaño grande para screenshots
  const baseStyle = `
    transform: rotate(${heading}deg);
    transform-origin: center center;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8));
  `;

  switch (category) {
    // ✈️ CAZA / COMBAT - Silueta compacta estilo FlightRadar24 (idéntico)
    case 'combat':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" style="${baseStyle}">
          <!-- Fuselaje central -->
          <path d="M16 2 L18 8 L18 24 L16 30 L14 24 L14 8 Z" 
                fill="${color}" stroke="#fff" stroke-width="1.5"/>
          <!-- Alas delta principales -->
          <path d="M16 10 L28 20 L26 22 L18 16 L14 16 L6 22 L4 20 Z" 
                fill="${color}" stroke="#fff" stroke-width="1.5"/>
          <!-- Estabilizadores traseros pequeños -->
          <path d="M16 24 L20 28 L19 29 L16 27 L13 29 L12 28 Z" 
                fill="${color}" stroke="#fff" stroke-width="1"/>
          <!-- Cabina (cristal oscuro) -->
          <ellipse cx="16" cy="7" rx="1.5" ry="3" fill="#1a1a2e" stroke="#fff" stroke-width="0.8"/>
        </svg>
      `;

    // 💣 BOMBARDERO - Silueta grande tipo B-52
    case 'bomber':
      return `
        <svg width="${size + 10}" height="${size + 10}" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje largo -->
          <path d="M50 2 L54 20 L54 80 L50 98 L46 80 L46 20 Z" 
                fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Alas largas -->
          <path d="M50 30 L95 55 L92 60 L54 45 L46 45 L8 60 L5 55 Z" 
                fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Estabilizador vertical -->
          <path d="M50 70 L50 85 L55 95 L50 90 L45 95 L50 85 Z" 
                fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Motores -->
          <ellipse cx="30" cy="48" rx="4" ry="7" fill="#333" stroke="#fff" stroke-width="1"/>
          <ellipse cx="40" cy="42" rx="4" ry="7" fill="#333" stroke="#fff" stroke-width="1"/>
          <ellipse cx="60" cy="42" rx="4" ry="7" fill="#333" stroke="#fff" stroke-width="1"/>
          <ellipse cx="70" cy="48" rx="4" ry="7" fill="#333" stroke="#fff" stroke-width="1"/>
        </svg>
      `;

    // ⛽ TANQUERO - KC-135 style
    case 'tanker':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje ancho -->
          <ellipse cx="50" cy="50" rx="10" ry="42" fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Alas -->
          <path d="M50 35 L90 55 L88 62 L52 45 L48 45 L12 62 L10 55 Z" 
                fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Cola T -->
          <path d="M50 82 L50 98 L62 94 L50 90 L38 94 Z" 
                fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Boom de reabastecimiento -->
          <line x1="50" y1="95" x2="50" y2="100" stroke="#fff" stroke-width="4"/>
        </svg>
      `;

    // 👁️ VIGILANCIA / AWACS - Con radome distintivo
    case 'surveillance':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje -->
          <ellipse cx="50" cy="50" rx="9" ry="40" fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Alas -->
          <path d="M50 38 L88 55 L85 62 L52 48 L48 48 L15 62 L12 55 Z" 
                fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Cola -->
          <path d="M50 84 L50 98 L58 94 L50 90 L42 94 Z" 
                fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Radome/Disco AWACS (distintivo) -->
          <ellipse cx="50" cy="45" rx="22" ry="5" fill="#1e3a5f" stroke="#fff" stroke-width="3"/>
          <ellipse cx="50" cy="45" rx="16" ry="3" fill="#3b82f6" stroke="none"/>
        </svg>
      `;

    // 🚁 HELICÓPTERO
    case 'helicopter':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Rotor principal -->
          <line x1="8" y1="22" x2="92" y2="22" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
          <circle cx="50" cy="22" r="7" fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Cabina -->
          <ellipse cx="50" cy="45" rx="22" ry="18" fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Ventana -->
          <ellipse cx="50" cy="42" rx="12" ry="9" fill="#1e3a5f" stroke="#fff" stroke-width="2"/>
          <!-- Cola -->
          <rect x="45" y="62" width="10" height="30" fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Rotor cola -->
          <ellipse cx="50" cy="94" rx="14" ry="4" fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Patines -->
          <line x1="26" y1="60" x2="26" y2="72" stroke="${color}" stroke-width="4"/>
          <line x1="74" y1="60" x2="74" y2="72" stroke="${color}" stroke-width="4"/>
          <line x1="16" y1="72" x2="38" y2="72" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
          <line x1="62" y1="72" x2="84" y2="72" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        </svg>
      `;

    // 👔 VIP - Jet ejecutivo
    case 'vip':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" style="${baseStyle}">
          <!-- Fuselaje elegante -->
          <path d="M50 5 L55 25 L55 75 L50 95 L45 75 L45 25 Z" 
                fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Alas swept-back -->
          <path d="M50 40 L82 62 L77 66 L53 52 L47 52 L23 66 L18 62 Z" 
                fill="${color}" stroke="#fff" stroke-width="3"/>
          <!-- Cola T -->
          <path d="M50 78 L50 94 L58 90 L50 86 L42 90 Z" 
                fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Ventanas -->
          <line x1="47" y1="30" x2="47" y2="62" stroke="#3b82f6" stroke-width="3"/>
          <line x1="53" y1="30" x2="53" y2="62" stroke="#3b82f6" stroke-width="3"/>
        </svg>
      `;

    // ✈️ TRANSPORTE / DEFAULT - Avión genérico
    case 'transport':
    default:
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" 
             fill="${color}" stroke="#fff" stroke-width="1.5" 
             stroke-linecap="round" stroke-linejoin="round"
             style="${baseStyle.replace(heading + 'deg', (heading - 45) + 'deg')}">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
      `;
  }
};

// Determinar categoría basado en tipo de aeronave
const getCategoryFromType = (type) => {
  if (!type) return 'transport';
  const t = type.toUpperCase();
  
  // Cazas
  if (t.includes('F15') || t.includes('F16') || t.includes('F22') || t.includes('F35') || 
      t.includes('F18') || t.includes('F14') || t.includes('EUFI') || t.includes('TYPN')) {
    return 'combat';
  }
  // Bombarderos
  if (t.includes('B52') || t.includes('B1') || t.includes('B2')) {
    return 'bomber';
  }
  // Tanqueros
  if (t.includes('KC135') || t.includes('KC10') || t.includes('KC46')) {
    return 'tanker';
  }
  // Vigilancia/AWACS
  if (t.includes('P8') || t.includes('P3') || t.includes('E3') || t.includes('E6') || 
      t.includes('E2') || t.includes('E8') || t.includes('RC135') || t.includes('RQ4') || 
      t.includes('U2') || t.includes('MQ9') || t.includes('DH8') || t.includes('DASH')) {
    return 'surveillance';
  }
  // Helicópteros
  if (t.includes('H60') || t.includes('H47') || t.includes('H64') || t.includes('H53') || 
      t.includes('UH') || t.includes('CH') || t.includes('AH') || t.includes('MH') || 
      t.includes('V22') || t.includes('OSPREY')) {
    return 'helicopter';
  }
  // VIP
  if (t.includes('C32') || t.includes('C37') || t.includes('GLF') || t.includes('GLEX')) {
    return 'vip';
  }
  
  return 'transport';
};

/**
 * 📸 SCREENSHOT VIEW - Vista simplificada para capturas de pantalla
 * 
 * Diseño similar al FlightDetailsPanel de la app principal:
 * - Panel inferior compacto (bottom sheet)
 * - Mapa con límites marítimos y territoriales de Venezuela
 * - Zoom alejado para contexto regional
 */
export default function ScreenshotView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boundariesLoaded, setBoundariesLoaded] = useState(false);

  // Obtener parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const flightId = params.get('flight');
  const callsign = params.get('callsign');
  const lat = parseFloat(params.get('lat')) || 10.5;
  const lon = parseFloat(params.get('lon')) || -66.9;
  const zoom = parseFloat(params.get('zoom')) || 5; // Zoom alejado para ver todo el territorio
  const altitude = parseFloat(params.get('alt')) || 0;
  const speed = parseFloat(params.get('speed')) || 0;
  const heading = parseFloat(params.get('heading')) || 0;
  const aircraftType = params.get('type') || 'Aeronave Militar';
  const registration = params.get('reg') || '';
  
  // Parámetros adicionales para ruta y operador
  const origin = params.get('origin') || '';       // Aeropuerto de origen (ej: "POS")
  const destination = params.get('dest') || '';    // Aeropuerto de destino (ej: "PUJ")
  const airline = params.get('airline') || '';     // Operador (ej: "US Air Force", "US Navy")
  const originName = params.get('origin_name') || ''; // Nombre completo origen
  const destName = params.get('dest_name') || '';     // Nombre completo destino

  // Cargar límites de Venezuela desde Supabase
  const loadVenezuelaBoundaries = async (mapInstance) => {
    try {
      console.log('📸 Cargando límites de Venezuela...');
      
      // Cargar límites marítimos (EEZ)
      const { data: maritimeData } = await supabase
        .from('maritime_boundaries_cache')
        .select('country_code, country_name, geojson')
        .eq('country_code', 'VEN');

      // Cargar límites terrestres
      const { data: terrestrialData } = await supabase
        .from('terrestrial_boundaries_cache')
        .select('country_code, country_name, geojson')
        .eq('country_code', 'VEN');

      const features = [];

      // Agregar límites marítimos
      if (maritimeData && maritimeData.length > 0) {
        maritimeData.forEach(item => {
          if (item.geojson) {
            features.push({
              ...item.geojson,
              properties: {
                ...item.geojson.properties,
                iso_sov1: 'VEN',
                type: 'maritime'
              }
            });
          }
        });
        console.log(`📸 ${maritimeData.length} límites marítimos cargados`);
      }

      // Agregar límites terrestres
      if (terrestrialData && terrestrialData.length > 0) {
        terrestrialData.forEach(item => {
          if (item.geojson) {
            features.push({
              ...item.geojson,
              properties: {
                ...item.geojson.properties,
                iso_sov1: 'VEN',
                type: 'terrestrial'
              }
            });
          }
        });
        console.log(`📸 ${terrestrialData.length} límites terrestres cargados`);
      }

      if (features.length === 0) {
        console.log('⚠️ No se encontraron límites de Venezuela');
        return;
      }

      const geojson = {
        type: 'FeatureCollection',
        features: features
      };

      // Agregar source
      if (mapInstance.getSource('venezuela-boundaries')) {
        mapInstance.removeLayer('venezuela-fill');
        mapInstance.removeLayer('venezuela-line');
        mapInstance.removeSource('venezuela-boundaries');
      }

      mapInstance.addSource('venezuela-boundaries', {
        type: 'geojson',
        data: geojson
      });

      // Capa de relleno
      mapInstance.addLayer({
        id: 'venezuela-fill',
        type: 'fill',
        source: 'venezuela-boundaries',
        paint: {
          'fill-color': VEN_COLOR,
          'fill-opacity': 0.15
        }
      });

      // Capa de línea (borde)
      mapInstance.addLayer({
        id: 'venezuela-line',
        type: 'line',
        source: 'venezuela-boundaries',
        paint: {
          'line-color': VEN_COLOR,
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      console.log('📸 Límites de Venezuela renderizados');
      setBoundariesLoaded(true);

    } catch (err) {
      console.error('📸 Error cargando límites:', err);
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    // Centro fijo en Caracas para contexto de Venezuela
    const CARACAS_LAT = 10.4806;
    const CARACAS_LON = -66.9036;
    
    console.log('📸 Inicializando mapa centrado en Caracas');
    console.log('📸 Posición del avión:', lat, lon);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [CARACAS_LON, CARACAS_LAT],
        zoom: zoom,
        attributionControl: false,
        preserveDrawingBuffer: true,
        fadeDuration: 0,
      });

      map.current.on('style.load', () => {
        console.log('📸 Estilo del mapa cargado');
      });

      map.current.on('load', async () => {
        console.log('📸 Mapa completamente cargado');
        setMapLoaded(true);
        
        // Cargar límites de Venezuela
        await loadVenezuelaBoundaries(map.current);
        
        // Agregar marcador del avión con icono según categoría
        if (lat && lon) {
          console.log('📸 Creando marcador en coordenadas:', { lat, lon });
          
          // Determinar categoría de la aeronave
          const category = getCategoryFromType(aircraftType);
          console.log('📸 Categoría detectada:', category, 'para tipo:', aircraftType);
          
          const el = document.createElement('div');
          el.className = 'flight-marker-screenshot';
          el.style.cssText = `
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            position: relative;
          `;
          
          // Usar el icono SVG según la categoría
          el.innerHTML = getAircraftSVGForScreenshot(category, heading);
          
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat([lon, lat])
            .addTo(map.current);
            
          console.log('📸 Marcador agregado en:', lon, lat, 'Categoría:', category, 'Marker:', marker);
        }
        
        setLoading(false);
        
        // Marcar como listo cuando todo esté cargado
        map.current.once('idle', () => {
          console.log('📸 Mapa idle - tiles cargadas');
          window.screenshotReady = true;
          document.body.classList.add('screenshot-ready');
          console.log('📸 Screenshot listo');
        });
      });

      map.current.on('error', (e) => {
        console.error('📸 Error de mapa:', e);
        setError('Error cargando mapa');
        setLoading(false);
      });

    } catch (e) {
      console.error('📸 Error inicializando mapa:', e);
      setError(e.message);
      setLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lat, lon, zoom]);

  // Buscar datos del vuelo y trail desde FlightRadar
  useEffect(() => {
    if (!callsign && !flightId) return;

    const fetchFlightData = async () => {
      try {
        // Primero buscar el vuelo en la lista activa
        const response = await fetch(
          `https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/flightradar-proxy?bounds=27,1,-85,-58`,
          {
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaHVqZHFic3pidm96c3V1bmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2ODI1MTMsImV4cCI6MjA0NDI1ODUxM30.D6hfs7gLMGdDfiST3IfTPjC9gqH9SFRzqiEryZqCcxw`,
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const flights = data.data || [];
          
          const flight = flights.find(f => 
            (flightId && f.hex?.toUpperCase() === flightId.toUpperCase()) ||
            (callsign && f.callsign?.toUpperCase().includes(callsign.toUpperCase()))
          );
          
          if (flight) {
            console.log('📸 Vuelo encontrado:', flight);
            setFlightData(flight);
            
            // Obtener detalles del vuelo incluyendo el trail
            if (flight.id) {
              console.log('📸 Obteniendo trail para vuelo:', flight.id);
              const details = await getFlightDetails(flight.id);
              
              if (details?.trail && details.trail.length > 0 && map.current) {
                console.log(`📸 Trail obtenido: ${details.trail.length} puntos`);
                drawTrailOnMap(map.current, details.trail);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error buscando vuelo:', e);
      }
    };

    fetchFlightData();
  }, [callsign, flightId]);

  // Función para dibujar el trail en el mapa
  const drawTrailOnMap = (mapInstance, trail) => {
    if (!mapInstance || !trail || trail.length < 2) return;

    const TRAIL_SOURCE_ID = 'screenshot-trail-source';
    const TRAIL_LAYER_ID = 'screenshot-trail-layer';
    const TRAIL_OUTLINE_ID = 'screenshot-trail-outline';

    try {
      // Remover capas existentes si las hay
      if (mapInstance.getLayer(TRAIL_LAYER_ID)) mapInstance.removeLayer(TRAIL_LAYER_ID);
      if (mapInstance.getLayer(TRAIL_OUTLINE_ID)) mapInstance.removeLayer(TRAIL_OUTLINE_ID);
      if (mapInstance.getSource(TRAIL_SOURCE_ID)) mapInstance.removeSource(TRAIL_SOURCE_ID);

      const geojson = trailToGeoJSON(trail);
      console.log(`📸 Dibujando trail: ${geojson.features.length} segmentos`);

      // Agregar source
      mapInstance.addSource(TRAIL_SOURCE_ID, {
        type: 'geojson',
        data: geojson
      });

      // Capa de outline (sombra)
      mapInstance.addLayer({
        id: TRAIL_OUTLINE_ID,
        type: 'line',
        source: TRAIL_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#000000',
          'line-width': 6,
          'line-opacity': 0.5,
          'line-blur': 1
        }
      });

      // Capa principal del trail
      mapInstance.addLayer({
        id: TRAIL_LAYER_ID,
        type: 'line',
        source: TRAIL_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.9
        }
      });

      console.log('📸 Trail dibujado exitosamente');
    } catch (e) {
      console.error('📸 Error dibujando trail:', e);
    }
  };

  // Datos para mostrar
  const displayCallsign = flightData?.callsign || callsign || flightId || 'UNKNOWN';
  const displayType = flightData?.type || aircraftType;
  const displayAlt = flightData?.alt || altitude;
  const displaySpeed = flightData?.gspeed || speed;
  const displayHeading = flightData?.track || heading;
  const displayLat = flightData?.lat || lat;
  const displayLon = flightData?.lon || lon;
  const displayReg = flightData?.reg || registration;
  const countryInfo = getCountryByICAO24(flightData?.hex || flightId);
  const speedKmh = Math.round(displaySpeed * 1.852);
  
  // Datos de ruta y operador
  const displayOrigin = flightData?.origin?.code || origin || '';
  const displayDest = flightData?.destination?.code || destination || '';
  const displayOriginName = flightData?.origin?.name || originName || '';
  const displayDestName = flightData?.destination?.name || destName || '';
  const displayAirline = flightData?.airline?.name || airline || '';
  const hasRoute = displayOrigin || displayDest;
  
  // Determinar categoría del operador
  const getOperatorCategory = () => {
    const op = displayAirline.toUpperCase();
    if (op.includes('AIR FORCE') || op.includes('USAF')) return { label: 'US AIR FORCE', icon: '✈️', color: '#3b82f6' };
    if (op.includes('NAVY') || op.includes('USN')) return { label: 'US NAVY', icon: '⚓', color: '#0ea5e9' };
    if (op.includes('MARINE') || op.includes('USMC')) return { label: 'US MARINES', icon: '🎖️', color: '#dc2626' };
    if (op.includes('COAST GUARD') || op.includes('USCG')) return { label: 'COAST GUARD', icon: '🛟', color: '#f97316' };
    if (op.includes('ARMY')) return { label: 'US ARMY', icon: '🪖', color: '#65a30d' };
    if (countryInfo.military) return { label: 'MILITAR/GOV', icon: '🎖️', color: '#ef4444' };
    return { label: 'MILITAR', icon: '⚠️', color: '#f59e0b' };
  };
  
  const operatorInfo = getOperatorCategory();
  const category = getCategoryFromType(displayType);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-900">
      {/* Estilos */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(239, 68, 68, 0.7), 0 0 40px rgba(239, 68, 68, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 4px 30px rgba(239, 68, 68, 0.9), 0 0 60px rgba(239, 68, 68, 0.6); }
        }
        .mapboxgl-map, .mapboxgl-canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      {/* Mapa a pantalla completa */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Indicador de incursión - Esquina superior izquierda */}
      <div className="absolute top-4 left-4 bg-red-600/95 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-red-400 shadow-lg shadow-red-500/30">
        <span className="text-white font-bold text-base flex items-center gap-2">
          🚨 INCURSIÓN DETECTADA
        </span>
      </div>

      {/* Panel de RUTA - Esquina superior derecha */}
      {hasRoute && (
        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-xl rounded-xl border-2 border-yellow-500/50 shadow-lg overflow-hidden" style={{ minWidth: '200px' }}>
          {/* Header */}
          <div className="bg-yellow-500/20 px-3 py-1.5 border-b border-yellow-500/30">
            <span className="text-yellow-400 font-bold text-xs flex items-center gap-1">
              ✈️ RUTA DE VUELO
            </span>
          </div>
          
          {/* Contenido de ruta */}
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            {/* Origen */}
            <div className="text-center">
              <p className="text-slate-400 text-[10px] uppercase">Origen</p>
              <p className="text-white font-bold text-xl">{displayOrigin || '???'}</p>
              {displayOriginName && (
                <p className="text-slate-400 text-[9px] max-w-[80px] truncate">{displayOriginName}</p>
              )}
            </div>
            
            {/* Flecha */}
            <div className="flex items-center gap-1 text-yellow-400">
              <div className="w-8 h-0.5 bg-yellow-400/50" />
              <span className="text-lg">✈</span>
              <div className="w-8 h-0.5 bg-yellow-400/50" />
            </div>
            
            {/* Destino */}
            <div className="text-center">
              <p className="text-slate-400 text-[10px] uppercase">Destino</p>
              <p className="text-white font-bold text-xl">{displayDest || '???'}</p>
              {displayDestName && (
                <p className="text-slate-400 text-[9px] max-w-[80px] truncate">{displayDestName}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panel inferior COMPACTO - Barra con info completa */}
      <div 
        className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-600"
        style={{
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Una sola fila compacta con toda la info esencial */}
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Icono SVG según categoría + Callsign */}
          <div className="flex items-center gap-2">
            <div 
              className="shrink-0 flex items-center justify-center"
              style={{ width: '40px', height: '40px' }}
              dangerouslySetInnerHTML={{ 
                __html: getAircraftSVGForScreenshot(category, displayHeading).replace('width="48"', 'width="36"').replace('height="48"', 'height="36"')
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-white leading-none">{displayCallsign}</h1>
              <p className="text-xs text-cyan-400 truncate max-w-[150px]">{displayType}</p>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-10 bg-slate-600" />

          {/* Operador/Fuerza + País */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{countryInfo.flag}</span>
            <div>
              <p className="text-xs font-bold flex items-center gap-1" style={{ color: operatorInfo.color }}>
                {operatorInfo.icon} {operatorInfo.label}
              </p>
              <p className="text-[10px] text-slate-400">{countryInfo.name}</p>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-10 bg-slate-600" />

          {/* Stats en línea */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Gauge size={12} className="text-blue-400" />
              <span className="text-slate-400">Alt:</span>
              <span className="text-white font-bold">{Math.round(displayAlt / 1000)}k ft</span>
            </div>
            <div className="flex items-center gap-1">
              <Navigation size={12} className="text-green-400" />
              <span className="text-slate-400">Vel:</span>
              <span className="text-white font-bold">{speedKmh} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Compass size={12} className="text-purple-400" />
              <span className="text-slate-400">Rumbo:</span>
              <span className="text-white font-bold">{displayHeading}° {getCardinal(displayHeading)}</span>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-10 bg-slate-600" />

          {/* Posición */}
          <div className="flex items-center gap-1 text-xs">
            <MapPin size={12} className="text-yellow-400" />
            <span className="font-mono text-slate-300">{displayLat.toFixed(4)}°, {displayLon.toFixed(4)}°</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Registro + Zona Venezuela */}
          <div className="flex items-center gap-2 text-right">
            {displayReg && (
              <div className="bg-slate-800 px-2 py-1 rounded border border-slate-600">
                <p className="text-[10px] text-slate-400">Registro</p>
                <p className="text-xs text-white font-mono font-bold">{displayReg}</p>
              </div>
            )}
            <div className="bg-red-900/50 px-2 py-1 rounded border border-red-500/50">
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <Shield size={8} /> ZONA
              </p>
              <p className="text-xs text-white font-bold">🇻🇪 VEN</p>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark SAE-RADAR - Esquina inferior izquierda, encima del panel */}
      <div className="absolute bottom-[60px] left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-white font-bold text-xs">SAE-RADAR</span>
        <span className="text-slate-400 text-[10px] ml-2">
          {new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}
        </span>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-20">
          {error}
        </div>
      )}
    </div>
  );
}
