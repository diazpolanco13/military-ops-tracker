import { useEffect, useRef, useCallback } from 'react';

/**
 * 🛩️ CAPA DE VUELOS NATIVA - CON ICONOS SVG POR CATEGORÍA
 * 
 * Usa capas GeoJSON nativas de Mapbox para sincronización perfecta
 * Iconos diferenciados por categoría militar estilo FlightRadar24
 */

const FLIGHTS_SOURCE_ID = 'flights-source';
const FLIGHTS_LAYER_ID = 'flights-layer';
const FLIGHTS_SELECTED_LAYER_ID = 'flights-selected-layer';

// Determinar si es helicóptero (lista ampliada)
const isHelicopter = (type) => {
  const heliPatterns = [
    'CH47', 'UH60', 'AH64', 'MH60', 'HH60', 'H60', 'H47', 'H64', 'H53',
    'V22', 'S70', 'S76', 'S92', 'EC', 'AS',
    'A109', 'A139', 'A169', 'AW',
    'B06', 'B07', 'B12', 'B47',
    'MD5', 'MD6', 'MD9',
    'R22', 'R44', 'R66',
    'H125', 'H130', 'H135', 'H145', 'H155', 'H160', 'H175', 'H215', 'H225',
    'BK17', 'NH90',
    'MI8', 'MI17', 'MI24', 'MI28', 'MI35',
    'KA52', 'KA27', 'KA32',
    'UH1', 'AH1',
  ];
  return heliPatterns.some(h => (type || '').toUpperCase().includes(h));
};

// Determinar si es drone
const isDrone = (type) => {
  const dronePatterns = ['RQ4', 'MQ4', 'MQ9', 'MQ1', 'RQ7', 'RQ11', 'Q4', 'HALE', 'UAV', 'RPAS'];
  return dronePatterns.some(d => (type || '').toUpperCase().includes(d));
};

// Determinar categoría desde el tipo de aeronave
const getCategoryFromType = (type, callsign) => {
  if (!type) return 'transport';
  const t = type.toUpperCase();
  const cs = (callsign || '').toUpperCase();
  
  // Drones/UAV (PRIMERO, antes de surveillance)
  if (isDrone(t) || cs.startsWith('BLKCAT') || cs.startsWith('FORTE') || cs.startsWith('BAMS')) {
    return 'drone';
  }
  // Cazas
  if (t.includes('F15') || t.includes('F16') || t.includes('F22') || t.includes('F35') || 
      t.includes('F18') || t.includes('F14') || t.includes('EUFI') || t.includes('TYPN') ||
      t.includes('EA18') || t.includes('FA18')) {
    return 'combat';
  }
  // Bombarderos
  if (t.includes('B52') || t.includes('B1B') || t.includes('B2')) {
    return 'bomber';
  }
  // Tanqueros
  if (t.includes('KC135') || t.includes('KC10') || t.includes('KC46') || t.includes('K35R')) {
    return 'tanker';
  }
  // Vigilancia/AWACS/Reconocimiento (sin los drones, ya detectados arriba)
  if (t.includes('P8') || t.includes('P3') || t.includes('E3') || t.includes('E6') || 
      t.includes('E2') || t.includes('E8') || t.includes('RC135') ||
      t.includes('U2') || t.includes('DH8') || t.includes('DASH') ||
      t.includes('DHC8') || t.includes('BE20') || t.includes('C12') ||
      cs.startsWith('BAT') || cs.startsWith('IRON')) {
    return 'surveillance';
  }
  // Helicópteros (ya se detectan aparte, pero por si acaso)
  if (isHelicopter(t)) {
    return 'helicopter';
  }
  // VIP
  if (t.includes('C32') || t.includes('C37') || t.includes('GLF') || t.includes('GLEX') ||
      cs.startsWith('SAM') || cs.startsWith('SPAR')) {
    return 'vip';
  }
  
  return 'transport';
};

// Colores por categoría
const CATEGORY_COLORS = {
  combat: '#ef4444',       // Rojo
  bomber: '#dc2626',       // Rojo oscuro
  tanker: '#10b981',       // Verde
  surveillance: '#f59e0b', // Naranja
  drone: '#06b6d4',        // Cyan (distintivo para drones)
  helicopter: '#8b5cf6',   // Morado
  vip: '#ec4899',          // Rosa
  transport: '#FFC107',    // Amarillo (default)
};

