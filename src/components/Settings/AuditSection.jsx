import { useState, useEffect } from 'react';
import { 
  ClipboardList,
  Users,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  LogIn,
  LogOut,
  XCircle,
  Shield,
  Activity,
  AlertTriangle,
  Search,
  Filter,
  History,
  ChevronLeft,
  MapPin,
  CheckCircle,
  User
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 📋 SECCIÓN DE AUDITORÍA DEL SISTEMA
 * 
 * Vista completa integrada en el panel de configuración.
 * Incluye: Logs de actividad + Conexiones de usuarios + Historial por usuario
 */

// Iconos de dispositivo
const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

// Estilos por tipo de evento
const EVENT_STYLES = {
  login: { icon: LogIn, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Inicio de sesión' },
  logout: { icon: LogOut, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Cierre de sesión' },
  login_failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Login fallido' },
  password_change: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Cambio de contraseña' },
  session_refresh: { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Sesión renovada' },
};

export default function AuditSection() {
  // Vista actual: 'logs' | 'users' | 'user-history'
  const [view, setView] = useState('logs');
  const [selectedUser, setSelectedUser] = useState(null);

  // Datos
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  
  // Loading states
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7d');

  // Cargar logs al montar
  useEffect(() => {
    loadLogs();
  }, [eventTypeFilter, dateFilter]);

  // Cargar logs de auditoría
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      // Calcular fecha de inicio según filtro
      let startDate = new Date();
      switch (dateFilter) {
        case '24h': startDate.setHours(startDate.getHours() - 24); break;
        case '7d': startDate.setDate(startDate.getDate() - 7); break;
        case '30d': startDate.setDate(startDate.getDate() - 30); break;
        case '90d': startDate.setDate(startDate.getDate() - 90); break;
        default: startDate.setDate(startDate.getDate() - 7);
      }

      let query = supabase
        .from('user_audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data: logsData, error: logsError } = await query;
      if (logsError) throw logsError;

      // Obtener perfiles de usuarios
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, username');

      // Combinar logs con perfiles
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      const enrichedLogs = (logsData || []).map(log => ({
        ...log,
        user: profileMap[log.user_id] || { email: log.user_email || 'Desconocido' }
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Cargar usuarios con estadísticas
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Obtener perfiles
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener estadísticas agregadas de auditoría
      const { data: stats } = await supabase
        .from('user_audit_logs')
        .select('user_id, event_type, ip_address, created_at, device_type, browser');

      // Procesar estadísticas por usuario
      const userStats = {};
      (stats || []).forEach(log => {
        if (!userStats[log.user_id]) {
          userStats[log.user_id] = {
            totalLogins: 0,
            failedLogins: 0,
            uniqueIPs: new Set(),
            lastLogin: null,
            lastLoginDetails: null
          };
        }
        
        if (log.event_type === 'login') {
          userStats[log.user_id].totalLogins++;
          if (!userStats[log.user_id].lastLogin || new Date(log.created_at) > new Date(userStats[log.user_id].lastLogin)) {
            userStats[log.user_id].lastLogin = log.created_at;
            userStats[log.user_id].lastLoginDetails = {
              ip_address: log.ip_address,
              device_type: log.device_type,
              browser: log.browser
            };
          }
        }
        
        if (log.event_type === 'login_failed') {
          userStats[log.user_id].failedLogins++;
        }
        
        if (log.ip_address) {
          userStats[log.user_id].uniqueIPs.add(log.ip_address);
        }
      });

      // Combinar perfiles con estadísticas
      const enrichedUsers = (profiles || []).map(user => ({
        ...user,
        totalLogins: userStats[user.id]?.totalLogins || 0,
        failedLogins: userStats[user.id]?.failedLogins || 0,
        uniqueIPs: userStats[user.id]?.uniqueIPs?.size || 0,
        last_login: userStats[user.id]?.lastLogin,
        lastLoginDetails: userStats[user.id]?.lastLoginDetails
      }));

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar historial de un usuario
  const loadUserHistory = async (user) => {
    setSelectedUser(user);
    setView('user-history');
    setLoadingHistory(true);
    
    try {
      const { data, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUserHistory(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setUserHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Cambiar a vista de usuarios
  const showUsersView = () => {
    setView('users');
    if (users.length === 0) {
      loadUsers();
    }
  };

  // Volver a vista principal
  const goBack = () => {
    if (view === 'user-history') {
      setView('users');
      setSelectedUser(null);
    } else {
      setView('logs');
    }
  };

  // Filtrar logs por búsqueda
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.user?.email?.toLowerCase().includes(search) ||
      log.user?.full_name?.toLowerCase().includes(search) ||
      log.ip_address?.includes(search) ||
      log.event_type?.toLowerCase().includes(search)
    );
  });

  // Calcular estadísticas
  const stats = {
    total: logs.length,
    logins: logs.filter(l => l.event_type === 'login').length,
    failed: logs.filter(l => l.event_type === 'login_failed').length,
    uniqueUsers: new Set(logs.map(l => l.user_id)).size,
    uniqueIPs: new Set(logs.filter(l => l.ip_address).map(l => l.ip_address)).size
  };

  // Formatear tiempo relativo
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES');
  };

  // Estado de usuario
  const getUserStatus = (lastLogin) => {
    if (!lastLogin) return { status: 'never', label: 'Nunca conectado', color: 'text-slate-500' };
    const now = new Date();
    const last = new Date(lastLogin);
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return { status: 'online', label: 'En línea', color: 'text-green-400' };
    if (diffMins < 30) return { status: 'recent', label: 'Reciente', color: 'text-blue-400' };
    if (diffHours < 24) return { status: 'today', label: 'Hoy', color: 'text-cyan-400' };
    if (diffDays < 7) return { status: 'week', label: 'Esta semana', color: 'text-amber-400' };
    if (diffDays < 30) return { status: 'month', label: 'Este mes', color: 'text-orange-400' };
    return { status: 'inactive', label: 'Inactivo', color: 'text-red-400' };
  };

  // Agrupar historial por fecha
  const groupedHistory = userHistory.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {view !== 'logs' && (
              <button
                onClick={goBack}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <ClipboardList className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {view === 'logs' && 'Registro de Actividad'}
                {view === 'users' && 'Conexiones de Usuarios'}
                {view === 'user-history' && `Historial: ${selectedUser?.full_name || selectedUser?.email}`}
              </h3>
              <p className="text-sm text-slate-400">
                {view === 'logs' && 'Eventos de auditoría del sistema'}
                {view === 'users' && 'Estado y última actividad de usuarios'}
                {view === 'user-history' && 'Historial completo de conexiones'}
              </p>
            </div>
          </div>

          {/* Botones de navegación */}
          {view === 'logs' && (
            <button
              onClick={showUsersView}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Ver Usuarios
            </button>
          )}
        </div>

        {/* === VISTA: LOGS === */}
        {view === 'logs' && (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Activity className="w-3 h-3" />
                  Total Eventos
                </div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                  <LogIn className="w-3 h-3" />
                  Logins Exitosos
                </div>
                <div className="text-2xl font-bold text-green-400">{stats.logins}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  Logins Fallidos
                </div>
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Usuarios Únicos
                </div>
                <div className="text-2xl font-bold text-blue-400">{stats.uniqueUsers}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-purple-400 text-xs mb-1">
                  <Globe className="w-3 h-3" />
                  IPs Únicas
                </div>
                <div className="text-2xl font-bold text-purple-400">{stats.uniqueIPs}</div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por usuario, IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">Todos los eventos</option>
                <option value="login">Logins exitosos</option>
                <option value="logout">Logouts</option>
                <option value="login_failed">Logins fallidos</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
              <button
                onClick={loadLogs}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 text-slate-300 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Lista de logs */}
            <div className="bg-slate-900/50 rounded-lg border border-slate-700 max-h-[500px] overflow-auto">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
                  <p>No hay eventos en este período</p>
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
                      const style = EVENT_STYLES[log.event_type] || { 
                        icon: Activity, color: 'text-slate-400', bg: 'bg-slate-400/10', label: log.event_type 
                      };
                      const EventIcon = style.icon;
                      const DeviceIcon = DEVICE_ICONS[log.device_type] || Monitor;

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${style.bg}`}>
                                <EventIcon className={`w-4 h-4 ${style.color}`} />
                              </div>
                              <span className={`text-sm font-medium ${style.color}`}>
                                {style.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <div>
                                <div className="text-sm text-white">
                                  {log.user?.full_name || 'Usuario'}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {log.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <DeviceIcon className="w-4 h-4" />
                              <span>{log.browser || log.device_type || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-400 font-mono">
                              {log.ip_address || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-slate-400">
                              {formatRelativeTime(log.created_at)}
                            </div>
                            <div className="text-xs text-slate-600">
                              {new Date(log.created_at).toLocaleTimeString('es-ES')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.success !== false ? (
                              <span className="flex items-center gap-1 text-green-400 text-xs">
                                <CheckCircle className="w-3 h-3" />
                                OK
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 text-xs">
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

            <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
              <span>Mostrando {filteredLogs.length} de {logs.length} registros</span>
              <span>Los logs se retienen por 90 días</span>
            </div>
          </>
        )}

        {/* === VISTA: USUARIOS === */}
        {view === 'users' && (
          <>
            {/* Stats de usuarios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Total Usuarios</div>
                <div className="text-2xl font-bold text-white">{users.length}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-green-400 mb-1">Activos (hoy)</div>
                <div className="text-2xl font-bold text-green-400">
                  {users.filter(u => {
                    if (!u.last_login) return false;
                    const diff = Date.now() - new Date(u.last_login).getTime();
                    return diff < 86400000;
                  }).length}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-amber-400 mb-1">Alertas</div>
                <div className="text-2xl font-bold text-amber-400">
                  {users.filter(u => u.failedLogins > 0).length}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-red-400 mb-1">Inactivos (+30d)</div>
                <div className="text-2xl font-bold text-red-400">
                  {users.filter(u => {
                    if (!u.last_login) return true;
                    const diff = Date.now() - new Date(u.last_login).getTime();
                    return diff > 30 * 86400000;
                  }).length}
                </div>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="space-y-3 max-h-[500px] overflow-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : users.map((user) => {
                const status = getUserStatus(user.last_login);
                const DeviceIcon = DEVICE_ICONS[user.lastLoginDetails?.device_type] || Monitor;

                return (
                  <div 
                    key={user.id}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(user.full_name || user.email)?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                          status.status === 'online' ? 'bg-green-500' :
                          status.status === 'recent' ? 'bg-blue-500' :
                          status.status === 'today' ? 'bg-cyan-500' :
                          status.status === 'week' ? 'bg-amber-500' :
                          status.status === 'month' ? 'bg-orange-500' :
                          'bg-slate-500'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">
                            {user.full_name || user.username || 'Sin nombre'}
                          </span>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm truncate">{user.email}</div>
                      </div>

                      {/* Última conexión */}
                      <div className="text-right hidden md:block">
                        <div className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs justify-end">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(user.last_login)}
                        </div>
                      </div>

                      {/* Dispositivo */}
                      {user.lastLoginDetails && (
                        <div className="flex flex-col items-center gap-1 w-16 hidden lg:flex">
                          <DeviceIcon className="w-5 h-5 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {user.lastLoginDetails.browser || 'Unknown'}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-slate-400 font-medium">{user.totalLogins}</div>
                          <div className="text-slate-600 text-xs">logins</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-400 font-medium">{user.uniqueIPs}</div>
                          <div className="text-slate-600 text-xs">IPs</div>
                        </div>
                      </div>

                      {/* IP */}
                      {user.lastLoginDetails?.ip_address && (
                        <div className="hidden xl:flex items-center gap-1 text-slate-500 text-xs font-mono">
                          <Globe className="w-3 h-3" />
                          {user.lastLoginDetails.ip_address}
                        </div>
                      )}

                      {/* Botón historial */}
                      <button
                        onClick={() => loadUserHistory(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Historial
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* === VISTA: HISTORIAL DE USUARIO === */}
        {view === 'user-history' && selectedUser && (
          <>
            {/* Header del usuario */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {(selectedUser.full_name || selectedUser.email)?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white">
                  {selectedUser.full_name || selectedUser.username || 'Usuario'}
                </h4>
                <p className="text-sm text-slate-400">{selectedUser.email}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{userHistory.length}</div>
                <div className="text-xs text-slate-500">eventos registrados</div>
              </div>
            </div>

            {/* Timeline de eventos */}
            <div className="max-h-[500px] overflow-auto space-y-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : userHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <History className="w-12 h-12 mb-3 opacity-30" />
                  <p>No hay historial de actividad</p>
                </div>
              ) : (
                Object.entries(groupedHistory).map(([date, dayLogs]) => (
                  <div key={date}>
                    {/* Fecha */}
                    <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm py-2 mb-3 z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-700"></div>
                        <span className="text-xs text-slate-500 uppercase tracking-wider px-2">
                          {date}
                        </span>
                        <div className="h-px flex-1 bg-slate-700"></div>
                      </div>
                    </div>

                    {/* Eventos del día */}
                    <div className="space-y-2">
                      {dayLogs.map((log) => {
                        const style = EVENT_STYLES[log.event_type] || { 
                          icon: Activity, color: 'text-slate-400', bg: 'bg-slate-400/10', label: log.event_type 
                        };
                        const EventIcon = style.icon;
                        const DeviceIcon = DEVICE_ICONS[log.device_type] || Monitor;

                        return (
                          <div 
                            key={log.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${style.bg} border border-slate-800`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg}`}>
                              <EventIcon className={`w-5 h-5 ${style.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${style.color}`}>
                                  {style.label}
                                </span>
                                {log.success === false && (
                                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                    Error
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(log.created_at).toLocaleTimeString('es-ES')}
                                </span>
                                
                                {log.device_type && (
                                  <span className="flex items-center gap-1">
                                    <DeviceIcon className="w-3 h-3" />
                                    {log.browser || log.device_type}
                                  </span>
                                )}
                                
                                {log.ip_address && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <MapPin className="w-3 h-3" />
                                    {log.ip_address}
                                  </span>
                                )}

                                {log.os && (
                                  <span className="text-slate-600">
                                    {log.os}
                                  </span>
                                )}
                              </div>

                              {log.error_message && (
                                <div className="mt-1 text-xs text-red-400/80 italic">
                                  {log.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

