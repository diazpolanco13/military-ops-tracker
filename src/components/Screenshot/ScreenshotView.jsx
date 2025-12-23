import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/maplibre';
import { supabase } from '../../lib/supabase';
import { Plane, Gauge, Navigation, MapPin, Shield, Compass } from 'lucide-react';

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
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
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

  // Buscar datos del vuelo desde FlightRadar (opcional)
  useEffect(() => {
    if (!callsign && !flightId) return;

    const fetchFlightData = async () => {
      try {
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
            
            if (map.current && flight.lat && flight.lon) {
              map.current.flyTo({
                center: [flight.lon, flight.lat],
                zoom: 6,
                duration: 1000
              });
            }
          }
        }
      } catch (e) {
        console.error('Error buscando vuelo:', e);
      }
    };

    fetchFlightData();
  }, [callsign, flightId]);

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

      {/* Panel inferior tipo Bottom Sheet - Estilo completo de la app */}
      <div 
        className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-600 rounded-t-2xl shadow-2xl"
        style={{
          boxShadow: '0 -10px 40px -5px rgba(0, 0, 0, 0.5)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
        }}
      >
        {/* Handle decorativo */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header: Callsign, tipo y stats rápidos */}
        <div className="px-4 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {/* Icono de avión */}
            <div 
              className="p-2.5 rounded-xl shrink-0"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                border: '2px solid #ef4444',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Plane size={28} color="#ef4444" strokeWidth={2.5} />
            </div>
            
            {/* Callsign y tipo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {displayCallsign}
                </h1>
              </div>
              <p className="text-sm text-cyan-400 font-medium truncate">
                {displayType}
              </p>
              <span 
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.5)'
                }}
              >
                🎖️ UNITED STATES - AIR FORCE
              </span>
            </div>

            {/* Stats rápidos */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Alt</p>
                <p className="text-lg font-bold text-white">{Math.round(displayAlt / 1000)}k ft</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Vel</p>
                <p className="text-lg font-bold text-white">{speedKmh} km/h</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-medium">País</p>
                <p className="text-2xl">{countryInfo.flag}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de información detallada - 2 columnas */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {/* Columna 1: AERONAVE */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Plane size={14} className="text-purple-400" />
              <span className="text-[10px] font-bold text-purple-300 uppercase">Aeronave</span>
            </div>
            <p className="text-sm font-bold text-white mb-2">{displayType}</p>
            
            <div className="space-y-1.5 text-xs">
              {displayReg && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Registro</span>
                  <span className="font-mono font-bold text-white">{displayReg}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">País</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span>{countryInfo.flag}</span>
                  <span className="text-cyan-400">{countryInfo.name}</span>
                  {countryInfo.military && <span className="text-[8px] text-red-400">(MIL)</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Categoría</span>
                <span className="font-semibold flex items-center gap-1 text-red-400">
                  <Shield size={10} /> Militar/Gobierno
                </span>
              </div>
              {(flightData?.hex || flightId) && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ICAO24</span>
                  <span className="font-mono text-cyan-400">{(flightData?.hex || flightId)?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Columna 2: POSICIÓN */}
          <div className="bg-slate-800/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-yellow-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Posición</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Latitud</span>
                <span className="font-mono text-white">{displayLat.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Longitud</span>
                <span className="font-mono text-white">{displayLon.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rumbo</span>
                <span className="font-mono text-white flex items-center gap-1">
                  <Compass size={10} className="text-purple-400" />
                  {displayHeading}° ({getCardinal(displayHeading)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Altitud</span>
                <span className="font-mono text-white">{displayAlt.toLocaleString()} ft ({(displayAlt * 0.3048 / 1000).toFixed(1)} km)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Velocidad</span>
                <span className="font-mono text-white">{speedKmh} km/h ({displaySpeed} kts)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Zona de incursión */}
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-xs font-medium">🌊 Zona de Incursión</span>
          </div>
          <span className="text-white text-xs font-bold">Espacio Aéreo Venezolano</span>
        </div>
      </div>

      {/* Watermark SAE-RADAR - Esquina inferior izquierda, encima del panel */}
      <div className="absolute bottom-[280px] left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
        <span className="text-white font-bold text-sm">SAE-RADAR</span>
        <span className="text-slate-400 text-xs ml-2">
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