/**
 * 🎨 ICONOS SVG POR CATEGORÍA MILITAR
 * Estilo FlightRadar24 - Siluetas distintivas
 */

// ✈️ CAZA - Silueta compacta estilo FlightRadar24 (idéntico)
const COMBAT_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <!-- Fuselaje central -->
  <path d="M16 2 L18 8 L18 24 L16 30 L14 24 L14 8 Z" fill="${color}" stroke="#000" stroke-width="0.8"/>
  <!-- Alas delta principales -->
  <path d="M16 10 L28 20 L26 22 L18 16 L14 16 L6 22 L4 20 Z" fill="${color}" stroke="#000" stroke-width="0.8"/>
  <!-- Estabilizadores traseros pequeños -->
  <path d="M16 24 L20 28 L19 29 L16 27 L13 29 L12 28 Z" fill="${color}" stroke="#000" stroke-width="0.6"/>
  <!-- Cabina (cristal oscuro) -->
  <ellipse cx="16" cy="7" rx="1.5" ry="3" fill="#1a1a2e" stroke="#000" stroke-width="0.4"/>
</svg>`;

// 💣 BOMBARDERO - Silueta B-52
const BOMBER_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">
  <path d="M50 2 L54 20 L54 80 L50 98 L46 80 L46 20 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 30 L95 55 L92 60 L54 45 L46 45 L8 60 L5 55 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 70 L50 85 L55 95 L50 90 L45 95 L50 85 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <ellipse cx="30" cy="48" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
  <ellipse cx="40" cy="42" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
  <ellipse cx="60" cy="42" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
  <ellipse cx="70" cy="48" rx="3" ry="6" fill="#333" stroke="#000" stroke-width="1"/>
</svg>`;

// ⛽ TANQUERO - KC-135 style
const TANKER_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">
  <ellipse cx="50" cy="50" rx="8" ry="40" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 35 L90 55 L88 60 L52 45 L48 45 L12 60 L10 55 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 82 L50 95 L60 92 L50 88 L40 92 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M40 88 L60 88 L58 92 L42 92 Z" fill="${color}" stroke="#000" stroke-width="1"/>
  <line x1="50" y1="95" x2="50" y2="100" stroke="#333" stroke-width="3"/>
</svg>`;

// 👁️ VIGILANCIA / AWACS - Con radome distintivo
const SURVEILLANCE_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">
  <ellipse cx="50" cy="50" rx="7" ry="38" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 38 L88 55 L85 60 L52 48 L48 48 L15 60 L12 55 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 82 L50 95 L55 92 L50 88 L45 92 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <ellipse cx="50" cy="45" rx="18" ry="4" fill="#1e3a5f" stroke="#000" stroke-width="2"/>
  <ellipse cx="50" cy="45" rx="14" ry="2" fill="#3b82f6" stroke="none"/>
</svg>`;

// 🚁 HELICÓPTERO - Diseño mejorado
const HELICOPTER_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">
  <!-- Fuselaje principal -->
  <rect x="40" y="35" width="20" height="40" fill="${color}" rx="8" ry="5" stroke="#000" stroke-width="1.5"/>
  <!-- Boom de cola -->
  <rect x="45" y="72" width="10" height="18" fill="${color}" rx="3" ry="2" stroke="#000" stroke-width="1"/>
  <!-- Ventana de cabina -->
  <ellipse cx="50" cy="42" rx="7" ry="6" fill="#0ea5e9" opacity="0.85" stroke="#000" stroke-width="0.8"/>
  <!-- Hélices principales (en X) -->
  <line x1="10" y1="30" x2="90" y2="30" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <line x1="50" y1="-10" x2="50" y2="70" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="50" cy="30" r="4" fill="#334155" stroke="#000" stroke-width="1"/>
  <!-- Rotor de cola -->
  <line x1="40" y1="85" x2="60" y2="85" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="50" y1="78" x2="50" y2="92" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="50" cy="85" r="2" fill="#334155"/>
  <!-- Patines de aterrizaje -->
  <line x1="35" y1="70" x2="35" y2="78" stroke="${color}" stroke-width="2.5"/>
  <line x1="65" y1="70" x2="65" y2="78" stroke="${color}" stroke-width="2.5"/>
  <line x1="28" y1="78" x2="42" y2="78" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  <line x1="58" y1="78" x2="72" y2="78" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
