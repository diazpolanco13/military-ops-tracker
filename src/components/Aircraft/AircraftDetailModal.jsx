import { useState, useEffect } from 'react';
import { 
  X, 
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
  Navigation,
  Gauge,
  Target,
  Shield,
  Route,
  Activity,
  Camera
} from 'lucide-react';
import { useAircraftRegistryActions } from '../../hooks/useAircraftRegistryActions';
import AircraftImageGallery from './AircraftImageGallery';

/**
 * 🎖️ MODAL DE DETALLE DE AERONAVE
 * 
 * Muestra información completa de una aeronave del registro:
 * - Identificación y especificaciones
 * - Base probable y estadísticas
 * - Historial de ubicaciones/incursiones
 * - Callsigns usados
 */
export default function AircraftDetailModal({ aircraft, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(aircraft?.notes || '');

  const { getLocationHistory, updateNotes, recalculateBase } = useAircraftRegistryActions();

  // Cargar historial cuando se selecciona la tab
  useEffect(() => {
    if (activeTab === 'history' && aircraft?.icao24 && history.length === 0) {
      setLoadingHistory(true);
      getLocationHistory(aircraft.icao24, 50)
        .then(data => setHistory(data))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, aircraft?.icao24, getLocationHistory, history.length]);

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

  const tabs = [
    { id: 'info', label: 'Información', icon: Plane },
    { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'images', label: 'Imágenes', icon: Camera },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-800 rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Imagen o icono */}
            <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center overflow-hidden">
              {a.model?.thumbnail_url ? (
                <img 
                  src={a.model.thumbnail_url} 
                  alt={a.aircraft_model}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Plane className="w-8 h-8 text-sky-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-lg text-sky-400 font-bold">{a.icao24}</span>
                {a.military_branch && (
                  <span className="text-xs bg-slate-600 px-2 py-0.5 rounded text-slate-300">
                    {a.military_branch}
                  </span>
                )}
                {a.is_new_today && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    NUEVA
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {a.aircraft_model || a.aircraft_type || 'Modelo desconocido'}
              </h2>
              {a.model?.manufacturer && (
                <p className="text-sm text-slate-400">{a.model.manufacturer}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700 hover:bg-red-500/50 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 sm:px-6 py-2 bg-slate-800/50 border-b border-slate-700 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-sky-500/20 text-sky-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
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
              formatDate={formatDate}
            />
          )}
          {activeTab === 'images' && (
            <AircraftImageGallery 
              aircraftType={a.aircraft_type}
              aircraftModel={a.aircraft_model}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// TAB: INFORMACIÓN
// =============================================
function InfoTab({ aircraft, notes, setNotes, isEditingNotes, setIsEditingNotes, onSaveNotes, onRecalculateBase }) {
  const a = aircraft;

  return (
    <div className="space-y-6">
      {/* Identificación */}
      <Section title="Identificación">
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
        {a.tail_number && (
          <InfoRow label="Número de cola" value={a.tail_number} mono />
        )}
        {a.squadron && (
          <InfoRow label="Escuadrón" value={a.squadron} />
        )}
        {a.model?.primary_role && (
          <InfoRow label="Rol principal" value={a.model.primary_role} />
        )}
      </Section>

      {/* Callsigns usados */}
      {a.callsigns_used && a.callsigns_used.length > 0 && (
        <Section title="Callsigns Usados">
          <div className="flex flex-wrap gap-2">
            {a.callsigns_used.map((cs, i) => (
              <span 
                key={i}
                className="font-mono text-sm bg-slate-700 px-2 py-1 rounded text-sky-300"
              >
                {cs}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Base probable */}
      <Section title="Base Probable">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-white">
                {a.probable_base_name || 'No determinada'}
              </span>
            </div>
            {a.base_confidence > 0 && (
              <span className={`text-sm font-medium ${
                a.base_confidence >= 70 ? 'text-green-400' :
                a.base_confidence >= 40 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {a.base_confidence}% confianza
              </span>
            )}
          </div>
          {a.probable_base_icao && (
            <div className="text-sm text-slate-400 mb-3">
              Código ICAO: <span className="font-mono text-slate-300">{a.probable_base_icao}</span>
              {a.probable_country && <span className="ml-2">({a.probable_country})</span>}
            </div>
          )}
          <button
            onClick={onRecalculateBase}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            ↻ Recalcular base
          </button>
        </div>
      </Section>

      {/* Especificaciones del modelo */}
      {a.model && (
        <Section title="Especificaciones">
          <div className="grid grid-cols-2 gap-3">
            {a.model.max_speed_knots && (
              <SpecCard 
                icon={Gauge}
                label="Velocidad máx"
                value={`${a.model.max_speed_knots} kts`}
              />
            )}
            {a.model.cruise_speed_knots && (
              <SpecCard 
                icon={Gauge}
                label="Velocidad crucero"
                value={`${a.model.cruise_speed_knots} kts`}
              />
            )}
            {a.model.max_altitude_ft && (
              <SpecCard 
                icon={TrendingUp}
                label="Altitud máx"
                value={`${(a.model.max_altitude_ft / 1000).toFixed(0)}k ft`}
              />
            )}
            {a.model.range_nm && (
              <SpecCard 
                icon={Route}
                label="Alcance"
                value={`${a.model.range_nm.toLocaleString()} nm`}
              />
            )}
            {a.model.crew_count !== undefined && a.model.crew_count !== null && (
              <SpecCard 
                icon={Shield}
                label="Tripulación"
                value={`${a.model.crew_count} personas`}
              />
            )}
            {a.model.operated_by && a.model.operated_by.length > 0 && (
              <SpecCard 
                icon={Target}
                label="Operadores"
                value={a.model.operated_by.join(', ')}
              />
            )}
          </div>
        </Section>
      )}

      {/* Países detectados */}
      {a.countries && a.countries.length > 0 && (
        <Section title="Países Detectados">
          <div className="space-y-2">
            {a.countries.map((country, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{country.country_flag || '🏳️'}</span>
                  <span className="text-sm text-white">{country.country_name}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {country.total_sightings} {country.total_sightings === 1 ? 'avistamiento' : 'avistamientos'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Notas */}
      <Section title="Notas">
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-24 bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 resize-none"
              placeholder="Agregar notas sobre esta aeronave..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onSaveNotes}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingNotes(true)}
            className="p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors group"
          >
            {notes ? (
              <p className="text-sm text-slate-300">{notes}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">Sin notas. Click para agregar.</p>
            )}
            <Edit3 className="w-4 h-4 text-slate-500 mt-2 group-hover:text-sky-400 transition-colors" />
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

  // Calcular días activo
  const daysActive = firstSeen && lastSeen 
    ? Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard 
          label="Detecciones"
          value={a.total_detections || 0}
          icon={Activity}
          color="text-sky-400"
        />
        <KPICard 
          label="Incursiones"
          value={a.total_incursions || 0}
          icon={AlertTriangle}
          color={a.total_incursions > 0 ? 'text-red-400' : 'text-slate-400'}
        />
        <KPICard 
          label="Vuelos"
          value={a.total_flights || 0}
          icon={Route}
          color="text-green-400"
        />
        <KPICard 
          label="Días activo"
          value={daysActive}
          icon={Calendar}
          color="text-amber-400"
        />
      </div>

      {/* Fechas */}
      <Section title="Actividad">
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
      </Section>

      {/* Base confidence */}
      {a.base_confidence > 0 && (
        <Section title="Confianza de Base">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Precisión del cálculo</span>
              <span className="text-white font-medium">{a.base_confidence}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  a.base_confidence >= 70 ? 'bg-green-500' :
                  a.base_confidence >= 40 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${a.base_confidence}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Basado en {a.total_flights || 0} vuelos registrados
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
function HistoryTab({ history, loading, formatDate }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Sin historial de ubicaciones</p>
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
      overflight: 'Sobrevuelo',
      patrol: 'Patrulla',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {history.map((h, idx) => (
        <div 
          key={h.id}
          className={`flex gap-3 p-3 rounded-lg border ${
            h.event_type === 'incursion' 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-slate-700/30 border-slate-700'
          }`}
        >
          {/* Icono */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            h.event_type === 'incursion' ? 'bg-red-500/20' : 'bg-slate-700'
          }`}>
            {getEventIcon(h.event_type)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white">
                {getEventLabel(h.event_type)}
              </span>
              {h.callsign && (
                <span className="font-mono text-xs bg-slate-600 px-1.5 py-0.5 rounded text-slate-300">
                  {h.callsign}
                </span>
              )}
            </div>
            
            {/* Ruta */}
            {(h.origin_icao || h.destination_icao) && (
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                {h.origin_icao && <span>{h.origin_name || h.origin_icao}</span>}
                {h.origin_icao && h.destination_icao && <ChevronRight className="w-3 h-3" />}
                {h.destination_icao && <span>{h.destination_name || h.destination_icao}</span>}
              </div>
            )}

            {/* Datos de vuelo */}
            {(h.altitude || h.speed) && (
              <div className="flex gap-3 text-xs text-slate-500">
                {h.altitude && <span>Alt: {h.altitude.toLocaleString()} ft</span>}
                {h.speed && <span>Vel: {h.speed} kts</span>}
                {h.heading && <span>Rmb: {h.heading}°</span>}
              </div>
            )}

            {/* Fecha */}
            <div className="text-xs text-slate-500 mt-1">
              {formatDate(new Date(h.detected_at))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================
// HELPERS & COMPONENTES AUXILIARES
// =============================================

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
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

function SpecCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-3">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
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

