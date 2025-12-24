/**
 * 📊 SITUATION SCREENSHOT VIEW
 * 
 * Vista de screenshot para múltiples aeronaves activas simultáneamente.
 * Muestra un resumen consolidado de la situación aérea actual.
 * 
 * URL: /screenshot/situation?flights=[...JSON...]&title=...&timestamp=...
 */

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/maplibre';
import { supabase } from '../../lib/supabase';
import { Plane, Gauge, Navigation, MapPin, Shield, Clock, AlertTriangle, Users } from 'lucide-react';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

// Colores para Venezuela
const VEN_COLOR = '#ef4444';

// Colores para diferenciar múltiples aeronaves
const AIRCRAFT_COLORS = [
  '#ef4444', // Rojo
  '#f97316', // Naranja
  '#eab308', // Amarillo
  '#22c55e', // Verde
  '#3b82f6', // Azul
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#06b6d4', // Cyan
];

// Obtener dirección cardinal desde grados
const getCardinal = (degrees) => {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return cardinals[index];
};

// Obtener nombre del operador
const getOperatorName = (flight) => {
  const op = (flight.operating_as || flight.painted_as || flight.airline || '').toUpperCase();
  const cs = (flight.callsign || '').toUpperCase();
  
  if (cs.startsWith('RCH') || cs.startsWith('CNV')) return 'US Air Force';
  if (cs.startsWith('NAVY') || cs.startsWith('IRON')) return 'US Navy';
  if (cs.startsWith('BAT')) return 'US Air Force';
  if (cs.startsWith('EVAC')) return 'US Air Force (Medical)';
  
  if (op.includes('AIR FORCE') || op.includes('USAF')) return 'US Air Force';
  if (op.includes('NAVY') || op.includes('USN')) return 'US Navy';
  if (op.includes('MARINE') || op.includes('USMC')) return 'US Marines';
  if (op.includes('COAST GUARD') || op.includes('USCG')) return 'US Coast Guard';
  if (op.includes('ARMY')) return 'US Army';
  
  return 'US Military';
};

/**
 * Generar SVG de avión para el mapa
 */
const getAircraftSVG = (color, heading) => {
  return `
    <svg width="36" height="36" viewBox="0 0 32 32" style="transform: rotate(${heading}deg); transform-origin: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.8));">
      <path d="M16 2 L18 8 L18 24 L16 30 L14 24 L14 8 Z" 
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <path d="M16 10 L28 20 L26 22 L18 16 L14 16 L6 22 L4 20 Z" 
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <path d="M16 24 L20 28 L19 29 L16 27 L13 29 L12 28 Z" 
            fill="${color}" stroke="#fff" stroke-width="1"/>
      <ellipse cx="16" cy="7" rx="1.5" ry="3" fill="#1a1a2e" stroke="#fff" stroke-width="0.8"/>
    </svg>
  `;
};

/**
 * Formatear duración
 */
