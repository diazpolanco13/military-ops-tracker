import { useState, useEffect, useRef, useCallback } from 'react';
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
  Anchor
} from 'lucide-react';
import { useAircraftRegistry } from '../../hooks/useAircraftRegistry';
import { useAircraftImages } from '../../hooks/useAircraftImages';
import { supabase } from '../../lib/supabase';

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
  
  // Ref para cancelar peticiones cuando el componente se desmonte
  const mountedRef = useRef(true);
  const historyLoadedRef = useRef(false);

  const { updateNotes, recalculateBase } = useAircraftRegistry();
  const { 
    images, 
    loading: loadingImages,
    uploading,
    uploadImage,
    deleteImage,
    setPrimaryImage 
  } = useAircraftImages(aircraft?.aircraft_type);

  // Función estable para cargar historial
  const loadHistory = useCallback(async (icao24) => {
    if (!icao24 || historyLoadedRef.current) return;
    
    setLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const { data, error } = await supabase
        .from('aircraft_location_history')
        .select('*')
        .eq('icao24', icao24.toUpperCase())
        .order('detected_at', { ascending: false })
        .limit(50);
      
      if (!mountedRef.current) return;
      
      if (error) throw error;
      
      setHistory(data || []);
      historyLoadedRef.current = true;
    } catch (err) {
      console.error('Error loading history:', err);
      if (mountedRef.current) {
        setHistoryError(err.message);
        setHistory([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingHistory(false);
      }
    }
  }, []);

  // Cargar historial cuando se selecciona la tab
  useEffect(() => {
    if (activeTab === 'history' && aircraft?.icao24) {
      loadHistory(aircraft.icao24);
    }
  }, [activeTab, aircraft?.icao24, loadHistory]);
  
  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    historyLoadedRef.current = false;
    
    return () => {
      mountedRef.current = false;
    };
  }, [aircraft?.icao24]); // Reset cuando cambia la aeronave

  if (!aircraft) return null;

  const a = aircraft;
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

        <div className="flex items-center gap-3">
          <span className="font-mono text-lg text-sky-400 font-bold">{a.icao24}</span>
          {a.military_branch && (
            <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-1 rounded-full font-medium">
              {getBranchLabel(a.military_branch)}
            </span>
          )}
          {a.is_new_today && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium animate-pulse">
              NUEVA
            </span>
          )}
        </div>

        <div className="w-24" />
      </header>

      {/* Main Content - Two Columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ==================== */}
        {/* LEFT PANEL - Imagen + Especificaciones */}
        {/* ==================== */}
        <div className="lg:w-1/2 xl:w-2/5 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-700/50 overflow-hidden">
          
          {/* Imagen Grande */}
          <div className="relative flex-shrink-0 h-[280px] sm:h-[350px] lg:h-[400px] flex items-center justify-center bg-slate-950 p-4">
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
              {a.model?.manufacturer && (
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {a.model.manufacturer}
                </span>
              )}
              {a.model?.category && (
                <span className="px-2 py-0.5 rounded-full bg-slate-700/80 text-xs">
                  {getCategoryLabel(a.model.category)}
                </span>
              )}
              {a.model?.country_origin && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {a.model.country_origin}
                </span>
              )}
            </div>
          </div>

          {/* Especificaciones del avión */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar-transparent">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Especificaciones Técnicas
            </h3>
            
            {a.model ? (
              <div className="grid grid-cols-2 gap-3">
                {a.model.max_speed_knots && (
                  <SpecCard 
                    icon={Gauge}
                    label="Velocidad máx"
                    value={`${a.model.max_speed_knots} kts`}
                    color="sky"
                  />
                )}
                {a.model.cruise_speed_knots && (
                  <SpecCard 
                    icon={Zap}
                    label="Velocidad crucero"
                    value={`${a.model.cruise_speed_knots} kts`}
                    color="green"
                  />
                )}
                {a.model.max_altitude_ft && (
                  <SpecCard 
                    icon={TrendingUp}
                    label="Altitud máx"
                    value={`${(a.model.max_altitude_ft / 1000).toFixed(0)}k ft`}
                    color="purple"
                  />
                )}
                {a.model.range_nm && (
                  <SpecCard 
                    icon={Route}
                    label="Alcance"
                    value={`${a.model.range_nm.toLocaleString()} nm`}
                    color="amber"
                  />
                )}
                {a.model.crew_count !== undefined && a.model.crew_count !== null && (
                  <SpecCard 
                    icon={Users}
                    label="Tripulación"
                    value={`${a.model.crew_count} personas`}
                    color="pink"
                  />
                )}
                {a.model.wingspan_m && (
                  <SpecCard 
                    icon={Ruler}
                    label="Envergadura"
                    value={`${a.model.wingspan_m} m`}
                    color="orange"
                  />
                )}
                {a.model.length_m && (
                  <SpecCard 
                    icon={Ruler}
                    label="Longitud"
                    value={`${a.model.length_m} m`}
                    color="teal"
                  />
                )}
                {a.model.mtow_kg && (
                  <SpecCard 
                    icon={Anchor}
                    label="Peso máx despegue"
                    value={`${(a.model.mtow_kg / 1000).toFixed(0)}t`}
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
            {a.model?.operated_by && a.model.operated_by.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Operadores
                </h4>
                <div className="flex flex-wrap gap-2">
                  {a.model.operated_by.map((op, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300 border border-slate-600/50">
                      {op}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rol principal */}
            {a.model?.primary_role && (
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Rol Principal
                </h4>
                <p className="text-white text-sm bg-slate-700/30 rounded-lg px-4 py-3 border border-slate-600/30">
                  {a.model.primary_role}
                </p>
              </div>
            )}

            {/* Wikipedia link */}
            {a.model?.wikipedia_url && (
              <div className="mt-6">
                <a
                  href={a.model.wikipedia_url}
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
        <div className="lg:w-1/2 xl:w-3/5 flex flex-col bg-slate-800/30 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex gap-1 px-4 sm:px-6 py-3 bg-slate-900/50 border-b border-slate-700/50 overflow-x-auto flex-shrink-0">
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar-transparent">
            {activeTab === 'info' && (
              <InfoTab 
                aircraft={a} 
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
function InfoTab({ aircraft, notes, setNotes, isEditingNotes, setIsEditingNotes, onSaveNotes, onRecalculateBase }) {
  const a = aircraft;

  return (
    <div className="space-y-6">
      {/* Identificación */}
      <Section title="Datos de Identificación">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
          <InfoRow label="ICAO24 (Hex)" value={a.icao24} mono />
          <InfoRow label="Tipo de aeronave" value={a.aircraft_type || 'Desconocido'} />
          <InfoRow label="Modelo" value={a.aircraft_model || 'Desconocido'} />
          {a.model?.category && (
            <InfoRow label="Categoría" value={getCategoryLabel(a.model.category)} />
          )}
          {a.model?.manufacturer && (
            <InfoRow label="Fabricante" value={a.model.manufacturer} />
          )}
          <InfoRow label="Rama militar" value={getBranchLabel(a.military_branch) || 'No identificada'} />
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-medium text-white text-lg">
                {a.probable_base_name || 'No determinada'}
              </span>
            </div>
            {a.base_confidence > 0 && (
              <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                a.base_confidence >= 70 ? 'bg-green-500/20 text-green-400' :
                a.base_confidence >= 40 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {a.base_confidence}% confianza
              </span>
            )}
          </div>
          {a.probable_base_icao && (
            <div className="text-sm text-slate-400 mb-3 ml-12">
              ICAO: <span className="font-mono text-slate-300">{a.probable_base_icao}</span>
              {a.probable_country && <span className="ml-2">({a.probable_country})</span>}
            </div>
          )}
          <button
            onClick={onRecalculateBase}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors ml-12"
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
// TAB: HISTORIAL
// =============================================
function HistoryTab({ history, loading, error, formatDate }) {
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
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg text-white mb-2">Sin historial</h3>
        <p className="text-slate-400 text-sm">Los eventos de esta aeronave aparecerán aquí</p>
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'incursion': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'departure': return <Navigation className="w-4 h-4 text-green-400" style={{ transform: 'rotate(45deg)' }} />;
      case 'arrival': return <Navigation className="w-4 h-4 text-blue-400" style={{ transform: 'rotate(135deg)' }} />;
      case 'transit': return <Route className="w-4 h-4 text-amber-400" />;
      case 'first_detection': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'detection': return <Activity className="w-4 h-4 text-sky-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEventLabel = (type) => {
    const labels = {
      incursion: 'Incursión',
      departure: 'Salida',
      arrival: 'Llegada',
      transit: 'Tránsito',
      first_detection: 'Primera detección',
      detection: 'Detección',
      overflight: 'Sobrevuelo',
      patrol: 'Patrulla',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {history.map((h) => (
        <div 
          key={h.id}
          className={`flex gap-4 p-4 rounded-xl border ${
            h.event_type === 'incursion' 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-slate-800/50 border-slate-700/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            h.event_type === 'incursion' ? 'bg-red-500/20' : 'bg-slate-700'
          }`}>
            {getEventIcon(h.event_type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white">
                {getEventLabel(h.event_type)}
              </span>
              {h.callsign && (
                <span className="font-mono text-xs bg-slate-600 px-2 py-0.5 rounded text-slate-300">
                  {h.callsign}
                </span>
              )}
            </div>
            
            {(h.origin_icao || h.destination_icao) && (
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                {h.origin_icao && <span>{h.origin_name || h.origin_icao}</span>}
                {h.origin_icao && h.destination_icao && <ChevronRight className="w-3 h-3" />}
                {h.destination_icao && <span>{h.destination_name || h.destination_icao}</span>}
              </div>
            )}

            {(h.altitude || h.speed) && (
              <div className="flex gap-4 text-xs text-slate-500">
                {h.altitude && <span>Alt: {h.altitude.toLocaleString()} ft</span>}
                {h.speed && <span>Vel: {h.speed} kts</span>}
                {h.heading && <span>Rmb: {h.heading}°</span>}
              </div>
            )}

            {h.country_code && (
              <div className="text-xs text-slate-400 mt-1">
                País: {h.country_code}
              </div>
            )}

            <div className="text-xs text-slate-500 mt-2">
              {formatDate(new Date(h.detected_at))}
            </div>
          </div>
        </div>
      ))}
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
  const labels = {
    'USAF': 'US Air Force',
    'USN': 'US Navy',
    'USMC': 'US Marine Corps',
    'USA': 'US Army',
    'USCG': 'US Coast Guard',
    'CBP': 'Customs & Border Protection',
  };
  return labels[branch] || branch;
}
