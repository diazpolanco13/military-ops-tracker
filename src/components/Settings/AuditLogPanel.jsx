import { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Clock, 
  User, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  ChevronDown,
  Search,
  LogIn,
  LogOut,
  Activity,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UserConnectionsPanel from './UserConnectionsPanel';

/**
 * 📋 PANEL DE AUDITORÍA DE USUARIOS
 * 
 * Muestra el registro de actividad de los usuarios del sistema.
 * Solo visible para admins.
 */

// Iconos por tipo de evento
const EVENT_ICONS = {
  login: LogIn,
  login_failed: XCircle,
  logout: LogOut,
  session_refresh: RefreshCw,
  password_change: Shield,
  entity_create: Activity,
  entity_update: Activity,
  entity_delete: Activity,
  settings_change: Activity,
  error: AlertTriangle,
};

// Colores por tipo de evento
const EVENT_COLORS = {
  login: 'text-green-400 bg-green-400/10',
  login_failed: 'text-red-400 bg-red-400/10',
  logout: 'text-blue-400 bg-blue-400/10',
  session_refresh: 'text-cyan-400 bg-cyan-400/10',
  password_change: 'text-purple-400 bg-purple-400/10',
  entity_create: 'text-emerald-400 bg-emerald-400/10',
  entity_update: 'text-amber-400 bg-amber-400/10',
  entity_delete: 'text-red-400 bg-red-400/10',
  settings_change: 'text-yellow-400 bg-yellow-400/10',
  error: 'text-red-400 bg-red-400/10',
};

// Iconos de dispositivo
const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Monitor,
};

// Formatear fecha relativa
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} días`;
  
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AuditLogPanel({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    eventType: 'all',
    userId: 'all',
    dateRange: '7d',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUsersPanel, setShowUsersPanel] = useState(false);

  // Cargar logs
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Calcular fecha según rango
        const dateRanges = {
          '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
          '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          'all': new Date(0),
        };
        const startDate = dateRanges[filters.dateRange] || dateRanges['7d'];

        // Cargar usuarios primero para hacer join manual
        const { data: usersData } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, username')
          .order('full_name');
        
        setUsers(usersData || []);

        // Crear mapa de usuarios para lookup rápido
        const usersMap = new Map((usersData || []).map(u => [u.id, u]));

        // Cargar logs (sin join, la FK apunta a auth.users no a user_profiles)
        let query = supabase
          .from('user_audit_logs')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(500);

        if (filters.eventType !== 'all') {
          query = query.eq('event_type', filters.eventType);
        }
        if (filters.userId !== 'all') {
          query = query.eq('user_id', filters.userId);
        }

        const { data: logsData, error } = await query;
        
        if (error) throw error;

        // Enriquecer logs con info de usuario (join manual)
        const enrichedLogs = (logsData || []).map(log => ({
          ...log,
          user_profiles: log.user_id ? usersMap.get(log.user_id) || null : null,
        }));

        setLogs(enrichedLogs);

        // Calcular estadísticas
        const statsData = {
          totalEvents: enrichedLogs.length || 0,
          logins: enrichedLogs.filter(l => l.event_type === 'login' && l.success).length || 0,
          failedLogins: enrichedLogs.filter(l => l.event_type === 'login_failed').length || 0,
          uniqueUsers: new Set(enrichedLogs.filter(l => l.user_id).map(l => l.user_id)).size,
          uniqueIPs: new Set(enrichedLogs.filter(l => l.ip_address).map(l => l.ip_address)).size,
        };
        setStats(statsData);

      } catch (error) {
        console.error('Error cargando logs de auditoría:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, filters.eventType, filters.userId, filters.dateRange]);

  // Filtrar por búsqueda
  const filteredLogs = useMemo(() => {
    if (!filters.search) return logs;
    
    const search = filters.search.toLowerCase();
    return logs.filter(log => 
      log.event_description?.toLowerCase().includes(search) ||
      log.user_profiles?.email?.toLowerCase().includes(search) ||
      log.user_profiles?.full_name?.toLowerCase().includes(search) ||
      log.ip_address?.includes(search) ||
      log.browser?.toLowerCase().includes(search)
    );
  }, [logs, filters.search]);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Auditoría del Sistema</h2>
              <p className="text-xs text-slate-500">Registro de actividad de usuarios</p>
            </div>
          </div>
          <button
            onClick={() => setShowUsersPanel(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            Ver Usuarios
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="px-6 py-4 border-b border-slate-700 grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Activity className="w-4 h-4" />
                Total Eventos
              </div>
              <div className="text-xl font-bold text-white">{stats.totalEvents}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                <LogIn className="w-4 h-4" />
                Logins Exitosos
              </div>
              <div className="text-xl font-bold text-green-400">{stats.logins}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                <XCircle className="w-4 h-4" />
                Logins Fallidos
              </div>
              <div className="text-xl font-bold text-red-400">{stats.failedLogins}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                <User className="w-4 h-4" />
                Usuarios Únicos
              </div>
              <div className="text-xl font-bold text-blue-400">{stats.uniqueUsers}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                <Globe className="w-4 h-4" />
                IPs Únicas
              </div>
              <div className="text-xl font-bold text-amber-400">{stats.uniqueIPs}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-700 flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por usuario, IP, descripción..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Tipo de evento */}
          <select
            value={filters.eventType}
            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos los eventos</option>
            <option value="login">🟢 Login</option>
            <option value="login_failed">🔴 Login Fallido</option>
            <option value="logout">🔵 Logout</option>
            <option value="password_change">🟣 Cambio Contraseña</option>
            <option value="entity_create">Crear Entidad</option>
            <option value="entity_update">Editar Entidad</option>
            <option value="settings_change">Configuración</option>
            <option value="error">⚠️ Error</option>
          </select>

          {/* Usuario */}
          <select
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos los usuarios</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.username || user.email}
              </option>
            ))}
          </select>

          {/* Rango de fecha */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="all">Todo el historial</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => setFilters({ ...filters })}
            disabled={loading}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Shield className="w-12 h-12 mb-3 opacity-30" />
              <p>No hay registros de auditoría</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/50 sticky top-0">
                <tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Dispositivo</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map((log) => {
                  const EventIcon = EVENT_ICONS[log.event_type] || Activity;
                  const DeviceIcon = DEVICE_ICONS[log.device_type] || Monitor;
                  const colorClass = EVENT_COLORS[log.event_type] || 'text-slate-400 bg-slate-400/10';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Evento */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                            <EventIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">
                              {log.event_type.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">
                              {log.event_description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm text-white">
                              {log.user_profiles?.full_name || log.user_profiles?.username || '—'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {log.user_profiles?.email || log.metadata?.email || 'Anónimo'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dispositivo */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-slate-500" />
                          <div>
                            <div className="text-sm text-slate-300">{log.browser || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{log.os || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-300 font-mono">
                          {log.ip_address || '—'}
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-300">
                          {formatRelativeTime(log.created_at)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString('es-ES')}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">
                            <XCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando {filteredLogs.length} de {logs.length} registros
          </span>
          <span>
            Los logs se retienen por 90 días
          </span>
        </div>
      </div>
    </div>

    {/* Panel de Usuarios */}
    {showUsersPanel && (
      <UserConnectionsPanel onClose={() => setShowUsersPanel(false)} />
    )}
    </>
  );
}

