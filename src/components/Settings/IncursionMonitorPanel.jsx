import { useState } from 'react';
import { 
  Radar, Settings, Bell, BellOff, Plane, Radio, MapPin, Clock, 
  Play, Pause, RefreshCw, Send, CheckCircle, XCircle, AlertTriangle,
  Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp, Eye, EyeOff,
  Zap, Activity, Target, Globe, Shield
} from 'lucide-react';
import { 
  useIncursionMonitorConfig, 
  AIRCRAFT_CATEGORIES, 
  MISSION_TYPES, 
  MILITARY_BRANCHES,
  PRIORITY_LEVELS 
} from '../../hooks/useIncursionMonitorConfig';
import Toast from '../Common/Toast';

/**
 * 🛡️ Panel de Control del Monitor de Incursiones
 * Permite configurar visualmente todos los parámetros del sistema de detección
 */
export default function IncursionMonitorPanel() {
  const {
    config,
    aircraftPatterns,
    callsignPatterns,
    alertZones,
    stats,
    loading,
    saving,
    error,
    loadConfig,
    updateConfig,
    addAircraftPattern,
    updateAircraftPattern,
    deleteAircraftPattern,
    addCallsignPattern,
    updateCallsignPattern,
    deleteCallsignPattern,
    toggleAlertZone,
    testTelegram,
    addTelegramDestination,
    updateTelegramDestination,
    deleteTelegramDestination
  } = useIncursionMonitorConfig();

  // Estado local para UI
  const [activeSection, setActiveSection] = useState('general');
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [editingCallsign, setEditingCallsign] = useState(null);
  const [showAddAircraft, setShowAddAircraft] = useState(false);
  const [showAddCallsign, setShowAddCallsign] = useState(false);
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [toast, setToast] = useState(null);

  // Formulario para nuevo destino Telegram
  const [newDestination, setNewDestination] = useState({
    name: '',
    chat_id: '',
    type: 'channel',
    enabled: true
  });

  // Formularios para nuevos patrones
  const [newAircraft, setNewAircraft] = useState({
    aircraft_code: '',
    aircraft_name: '',
    category: 'transport',
    alert_priority: 3,
    description: ''
  });

  const [newCallsign, setNewCallsign] = useState({
    pattern: '',
    description: '',
    mission_type: 'general',
    military_branch: 'USAF',
    alert_priority: 3
  });

  // Handlers
  const handleTestTelegram = async (destinationId = null) => {
    setTelegramTestResult(null);
    const result = await testTelegram(destinationId);
    setTelegramTestResult({ ...result, destinationId });
    if (result.success) {
      setToast({ type: 'success', message: 'Mensaje de prueba enviado correctamente' });
    } else {
      setToast({ type: 'error', message: result.error || 'Error al enviar mensaje' });
    }
    setTimeout(() => setTelegramTestResult(null), 5000);
  };

  const handleAddDestination = async () => {
    if (!newDestination.name || !newDestination.chat_id) {
      setToast({ type: 'error', message: 'Nombre y Chat ID son requeridos' });
      return;
    }
    const result = await addTelegramDestination(newDestination);
    if (result.success) {
      setShowAddDestination(false);
      setNewDestination({ name: '', chat_id: '', type: 'channel', enabled: true });
      setToast({ type: 'success', message: 'Destino agregado correctamente' });
    } else {
      setToast({ type: 'error', message: result.error });
    }
  };

  const handleDeleteDestination = async (id) => {
    const result = await deleteTelegramDestination(id);
    if (result.success) {
      setToast({ type: 'success', message: 'Destino eliminado' });
    }
  };

  const handleToggleDestination = async (id, enabled) => {
    await updateTelegramDestination(id, { enabled });
  };

  const handleToggleMonitor = async () => {
    await updateConfig({ is_active: !config?.is_active });
  };

  const handleSaveAircraft = async () => {
    if (!newAircraft.aircraft_code || !newAircraft.aircraft_name) return;
    const result = await addAircraftPattern(newAircraft);
    if (result.success) {
      setShowAddAircraft(false);
      setNewAircraft({ aircraft_code: '', aircraft_name: '', category: 'transport', alert_priority: 3, description: '' });
    }
  };

  const handleSaveCallsign = async () => {
    if (!newCallsign.pattern) return;
    const result = await addCallsignPattern(newCallsign);
    if (result.success) {
      setShowAddCallsign(false);
      setNewCallsign({ pattern: '', description: '', mission_type: 'general', military_branch: 'USAF', alert_priority: 3 });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Error al cargar configuración</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
        <button 
          onClick={loadConfig}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'bounds', label: 'Área de Monitoreo', icon: MapPin },
    { id: 'telegram', label: 'Telegram', icon: Send },
    { id: 'aircraft', label: 'Aeronaves', icon: Plane },
    { id: 'callsigns', label: 'Callsigns', icon: Radio },
    { id: 'zones', label: 'Zonas de Alerta', icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header con estado del sistema */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config?.is_active ? 'bg-green-600' : 'bg-slate-600'}`}>
              <Radar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Monitor de Incursiones</h2>
              <p className="text-sm text-slate-400">
                {config?.is_active ? 'Sistema activo y monitoreando' : 'Sistema pausado'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleToggleMonitor}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              config?.is_active 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {config?.is_active ? (
              <>
                <Pause className="w-4 h-4" />
                Pausar Monitor
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Activar Monitor
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Ejecuciones</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalExecutions}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Incursiones Detectadas</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{stats.totalIncursions}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Plane className="w-4 h-4" />
              <span className="text-xs">Modelos de Aeronaves</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {stats.activeAircraftPatterns}/{stats.totalAircraftPatterns}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">Zonas con Alertas</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {stats.activeAlertZones}/{stats.totalAlertZones}
            </div>
          </div>
        </div>

        {/* Última ejecución */}
        {config?.last_execution_at && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Última ejecución:</span>
              <span className="text-slate-300">
                {new Date(config.last_execution_at).toLocaleString('es-VE', { timeZone: 'America/Caracas' })}
              </span>
              {config.last_execution_status && (
                <span className={`px-2 py-0.5 rounded text-xs ${
                  config.last_execution_status === 'success' 
                    ? 'bg-green-900/50 text-green-400' 
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  {config.last_execution_status}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navegación de secciones */}
      <div className="flex flex-wrap gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* SECCIÓN: General */}
      {activeSection === 'general' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Configuración General
          </h3>

          <div className="space-y-6">
            {/* Umbral de inactividad */}
            <div>
              <label className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-base text-slate-200 font-medium">Umbral de Inactividad</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Tiempo sin detección para considerar que el avión salió de la zona
                  </p>
                </div>
                <span className="text-lg font-mono text-blue-400 bg-slate-900 px-3 py-1 rounded">
                  {config?.inactivity_threshold_minutes || 15} min
                </span>
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={config?.inactivity_threshold_minutes || 15}
                onChange={(e) => updateConfig({ inactivity_threshold_minutes: parseInt(e.target.value) })}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>5 min (rápido)</span>
                <span>30 min</span>
                <span>60 min (lento)</span>
              </div>
            </div>

            {/* Prefijos ICAO24 */}
            <div className="pt-6 border-t border-slate-700">
              <label className="text-base text-slate-200 font-medium block mb-3">
                Prefijos ICAO24 Militares USA
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Códigos hex de transponder que identifican aeronaves militares (primeros 2 caracteres)
              </p>
              <div className="flex flex-wrap gap-2">
                {(config?.icao24_military_prefixes || ['AE', 'AF']).map((prefix, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-blue-900/50 text-blue-300 rounded-lg font-mono text-sm border border-blue-700"
                  >
                    {prefix}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                AE/AF = USAF Military (rango AE0000-AFFFFF)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: Área de Monitoreo */}
      {activeSection === 'bounds' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-400" />
            Área de Monitoreo
          </h3>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Límite Norte (°)</label>
              <input
                type="number"
                step="0.1"
                value={config?.query_bounds_north || 22}
                onChange={(e) => updateConfig({ query_bounds_north: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Límite Sur (°)</label>
              <input
                type="number"
                step="0.1"
                value={config?.query_bounds_south || 8}
                onChange={(e) => updateConfig({ query_bounds_south: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Límite Oeste (°)</label>
              <input
                type="number"
                step="0.1"
                value={config?.query_bounds_west || -75}
                onChange={(e) => updateConfig({ query_bounds_west: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Límite Este (°)</label>
              <input
                type="number"
                step="0.1"
                value={config?.query_bounds_east || -58}
                onChange={(e) => updateConfig({ query_bounds_east: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Centro de Zona (para cálculo de cuadrantes)</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Latitud Centro (°)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config?.zone_center_lat || 13}
                  onChange={(e) => updateConfig({ zone_center_lat: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Longitud Centro (°)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config?.zone_center_lon || -66}
                  onChange={(e) => updateConfig({ zone_center_lon: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800/50">
            <p className="text-sm text-blue-300">
              <Globe className="w-4 h-4 inline mr-2" />
              El área de monitoreo define la región geográfica donde se consultan vuelos a FlightRadar24.
              Los cuadrantes (NE, NW, SE, SW) se calculan desde el centro configurado.
            </p>
          </div>
        </div>
      )}

      {/* SECCIÓN: Telegram */}
      {activeSection === 'telegram' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            Configuración de Telegram
          </h3>

          <div className="space-y-6">
            {/* Toggle habilitado */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div>
                <span className="text-base text-slate-200 font-medium">Notificaciones Telegram</span>
                <p className="text-xs text-slate-400 mt-1">
                  Enviar alertas automáticas a los canales/grupos configurados
                </p>
              </div>
              <button
                onClick={() => updateConfig({ telegram_enabled: !config?.telegram_enabled })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  config?.telegram_enabled ? 'bg-cyan-600' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  config?.telegram_enabled ? 'translate-x-7' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Bot Token (compartido para todos los destinos) */}
            <div>
              <label className="text-sm text-slate-400 block mb-2">Bot Token (compartido)</label>
              <input
                type="password"
                value={config?.telegram_bot_token || ''}
                onChange={(e) => updateConfig({ telegram_bot_token: e.target.value })}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                El mismo bot puede enviar mensajes a múltiples canales/grupos
              </p>
            </div>

            {/* Destinos (Canales/Grupos) */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base text-slate-200 font-medium">Destinos de Alertas</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Canales o grupos donde se enviarán las notificaciones
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDestination(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Destino
                </button>
              </div>

              {/* Formulario para agregar destino */}
              {showAddDestination && (
                <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-cyan-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Nombre del destino</label>
                      <input
                        type="text"
                        placeholder="Ej: Canal Alertas VEN"
                        value={newDestination.name}
                        onChange={(e) => setNewDestination(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Chat ID</label>
                      <input
                        type="text"
                        placeholder="-1001234567890"
                        value={newDestination.chat_id}
                        onChange={(e) => setNewDestination(prev => ({ ...prev, chat_id: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="destType"
                        checked={newDestination.type === 'channel'}
                        onChange={() => setNewDestination(prev => ({ ...prev, type: 'channel' }))}
                        className="text-cyan-500"
                      />
                      📢 Canal (recomendado)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="destType"
                        checked={newDestination.type === 'group'}
                        onChange={() => setNewDestination(prev => ({ ...prev, type: 'group' }))}
                        className="text-cyan-500"
                      />
                      👥 Grupo
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddDestination}
                      disabled={!newDestination.name || !newDestination.chat_id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setShowAddDestination(false);
                        setNewDestination({ name: '', chat_id: '', type: 'channel', enabled: true });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de destinos */}
              <div className="space-y-3">
                {(config?.telegram_destinations || []).map(dest => (
                  <div
                    key={dest.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      dest.enabled 
                        ? 'bg-slate-900/50 border-slate-700' 
                        : 'bg-slate-900/20 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">
                        {dest.type === 'channel' ? '📢' : '👥'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{dest.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            dest.type === 'channel' 
                              ? 'bg-cyan-900/50 text-cyan-400' 
                              : 'bg-purple-900/50 text-purple-400'
                          }`}>
                            {dest.type === 'channel' ? 'Canal' : 'Grupo'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{dest.chat_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestTelegram(dest.id)}
                        disabled={saving}
                        className="p-2 text-cyan-400 hover:bg-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                        title="Probar envío"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleDestination(dest.id, !dest.enabled)}
                        className={`p-2 rounded-lg transition-colors ${
                          dest.enabled 
                            ? 'text-green-400 hover:bg-green-900/30' 
                            : 'text-slate-500 hover:bg-slate-700'
                        }`}
                        title={dest.enabled ? 'Desactivar' : 'Activar'}
                      >
                        {dest.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteDestination(dest.id)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!config?.telegram_destinations || config.telegram_destinations.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    <Send className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No hay destinos configurados</p>
                    <p className="text-sm">Agrega un canal o grupo para recibir alertas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info sobre canales */}
            <div className="p-4 bg-cyan-900/20 rounded-lg border border-cyan-800/50">
              <h4 className="text-sm font-medium text-cyan-300 mb-2">💡 Recomendación: Usa Canales</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Los <strong>canales</strong> son ideales para alertas porque los suscriptores no ven quiénes están en el canal</li>
                <li>• Crea un canal <strong>privado</strong> y comparte el enlace solo con personas autorizadas</li>
                <li>• El bot debe ser <strong>administrador</strong> del canal con permiso de publicar</li>
                <li>• Para obtener el Chat ID de un canal, reenvía un mensaje del canal a @userinfobot</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: Patrones de Aeronaves */}
      {activeSection === 'aircraft' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-orange-400" />
              Modelos de Aeronaves Militares
            </h3>
            <button
              onClick={() => setShowAddAircraft(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar Modelo
            </button>
          </div>

          {/* Formulario para agregar */}
          {showAddAircraft && (
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-orange-700/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Código (ej: C17)"
                  value={newAircraft.aircraft_code}
                  onChange={(e) => setNewAircraft(prev => ({ ...prev, aircraft_code: e.target.value.toUpperCase() }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newAircraft.aircraft_name}
                  onChange={(e) => setNewAircraft(prev => ({ ...prev, aircraft_name: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm md:col-span-2"
                />
                <select
                  value={newAircraft.category}
                  onChange={(e) => setNewAircraft(prev => ({ ...prev, category: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {AIRCRAFT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={newAircraft.alert_priority}
                  onChange={(e) => setNewAircraft(prev => ({ ...prev, alert_priority: parseInt(e.target.value) }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {PRIORITY_LEVELS.map(p => (
                    <option key={p.value} value={p.value}>Prioridad {p.value}: {p.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveAircraft}
                  disabled={!newAircraft.aircraft_code || !newAircraft.aircraft_name}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg text-sm"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => setShowAddAircraft(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de aeronaves */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {aircraftPatterns.map(aircraft => {
              const category = AIRCRAFT_CATEGORIES.find(c => c.value === aircraft.category);
              const priority = PRIORITY_LEVELS.find(p => p.value === aircraft.alert_priority);
              
              return (
                <div
                  key={aircraft.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    aircraft.is_active 
                      ? 'bg-slate-900/50 border-slate-700' 
                      : 'bg-slate-900/20 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{category?.icon || '✈️'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded">
                          {aircraft.aircraft_code}
                        </span>
                        <span className="text-white font-medium">{aircraft.aircraft_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded bg-${priority?.color || 'gray'}-900/50 text-${priority?.color || 'gray'}-400`}>
                          P{aircraft.alert_priority}
                        </span>
                        <span className="text-xs text-slate-500">{category?.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateAircraftPattern(aircraft.id, { is_active: !aircraft.is_active })}
                      className={`p-2 rounded-lg transition-colors ${
                        aircraft.is_active 
                          ? 'text-green-400 hover:bg-green-900/30' 
                          : 'text-slate-500 hover:bg-slate-700'
                      }`}
                      title={aircraft.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {aircraft.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteAircraftPattern(aircraft.id)}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN: Patrones de Callsign */}
      {activeSection === 'callsigns' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              Patrones de Callsign
            </h3>
            <button
              onClick={() => setShowAddCallsign(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar Patrón
            </button>
          </div>

          {/* Formulario para agregar */}
          {showAddCallsign && (
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-purple-700/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Patrón (ej: RCH)"
                  value={newCallsign.pattern}
                  onChange={(e) => setNewCallsign(prev => ({ ...prev, pattern: e.target.value.toUpperCase() }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
                <input
                  type="text"
                  placeholder="Descripción"
                  value={newCallsign.description}
                  onChange={(e) => setNewCallsign(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm md:col-span-2"
                />
                <select
                  value={newCallsign.military_branch}
                  onChange={(e) => setNewCallsign(prev => ({ ...prev, military_branch: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {MILITARY_BRANCHES.map(branch => (
                    <option key={branch.value} value={branch.value}>{branch.icon} {branch.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={newCallsign.mission_type}
                  onChange={(e) => setNewCallsign(prev => ({ ...prev, mission_type: e.target.value }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {MISSION_TYPES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={newCallsign.alert_priority}
                  onChange={(e) => setNewCallsign(prev => ({ ...prev, alert_priority: parseInt(e.target.value) }))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {PRIORITY_LEVELS.map(p => (
                    <option key={p.value} value={p.value}>Prioridad {p.value}: {p.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveCallsign}
                  disabled={!newCallsign.pattern}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg text-sm"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => setShowAddCallsign(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de callsigns agrupados por rama */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {callsignPatterns.map(cs => {
              const branch = MILITARY_BRANCHES.find(b => b.value === cs.military_branch);
              const mission = MISSION_TYPES.find(m => m.value === cs.mission_type);
              const priority = PRIORITY_LEVELS.find(p => p.value === cs.alert_priority);
              
              return (
                <div
                  key={cs.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    cs.is_active 
                      ? 'bg-slate-900/50 border-slate-700' 
                      : 'bg-slate-900/20 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{branch?.icon || '❓'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">
                          {cs.pattern}
                        </span>
                        <span className="text-white text-sm">{cs.description}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{branch?.label}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{mission?.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-${priority?.color || 'gray'}-900/50 text-${priority?.color || 'gray'}-400`}>
                          P{cs.alert_priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCallsignPattern(cs.id, { is_active: !cs.is_active })}
                      className={`p-2 rounded-lg transition-colors ${
                        cs.is_active 
                          ? 'text-green-400 hover:bg-green-900/30' 
                          : 'text-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {cs.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteCallsignPattern(cs.id)}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN: Zonas de Alerta */}
      {activeSection === 'zones' && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Zonas de Alerta
          </h3>

          <p className="text-sm text-slate-400 mb-4">
            Activa las alertas para los países donde deseas recibir notificaciones de incursiones.
          </p>

          <div className="space-y-3">
            {alertZones.map(zone => {
              const flags = {
                'VEN': '🇻🇪', 'COL': '🇨🇴', 'BRA': '🇧🇷', 'GUY': '🇬🇾',
                'TTO': '🇹🇹', 'CUW': '🇨🇼', 'ABW': '🇦🇼', 'DOM': '🇩🇴'
              };
              
              return (
                <div
                  key={zone.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    zone.alert_enabled 
                      ? 'bg-red-900/20 border-red-700/50' 
                      : 'bg-slate-900/30 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{flags[zone.country_code] || '🌍'}</span>
                    <div>
                      <span className="text-white font-medium">{zone.country_name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">{zone.country_code}</span>
                        {zone.is_visible && (
                          <span className="text-xs text-blue-400">Visible en mapa</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAlertZone(zone.id, !zone.alert_enabled)}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      zone.alert_enabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-slate-600 hover:bg-slate-500 text-white'
                    }`}
                  >
                    {zone.alert_enabled ? (
                      <>
                        <Bell className="w-4 h-4" />
                        Alertas Activas
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4" />
                        Alertas Inactivas
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {alertZones.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay países configurados</p>
              <p className="text-sm">Agrega países desde el Gestor de Límites Marítimos</p>
            </div>
          )}
        </div>
      )}

      {/* Indicador de guardado */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Guardando cambios...
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
