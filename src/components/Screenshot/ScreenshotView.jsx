import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/maplibre';
import { Plane, MapPin, Gauge, Navigation, Shield, Flag } from 'lucide-react';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

// Colores por categoría
const getCategoryColor = (category) => {
  const colors = {
    military: '#ef4444',
    combat: '#dc2626',
    surveillance: '#f97316',
    tanker: '#eab308',
    transport: '#22c55e',
    passenger: '#3b82f6',
    cargo: '#8b5cf6',
    helicopter: '#06b6d4',
    default: '#64748b'
  };
  return colors[category] || colors.default;
};

// Nombre del país por prefijo ICAO24
const getCountryByICAO24 = (icao24) => {
  if (!icao24) return { name: 'Desconocido', flag: '🏳️' };
  const prefix = icao24.substring(0, 2).toUpperCase();
  const countries = {
    'A0': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A1': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A2': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A3': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A4': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A5': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A6': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A7': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A8': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'A9': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'AA': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'AB': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'AC': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'AD': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'AE': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
    'AF': { name: 'Estados Unidos', flag: '🇺🇸', military: true },
  };
  return countries[prefix] || { name: 'Desconocido', flag: '🏳️' };
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
 * Esta vista no requiere autenticación y está diseñada para
 * ser capturada por el servicio de screenshots para Telegram.
 * 
 * Parámetros URL:
 * - screenshot_token: Token secreto de autorización
 * - flight: ICAO24 hex del vuelo
 * - callsign: Callsign del vuelo
 * - lat: Latitud para centrar el mapa
 * - lon: Longitud para centrar el mapa
 * - zoom: Nivel de zoom (default: 7)
 */
export default function ScreenshotView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const flightId = params.get('flight');
  const callsign = params.get('callsign');
  const lat = parseFloat(params.get('lat')) || 10.5;
  const lon = parseFloat(params.get('lon')) || -66.9;
  const zoom = parseFloat(params.get('zoom')) || 7;

  // Inicializar mapa
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    console.log('📸 Inicializando mapa en coordenadas:', lat, lon);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satélite para mejor visualización
        center: [lon, lat],
        zoom: zoom,
        attributionControl: false,
        preserveDrawingBuffer: true, // Importante para screenshots
        fadeDuration: 0, // Sin fade para carga más rápida
      });

      map.current.on('style.load', () => {
        console.log('📸 Estilo del mapa cargado');
      });

      map.current.on('load', () => {
        console.log('📸 Mapa completamente cargado');
        setMapLoaded(true);
        setLoading(false);
        
        // Agregar marcador si hay coordenadas
        if (lat && lon) {
          // Crear elemento del marcador
          const el = document.createElement('div');
          el.className = 'flight-marker';
          el.style.cssText = `
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border: 4px solid #fef2f2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6);
            font-size: 24px;
          `;
          el.innerHTML = '✈️';
          
          new mapboxgl.Marker(el)
            .setLngLat([lon, lat])
            .addTo(map.current);
            
          console.log('📸 Marcador agregado en:', lon, lat);
        }
        
        // Marcar como listo después de que las tiles carguen
        map.current.once('idle', () => {
          console.log('📸 Mapa idle - tiles cargadas');
          window.screenshotReady = true;
          document.body.classList.add('screenshot-ready');
          console.log('📸 Screenshot listo');
        });
      });

      map.current.on('error', (e) => {
        console.error('📸 Error de mapa:', e);
        setError('Error cargando mapa: ' + (e.error?.message || 'desconocido'));
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
    if (!callsign && !flightId) {
      setLoading(false);
      return;
    }

    const fetchFlightData = async () => {
      try {
        // Intentar obtener datos del vuelo desde la Edge Function
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
          
          // Buscar el vuelo específico
          const flight = flights.find(f => 
            (flightId && f.hex?.toUpperCase() === flightId.toUpperCase()) ||
            (callsign && f.callsign?.toUpperCase().includes(callsign.toUpperCase()))
          );
          
          if (flight) {
            console.log('📸 Vuelo encontrado:', flight);
            setFlightData(flight);
            
            // Centrar mapa en el vuelo real si tiene coordenadas
            if (map.current && flight.lat && flight.lon) {
              map.current.flyTo({
                center: [flight.lon, flight.lat],
                zoom: 8,
                duration: 1000
              });
            }
          } else {
            console.log('📸 Vuelo no encontrado en datos actuales');
          }
        }
      } catch (e) {
        console.error('Error buscando vuelo:', e);
        // No es crítico, continuamos sin datos del vuelo
      }
    };

    fetchFlightData();
  }, [callsign, flightId]);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-900">
      {/* Estilos para animación y mapa */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .mapboxgl-map {
          width: 100% !important;
          height: 100% !important;
        }
        .mapboxgl-canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      {/* Mapa a pantalla completa */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Panel de información del vuelo - Estilo FlightDetailsPanel */}
      {(callsign || flightId || flightData) && (() => {
        const color = getCategoryColor('military');
        const countryInfo = getCountryByICAO24(flightData?.hex || flightId);
        const altitude = flightData?.alt || params.get('alt') || 0;
        const speed = flightData?.gspeed || params.get('speed') || 0;
        const heading = flightData?.track || params.get('heading') || 0;
        const aircraftType = flightData?.type || params.get('type') || 'Aeronave Militar';
        const registration = flightData?.reg || params.get('reg') || 'N/A';
        
        return (
          <div 
            className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-auto sm:top-20 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-600 shadow-2xl overflow-hidden sm:w-[340px]"
            style={{
              boxShadow: '0 10px 40px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
            }}
          >
            {/* Header con callsign y modelo */}
            <div className="px-4 py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                {/* Icono */}
                <div 
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ 
                    backgroundColor: `${color}15`, 
                    border: `2px solid ${color}`,
                    boxShadow: `0 0 20px ${color}40`
                  }}
                >
                  <Plane size={28} color={color} strokeWidth={2.5} />
                </div>
                
                {/* Callsign y tipo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {flightData?.callsign || callsign || flightId || 'UNKNOWN'}
                    </h1>
                  </div>
                  <p className="text-sm text-cyan-400 font-medium truncate">
                    {aircraftType}
                  </p>
                  <span 
                    className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color,
                      border: `1px solid ${color}50`
                    }}
                  >
                    <Shield size={10} /> MILITAR / GOBIERNO
                  </span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-slate-700/30">
              <div className="bg-blue-500/10 p-3 text-center">
                <p className="text-[10px] text-blue-400 uppercase font-medium flex items-center justify-center gap-1">
                  <Gauge size={10} /> Altitud
                </p>
                <p className="text-lg font-bold text-white">{Math.round(altitude / 1000)}k</p>
                <p className="text-[10px] text-slate-400">ft</p>
              </div>
              <div className="bg-green-500/10 p-3 text-center">
                <p className="text-[10px] text-green-400 uppercase font-medium flex items-center justify-center gap-1">
                  <Navigation size={10} /> Velocidad
                </p>
                <p className="text-lg font-bold text-white">{speed}</p>
                <p className="text-[10px] text-slate-400">kts</p>
              </div>
              <div className="bg-purple-500/10 p-3 text-center">
                <p className="text-[10px] text-purple-400 uppercase font-medium flex items-center justify-center gap-1">
                  <Flag size={10} /> País
                </p>
                <p className="text-2xl">{countryInfo.flag}</p>
                <p className="text-[10px] text-slate-400">{countryInfo.name}</p>
              </div>
            </div>

            {/* Detalles adicionales */}
            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> Posición
                </span>
                <span className="font-mono text-white">
                  {(flightData?.lat || lat)?.toFixed(4)}°, {(flightData?.lon || lon)?.toFixed(4)}°
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Rumbo</span>
                <span className="font-mono text-white">{heading}° ({getCardinal(heading)})</span>
              </div>
              {registration !== 'N/A' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Registro</span>
                  <span className="font-mono font-bold text-white">{registration}</span>
                </div>
              )}
              {(flightData?.hex || flightId) && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ICAO24</span>
                  <span className="font-mono text-cyan-400">{(flightData?.hex || flightId)?.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Footer con zona de incursión */}
            <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/30">
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-xs font-medium">🌊 Zona de Incursión</span>
                <span className="text-white text-xs font-bold">Espacio Aéreo Venezolano</span>
              </div>
            </div>
          </div>
        );
      })()}

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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Watermark SAE-RADAR */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
        <span className="text-white font-bold text-sm">SAE-RADAR</span>
        <span className="text-slate-400 text-xs ml-2">
          {new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}
        </span>
      </div>

      {/* Indicador de incursión */}
      <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-400 animate-pulse">
        <span className="text-white font-bold">🚨 INCURSIÓN DETECTADA</span>
      </div>
    </div>
  );
}
