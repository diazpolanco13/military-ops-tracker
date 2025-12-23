import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/maplibre';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

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

      {/* Panel de información del vuelo */}
      {(callsign || flightId || flightData) && (
        <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 p-4 min-w-[280px] shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h3 className="text-white font-bold text-lg">
                {flightData?.callsign || callsign || flightId || 'Aeronave'}
              </h3>
              <p className="text-slate-400 text-sm">
                {flightData?.type || 'Vuelo Militar'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            {flightData?.hex && (
              <div className="flex justify-between">
                <span className="text-slate-400">ICAO24:</span>
                <span className="text-white font-mono">{flightData.hex}</span>
              </div>
            )}
            {(flightData?.alt || lat) && (
              <div className="flex justify-between">
                <span className="text-slate-400">Altitud:</span>
                <span className="text-white">{flightData?.alt?.toLocaleString() || 'N/A'} ft</span>
              </div>
            )}
            {flightData?.gspeed && (
              <div className="flex justify-between">
                <span className="text-slate-400">Velocidad:</span>
                <span className="text-white">{flightData.gspeed} kts</span>
              </div>
            )}
            {flightData?.track && (
              <div className="flex justify-between">
                <span className="text-slate-400">Rumbo:</span>
                <span className="text-white">{flightData.track}°</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Posición:</span>
              <span className="text-white font-mono text-xs">
                {(flightData?.lat || lat)?.toFixed(4)}°, {(flightData?.lon || lon)?.toFixed(4)}°
              </span>
            </div>
          </div>
        </div>
      )}

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
