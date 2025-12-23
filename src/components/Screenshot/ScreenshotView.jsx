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
        
        // Agregar marcador del avión
        if (lat && lon) {
          console.log('📸 Creando marcador en coordenadas:', { lat, lon });
          
          const el = document.createElement('div');
          el.className = 'flight-marker-screenshot';
          el.style.cssText = `
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            border: 5px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 25px rgba(239, 68, 68, 0.8), 0 0 50px rgba(239, 68, 68, 0.5);
            font-size: 30px;
            z-index: 9999;
            position: relative;
          `;
          el.innerHTML = '✈️';
          
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat([lon, lat])
            .addTo(map.current);
            
          console.log('📸 Marcador agregado en:', lon, lat, 'Marker:', marker);
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

      {/* Panel inferior COMPACTO - Barra minimalista */}
      <div 
        className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-600"
        style={{
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Una sola fila compacta con toda la info esencial */}
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Icono + Callsign */}
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg shrink-0"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                border: '2px solid #ef4444'
              }}
            >
              <Plane size={20} color="#ef4444" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">{displayCallsign}</h1>
              <p className="text-xs text-cyan-400 truncate max-w-[150px]">{displayType}</p>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-8 bg-slate-600" />

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
          <div className="w-px h-8 bg-slate-600" />

          {/* Posición */}
          <div className="flex items-center gap-1 text-xs">
            <MapPin size={12} className="text-yellow-400" />
            <span className="font-mono text-slate-300">{displayLat.toFixed(4)}°, {displayLon.toFixed(4)}°</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* País + Zona */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{countryInfo.flag}</span>
            <div className="text-right">
              <p className="text-xs text-red-400 font-bold flex items-center gap-1">
                <Shield size={10} /> MIL/GOV
              </p>
              <p className="text-[10px] text-slate-400">🇻🇪 Espacio Aéreo VEN</p>
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