const formatDuration = (minutes) => {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

export default function SituationScreenshotView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flights, setFlights] = useState([]);

  // Obtener parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const title = params.get('title') || 'SITUACIÓN ACTIVA';
  const timestamp = params.get('timestamp') || new Date().toISOString();
  const zoom = parseFloat(params.get('zoom')) || 4.5;
  
  // Parsear vuelos desde URL
  useEffect(() => {
    const flightsParam = params.get('flights');
    if (flightsParam) {
      try {
        const decoded = decodeURIComponent(flightsParam);
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`📊 Vuelos recibidos: ${parsed.length}`);
          setFlights(parsed);
        }
      } catch (e) {
        console.error('📊 Error parseando vuelos:', e);
        setError('Error parseando datos de vuelos');
      }
    }
  }, []);

  // Cargar límites de Venezuela desde Supabase
  const loadVenezuelaBoundaries = async (mapInstance) => {
    try {
      console.log('📊 Cargando límites de Venezuela...');
      
      const { data: maritimeData } = await supabase
        .from('maritime_boundaries_cache')
        .select('country_code, country_name, geojson')
        .eq('country_code', 'VEN');

      const { data: terrestrialData } = await supabase
        .from('terrestrial_boundaries_cache')
        .select('country_code, country_name, geojson')
        .eq('country_code', 'VEN');

      const features = [];

      if (maritimeData?.length) {
        maritimeData.forEach(item => {
          if (item.geojson) {
            features.push({
              ...item.geojson,
              properties: { ...item.geojson.properties, iso_sov1: 'VEN', type: 'maritime' }
            });
          }
        });
      }

      if (terrestrialData?.length) {
        terrestrialData.forEach(item => {
          if (item.geojson) {
            features.push({
              ...item.geojson,
              properties: { ...item.geojson.properties, iso_sov1: 'VEN', type: 'terrestrial' }
            });
          }
        });
      }

      if (features.length === 0) {
        console.log('⚠️ No se encontraron límites de Venezuela');
        return;
      }

      const geojson = { type: 'FeatureCollection', features };

      if (mapInstance.getSource('venezuela-boundaries')) {
        mapInstance.removeLayer('venezuela-fill');
        mapInstance.removeLayer('venezuela-line');
        mapInstance.removeSource('venezuela-boundaries');
      }

      mapInstance.addSource('venezuela-boundaries', {
        type: 'geojson',
        data: geojson
      });

      mapInstance.addLayer({
        id: 'venezuela-fill',
        type: 'fill',
        source: 'venezuela-boundaries',
        paint: { 'fill-color': VEN_COLOR, 'fill-opacity': 0.15 }
      });

      mapInstance.addLayer({
        id: 'venezuela-line',
        type: 'line',
        source: 'venezuela-boundaries',
        paint: { 'line-color': VEN_COLOR, 'line-width': 2, 'line-opacity': 0.8 }
      });

      console.log('📊 Límites de Venezuela renderizados');
    } catch (err) {
      console.error('📊 Error cargando límites:', err);
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    const CARACAS_LAT = 10.4806;
    const CARACAS_LON = -66.9036;
    
    console.log('📊 Inicializando mapa de situación');

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

      map.current.on('load', async () => {
        console.log('📊 Mapa cargado');
        setMapLoaded(true);
        await loadVenezuelaBoundaries(map.current);
        setLoading(false);
        
        map.current.once('idle', () => {
          window.screenshotReady = true;
          document.body.classList.add('screenshot-ready');
          console.log('📊 Screenshot de situación listo');
        });
      });

      map.current.on('error', (e) => {
        console.error('📊 Error de mapa:', e);
        setError('Error cargando mapa');
        setLoading(false);
      });

    } catch (e) {
      console.error('📊 Error inicializando mapa:', e);
      setError(e.message);
      setLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [zoom]);

  // Agregar marcadores de todos los vuelos
  useEffect(() => {
    if (!mapLoaded || !map.current || flights.length === 0) return;

    console.log(`📊 Agregando ${flights.length} marcadores`);
    
    const bounds = new mapboxgl.LngLatBounds();
    
    flights.forEach((flight, index) => {
      const color = AIRCRAFT_COLORS[index % AIRCRAFT_COLORS.length];
      const lat = parseFloat(flight.lat || flight.latitude);
      const lon = parseFloat(flight.lon || flight.lng || flight.longitude);
      const heading = parseFloat(flight.heading || flight.track) || 0;
      
      if (!lat || !lon) return;
      
      // Extender bounds
      bounds.extend([lon, lat]);
      
      // Crear marcador
      const el = document.createElement('div');
      el.className = 'flight-marker-situation';
      el.style.cssText = `
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${9999 - index};
        position: relative;
      `;
      el.innerHTML = getAircraftSVG(color, heading);
      
      // Agregar etiqueta
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      `;
      label.textContent = flight.callsign || flight.hex || `VUELO-${index + 1}`;
      el.appendChild(label);
      
      new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([lon, lat])
        .addTo(map.current);
        
      console.log(`📊 Marcador ${index + 1}: ${flight.callsign} en [${lat}, ${lon}]`);
    });
    
    // Ajustar mapa para mostrar todos los vuelos
    if (flights.length > 0 && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 200, left: 80, right: 300 },
        maxZoom: 6,
        duration: 0
      });
    }
  }, [mapLoaded, flights]);

  // Estadísticas
  const totalFlights = flights.length;
  const avgAltitude = flights.length > 0 
    ? Math.round(flights.reduce((sum, f) => sum + (parseFloat(f.alt || f.altitude) || 0), 0) / flights.length)
    : 0;

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-900">
      {/* Estilos */}
      <style>{`
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

      {/* Header - SITUACIÓN ACTIVA */}
      <div className="absolute top-4 left-4 bg-amber-600/95 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-amber-400 shadow-lg shadow-amber-500/30">
        <span className="text-white font-bold text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </span>
        <div className="flex items-center gap-3 mt-1 text-amber-100 text-sm">
          <span className="flex items-center gap-1">
            <Plane size={12} />
            {totalFlights} aeronave{totalFlights !== 1 ? 's' : ''}
          </span>
          {avgAltitude > 0 && (
            <span className="flex items-center gap-1">
              <Gauge size={12} />
              ~{Math.round(avgAltitude / 1000)}k ft
            </span>
          )}
        </div>
      </div>

      {/* Panel lateral derecho - Lista de vuelos */}
      <div className="absolute top-4 right-4 bottom-[70px] w-72 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col">
        {/* Header del panel */}
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-sm">AERONAVES EN ZONA</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {new Date(timestamp).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}
          </p>
        </div>
        
        {/* Lista de vuelos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {flights.map((flight, index) => {
            const color = AIRCRAFT_COLORS[index % AIRCRAFT_COLORS.length];
            const duration = flight.duration_minutes 
              ? formatDuration(flight.duration_minutes)
              : null;
            
            return (
              <div 
                key={flight.hex || index}
                className="bg-slate-800/80 rounded-lg p-3 border-l-4"
                style={{ borderLeftColor: color }}
              >
                {/* Callsign y tipo */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">
                      {flight.callsign || flight.hex}
                    </p>
                    <p className="text-slate-400 text-xs truncate max-w-[140px]">
                      {flight.aircraft_model || flight.type || 'Aeronave Militar'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}30`, color }}>
                      {getOperatorName(flight)}
                    </span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Gauge size={10} className="text-blue-400" />
                    {Math.round((flight.alt || flight.altitude || 0) / 1000)}k ft
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation size={10} className="text-green-400" />
                    {flight.speed || flight.gspeed || '?'} kts
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-amber-400" />
                      {duration}
                    </span>
                  )}
                </div>
                
                {/* Coordenadas */}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                  <MapPin size={8} />
                  <span className="font-mono">
                    {parseFloat(flight.lat || flight.latitude || 0).toFixed(3)}°, 
                    {parseFloat(flight.lon || flight.longitude || 0).toFixed(3)}°
                  </span>
                </div>
              </div>
            );
          })}
          
          {flights.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin aeronaves activas</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel inferior - Resumen */}
      <div 
        className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-600"
        style={{ boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)' }}
      >
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Estadísticas generales */}
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-2 rounded-lg">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Activas</p>
              <p className="text-xl font-bold text-white">{totalFlights}</p>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-10 bg-slate-600" />

          {/* Altitud promedio */}
          {avgAltitude > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Alt. Promedio</p>
                  <p className="text-lg font-bold text-white">{Math.round(avgAltitude / 1000)}k ft</p>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-600" />
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Zona Venezuela */}
          <div className="flex items-center gap-2 bg-red-900/50 px-3 py-2 rounded-lg border border-red-500/50">
            <Shield className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-[10px] text-red-400">ZONA MONITOREADA</p>
              <p className="text-sm text-white font-bold">🇻🇪 Venezuela</p>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark SAE-RADAR */}
      <div className="absolute bottom-[60px] left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-white font-bold text-xs">SAE-RADAR</span>
        <span className="text-slate-400 text-[10px] ml-2">
          {new Date(timestamp).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}
        </span>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Cargando situación...</p>
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

