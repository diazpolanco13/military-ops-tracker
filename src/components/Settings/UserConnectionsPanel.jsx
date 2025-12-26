import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Monitor, 
  Smartphone,
  Tablet,
  AlertTriangle,
  RefreshCw,
  Shield,
  Globe,
  Activity,
  User,
  History,
  LogIn,
  LogOut,
  ChevronLeft,
  MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 👥 PANEL DE CONEXIONES DE USUARIOS
 * 
 * Muestra el estado de conexión de todos los usuarios del sistema.
 * Última conexión, dispositivo usado, intentos fallidos, etc.
 */

// Iconos de dispositivo
const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Monitor,
};

// Formatear fecha relativa
function formatRelativeTime(date) {
  if (!date) return 'Nunca';
  
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'En línea';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Estado del usuario basado en última conexión
function getUserStatus(lastLogin) {
  if (!lastLogin) return { status: 'inactive', label: 'Nunca conectado', color: 'text-slate-500' };
  
  const diff = Date.now() - new Date(lastLogin).getTime();
  const minutes = diff / 60000;
  const hours = diff / 3600000;
  const days = diff / 86400000;

  if (minutes < 15) return { status: 'online', label: 'En línea', color: 'text-green-400' };
  if (hours < 1) return { status: 'recent', label: 'Reciente', color: 'text-blue-400' };
  if (days < 1) return { status: 'today', label: 'Hoy', color: 'text-cyan-400' };
  if (days < 7) return { status: 'week', label: 'Esta semana', color: 'text-amber-400' };
  if (days < 30) return { status: 'month', label: 'Este mes', color: 'text-orange-400' };
  
  return { status: 'inactive', label: 'Inactivo', color: 'text-red-400' };
}

export default function UserConnectionsPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('last_login'); // last_login, name, logins
  const [selectedUserHistory, setSelectedUserHistory] = useState(null); // Usuario para ver historial
  const [userHistoryLogs, setUserHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cargar datos de conexiones
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Obtener usuarios
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('last_login', { ascending: false, nullsFirst: false });

        if (usersError) throw usersError;

        // Obtener todos los logs de login en una sola consulta
        const { data: allLogsData } = await supabase
          .from('user_audit_logs')
          .select('user_id, event_type, success, ip_address, device_type, browser, os, created_at')
          .in('event_type', ['login', 'login_failed'])
          .order('created_at', { ascending: false });

        const allLogs = allLogsData || [];

        // Procesar estadísticas por usuario (en memoria, sin consultas adicionales)
        const usersWithStats = (usersData || []).map(user => {
          // Filtrar logs de este usuario
          const userLogs = allLogs.filter(log => log.user_id === user.id);
          const successfulLogins = userLogs.filter(log => log.event_type === 'login' && log.success);
          const failedLogins = userLogs.filter(log => log.event_type === 'login_failed');
          
          // Último login exitoso
          const lastLoginLog = successfulLogins[0] || null;
          
          // Logins fallidos en últimas 24h
          const now = Date.now();
          const failedLogins24h = failedLogins.filter(
            log => (now - new Date(log.created_at).getTime()) < 24 * 60 * 60 * 1000
          ).length;

          // IPs únicas
          const uniqueIPs = new Set(
            successfulLogins.filter(log => log.ip_address).map(log => log.ip_address)
          ).size;

          return {
            ...user,
            lastLoginDetails: lastLoginLog ? {
              created_at: lastLoginLog.created_at,
              ip_address: lastLoginLog.ip_address,
              device_type: lastLoginLog.device_type,
              browser: lastLoginLog.browser,
              os: lastLoginLog.os,
            } : null,
            totalLogins: successfulLogins.length,
            failedLogins24h,
            uniqueIPs,
          };
        });

        setUsers(usersWithStats);
      } catch (error) {
        console.error('Error cargando datos de usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Cargar historial de un usuario específico
  const loadUserHistory = async (user) => {
    setSelectedUserHistory(user);
    setLoadingHistory(true);
    
    try {
      const { data, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUserHistoryLogs(data || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setUserHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Ordenar usuarios
  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.full_name || a.email).localeCompare(b.full_name || b.email);
      case 'logins':
        return b.totalLogins - a.totalLogins;
      case 'last_login':
      default:
        if (!a.last_login) return 1;
        if (!b.last_login) return -1;
        return new Date(b.last_login) - new Date(a.last_login);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Conexiones de Usuarios</h2>
              <p className="text-xs text-slate-500">Estado y última actividad</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Ordenar por */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="last_login">Última conexión</option>
              <option value="name">Nombre</option>
              <option value="logins">Total logins</option>
            </select>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-4 border-b border-slate-700 grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="w-4 h-4" />
              Total Usuarios
            </div>
            <div className="text-xl font-bold text-white">{users.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
              <CheckCircle className="w-4 h-4" />
              Activos (hoy)
            </div>
            <div className="text-xl font-bold text-green-400">
              {users.filter(u => {
                if (!u.last_login) return false;
                return (Date.now() - new Date(u.last_login).getTime()) < 24 * 60 * 60 * 1000;
              }).length}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <AlertTriangle className="w-4 h-4" />
              Alertas
            </div>
            <div className="text-xl font-bold text-amber-400">
              {users.filter(u => u.failedLogins24h > 0).length}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
              <XCircle className="w-4 h-4" />
              Inactivos (+30d)
            </div>
            <div className="text-xl font-bold text-red-400">
              {users.filter(u => {
                if (!u.last_login) return true;
                return (Date.now() - new Date(u.last_login).getTime()) > 30 * 24 * 60 * 60 * 1000;
              }).length}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p>No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {sortedUsers.map((user) => {
                const status = getUserStatus(user.last_login);
                const DeviceIcon = DEVICE_ICONS[user.lastLoginDetails?.device_type] || Monitor;

                return (
                  <div 
                    key={user.id} 
                    className="px-6 py-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(user.full_name || user.email)?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        {/* Indicador de estado */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                          status.status === 'online' ? 'bg-green-500' :
                          status.status === 'recent' ? 'bg-blue-500' :
                          status.status === 'today' ? 'bg-cyan-500' :
                          status.status === 'week' ? 'bg-amber-500' :
                          status.status === 'month' ? 'bg-orange-500' :
                          'bg-slate-500'
                        }`} />
                      </div>

                      {/* Info principal */}
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
                          {!user.is_active && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                              Desactivado
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm truncate">
                          {user.email}
                        </div>
                        {user.cargo && (
                          <div className="text-slate-500 text-xs truncate">
                            {user.cargo} {user.organizacion ? `• ${user.organizacion}` : ''}
                          </div>
                        )}
                      </div>

                      {/* Última conexión */}
                      <div className="text-right">
                        <div className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs justify-end">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(user.last_login)}
                        </div>
                      </div>

                      {/* Dispositivo último login */}
                      {user.lastLoginDetails && (
                        <div className="flex flex-col items-center gap-1 w-20">
                          <DeviceIcon className="w-5 h-5 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {user.lastLoginDetails.browser || 'Unknown'}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        {/* Total logins */}
                        <div className="text-center">
                          <div className="text-slate-400 font-medium">{user.totalLogins}</div>
                          <div className="text-slate-600 text-xs">logins</div>
                        </div>

                        {/* IPs únicas */}
                        <div className="text-center">
                          <div className="text-slate-400 font-medium">{user.uniqueIPs}</div>
                          <div className="text-slate-600 text-xs">IPs</div>
                        </div>

                        {/* Intentos fallidos */}
                        {user.failedLogins24h > 0 && (
                          <div className="text-center">
                            <div className="text-red-400 font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {user.failedLogins24h}
                            </div>
                            <div className="text-red-400/60 text-xs">fallidos</div>
                          </div>
                        )}
                      </div>

                      {/* IP último login */}
                      {user.lastLoginDetails?.ip_address && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                          <Globe className="w-3 h-3" />
                          {user.lastLoginDetails.ip_address}
                        </div>
                      )}

                      {/* Botón Ver Historial */}
                      <button
                        onClick={() => loadUserHistory(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                        title="Ver historial de conexiones"
                      >
                        <History className="w-4 h-4" />
                        Historial
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>
            {users.filter(u => u.is_active !== false).length} usuarios activos
          </span>
          <span>
            Actualizado: {new Date().toLocaleTimeString('es-ES')}
          </span>
        </div>
      </div>

      {/* Modal de Historial de Usuario */}
      {selectedUserHistory && (
        <UserHistoryModal
          user={selectedUserHistory}
          logs={userHistoryLogs}
          loading={loadingHistory}
          onClose={() => setSelectedUserHistory(null)}
        />
      )}
    </div>
  );
}

/**
 * 📜 Modal de Historial de Conexiones de Usuario
 */
function UserHistoryModal({ user, logs, loading, onClose }) {
  // Agrupar logs por fecha
  const groupedLogs = logs.reduce((acc, log) => {
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

  // Iconos y colores por tipo de evento
  const EVENT_STYLES = {
    login: { icon: LogIn, color: 'text-green-400', bg: 'bg-green-400/10' },
    logout: { icon: LogOut, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    login_failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    password_change: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    session_refresh: { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  };

  const DEVICE_ICONS = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {(user.full_name || user.email)?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">
              {user.full_name || user.username || 'Usuario'}
            </h2>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white">{logs.length}</div>
            <div className="text-xs text-slate-500">eventos</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <History className="w-12 h-12 mb-3 opacity-30" />
              <p>No hay historial de actividad</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  {/* Fecha */}
                  <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm py-2 mb-3 z-10">
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
                        icon: Activity, 
                        color: 'text-slate-400', 
                        bg: 'bg-slate-400/10' 
                      };
                      const EventIcon = style.icon;
                      const DeviceIcon = DEVICE_ICONS[log.device_type] || Monitor;

                      return (
                        <div 
                          key={log.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${style.bg} border border-slate-800`}
                        >
                          {/* Icono del evento */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg}`}>
                            <EventIcon className={`w-5 h-5 ${style.color}`} />
                          </div>

                          {/* Info del evento */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${style.color}`}>
                                {log.event_type === 'login' ? 'Inicio de sesión' :
                                 log.event_type === 'logout' ? 'Cierre de sesión' :
                                 log.event_type === 'login_failed' ? 'Login fallido' :
                                 log.event_type === 'password_change' ? 'Cambio de contraseña' :
                                 log.event_type}
                              </span>
                              {!log.success && (
                                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                  Error
                                </span>
                              )}
                            </div>
                            
                            {/* Detalles */}
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              {/* Hora */}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.created_at).toLocaleTimeString('es-ES')}
                              </span>
                              
                              {/* Dispositivo */}
                              {log.device_type && (
                                <span className="flex items-center gap-1">
                                  <DeviceIcon className="w-3 h-3" />
                                  {log.browser || log.device_type}
                                </span>
                              )}
                              
                              {/* IP */}
                              {log.ip_address && (
                                <span className="flex items-center gap-1 font-mono">
                                  <MapPin className="w-3 h-3" />
                                  {log.ip_address}
                                </span>
                              )}

                              {/* OS */}
                              {log.os && (
                                <span className="text-slate-600">
                                  {log.os}
                                </span>
                              )}
                            </div>

                            {/* Mensaje de error si existe */}
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
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Mostrando últimos {logs.length} eventos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

