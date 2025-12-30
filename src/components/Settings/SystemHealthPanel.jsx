/**
 * 🏥 SYSTEM HEALTH PANEL - Monitor de Estado del Sistema
 * 
 * Monitorea en tiempo real:
 * - Conexión a Supabase
 * - Canales Realtime activos
 * - Edge Functions y Cron Jobs
 * - Registro de aeronaves
 * - Monitor de incursiones
 * - Logs y alertas recientes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Database,
  Wifi,
  WifiOff,
  Radio,
  Server,
  Plane,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Bell,
  TrendingUp,
  Eye,
  Loader2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Globe,
  Shield,
  Timer,
  ArrowUpRight,
  Pause,
  Play
} from 'lucide-react';
import { supabase, getConnectionStatus, withTimeout } from '../../lib/supabase';
import { realtimeManager } from '../../lib/realtimeManager';

// Intervalo de actualización (10 segundos)
const REFRESH_INTERVAL = 10000;
const QUERY_TIMEOUT = 8000;

export default function SystemHealthPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados del sistema
  const [supabaseStatus, setSupabaseStatus] = useState('checking');
  const [realtimeStatus, setRealtimeStatus] = useState(null);
  const [cronJobs, setCronJobs] = useState([]);
  const [edgeFunctions, setEdgeFunctions] = useState([]);
  const [aircraftStats, setAircraftStats] = useState(null);
  const [incursionStats, setIncursionStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Secciones expandidas
  const [expandedSections, setExpandedSections] = useState({
    connection: true,
    realtime: true,
    cron: false,
    aircraft: true,
    incursions: true,
    alerts: false,
    logs: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [{
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('es-VE'),
    }, ...prev.slice(0, 49)]); // Máximo 50 logs
  }, []);

  // Verificar conexión a Supabase
  const checkSupabase = useCallback(async () => {
    try {
      const start = Date.now();
      const result = await withTimeout(
        supabase.from('entities').select('id', { count: 'exact', head: true }),
        QUERY_TIMEOUT
      );
      const latency = Date.now() - start;
      
      if (result.error) {
        setSupabaseStatus('error');
        addLog(`Supabase error: ${result.error.message}`, 'error');
        return { status: 'error', latency: null };
      }
      
      setSupabaseStatus(latency > 2000 ? 'slow' : 'connected');
      return { status: 'connected', latency };
    } catch (err) {
      setSupabaseStatus('timeout');
      addLog(`Supabase timeout: ${err.message}`, 'error');
      return { status: 'timeout', latency: null };
    }
  }, [addLog]);

  // Verificar estado de Realtime
  const checkRealtime = useCallback(() => {
    const status = realtimeManager.getStatus();
    setRealtimeStatus(status);
    return status;
  }, []);

  // Verificar cron jobs (usando tabla de configuración del monitor)
  const checkCronJobs = useCallback(async () => {
    try {
      // Verificamos la configuración del monitor de incursiones
      const configResult = await withTimeout(
        supabase
          .from('incursion_monitor_config')
          .select('is_active, telegram_enabled, last_execution_at, last_execution_status, inactivity_threshold_minutes')
          .limit(1),
        QUERY_TIMEOUT
      );
      
      if (configResult.data && configResult.data.length > 0) {
        const config = configResult.data[0];
        // Crear jobs basados en la configuración real
        const jobs = [
          {
            jobid: 1,
            jobname: 'military-airspace-monitor',
            schedule: 'Cada 2 minutos',
            active: config.is_active,
            description: 'Monitorea espacio aéreo militar',
            lastRun: config.last_execution_at,
            lastStatus: config.last_execution_status,
          },
          {
            jobid: 2,
            jobname: 'incursion-session-closer',
            schedule: `Cada ${config.inactivity_threshold_minutes || 5} minutos`,
            active: config.is_active,
            description: 'Cierra sesiones de incursión inactivas',
          },
          {
            jobid: 3,
            jobname: 'telegram-notifications',
            schedule: 'En tiempo real',
            active: config.telegram_enabled,
            description: 'Envía alertas a Telegram',
          },
        ];
        setCronJobs(jobs);
        return jobs;
      }
      
      setCronJobs([]);
      return [];
    } catch (err) {
      console.warn('[SystemHealth] Cron config check failed:', err.message);
      setCronJobs([]);
      return [];
    }
  }, []);

  // Verificar estadísticas de aeronaves
  const checkAircraftStats = useCallback(async () => {
    try {
      const result = await withTimeout(
        supabase.from('military_aircraft_registry')
          .select('icao24, is_new_today, total_incursions, last_seen'),
        QUERY_TIMEOUT
      );
      
      if (result.data) {
        const data = result.data;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const stats = {
          total: data.length,
          newToday: data.filter(a => a.is_new_today).length,
          withIncursions: data.filter(a => a.total_incursions > 0).length,
          activeLastHour: data.filter(a => new Date(a.last_seen) > oneHourAgo).length,
        };
        setAircraftStats(stats);
        return stats;
      }
      return null;
    } catch (err) {
      console.warn('[SystemHealth] Aircraft stats failed:', err.message);
      return null;
    }
  }, []);

  // Verificar estadísticas de incursiones
  const checkIncursionStats = useCallback(async () => {
    try {
      const result = await withTimeout(
        supabase.from('incursion_sessions')
          .select('id, status, started_at, zone_code')
          .order('started_at', { ascending: false })
          .limit(100),
        QUERY_TIMEOUT
      );
      
      if (result.data) {
        const data = result.data;
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
          total: data.length,
          active: data.filter(i => i.status === 'active').length,
          today: data.filter(i => i.started_at?.startsWith(today)).length,
          byZone: data.reduce((acc, i) => {
            acc[i.zone_code] = (acc[i.zone_code] || 0) + 1;
            return acc;
          }, {}),
        };
        setIncursionStats(stats);
        return stats;
      }
      return null;
    } catch (err) {
      console.warn('[SystemHealth] Incursion stats failed:', err.message);
      return null;
    }
  }, []);

  // Verificar alertas recientes
  const checkRecentAlerts = useCallback(async () => {
    try {
      const result = await withTimeout(
        supabase.from('incursion_sessions')
          .select('callsign, aircraft_type, zone_name, started_at, status')
          .order('started_at', { ascending: false })
          .limit(5),
        QUERY_TIMEOUT
      );
      
      if (result.data) {
        setRecentAlerts(result.data);
        return result.data;
      }
      return [];
    } catch (err) {
      return [];
    }
  }, []);

  // Refrescar todo
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    addLog('Actualizando estado del sistema...', 'info');
    
    const start = Date.now();
    
    await Promise.all([
      checkSupabase(),
      checkCronJobs(),
      checkAircraftStats(),
      checkIncursionStats(),
      checkRecentAlerts(),
    ]);
    
    checkRealtime();
    
    const elapsed = Date.now() - start;
    setLastRefresh(new Date());
    setIsRefreshing(false);
    addLog(`Sistema actualizado en ${elapsed}ms`, 'success');
  }, [checkSupabase, checkRealtime, checkCronJobs, checkAircraftStats, checkIncursionStats, checkRecentAlerts, addLog]);

  // Auto-refresh
  useEffect(() => {
    refreshAll();
    
    if (!autoRefresh) return;
    
    const interval = setInterval(refreshAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshAll]);

  // Componente de indicador de estado
  const StatusIndicator = ({ status, size = 'sm' }) => {
    const sizeClass = size === 'lg' ? 'w-4 h-4' : 'w-2.5 h-2.5';
    const colors = {
      connected: 'bg-green-500',
      slow: 'bg-yellow-500 animate-pulse',
      error: 'bg-red-500',
      timeout: 'bg-red-500 animate-pulse',
      checking: 'bg-slate-500 animate-pulse',
      active: 'bg-green-500',
      inactive: 'bg-slate-500',
    };
    
    return (
      <span className={`inline-block rounded-full ${sizeClass} ${colors[status] || colors.inactive}`} />
    );
  };

  // Sección colapsable
  const Section = ({ id, title, icon: Icon, children, badge, status }) => (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && (
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status && <StatusIndicator status={status} size="lg" />}
          {expandedSections[id] ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>
      {expandedSections[id] && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Monitor del Sistema</h3>
            <p className="text-xs text-slate-400">
              Estado en tiempo real de los componentes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAutoRefresh(!autoRefresh);
            }}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-slate-700 text-slate-400'
            }`}
            title={autoRefresh ? 'Auto-refresh activo' : 'Auto-refresh pausado'}
          >
            {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          {/* Refresh manual */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshAll();
            }}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Estado general */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50">
            <StatusIndicator status={supabaseStatus} size="lg" />
            <span className="text-xs text-slate-300 capitalize">
              {supabaseStatus === 'connected' ? 'Online' : 
               supabaseStatus === 'slow' ? 'Lento' :
               supabaseStatus === 'checking' ? 'Verificando...' : 'Offline'}
            </span>
          </div>
          
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="divide-y divide-slate-700/30">
          
          {/* === CONEXIÓN SUPABASE === */}
          <Section 
            id="connection" 
            title="Conexión a Base de Datos" 
            icon={Database}
            status={supabaseStatus}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Wifi className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Estado</span>
                </div>
                <div className="flex items-center gap-2">
                  {supabaseStatus === 'connected' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {supabaseStatus === 'slow' && <Timer className="w-4 h-4 text-yellow-400" />}
                  {supabaseStatus === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                  {supabaseStatus === 'timeout' && <WifiOff className="w-4 h-4 text-red-400" />}
                  {supabaseStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                  <span className="text-sm font-medium text-white capitalize">
                    {supabaseStatus === 'connected' ? 'Conectado' :
                     supabaseStatus === 'slow' ? 'Conexión lenta' :
                     supabaseStatus === 'error' ? 'Error' :
                     supabaseStatus === 'timeout' ? 'Sin respuesta' : 'Verificando...'}
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Última verificación</span>
                </div>
                <span className="text-sm text-white">
                  {lastRefresh ? lastRefresh.toLocaleTimeString('es-VE') : '—'}
                </span>
              </div>
            </div>
          </Section>

          {/* === REALTIME CHANNELS === */}
          <Section 
            id="realtime" 
            title="Canales Realtime" 
            icon={Radio}
            badge={realtimeStatus?.channels?.length || 0}
            status={realtimeStatus?.channels?.length > 0 ? 'active' : 'inactive'}
          >
            {realtimeStatus ? (
              <div className="space-y-2 mt-2">
                {realtimeStatus.channels.length > 0 ? (
                  <div className="grid gap-2">
                    {realtimeStatus.channels.map(table => (
                      <div 
                        key={table}
                        className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-700/50"
                      >
                        <div className="flex items-center gap-2">
                          <StatusIndicator status="active" />
                          <span className="text-sm font-mono text-slate-300">{table}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {realtimeStatus.listeners[table] || 0} listeners
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-500 text-sm">
                    No hay canales activos
                  </div>
                )}
                
                {/* Info adicional */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>Throttle: {realtimeManager.throttleMs}ms</span>
                  <span>Max reconexiones: {realtimeManager.maxReconnectAttempts}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin mx-auto" />
              </div>
            )}
          </Section>

          {/* === CRON JOBS / TAREAS PROGRAMADAS === */}
          <Section 
            id="cron" 
            title="Tareas Programadas" 
            icon={Timer}
            badge={cronJobs.length}
            status={cronJobs.some(j => j.active) ? 'active' : 'inactive'}
          >
            {cronJobs.length > 0 ? (
              <div className="space-y-2 mt-2">
                {cronJobs.map(job => (
                  <div 
                    key={job.jobid}
                    className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{job.jobname}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        job.active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {job.active ? 'Activo' : 'Desactivado'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-1">
                      ⏱️ {job.schedule}
                    </div>
                    {job.description && (
                      <div className="text-xs text-slate-500 mb-1">
                        {job.description}
                      </div>
                    )}
                    {job.lastRun && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700/30">
                        <Clock className="w-3 h-3" />
                        Última: {new Date(job.lastRun).toLocaleString('es-VE')}
                        {job.lastStatus && (
                          <span className={job.lastStatus === 'success' ? 'text-green-400' : 'text-amber-400'}>
                            ({job.lastStatus})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                  💡 Ejecutados via Supabase Edge Functions + pg_cron
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Sin configuración de tareas programadas
              </div>
            )}
          </Section>

          {/* === REGISTRO DE AERONAVES === */}
          <Section 
            id="aircraft" 
            title="Registro de Aeronaves" 
            icon={Plane}
            badge={aircraftStats?.total}
            status={aircraftStats ? 'active' : 'checking'}
          >
            {aircraftStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <StatCard 
                  label="Total" 
                  value={aircraftStats.total} 
                  icon={Plane}
                  color="sky"
                />
                <StatCard 
                  label="Nuevas hoy" 
                  value={aircraftStats.newToday} 
                  icon={Zap}
                  color="green"
                />
                <StatCard 
                  label="Con incursiones" 
                  value={aircraftStats.withIncursions} 
                  icon={AlertTriangle}
                  color="amber"
                />
                <StatCard 
                  label="Activas (1h)" 
                  value={aircraftStats.activeLastHour} 
                  icon={Eye}
                  color="purple"
                />
              </div>
            ) : (
              <div className="text-center py-3">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin mx-auto" />
              </div>
            )}
          </Section>

          {/* === INCURSIONES === */}
          <Section 
            id="incursions" 
            title="Monitor de Incursiones" 
            icon={Shield}
            badge={incursionStats?.today}
            status={incursionStats?.active > 0 ? 'active' : 'inactive'}
          >
            {incursionStats ? (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <StatCard 
                    label="Activas" 
                    value={incursionStats.active} 
                    icon={Activity}
                    color={incursionStats.active > 0 ? 'red' : 'slate'}
                  />
                  <StatCard 
                    label="Hoy" 
                    value={incursionStats.today} 
                    icon={Clock}
                    color="amber"
                  />
                  <StatCard 
                    label="Total" 
                    value={incursionStats.total} 
                    icon={TrendingUp}
                    color="sky"
                  />
                </div>
                
                {/* Por zona */}
                {Object.keys(incursionStats.byZone).length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400">Por zona:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(incursionStats.byZone).map(([zone, count]) => (
                        <span 
                          key={zone}
                          className="text-xs bg-slate-700/50 px-2 py-1 rounded text-slate-300"
                        >
                          {zone}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin mx-auto" />
              </div>
            )}
          </Section>

          {/* === ALERTAS RECIENTES === */}
          <Section 
            id="alerts" 
            title="Alertas Recientes" 
            icon={Bell}
            badge={recentAlerts.length}
          >
            {recentAlerts.length > 0 ? (
              <div className="space-y-2 mt-2">
                {recentAlerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-mono text-white truncate">
                          {alert.callsign || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {alert.zone_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className={`text-xs px-2 py-0.5 rounded-full ${
                        alert.status === 'active' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {alert.status}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {alert.started_at ? new Date(alert.started_at).toLocaleTimeString('es-VE', { 
                          hour: '2-digit', minute: '2-digit' 
                        }) : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Sin alertas recientes
              </div>
            )}
          </Section>

          {/* === LOGS === */}
          <Section 
            id="logs" 
            title="Logs del Sistema" 
            icon={Terminal}
            badge={logs.length}
          >
            {logs.length > 0 ? (
              <div className="space-y-1 mt-2 max-h-48 overflow-y-auto custom-scrollbar-transparent">
                {logs.map(log => (
                  <div 
                    key={log.id}
                    className={`flex items-start gap-2 p-1.5 rounded text-xs font-mono ${
                      log.type === 'error' ? 'text-red-400 bg-red-500/10' :
                      log.type === 'success' ? 'text-green-400 bg-green-500/10' :
                      'text-slate-400'
                    }`}
                  >
                    <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                Sin logs
              </div>
            )}
          </Section>

        </div>
      )}
    </div>
  );
}

// Componente de tarjeta de estadística
function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    sky: 'from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30',
    green: 'from-green-500/20 to-green-600/10 text-green-400 border-green-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
    slate: 'from-slate-500/20 to-slate-600/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-3 border text-center`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