</svg>`;

// 🛸 DRONE / UAV - Silueta tipo RQ-4 Global Hawk / MQ-4C Triton
const DRONE_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">
  <!-- Alas muy largas (característica distintiva de drones HALE) -->
  <path d="M50 45 L98 50 L95 54 L52 50 L48 50 L5 54 L2 50 Z" fill="${color}" stroke="#000" stroke-width="1.5"/>
  <!-- Fuselaje delgado y aerodinámico -->
  <ellipse cx="50" cy="50" rx="5" ry="35" fill="${color}" stroke="#000" stroke-width="1.5"/>
  <!-- Sensor dome frontal (bulbo característico - cámara/radar) -->
  <ellipse cx="50" cy="18" rx="8" ry="7" fill="#0ea5e9" stroke="#000" stroke-width="1.2"/>
  <ellipse cx="50" cy="18" rx="4" ry="3" fill="#1e3a5f" opacity="0.8"/>
  <!-- Cola en V invertida -->
  <path d="M50 82 L60 96 L50 90 L40 96 Z" fill="${color}" stroke="#000" stroke-width="1.2"/>
  <!-- Hélice trasera (pusher prop) -->
  <circle cx="50" cy="88" r="4" fill="#334155" stroke="#000" stroke-width="1"/>
  <line x1="42" y1="88" x2="58" y2="88" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

// 👔 VIP - Jet ejecutivo
const VIP_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 100 100">
  <path d="M50 5 L54 25 L54 75 L50 95 L46 75 L46 25 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 40 L80 60 L75 63 L52 50 L48 50 L25 63 L20 60 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M50 78 L50 92 L56 88 L50 85 L44 88 Z" fill="${color}" stroke="#000" stroke-width="2"/>
  <path d="M42 85 L58 85 L56 88 L44 88 Z" fill="${color}" stroke="#000" stroke-width="1"/>
  <line x1="48" y1="30" x2="48" y2="60" stroke="#3b82f6" stroke-width="2"/>
  <line x1="52" y1="30" x2="52" y2="60" stroke="#3b82f6" stroke-width="2"/>
</svg>`;

