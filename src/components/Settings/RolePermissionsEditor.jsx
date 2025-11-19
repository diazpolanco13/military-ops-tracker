import { useState, useEffect } from 'react';
import { Shield, Save, RefreshCw, CheckCircle, AlertCircle, Crown, UserCheck, Eye as EyeIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 🔐 Editor de Permisos por Rol
 * Permite configurar qué puede hacer cada rol mediante toggles
 */
export default function RolePermissionsEditor() {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRole, setSelectedRole] = useState('operator'); // ✅ Inicia con Colaborador

  // Definición de permisos disponibles
  const PERMISSION_GROUPS = [
    {
      title: 'Entidades',
      icon: Shield,
      permissions: [
        { key: 'view_entities', label: 'Ver Entidades', description: 'Puede ver entidades en el mapa' },
        { key: 'create_entities', label: 'Crear Entidades', description: 'Puede crear nuevas entidades' },
        { key: 'edit_entities', label: 'Editar Entidades', description: 'Puede modificar entidades existentes' },
        { key: 'delete_entities', label: 'Eliminar Entidades', description: 'Puede eliminar/archivar entidades' }
      ]
    },
    {
      title: 'Eventos',
      icon: CheckCircle,
      permissions: [
        { key: 'view_events', label: 'Ver Eventos', description: 'Puede ver eventos en el timeline' },
        { key: 'create_events', label: 'Crear Eventos', description: 'Puede crear nuevos eventos' },
        { key: 'edit_events', label: 'Editar Eventos', description: 'Puede modificar eventos existentes' },
        { key: 'delete_events', label: 'Eliminar Eventos', description: 'Puede eliminar eventos' }
      ]
    },
    {
      title: 'Plantillas',
      icon: Shield,
      permissions: [
        { key: 'view_templates', label: 'Ver Plantillas', description: 'Puede ver y usar plantillas' },
        { key: 'create_templates', label: 'Crear Plantillas', description: 'Puede crear nuevas plantillas' },
        { key: 'manage_templates', label: 'Administrar Plantillas', description: 'Puede editar y eliminar plantillas' }
      ]
    },
    {
      title: 'Sistema',
      icon: Shield,
      permissions: [
        { key: 'manage_users', label: 'Gestionar Usuarios', description: 'Puede crear, editar y eliminar usuarios' },
        { key: 'access_settings', label: 'Acceso a Configuración', description: 'Puede acceder al menú de configuración' }
      ]
    }
  ];

  // Roles (valores deben coincidir con constraint de BD y useUserRole)
  const ROLES = [
    { value: 'admin', label: 'Administrador', icon: Crown, color: 'text-red-400' },
    { value: 'operator', label: 'Colaborador', icon: UserCheck, color: 'text-blue-400' },
    { value: 'viewer', label: 'Solo Lectura', icon: EyeIcon, color: 'text-slate-400' }
  ];

  // Cargar permisos
  useEffect(() => {
    loadPermissions();
  }, [selectedRole]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('role_permissions')
        .select('role, permissions')
        .eq('role', selectedRole)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      if (data) {
        setPermissions(data.permissions || {});
      } else {
        // Si no existe, crear con permisos por defecto
        const defaultPermissions = getDefaultPermissions(selectedRole);
        setPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error('❌ Error cargando permisos:', err);
      setError('Error al cargar permisos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: {
        view_entities: true,
        create_entities: true,
        edit_entities: true,
        delete_entities: true,
        view_events: true,
        create_events: true,
        edit_events: true,
        delete_events: true,
        view_templates: true,
        create_templates: true,
        manage_templates: true,
        manage_users: true,
        access_settings: true
      },
      operator: {
        view_entities: true,
        create_entities: true,
        edit_entities: true,
        delete_entities: false,
        view_events: true,
        create_events: true,
        edit_events: true,
        delete_events: false,
        view_templates: true,
        create_templates: false,
        manage_templates: false,
        manage_users: false,
        access_settings: true  // ✅ Por defecto tienen acceso
      },
      analyst: {
        view_entities: true,
        create_entities: true,
        edit_entities: true,
        delete_entities: false,
        view_events: true,
        create_events: true,
        edit_events: true,
        delete_events: false,
        view_templates: true,
        create_templates: false,
        manage_templates: false,
        manage_users: false,
        access_settings: true  // ✅ Por defecto tienen acceso
      },
      viewer: {
        view_entities: true,
        create_entities: false,
        edit_entities: false,
        delete_entities: false,
        view_events: true,
        create_events: false,
        edit_events: false,
        delete_events: false,
        view_templates: true,
        create_templates: false,
        manage_templates: false,
        manage_users: false,
        access_settings: false
      }
    };
    return defaults[role] || defaults.viewer;
  };

  const togglePermission = (permissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
    setSuccess(null);
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error: saveError } = await supabase
        .from('role_permissions')
        .upsert({
          role: selectedRole,
          permissions: permissions,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'role'
        });

      if (saveError) {
        throw saveError;
      }

      setSuccess(`Permisos de ${ROLES.find(r => r.value === selectedRole)?.label} guardados exitosamente`);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error guardando permisos:', err);
      setError('Error al guardar permisos: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm(`¿Restablecer permisos de ${ROLES.find(r => r.value === selectedRole)?.label} a los valores por defecto?`)) {
      const defaults = getDefaultPermissions(selectedRole);
      setPermissions(defaults);
      setSuccess(null);
      setError(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Cargando permisos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Rol */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Seleccionar Rol
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map((roleOption) => {
            const Icon = roleOption.icon;
            return (
              <button
                key={roleOption.value}
                onClick={() => setSelectedRole(roleOption.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedRole === roleOption.value
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${roleOption.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${roleOption.color}`}>
                      {roleOption.label}
                    </div>
                  </div>
                  {selectedRole === roleOption.value && (
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-300 text-sm font-medium">Error</p>
            <p className="text-red-400 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-300 text-sm font-medium">Éxito</p>
            <p className="text-green-400 text-xs mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Editor de Permisos */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Permisos de {ROLES.find(r => r.value === selectedRole)?.label}
          </h3>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Restablecer
          </button>
        </div>

        <div className="space-y-6">
          {PERMISSION_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.title} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                  <GroupIcon className="w-5 h-5 text-blue-400" />
                  <h4 className="text-base font-semibold text-white">{group.title}</h4>
                </div>
                
                <div className="space-y-3 pl-2">
                  {group.permissions.map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-start justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white mb-1">
                          {permission.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {permission.description}
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        onClick={() => togglePermission(permission.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          permissions[permission.key]
                            ? 'bg-purple-600'
                            : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            permissions[permission.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Guardar */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <button
            onClick={savePermissions}
            disabled={saving}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              saving
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Permisos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Información */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Acerca de los Permisos
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Los permisos se aplican inmediatamente después de guardar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Los cambios afectan a todos los usuarios con ese rol</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Las políticas RLS en Supabase también se actualizan automáticamente</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">⚠️</span>
            <span><strong>Nota:</strong> Solo administradores pueden modificar permisos</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

