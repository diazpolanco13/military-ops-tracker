import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLES } from '../../lib/maplibre';
import { 
  ArrowLeft, 
  Plane, 
  MapPin, 
  Clock, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  History,
  Edit3,
  Save,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Gauge,
  Target,
  Shield,
  Route,
  Activity,
  Camera,
  Upload,
  X,
  Star,
  Trash2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Globe,
  Info,
  BarChart3,
  Maximize2,
  Users,
  Ruler,
  Zap,
  Anchor,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { useAircraftRegistry } from '../../hooks/useAircraftRegistry';
import { useAircraftImages } from '../../hooks/useAircraftImages';
import { supabase, withTimeout } from '../../lib/supabase';
import { batchGeocodeHistory, updateHistoryWithCountries, getCountryNameEs } from '../../services/geocodingService';
import { getCountryByICAO24 } from '../../services/flightRadarService';

// Timeouts para consultas
const QUERY_TIMEOUT = 8000;       // Consultas simples (8 segundos)
const HISTORY_TIMEOUT = 20000;    // Historial - más tiempo porque puede ser grande (20 segundos)
const HISTORY_LIMIT_INITIAL = 50; // Carga inicial rápida
const HISTORY_LIMIT_FULL = 200;   // Carga completa bajo demanda

/**
 * 🎖️ VISTA DE DETALLE DE AERONAVE (PANTALLA COMPLETA)
 * 
 * Layout:
 * - Panel Izquierdo: Imagen grande arriba + Especificaciones abajo
 * - Panel Derecho: Tabs con información, estadísticas, historial, galería
 */
export default function AircraftDetailView({ aircraft, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(aircraft?.notes || '');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [modelData, setModelData] = useState(aircraft?.model || null);
  const [lastLocation, setLastLocation] = useState(null);
  

  const { updateNotes, recalculateBase } = useAircraftRegistry();
  
  // Cargar modelo del catálogo si no viene incluido (con timeout)
  useEffect(() => {
    let cancelled = false;
    
    // Si ya tenemos modelo cargado o no hay tipo, no hacer nada
    if (modelData || !aircraft?.aircraft_type) return;
    
    const loadModelFromCatalog = async () => {
      try {
        const result = await withTimeout(
          supabase
            .from('aircraft_model_catalog')
            .select('*')
            .eq('aircraft_type', aircraft.aircraft_type)
            .limit(1),
          QUERY_TIMEOUT
        );

        const row = result.data?.[0] || null;
        if (!cancelled && !result.error && row) {
          setModelData(row);
        }
      } catch (err) {
        // Silencioso - timeout o el modelo simplemente no está en el catálogo
        console.warn('[AircraftDetailView] Model catalog timeout/error:', err.message);
      }
    };
    
    loadModelFromCatalog();
    
    return () => {
      cancelled = true;
    };
  }, [aircraft?.aircraft_type, modelData]);

  // Cargar última ubicación (con timeout)
  useEffect(() => {
    let cancelled = false;

    if (!aircraft?.icao24) {
      setLastLocation(null);
      return;
    }

    const loadLastLocation = async () => {
      try {
        const result = await withTimeout(
          supabase
            .from('aircraft_location_history')
            .select('callsign, latitude, longitude, country_code, country_name, detected_at, origin_icao, destination_icao')
            .eq('icao24', aircraft.icao24.toUpperCase())
            .order('detected_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          QUERY_TIMEOUT
        );

        if (!cancelled && !result.error) {
          setLastLocation(result.data || null);
        }
      } catch (e) {
        // Timeout o error - silencioso
        console.warn('[AircraftDetailView] Last location timeout/error:', e.message);
        if (!cancelled) setLastLocation(null);
      }
    };

    loadLastLocation();

    return () => {
      cancelled = true;
    };
  }, [aircraft?.icao24]);

  const { 
    images, 
    loading: loadingImages,
    uploading,
    uploadImage,
    deleteImage,
    setPrimaryImage 
  } = useAircraftImages(aircraft?.aircraft_type);

  // Si cambió el tamaño de la galería y el índice quedó fuera de rango, clamp a 0
  useEffect(() => {
    if (currentImageIndex >= images.length && images.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  // Estado para historial paginado
  const [historyLimit, setHistoryLimit] = useState(HISTORY_LIMIT_INITIAL);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);

  // Cargar historial cuando se selecciona la tab "history" (con timeout largo)
  useEffect(() => {
    let cancelled = false;
    
    if (activeTab !== 'history' || !aircraft?.icao24) {
      return;
    }
    
    const fetchHistory = async () => {
      setLoadingHistory(true);
      setHistoryError(null);
      
      try {
        // Usar timeout más largo y límite configurable
        const result = await withTimeout(
          supabase
            .from('aircraft_location_history')
            .select('*')
            .eq('icao24', aircraft.icao24.toUpperCase())
            .order('detected_at', { ascending: false })
            .limit(historyLimit + 1),  // +1 para saber si hay más
          HISTORY_TIMEOUT
        );
        
        if (cancelled) return;
        
        if (result.error) throw result.error;
        
        const data = result.data || [];
        
        // Verificar si hay más registros
        if (data.length > historyLimit) {
          setHasMoreHistory(true);
          data.pop(); // Quitar el extra
        } else {
          setHasMoreHistory(false);
        }
        
        // Hacer geocoding de registros sin país (en background, sin bloquear)
        const recordsWithoutCountry = data.filter(r => !r.country_code && r.latitude && r.longitude);
        
        if (recordsWithoutCountry.length > 0) {
          // Procesar en background sin bloquear la UI
          batchGeocodeHistory(recordsWithoutCountry.slice(0, 10))
            .then(geocoded => {
              if (!cancelled) {
                updateHistoryWithCountries(geocoded);
                const updatedHistory = data.map(h => {
                  const geocodedItem = geocoded.find(g => g.id === h.id);
                  if (geocodedItem?.country) {
                    return {
                      ...h,
                      country_code: geocodedItem.country.country_code,
                      country_name: geocodedItem.country.country_name
                    };
                  }
                  return h;
                });
                setHistory(updatedHistory);
              }
            })
            .catch(console.error);
        }
        
        setHistory(data);
      } catch (err) {
        console.error('[AircraftDetailView] Error/timeout loading history:', err);
        if (!cancelled) {
          setHistoryError(err.message?.includes('Timeout') 
            ? 'Tiempo de espera agotado. Intenta de nuevo.' 
            : err.message);
          setHistory([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };
    
    fetchHistory();
    
    return () => {
      cancelled = true;
    };
  }, [activeTab, aircraft?.icao24, historyLimit]);

  // Handler para cargar más historial
  const loadMoreHistory = () => {
    setHistoryLimit(HISTORY_LIMIT_FULL);
  };

  if (!aircraft) return null;

  const a = aircraft;
  const primaryCallsign =
    (lastLocation?.callsign && String(lastLocation.callsign).trim()) ||
    (a.callsigns_used && a.callsigns_used.length > 0 ? a.callsigns_used[a.callsigns_used.length - 1] : null);
  const lastSeen = a.last_seen ? new Date(a.last_seen) : null;
  const firstSeen = a.first_seen ? new Date(a.first_seen) : null;

  // Formatear fechas
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Guardar notas
  const handleSaveNotes = async () => {
    const result = await updateNotes(a.icao24, notes);
    if (result.success) {
      setIsEditingNotes(false);
    }
  };

  // Recalcular base
  const handleRecalculateBase = async () => {
    await recalculateBase(a.icao24);
  };

  // Imagen actual para mostrar
  const currentImage = images[currentImageIndex];
  const hasImages = images.length > 0;

  // Navegar imágenes
  const goToPrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const tabs = [
    { id: 'info', label: 'Identificación', icon: Info },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'gallery', label: 'Galería', icon: Camera },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header Minimalista */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Volver al Registro</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Bandera del país del avión (basado en ICAO24) */}
          {(() => {
            const ci = getCountryByICAO24(a.icao24);
            return ci && ci.code !== 'XX' ? (
              <div className="flex flex-col items-center shrink-0" title={`${ci.name}${ci.military ? ' (Militar)' : ''}`}>
                <span className="text-2xl sm:text-3xl leading-none">{ci.flag}</span>
                {ci.military && (
                  <span className="text-[7px] sm:text-[8px] font-bold uppercase text-red-400 mt-0.5">MIL</span>
                )}
              </div>
            ) : null;
          })()}
          <div className="flex flex-col items-center sm:items-start leading-tight min-w-0">
            <span className="font-mono text-xl sm:text-2xl text-amber-300 font-extrabold tracking-wide max-w-[180px] sm:max-w-none truncate">
              {primaryCallsign || 'SIN CALLSIGN'}
            </span>
            <span className="font-mono text-xs sm:text-sm text-sky-400/90 max-w-[180px] sm:max-w-none truncate">
              {a.icao24}
            </span>
          </div>
          {a.military_branch && (
            <span className="text-[10px] sm:text-xs bg-sky-500/20 text-sky-300 px-2 py-1 rounded-full font-medium leading-none max-w-[140px] truncate">
              {getBranchLabel(a.military_branch)}
            </span>
          )}
          {a.is_new_today && (
            <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium animate-pulse leading-none">
              NUEVA
            </span>
          )}
        </div>

        <div className="w-24" />
      </header>

      {/* Main Content */}
      {/* En móvil evitamos scrolls anidados (mala UX) y dejamos que la página scrollee completa.
          En desktop mantenemos el split con scroll interno. */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        
        {/* ==================== */}
        {/* LEFT PANEL - Imagen + Especificaciones */}
        {/* ==================== */}
        <div className="lg:w-1/2 xl:w-2/5 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 lg:border-r border-slate-700/50 overflow-visible lg:overflow-hidden">
          
          {/* Imagen Grande */}
          <div className="relative flex-shrink-0 h-[240px] sm:h-[320px] lg:h-[400px] flex items-center justify-center bg-slate-950 p-4">
            {loadingImages ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                <span className="text-slate-400 text-sm">Cargando imágenes...</span>
              </div>
            ) : hasImages ? (
              <>
                <img
                  src={currentImage.image_url}
                  alt={currentImage.image_caption || a.aircraft_model}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => setIsLightboxOpen(true)}
                />

                {/* Navegación de imágenes */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Pantalla completa */}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/80 text-white transition-all"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Indicadores y caption */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                    {images.length > 1 && (
                      <div className="flex justify-center gap-1.5 mb-2">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? 'bg-sky-400 w-5' : 'bg-slate-500 hover:bg-slate-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {currentImage.image_caption && (
                      <p className="text-white/90 text-xs text-center">{currentImage.image_caption}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-24 h-24 rounded-2xl bg-slate-800 flex items-center justify-center">
                  <Plane className="w-12 h-12 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Sin imágenes disponibles</p>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Subir imagen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Título del modelo */}
          <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-900/80 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {a.aircraft_model || a.aircraft_type || 'Modelo desconocido'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              {modelData?.manufacturer && (
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {modelData?.manufacturer}
                </span>
              )}
              {modelData?.category && (
                <span className="px-2 py-0.5 rounded-full bg-slate-700/80 text-xs">
                  {getCategoryLabel(modelData?.category)}
                </span>
              )}
              {modelData?.country_origin && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {modelData?.country_origin}
                </span>
              )}
            </div>
          </div>

          {/* Especificaciones del avión */}
          {/* Móvil: que crezca naturalmente (sin franja minúscula); Desktop: scroll interno */}
          <div className="p-5 lg:flex-1 lg:overflow-y-auto custom-scrollbar-transparent">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Especificaciones Técnicas
            </h3>
            
            {modelData ? (
              <div className="grid grid-cols-2 gap-3">
                {modelData?.max_speed_knots && (
                  <SpecCard 
                    icon={Gauge}
                    label="Velocidad máx"
                    value={`${modelData?.max_speed_knots} kts`}
                    color="sky"
                  />
                )}
                {modelData?.cruise_speed_knots && (
                  <SpecCard 
                    icon={Zap}
                    label="Velocidad crucero"
                    value={`${modelData?.cruise_speed_knots} kts`}
                    color="green"
                  />
                )}
                {modelData?.max_altitude_ft && (
                  <SpecCard 
                    icon={TrendingUp}
                    label="Altitud máx"
                    value={`${(modelData?.max_altitude_ft / 1000).toFixed(0)}k ft`}
                    color="purple"
                  />
                )}
                {modelData?.range_nm && (
                  <SpecCard 
                    icon={Route}
                    label="Alcance"
                    value={`${modelData?.range_nm.toLocaleString()} nm`}
                    color="amber"
                  />
                )}
                {modelData?.crew_count !== undefined && modelData?.crew_count !== null && (
                  <SpecCard 
                    icon={Users}
                    label="Tripulación"
                    value={`${modelData?.crew_count} personas`}
                    color="pink"
                  />
                )}
                {modelData?.wingspan_m && (
                  <SpecCard 
                    icon={Ruler}
                    label="Envergadura"
                    value={`${modelData?.wingspan_m} m`}
                    color="orange"
                  />
                )}
                {modelData?.length_m && (
                  <SpecCard 
                    icon={Ruler}
                    label="Longitud"
                    value={`${modelData?.length_m} m`}
                    color="teal"
                  />
                )}
                {modelData?.mtow_kg && (
                  <SpecCard 
                    icon={Anchor}
                    label="Peso máx despegue"
                    value={`${(modelData?.mtow_kg / 1000).toFixed(0)}t`}
                    color="slate"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Sin especificaciones disponibles</p>
              </div>
            )}

            {/* Operadores */}
            {modelData?.operated_by && modelData?.operated_by.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Operadores
                </h4>
                <div className="flex flex-wrap gap-2">
                  {modelData?.operated_by.map((op, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300 border border-slate-600/50">
                      {op}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rol principal */}
            {modelData?.primary_role && (
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Rol Principal
                </h4>
                <p className="text-white text-sm bg-slate-700/30 rounded-lg px-4 py-3 border border-slate-600/30">
                  {modelData?.primary_role}
                </p>
              </div>
            )}

            {/* Wikipedia link */}
            {modelData?.wikipedia_url && (
              <div className="mt-6">
                <a
                  href={modelData?.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sky-400 hover:text-sky-300 text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver en Wikipedia
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ==================== */}
        {/* RIGHT PANEL - Tabs con información */}
        {/* ==================== */}
        <div className="lg:w-1/2 xl:w-3/5 flex flex-col bg-slate-800/30 overflow-visible lg:overflow-hidden">
          
          {/* Tabs */}
          <div className="flex gap-1 px-4 sm:px-6 py-3 bg-slate-900/50 border-b border-slate-700/50 overflow-x-auto flex-nowrap flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {/* Móvil: scroll del contenedor principal; Desktop: scroll interno */}
          <div className="p-4 sm:p-6 lg:flex-1 lg:overflow-y-auto custom-scrollbar-transparent">
            {activeTab === 'info' && (
              <InfoTab 
                aircraft={a} 
                modelData={modelData}
                lastLocation={lastLocation}
                notes={notes}
                setNotes={setNotes}
                isEditingNotes={isEditingNotes}
                setIsEditingNotes={setIsEditingNotes}
                onSaveNotes={handleSaveNotes}
                onRecalculateBase={handleRecalculateBase}
              />
            )}
            {activeTab === 'stats' && (
              <StatsTab 
                aircraft={a} 
                firstSeen={firstSeen}
                lastSeen={lastSeen}
                formatDate={formatDate}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab 
                history={history}
                loading={loadingHistory}
                error={historyError}
                formatDate={formatDate}
                hasMore={hasMoreHistory}
                onLoadMore={loadMoreHistory}
                onRetry={() => {
                  setHistoryLimit(HISTORY_LIMIT_INITIAL);
                  setHistoryError(null);
                }}
              />
            )}
            {activeTab === 'gallery' && (
              <GalleryTab 
                aircraftType={a.aircraft_type}
                aircraftModel={a.aircraft_model}
                images={images}
                uploading={uploading}
                onUpload={uploadImage}
                onDelete={deleteImage}
                onSetPrimary={setPrimaryImage}
                onImageClick={(idx) => {
                  setCurrentImageIndex(idx);
                  setIsLightboxOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && hasImages && (
        <Lightbox
          images={images}
          currentIndex={currentImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={goToPrevImage}
          onNext={goToNextImage}
          onIndexChange={setCurrentImageIndex}
          aircraftModel={a.aircraft_model}
        />
      )}
    </div>
  );
}

// =============================================
// LIGHTBOX
// =============================================
function Lightbox({ images, currentIndex, onClose, onPrev, onNext, onIndexChange, aircraftModel }) {
  const img = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <img
        src={img.image_url}
        alt={img.image_caption || aircraftModel}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <div className="absolute bottom-6 left-6 right-6 text-center">
        <div className="inline-block bg-black/70 backdrop-blur-md rounded-xl px-6 py-4">
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mb-3">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onIndexChange(idx); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
          <p className="text-white text-sm">{img.image_caption || 'Sin descripción'}</p>
          {img.image_source && (
            <p className="text-white/60 text-xs mt-1">Fuente: {img.image_source}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// TAB: IDENTIFICACIÓN
// =============================================
function InfoTab({ aircraft, modelData, lastLocation, notes, setNotes, isEditingNotes, setIsEditingNotes, onSaveNotes, onRecalculateBase }) {
  const a = aircraft;
  const baseCountryCode = a.probable_country;
  const baseCountryLabel = baseCountryCode === 'PR'
    ? 'Puerto Rico (Territorio de USA)'
    : (getCountryNameEs(baseCountryCode) || baseCountryCode);
  const baseCountryFlag = baseCountryCode === 'PR' ? '🇵🇷' : null;

  return (
    <div className="space-y-6">
      {/* Identificación */}
      <Section title="Datos de Identificación">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
          <InfoRow label="ICAO24 (Hex)" value={a.icao24} mono />
          <InfoRow label="Tipo de aeronave" value={a.aircraft_type || 'Desconocido'} />
          <InfoRow label="Modelo" value={a.aircraft_model || 'Desconocido'} />
          {modelData?.category && (
            <InfoRow label="Categoría" value={getCategoryLabel(modelData?.category)} />
          )}
          {modelData?.manufacturer && (
            <InfoRow label="Fabricante" value={modelData?.manufacturer} />
          )}
          <InfoRow label="Rama militar" value={getBranchLabel(a.military_branch) || 'No identificada'} />
          {/* País del avión (basado en ICAO24) */}
          {(() => {
            const countryInfo = getCountryByICAO24(a.icao24);
            return countryInfo && countryInfo.code !== 'XX' ? (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>País del avión</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{countryInfo.flag}</span>
                  <span className="text-sm font-medium text-white">{countryInfo.name}</span>
                  {countryInfo.military && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      MIL
                    </span>
                  )}
                </div>
              </div>
            ) : null;
          })()}
          {lastLocation?.country_code && (
            <InfoRow
              label="Último país detectado"
              value={getCountryNameEs(lastLocation.country_code) || lastLocation.country_name || lastLocation.country_code}
              icon={Globe}
            />
          )}
          {(lastLocation?.latitude && lastLocation?.longitude) && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Última posición</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-sky-300 hover:text-sky-200 transition-colors"
                title="Ver en Google Maps"
              >
                {Number(lastLocation.latitude).toFixed(4)}°, {Number(lastLocation.longitude).toFixed(4)}°
              </a>
            </div>
          )}
        </div>
      </Section>

      {/* Callsigns usados */}
      {a.callsigns_used && a.callsigns_used.length > 0 && (
        <Section title="Callsigns Usados">
          <div className="flex flex-wrap gap-2">
            {a.callsigns_used.map((cs, i) => (
              <span 
                key={i}
                className="font-mono text-sm bg-slate-700/80 px-3 py-2 rounded-lg text-sky-300 border border-slate-600"
              >
                {cs}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Base probable */}
      <Section title="Base Probable">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-xl p-4 border border-amber-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-lg bg-amber-500/20">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-medium text-white text-base sm:text-lg leading-snug break-words min-w-0">
                {a.probable_base_name || 'No determinada'}
              </span>
            </div>
            {a.base_confidence > 0 && (
              <span className={`self-start sm:self-auto text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                a.base_confidence >= 70 ? 'bg-green-500/20 text-green-400' :
                a.base_confidence >= 40 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {a.base_confidence}% confianza
              </span>
            )}
          </div>
          {a.probable_base_icao && (
            <div className="text-sm text-slate-400 mb-3 ml-0 sm:ml-12 break-words">
              ICAO: <span className="font-mono text-slate-300">{a.probable_base_icao}</span>
              {a.probable_country && (
                <span className="ml-2">
                  ({baseCountryFlag ? `${baseCountryFlag} ` : ''}{baseCountryLabel || a.probable_country})
                </span>
              )}
            </div>
          )}
          {!a.probable_base_icao && a.callsigns_used?.length > 0 && (
            <div className="text-xs text-slate-500 mb-3 ml-0 sm:ml-12">
              Tip: registra más detecciones para que el sistema estime el origen/base por frecuencia.
            </div>
          )}
          <button
            onClick={onRecalculateBase}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors ml-0 sm:ml-12"
          >
            ↻ Recalcular base
          </button>
        </div>
      </Section>

      {/* Países detectados */}
      {a.countries && a.countries.length > 0 && (
        <Section title="Países Donde Ha Sido Detectado">
          <div className="grid grid-cols-2 gap-2">
            {a.countries.map((country, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{country.country_flag || '🏳️'}</span>
                  <span className="text-sm font-medium text-white">{country.country_name}</span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                  {country.total_sightings}x
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Notas */}
      <Section title="Notas del Analista">
        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-xl p-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none"
              placeholder="Agregar notas sobre esta aeronave..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onSaveNotes}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingNotes(true)}
            className="p-4 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors group border border-slate-700/50"
          >
            {notes ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">Sin notas. Click para agregar.</p>
            )}
            <Edit3 className="w-4 h-4 text-slate-500 mt-3 group-hover:text-sky-400 transition-colors" />
          </div>
        )}
      </Section>
    </div>
  );
}

// =============================================
// TAB: ESTADÍSTICAS
// =============================================
function StatsTab({ aircraft, firstSeen, lastSeen, formatDate }) {
  const a = aircraft;
  const daysActive = firstSeen && lastSeen 
    ? Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard 
          label="Detecciones"
          value={a.total_detections || 0}
          icon={Activity}
          color="sky"
        />
        <KPICard 
          label="Incursiones"
          value={a.total_incursions || 0}
          icon={AlertTriangle}
          color={a.total_incursions > 0 ? 'red' : 'slate'}
        />
        <KPICard 
          label="Vuelos"
          value={a.total_flights || 0}
          icon={Route}
          color="green"
        />
        <KPICard 
          label="Días activo"
          value={daysActive}
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Timeline de actividad */}
      <Section title="Timeline de Actividad">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
          <InfoRow 
            label="Primera detección" 
            value={formatDate(firstSeen)} 
            icon={Calendar}
          />
          <InfoRow 
            label="Última detección" 
            value={formatDate(lastSeen)} 
            icon={Clock}
          />
          {a.notified_at && (
            <InfoRow 
              label="Última notificación" 
              value={formatDate(new Date(a.notified_at))} 
            />
          )}
        </div>
      </Section>

      {/* Confianza de base */}
      {a.base_confidence > 0 && (
        <Section title="Precisión del Análisis de Base">
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-slate-400">Nivel de confianza</span>
              <span className={`font-bold ${
                a.base_confidence >= 70 ? 'text-green-400' :
                a.base_confidence >= 40 ? 'text-amber-400' :
                'text-red-400'
              }`}>{a.base_confidence}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  a.base_confidence >= 70 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                  a.base_confidence >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${a.base_confidence}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Basado en el análisis de {a.total_flights || 0} vuelos registrados
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}

// =============================================
// TAB: HISTORIAL (Estilo FlightRadar24)
// =============================================
function HistoryTab({ history, loading, error, formatDate, hasMore, onLoadMore, onRetry }) {
  const [selectedFlight, setSelectedFlight] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Error al cargar historial</h3>
        <p className="text-slate-400 text-sm mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Sin historial de vuelos</h3>
        <p className="text-slate-400 text-sm">Los vuelos de esta aeronave aparecerán aquí cuando sean detectados.</p>
      </div>
    );
  }

  // Agrupar por fecha
  const groupedByDate = {};
  history.forEach(h => {
    const date = new Date(h.detected_at).toISOString().split('T')[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        date,
        records: [],
        callsigns: new Set(),
        origins: new Set(),
        destinations: new Set(),
        countries: new Set(),
        firstRecord: null,
        lastRecord: null,
      };
    }
    const group = groupedByDate[date];
    group.records.push(h);
    if (h.callsign) group.callsigns.add(h.callsign);
    if (h.origin_icao) group.origins.add(h.origin_icao);
    if (h.destination_icao) group.destinations.add(h.destination_icao);
    if (h.country_code) group.countries.add(h.country_code);
    if (!group.firstRecord || new Date(h.detected_at) < new Date(group.firstRecord.detected_at)) {
      group.firstRecord = h;
    }
    if (!group.lastRecord || new Date(h.detected_at) > new Date(group.lastRecord.detected_at)) {
      group.lastRecord = h;
    }
  });

  // Convertir a array y ordenar por fecha descendente
  const flightDays = Object.values(groupedByDate)
    .map(g => ({
      ...g,
      callsigns: Array.from(g.callsigns),
      origins: Array.from(g.origins),
      destinations: Array.from(g.destinations),
      countries: Array.from(g.countries),
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calcular estadísticas
  const totalFlights = flightDays.length;
  const totalPoints = history.length;
  const uniqueOrigins = new Set(history.map(h => h.origin_icao).filter(Boolean)).size;

  // Vista de detalle de un día específico
  if (selectedFlight) {
    return (
      <FlightDayDetail 
        flight={selectedFlight} 
        onBack={() => setSelectedFlight(null)} 
        formatDate={formatDate}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
          <div className="text-xl sm:text-2xl font-bold text-sky-400">{totalFlights}</div>
          <div className="text-[10px] sm:text-xs text-slate-400">Días con actividad</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-400">{totalPoints}</div>
          <div className="text-[10px] sm:text-xs text-slate-400">Puntos registrados</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
          <div className="text-xl sm:text-2xl font-bold text-amber-400">{uniqueOrigins}</div>
          <div className="text-[10px] sm:text-xs text-slate-400">Aeropuertos</div>
        </div>
      </div>

      {/* Encabezado de tabla */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700">
        <div className="col-span-2">Fecha</div>
        <div className="col-span-2">Origen</div>
        <div className="col-span-2">Destino</div>
        <div className="col-span-1">Callsign</div>
        <div className="col-span-2">Duración</div>
        <div className="col-span-2">Puntos</div>
        <div className="col-span-1"></div>
      </div>

      {/* Lista de vuelos (tabla) */}
      <div className="space-y-1">
        {flightDays.map((day) => {
          const duration = day.firstRecord && day.lastRecord
            ? Math.round((new Date(day.lastRecord.detected_at) - new Date(day.firstRecord.detected_at)) / 60000)
            : 0;
          const hours = Math.floor(duration / 60);
          const mins = duration % 60;
          const primaryCallsign = day.callsigns[0] || '—';
          const originDisplay = day.origins.length > 0 ? day.origins.join(', ') : '—';
          const destDisplay = day.destinations.length > 0 ? day.destinations.join(', ') : '—';
          
          return (
            <div 
              key={day.date}
              onClick={() => setSelectedFlight(day)}
              className="grid grid-cols-12 gap-2 items-center p-3 sm:p-4 bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 hover:border-sky-500/30 rounded-lg cursor-pointer transition-all group"
            >
              {/* Fecha */}
              <div className="col-span-6 sm:col-span-2">
                <div className="text-sm font-medium text-white">
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-xs text-slate-500 sm:hidden mt-0.5">
                  {primaryCallsign} • {day.records.length} pts
                </div>
              </div>

              {/* Origen */}
              <div className="hidden sm:block col-span-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <Navigation className="w-3 h-3 text-green-400" style={{ transform: 'rotate(45deg)' }} />
                  <span className="font-mono text-slate-300">{originDisplay}</span>
                </div>
              </div>

              {/* Destino */}
              <div className="hidden sm:block col-span-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span className="font-mono text-slate-300">{destDisplay}</span>
                </div>
              </div>

              {/* Callsign */}
              <div className="hidden sm:block col-span-1">
                <span className="font-mono text-xs bg-slate-600 px-2 py-0.5 rounded text-amber-300">
                  {primaryCallsign}
                </span>
              </div>

              {/* Duración */}
              <div className="col-span-3 sm:col-span-2 text-right sm:text-left">
                <div className="flex items-center gap-1.5 text-sm text-slate-300 justify-end sm:justify-start">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {duration > 0 ? `${hours}h ${mins}m` : '—'}
                </div>
              </div>

              {/* Puntos */}
              <div className="hidden sm:flex col-span-2 items-center gap-1.5 text-sm text-slate-400">
                <Route className="w-3 h-3" />
                {day.records.length} puntos
              </div>

              {/* Acción */}
              <div className="col-span-3 sm:col-span-1 flex justify-end">
                <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Ver <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón cargar más */}
      {hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <History className="w-4 h-4" />
            Cargar historial completo
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Mostrando {history.length} registros. Hay más disponibles.
          </p>
        </div>
      )}
    </div>
  );
}

// Vista de detalle de un día de vuelo con mapa
function FlightDayDetail({ flight, onBack, formatDate }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [showTrailList, setShowTrailList] = useState(false);

  const duration = flight.firstRecord && flight.lastRecord
    ? Math.round((new Date(flight.lastRecord.detected_at) - new Date(flight.firstRecord.detected_at)) / 60000)
    : 0;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  // Ordenar puntos cronológicamente
  const sortedRecords = [...flight.records].sort((a, b) => 
    new Date(a.detected_at) - new Date(b.detected_at)
  );

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || sortedRecords.length === 0) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Calcular bounds para centrar el mapa
    const lngs = sortedRecords.map(r => parseFloat(r.longitude));
    const lats = sortedRecords.map(r => parseFloat(r.latitude));
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLES.OUTDOORS, // Mapa claro con topografía
      bounds: bounds,
      fitBoundsOptions: { padding: 50 },
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Crear coordenadas para la línea
      const coordinates = sortedRecords.map(r => [
        parseFloat(r.longitude),
        parseFloat(r.latitude)
      ]);

      // Agregar source para la línea del trail
      map.addSource('trail-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      // Agregar capa de línea con gradiente de color
      map.addLayer({
        id: 'trail-line-layer',
        type: 'line',
        source: 'trail-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 3,
          'line-opacity': 0.9
        }
      });

      // Agregar puntos del trail
      map.addSource('trail-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: sortedRecords.map((r, i) => ({
            type: 'Feature',
            properties: {
              index: i + 1,
              time: new Date(r.detected_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
              altitude: r.altitude,
              speed: r.speed
            },
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(r.longitude), parseFloat(r.latitude)]
            }
          }))
        }
      });

      map.addLayer({
        id: 'trail-points-layer',
        type: 'circle',
        source: 'trail-points',
        paint: {
          'circle-radius': 4,
          'circle-color': '#0ea5e9',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Marcador de INICIO (verde)
      const startPoint = sortedRecords[0];
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([parseFloat(startPoint.longitude), parseFloat(startPoint.latitude)])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div style="color: #333; font-size: 12px;">
            <strong>🛫 Inicio</strong><br/>
            ${new Date(startPoint.detected_at).toLocaleTimeString('es-VE')}<br/>
            Alt: ${startPoint.altitude?.toLocaleString() || '—'} ft
          </div>
        `))
        .addTo(map);

      // Marcador de FIN (rojo)
      const endPoint = sortedRecords[sortedRecords.length - 1];
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([parseFloat(endPoint.longitude), parseFloat(endPoint.latitude)])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div style="color: #333; font-size: 12px;">
            <strong>🛬 Fin</strong><br/>
            ${new Date(endPoint.detected_at).toLocaleTimeString('es-VE')}<br/>
            Alt: ${endPoint.altitude?.toLocaleString() || '—'} ft
          </div>
        `))
        .addTo(map);

      // Agregar controles de navegación
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sortedRecords]);

  return (
    <div className="space-y-4">
      {/* Header con botón volver */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">
            {new Date(flight.date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          <p className="text-sm text-slate-400">
            {flight.callsigns.join(', ')} • {flight.records.length} puntos registrados
          </p>
        </div>
      </div>

      {/* 🗺️ MAPA CON EL TRAIL */}
      <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
        <div 
          ref={mapContainerRef} 
          className="w-full h-[250px] sm:h-[300px]"
        />
        {/* Leyenda del mapa */}
        <div className="flex items-center justify-center gap-4 py-2 bg-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Inicio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Fin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-amber-500"></span>
            Ruta
          </span>
        </div>
      </div>

      {/* Resumen del vuelo */}
      <div className="bg-gradient-to-r from-sky-500/10 to-amber-500/10 rounded-xl p-4 border border-sky-500/20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Origen</div>
            <div className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-green-400" style={{ transform: 'rotate(45deg)' }} />
              <span className="font-mono text-white">{flight.origins.join(', ') || 'N/A'}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Destino</div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400" />
              <span className="font-mono text-white">{flight.destinations.join(', ') || 'N/A'}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Duración</div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-white">{duration > 0 ? `${hours}h ${mins}m` : 'N/A'}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Países</div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <span className="text-white truncate">{flight.countries.length > 0 ? flight.countries.map(c => getCountryNameEs(c) || c).join(', ') : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horario */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700">
        <div className="text-center flex-1">
          <div className="text-xs text-slate-400">Primera detección</div>
          <div className="text-lg font-mono text-green-400">
            {flight.firstRecord ? new Date(flight.firstRecord.detected_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-8 h-px bg-slate-600"></div>
          <Plane className="w-5 h-5" />
          <div className="w-8 h-px bg-slate-600"></div>
        </div>
        <div className="text-center flex-1">
          <div className="text-xs text-slate-400">Última detección</div>
          <div className="text-lg font-mono text-red-400">
            {flight.lastRecord ? new Date(flight.lastRecord.detected_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
        </div>
      </div>

      {/* Toggle para lista de puntos */}
      <button
        onClick={() => setShowTrailList(!showTrailList)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <Route className="w-4 h-4" />
          Trail de vuelo ({flight.records.length} puntos)
        </span>
        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showTrailList ? 'rotate-90' : ''}`} />
      </button>

      {/* Lista de puntos (trail) - colapsable */}
      {showTrailList && (
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar-transparent animate-in fade-in duration-200">
          {sortedRecords.map((record, index) => (
            <div 
              key={record.id}
              className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-300">
                    {new Date(record.detected_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {record.country_code && (
                    <span className="text-amber-400">{getCountryNameEs(record.country_code) || record.country_code}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Alt: {record.altitude?.toLocaleString() || '—'} ft</span>
                  <span>Vel: {record.speed || '—'} kts</span>
                  <span>Rmb: {record.heading || '—'}°</span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 p-1.5 rounded hover:bg-slate-700 transition-colors"
                title="Ver en mapa"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// TAB: GALERÍA
// =============================================
function GalleryTab({ aircraftType, aircraftModel, images, uploading, onUpload, onDelete, onSetPrimary, onImageClick }) {
  const [showUploader, setShowUploader] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadSource, setUploadSource] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }

    const result = await onUpload(file, {
      aircraftType,
      aircraftModel,
      caption: uploadCaption,
      source: uploadSource || 'User Upload',
      isPrimary: makePrimary || images.length === 0,
    });

    if (result.success) {
      setShowUploader(false);
      setUploadCaption('');
      setUploadSource('');
      setMakePrimary(false);
    } else {
      alert('Error al subir imagen: ' + result.error);
    }
  };

  const handleDelete = async (img) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    const result = await onDelete(img.id, img.image_url);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
  };

  const handleSetPrimary = async (img) => {
    const result = await onSetPrimary(img.id, aircraftType);
    if (!result.success) {
      alert('Error: ' + result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Galería de Imágenes ({images.length})
        </h4>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Subir
        </button>
      </div>

      {showUploader && (
        <div className="bg-slate-800/50 rounded-xl p-5 space-y-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Nueva Imagen</span>
            <button onClick={() => setShowUploader(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <label className="block border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-sky-500/50 hover:bg-slate-700/30 transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-3" />
                <span className="text-sm text-slate-400">Subiendo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ImageIcon className="w-12 h-12 text-slate-500 mb-3" />
                <span className="text-sm text-slate-300">Click o arrastra una imagen</span>
                <span className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP • Max 5MB</span>
              </div>
            )}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Descripción</label>
              <input
                type="text"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="ej: Vista lateral"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Fuente</label>
              <input
                type="text"
                value={uploadSource}
                onChange={(e) => setUploadSource(e.target.value)}
                placeholder="ej: US Navy"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={makePrimary}
              onChange={(e) => setMakePrimary(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500"
            />
            Establecer como imagen principal
          </label>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-1">Sin imágenes</p>
          <p className="text-xs text-slate-500">Sube la primera imagen de este modelo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div 
              key={img.id}
              className="relative group rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50"
            >
              <img
                src={img.thumbnail_url || img.image_url}
                alt={img.image_caption || aircraftModel}
                className="w-full aspect-video object-cover cursor-pointer"
                onClick={() => onImageClick(idx)}
              />

              {img.is_primary && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Principal
                </div>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    className="p-2.5 bg-amber-500/90 rounded-full hover:bg-amber-500 transition-colors"
                  >
                    <Star className="w-4 h-4 text-white" />
                  </button>
                )}
                <button
                  onClick={() => window.open(img.image_url, '_blank')}
                  className="p-2.5 bg-slate-500/90 rounded-full hover:bg-slate-500 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handleDelete(img)}
                  className="p-2.5 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>

              {img.image_caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-xs text-white truncate">{img.image_caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// COMPONENTES AUXILIARES
// =============================================

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false, icon: Icon }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <span className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function SpecCard({ icon: Icon, label, value, color }) {
  const colors = {
    sky: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    teal: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-400',
    slate: 'from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color }) {
  const colors = {
    sky: 'from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30',
    red: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30',
    green: 'from-green-500/20 to-green-600/10 text-green-400 border-green-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    slate: 'from-slate-500/20 to-slate-600/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-center border`}>
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function getCategoryLabel(category) {
  const labels = {
    fighter: 'Caza',
    transport: 'Transporte',
    tanker: 'Cisterna',
    awacs: 'AWACS/Alerta Temprana',
    patrol: 'Patrulla Marítima',
    reconnaissance: 'Reconocimiento',
    helicopter: 'Helicóptero',
    drone: 'Drone/UAV',
    bomber: 'Bombardero',
    trainer: 'Entrenador',
  };
  return labels[category] || category;
}

function getBranchLabel(branch) {
  if (!branch) return null;
  const labels = {
    // Códigos oficiales
    'USAF': 'US Air Force',
    'USN': 'US Navy',
    'USMC': 'US Marine Corps',
    'USA': 'US Army',
    'USCG': 'US Coast Guard',
    'CBP': 'Customs & Border Protection',
    // Variantes que vienen de la API
    'Air Force': 'US Air Force',
    'Navy': 'US Navy',
    'Marine Corps': 'US Marine Corps',
    'Army': 'US Army',
    'Coast Guard': 'US Coast Guard',
    // Otros países
    'RAF': 'Royal Air Force (UK)',
    'FAC': 'Fuerza Aérea Colombiana',
    'FAB': 'Fuerza Aérea Brasileña',
    'FAV': 'Fuerza Aérea Venezolana',
    'FAM': 'Fuerza Aérea Mexicana',
  };
  return labels[branch] || branch;
}