// ✈️ TRANSPORTE - Avión genérico (Lucide Plane)
const TRANSPORT_SVG = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="0.5">
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
</svg>`;

// Mapeo de categoría a función SVG
const CATEGORY_SVG = {
  combat: COMBAT_SVG,
  bomber: BOMBER_SVG,
  tanker: TANKER_SVG,
  surveillance: SURVEILLANCE_SVG,
  drone: DRONE_SVG,
  helicopter: HELICOPTER_SVG,
  vip: VIP_SVG,
  transport: TRANSPORT_SVG,
};

// Todas las categorías
const ALL_CATEGORIES = ['combat', 'bomber', 'tanker', 'surveillance', 'drone', 'helicopter', 'vip', 'transport'];

// Convertir SVG a imagen para Mapbox
const svgToImage = (svgString, size = 32) => {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

export default function FlightLayer({ 
  map, 
  flights = [], 
  selectedFlight, 
  onFlightClick 
}) {
  const initializedRef = useRef(false);

  // Convertir vuelos a GeoJSON con categoría
  const getGeoJSON = useCallback((forSelected = false) => {
    const filteredFlights = forSelected 
      ? flights.filter(f => f.id === selectedFlight?.id)
      : flights.filter(f => f.id !== selectedFlight?.id);
      
    return {
      type: 'FeatureCollection',
      features: filteredFlights.map(flight => {
        const isHeli = isHelicopter(flight.aircraft?.type);
        const category = isHeli ? 'helicopter' : getCategoryFromType(flight.aircraft?.type, flight.callsign);
        
        // Ajuste de heading: transporte usa Lucide Plane (-45°), otros apuntan arriba (0°)
        const headingAdjust = category === 'transport' ? -45 : 0;
        
        // Detectar si la posición es estimada (transponder apagado)
        const isEstimated = flight.signal?.isTransponderActive === false;
        
        return {
          type: 'Feature',
          properties: {
            id: flight.id,
            callsign: isEstimated ? `📍 ${flight.callsign || 'UNKNOWN'}` : (flight.callsign || 'UNKNOWN'),
            category: category,
            heading: (flight.heading || 0) + headingAdjust,
            isEstimated: isEstimated,
          },
          geometry: {
            type: 'Point',
            coordinates: [flight.longitude, flight.latitude]
          }
        };
      })
    };
  }, [flights, selectedFlight]);

  // Inicializar: cargar iconos y crear capas
  useEffect(() => {
    if (!map || initializedRef.current) return;
    
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      
      // 🔧 FIX: Verificar que el estilo esté realmente cargado
      if (!map.isStyleLoaded()) {
        console.log('⏳ FlightLayer: Esperando estilo del mapa...');
        return;
      }
      
      try {
        // Cargar iconos SVG para cada categoría (normal y seleccionado)
        const iconPromises = [];
        
        for (const category of ALL_CATEGORIES) {
          const svgFn = CATEGORY_SVG[category];
          const color = CATEGORY_COLORS[category];
          
          // Icono normal con su color
          iconPromises.push(
            svgToImage(svgFn(color)).then(img => ({ 
              name: `icon-${category}`, 
              img 
            }))
          );
          
          // Icono seleccionado (rojo brillante)
          iconPromises.push(
            svgToImage(svgFn('#ef4444')).then(img => ({ 
              name: `icon-${category}-selected`, 
              img 
            }))
          );
        }

        const icons = await Promise.all(iconPromises);
        
        if (!mounted) return;
        
        // Agregar todos los iconos a Mapbox
        for (const { name, img } of icons) {
          if (!map.hasImage(name)) {
            map.addImage(name, img);
          }
        }

        // Crear sources
        if (!map.getSource(FLIGHTS_SOURCE_ID)) {
          map.addSource(FLIGHTS_SOURCE_ID, {
            type: 'geojson',
            data: getGeoJSON(false)
          });
        }

        if (!map.getSource(FLIGHTS_SOURCE_ID + '-selected')) {
          map.addSource(FLIGHTS_SOURCE_ID + '-selected', {
            type: 'geojson',
            data: getGeoJSON(true)
          });
        }

        // Expresión para seleccionar icono según categoría
        const iconExpression = [
          'concat',
          'icon-',
          ['get', 'category']
        ];
        
        const iconExpressionSelected = [
          'concat',
          'icon-',
          ['get', 'category'],
          '-selected'
        ];

        // Capa de vuelos normales
        if (!map.getLayer(FLIGHTS_LAYER_ID)) {
          map.addLayer({
            id: FLIGHTS_LAYER_ID,
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID,
            layout: {
              'icon-image': iconExpression,
              'icon-size': 1,
              'icon-rotate': ['get', 'heading'],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
            paint: {
              // Opacidad reducida para posiciones estimadas (transponder apagado)
              'icon-opacity': ['case', ['get', 'isEstimated'], 0.5, 1],
            },
            minzoom: 3,
          });
        }

        // Capa de labels con color según categoría
        if (!map.getLayer(FLIGHTS_LAYER_ID + '-labels')) {
          map.addLayer({
            id: FLIGHTS_LAYER_ID + '-labels',
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID,
            layout: {
              'text-field': ['get', 'callsign'],
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': 10,
              'text-offset': [0, 1.3],
              'text-anchor': 'top',
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': [
                'case',
                ['get', 'isEstimated'],
                '#fca5a5', // Rojo claro para estimados
                [
                  'match',
                  ['get', 'category'],
                  'combat', CATEGORY_COLORS.combat,
                  'bomber', CATEGORY_COLORS.bomber,
                  'tanker', CATEGORY_COLORS.tanker,
                  'surveillance', CATEGORY_COLORS.surveillance,
                  'helicopter', CATEGORY_COLORS.helicopter,
                  'vip', CATEGORY_COLORS.vip,
                  CATEGORY_COLORS.transport  // default
                ]
              ],
              'text-halo-color': 'rgba(0,0,0,0.9)',
              'text-halo-width': 1.5,
              'text-opacity': ['case', ['get', 'isEstimated'], 0.7, 1],
            },
            minzoom: 6,
          });
        }

        // Capa de vuelo seleccionado (siempre rojo)
        if (!map.getLayer(FLIGHTS_SELECTED_LAYER_ID)) {
          map.addLayer({
            id: FLIGHTS_SELECTED_LAYER_ID,
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID + '-selected',
            layout: {
              'icon-image': iconExpressionSelected,
              'icon-size': 1.3,
              'icon-rotate': ['get', 'heading'],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          });
        }

        // Label del seleccionado
        if (!map.getLayer(FLIGHTS_SELECTED_LAYER_ID + '-label')) {
          map.addLayer({
            id: FLIGHTS_SELECTED_LAYER_ID + '-label',
            type: 'symbol',
            source: FLIGHTS_SOURCE_ID + '-selected',
            layout: {
              'text-field': ['get', 'callsign'],
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
            },
            paint: {
              'text-color': '#ef4444',
              'text-halo-color': 'rgba(0,0,0,0.95)',
              'text-halo-width': 2,
            },
          });
        }

        initializedRef.current = true;
        console.log('✅ FlightLayer: Iconos por categoría cargados correctamente', ALL_CATEGORIES);
        
        // 🔧 FIX CRÍTICO: Forzar actualización de datos inmediatamente después de inicializar
        // Esto resuelve la condición de carrera donde los vuelos llegan antes de init()
        const source = map.getSource(FLIGHTS_SOURCE_ID);
        const selectedSource = map.getSource(FLIGHTS_SOURCE_ID + '-selected');
        if (source) source.setData(getGeoJSON(false));
        if (selectedSource) selectedSource.setData(getGeoJSON(true));
        console.log('🔄 FlightLayer: Datos actualizados post-inicialización');
        
      } catch (error) {
        console.error('❌ FlightLayer error:', error);
      }
    };

    // 🔧 FIX: Estrategia robusta de inicialización con múltiples intentos
    const tryInit = () => {
      if (initializedRef.current) return;
      if (map.isStyleLoaded()) {
        init();
      }
    };
    
    // Intento inmediato si el estilo ya está cargado
    if (map.isStyleLoaded()) {
      init();
    }
    
    // Escuchar evento load del mapa
    map.once('load', tryInit);
    
    // 🔧 FIX: Usar idle como respaldo para asegurar inicialización
    const handleIdle = () => {
      if (!initializedRef.current) {
        tryInit();
      }
    };
    map.once('idle', handleIdle);
    
    // 🔧 FIX ADICIONAL: Retry con delay como último recurso
    const retryTimeout = setTimeout(() => {
      if (!initializedRef.current && map.isStyleLoaded()) {
        console.log('⚠️ FlightLayer: Retry de inicialización...');
        init();
      }
    }, 500);

    // Reinicializar al cambiar estilo
    const handleStyleLoad = () => {
      initializedRef.current = false;
      // Pequeño delay para asegurar que el estilo está listo
      setTimeout(init, 50);
    };
    map.on('style.load', handleStyleLoad);

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      map.off('style.load', handleStyleLoad);
      map.off('idle', handleIdle);
      map.off('load', tryInit);
      
      // Limpiar todo al desmontar
      try {
        if (map.getLayer(FLIGHTS_SELECTED_LAYER_ID + '-label')) map.removeLayer(FLIGHTS_SELECTED_LAYER_ID + '-label');
        if (map.getLayer(FLIGHTS_SELECTED_LAYER_ID)) map.removeLayer(FLIGHTS_SELECTED_LAYER_ID);
        if (map.getLayer(FLIGHTS_LAYER_ID + '-labels')) map.removeLayer(FLIGHTS_LAYER_ID + '-labels');
        if (map.getLayer(FLIGHTS_LAYER_ID)) map.removeLayer(FLIGHTS_LAYER_ID);
        if (map.getSource(FLIGHTS_SOURCE_ID + '-selected')) map.removeSource(FLIGHTS_SOURCE_ID + '-selected');
        if (map.getSource(FLIGHTS_SOURCE_ID)) map.removeSource(FLIGHTS_SOURCE_ID);
        
        // Limpiar todos los iconos por categoría
        for (const category of ALL_CATEGORIES) {
          if (map.hasImage(`icon-${category}`)) map.removeImage(`icon-${category}`);
          if (map.hasImage(`icon-${category}-selected`)) map.removeImage(`icon-${category}-selected`);
        }
        
        initializedRef.current = false;
        console.log('🧹 FlightLayer: Capas limpiadas al desmontar');
      } catch (e) {
        console.log('⚠️ Error limpiando capas:', e.message);
      }
    };
  }, [map]);

  // Actualizar datos cuando cambien los vuelos
  useEffect(() => {
    if (!map) return;
    
    // 🔧 FIX: Intentar actualizar incluso si init no ha terminado
    // Las sources pueden existir mientras init está en progreso
    try {
      const source = map.getSource(FLIGHTS_SOURCE_ID);
      const selectedSource = map.getSource(FLIGHTS_SOURCE_ID + '-selected');
      
      if (source && selectedSource) {
        source.setData(getGeoJSON(false));
        selectedSource.setData(getGeoJSON(true));
      }
    } catch (e) {
      // Ignorar errores si las sources aún no existen
    }
  }, [map, flights, selectedFlight, getGeoJSON]);

  // Manejar clicks en vuelos
  useEffect(() => {
    if (!map) return;

    let handlersRegistered = false;

    const handleFlightClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [FLIGHTS_LAYER_ID, FLIGHTS_SELECTED_LAYER_ID].filter(id => map.getLayer(id))
      });

      if (features.length > 0) {
        const flightId = features[0].properties.id;
        const flight = flights.find(f => f.id === flightId);
        if (flight && onFlightClick) {
          onFlightClick(flight);
        }
      }
    };

    const setCursor = () => { map.getCanvas().style.cursor = 'pointer'; };
    const resetCursor = () => { map.getCanvas().style.cursor = ''; };

    const setup = () => {
      if (handlersRegistered) return;
      
      if (map.getLayer(FLIGHTS_LAYER_ID)) {
        map.on('click', FLIGHTS_LAYER_ID, handleFlightClick);
        map.on('click', FLIGHTS_SELECTED_LAYER_ID, handleFlightClick);
        map.on('mouseenter', FLIGHTS_LAYER_ID, setCursor);
        map.on('mouseleave', FLIGHTS_LAYER_ID, resetCursor);
        handlersRegistered = true;
        console.log('✅ FlightLayer: Click handlers registrados');
      }
    };

    // 🔧 FIX: Estrategia múltiple para registrar handlers
    // 1. Intento inmediato si la capa ya existe
    setup();
    
    // 2. Escuchar idle como respaldo
    const handleIdle = () => {
      if (!handlersRegistered) setup();
    };
    map.on('idle', handleIdle);
    
    // 3. Retry con delay como último recurso
    const retryInterval = setInterval(() => {
      if (!handlersRegistered && map.getLayer(FLIGHTS_LAYER_ID)) {
        setup();
        clearInterval(retryInterval);
      }
    }, 200);
    
    // Limpiar después de 5 segundos si no se necesita
    const clearRetry = setTimeout(() => clearInterval(retryInterval), 5000);

    return () => {
      clearInterval(retryInterval);
      clearTimeout(clearRetry);
      map.off('idle', handleIdle);
      try {
        map.off('click', FLIGHTS_LAYER_ID, handleFlightClick);
        map.off('click', FLIGHTS_SELECTED_LAYER_ID, handleFlightClick);
        map.off('mouseenter', FLIGHTS_LAYER_ID, setCursor);
        map.off('mouseleave', FLIGHTS_LAYER_ID, resetCursor);
      } catch (e) {}
    };
  }, [map, flights, onFlightClick]);

  // Click en mapa (no en vuelo) → deseleccionar vuelo
  useEffect(() => {
    if (!map || !selectedFlight || !onFlightClick) return;

    const handleMapClick = (e) => {
      // Verificar si el click fue en un vuelo
      const features = map.queryRenderedFeatures(e.point, {
        layers: [FLIGHTS_LAYER_ID, FLIGHTS_SELECTED_LAYER_ID].filter(id => map.getLayer(id))
      });

      // Si no hay vuelos en el punto clickeado, deseleccionar
      if (features.length === 0) {
        onFlightClick(null);
      }
    };

    // Usar setTimeout para que este handler se ejecute después del específico
    const setup = () => {
      map.on('click', handleMapClick);
    };

    // Esperar un tick para registrar después de los handlers de capa
    const timeoutId = setTimeout(setup, 100);

    return () => {
      clearTimeout(timeoutId);
      try {
        map.off('click', handleMapClick);
      } catch (e) {}
    };
  }, [map, selectedFlight, onFlightClick]);

  return null;
}
