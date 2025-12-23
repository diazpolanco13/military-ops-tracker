import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/maplibre';
import { useFlightRadar } from '../../hooks/useFlightRadar';
import FlightLayer from '../FlightRadar/FlightLayer';
import FlightDetailsPanel from '../FlightRadar/FlightDetailsPanel';

// Configurar token de Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * 📸 SCREENSHOT VIEW - Vista pública para capturas de pantalla
 * 
 * Esta vista no requiere autenticación y está diseñada para
 * ser capturada por el servicio de screenshots para Telegram.
 * 
 * Parámetros URL:
 * - token: Token secreto de autorización
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
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [targetFlight, setTargetFlight] = useState(null);

  // Obtener parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const flightId = params.get('flight');
  const callsign = params.get('callsign');
  const lat = parseFloat(params.get('lat')) || 10.5;
  const lon = parseFloat(params.get('lon')) || -66.9;
  const zoom = parseFloat(params.get('zoom')) || 7;

  // Hook de FlightRadar - solo militar activo
  const {
    flights,
    loading: flightsLoading,
    categoryFilters,
    setFilters,
  } = useFlightRadar({
    autoUpdate: true,
    updateInterval: 5000, // Actualizar cada 5 segundos para capturar el vuelo
    enabled: true,
    militaryOnly: false,
  });

  // Activar solo militar al inicio
  useEffect(() => {
    setFilters({ military: true });
  }, [setFilters]);

  // Inicializar mapa
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lon, lat],
      zoom: zoom,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lat, lon, zoom]);

  // Buscar y seleccionar el vuelo objetivo
  useEffect(() => {
    if (!flights.length || selectedFlight) return;

    // Buscar por flightId (hex) o callsign
    const target = flights.find(f => 
      (flightId && f.hex?.toUpperCase() === flightId.toUpperCase()) ||
      (callsign && f.callsign?.toUpperCase() === callsign.toUpperCase())
    );

    if (target) {
      setTargetFlight(target);
      setSelectedFlight(target);
      
      // Centrar mapa en el vuelo
      if (map.current && target.lat && target.lon) {
        map.current.flyTo({
          center: [target.lon, target.lat],
          zoom: 8,
          duration: 1000
        });
      }
    }
  }, [flights, flightId, callsign, selectedFlight]);

  // Marcar como listo para screenshot cuando el vuelo esté seleccionado
  useEffect(() => {
    if (selectedFlight && mapLoaded) {
      // Agregar clase al body para indicar que está listo
      document.body.classList.add('screenshot-ready');
      
      // También exponer en window para que Puppeteer pueda verificar
      window.screenshotReady = true;
      window.selectedFlight = selectedFlight;
    }
  }, [selectedFlight, mapLoaded]);

  const flightsWithCategory = flights.filter(f => {
    const hasActiveFilters = Object.values(categoryFilters).some(Boolean);
    if (!hasActiveFilters) return false;
    return categoryFilters[f.flightCategory] === true;
  }).slice(0, 50);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-900">
      {/* Mapa a pantalla completa */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Capa de vuelos */}
      {mapLoaded && map.current && (
        <FlightLayer
          map={map.current}
          flights={flightsWithCategory}
          onFlightClick={setSelectedFlight}
          selectedFlight={selectedFlight}
        />
      )}

      {/* Panel de detalles del vuelo */}
      {selectedFlight && (
        <FlightDetailsPanel
          flight={selectedFlight}
          onClose={() => {}} // No permitir cerrar en modo screenshot
          compact={false}
        />
      )}

      {/* Indicador de carga */}
      {flightsLoading && !selectedFlight && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Buscando vuelo {callsign || flightId}...</p>
          </div>
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
      {selectedFlight && (
        <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-400 animate-pulse">
          <span className="text-white font-bold">🚨 INCURSIÓN DETECTADA</span>
        </div>
      )}
    </div>
  );
}

