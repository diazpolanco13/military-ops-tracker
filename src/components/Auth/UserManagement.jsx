import { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, Mail, Lock, Shield, AlertCircle, CheckCircle, Eye, EyeOff, User, Briefcase, Building2, Edit2, X, Crown, UserCheck, Eye as EyeIcon, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 👥 Panel de Gestión de Usuarios
 * Crear, listar y eliminar usuarios desde el panel de configuración
 */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserNombre, setNewUserNombre] = useState('');
  const [newUserApellido, setNewUserApellido] = useState('');
  const [newUserCargo, setNewUserCargo] = useState('');
  const [newUserOrganizacion, setNewUserOrganizacion] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(null); // userId del usuario al que se le resetea
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Roles disponibles (valores deben coincidir con constraint de BD)
  // Constraint: CHECK (role IN ('admin', 'operator', 'analyst', 'viewer'))
  const ROLES = [
    { value: 'admin', label: 'Administrador', icon: Crown, description: 'Acceso completo al sistema', color: 'text-red-400' },
    { value: 'operator', label: 'Colaborador', icon: UserCheck, description: 'Puede añadir y editar información', color: 'text-blue-400' },
    { value: 'viewer', label: 'Solo Lectura', icon: EyeIcon, description: 'Solo puede ver el mapa', color: 'text-slate-400' }
  ];

  // Cargar usuarios usando Edge Function
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Obtener sesión actual para el token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      // Llamar a Edge Function admin-users
      const response = await fetch(
        'https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/admin-users',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'list' })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar usuarios');
      }

      const { users: authUsers } = await response.json();
      
      // Cargar perfiles de usuarios desde user_profiles
      const userIds = authUsers?.map(u => u.id) || [];
      let profilesMap = {};
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, nombre, apellido, cargo, organizacion, role')
          .in('id', userIds);
        
        if (!profilesError && profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }
      
      // Combinar datos de auth con perfiles
      const usersWithProfiles = (authUsers || []).map(user => ({
        ...user,
        nombre: profilesMap[user.id]?.nombre || null,
        apellido: profilesMap[user.id]?.apellido || null,
        cargo: profilesMap[user.id]?.cargo || null,
        organizacion: profilesMap[user.id]?.organizacion || null,
        role: profilesMap[user.id]?.role || 'viewer',
      }));
      
      setUsers(usersWithProfiles);
      console.log('✅ Usuarios cargados:', usersWithProfiles?.length);
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err);
      setError(err.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Crear nuevo usuario usando Edge Function
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Validaciones
      if (!newUserEmail || !newUserPassword) {
        throw new Error('Email y contraseña son requeridos');
      }

      if (newUserPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Obtener sesión actual para el token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      // Llamar a Edge Function
      const response = await fetch(
        'https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/admin-users',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            email: newUserEmail,
            password: newUserPassword
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear usuario');
      }

      const { user: newUser } = await response.json();
      console.log('✅ Usuario creado:', newUser.email);
      
      // Crear/actualizar perfil en user_profiles con los datos adicionales
      if (newUser.id) {
        const nombreCompleto = `${newUserNombre || ''} ${newUserApellido || ''}`.trim() || newUser.email;
        const username = newUser.email?.split('@')[0] || `user_${newUser.id.slice(0, 8)}`;
        
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: newUser.id,
            username: username,
            full_name: nombreCompleto,
            email: newUser.email,
            nombre: newUserNombre || null,
            apellido: newUserApellido || null,
            cargo: newUserCargo || null,
            organizacion: newUserOrganizacion || null,
            role: newUserRole || 'viewer',
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.warn('⚠️ Error guardando perfil:', profileError);
          // No lanzamos error aquí porque el usuario ya fue creado
        } else {
          console.log('✅ Perfil de usuario creado/actualizado');
        }
      }
      
      setSuccess(`Usuario ${newUser.email} creado exitosamente`);
      
      // Limpiar form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserNombre('');
      setNewUserApellido('');
      setNewUserCargo('');
      setNewUserOrganizacion('');
      setNewUserRole('viewer');
      setShowCreateForm(false);
      
      // Recargar lista
      await loadUsers();
    } catch (err) {
      console.error('❌ Error creando usuario:', err);
      setError(err.message || 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  // Abrir modal de edición
  const handleEditUser = async (user) => {
    // Asegurar que el rol esté cargado
    if (!user.role) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        user.role = profile.role || 'viewer';
      } else {
        user.role = 'viewer';
      }
    }
    
    setEditingUser({ ...user, role: user.role || 'viewer' });
    setError(null);
    setSuccess(null);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    setEditingUser(null);
    setError(null);
    setSuccess(null);
  };

  // Actualizar usuario
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      // Obtener perfil actual para preservar campos requeridos
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('username, full_name, email, role, is_active')
        .eq('id', editingUser.id)
        .single();

      // Preparar datos para actualizar
      const nombreCompleto = `${editingUser.nombre || ''} ${editingUser.apellido || ''}`.trim() || editingUser.email;
      const username = currentProfile?.username || editingUser.email?.split('@')[0] || `user_${editingUser.id.slice(0, 8)}`;
      const fullName = currentProfile?.full_name || nombreCompleto;
      const email = editingUser.email;
      const role = editingUser.role || currentProfile?.role || 'viewer';

      // Actualizar perfil en user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: editingUser.id,
          username: username,
          full_name: fullName,
          email: email,
          nombre: editingUser.nombre || null,
          apellido: editingUser.apellido || null,
          cargo: editingUser.cargo || null,
          organizacion: editingUser.organizacion || null,
          role: role,
          is_active: currentProfile?.is_active !== undefined ? currentProfile.is_active : true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        throw new Error(profileError.message || 'Error al actualizar perfil');
      }

      console.log('✅ Perfil de usuario actualizado');
      setSuccess(`Usuario ${editingUser.email} actualizado exitosamente`);
      
      // Recargar lista
      await loadUsers();
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        handleCloseEdit();
      }, 1500);
    } catch (err) {
      console.error('❌ Error actualizando usuario:', err);
      setError(err.message || 'Error al actualizar usuario');
    } finally {
      setUpdating(false);
    }
  };

  // Abrir modal de reset de contraseña
  const handleOpenResetPassword = (user) => {
    setResettingPassword(user);
    setNewPasswordForReset('');
    setShowResetPassword(true);
    setError(null);
    setSuccess(null);
  };

  // Resetear contraseña de un usuario (solo admin)
  const handleResetPassword = async () => {
    if (!resettingPassword || !newPasswordForReset) return;

    setResetting(true);
    setError(null);
    setSuccess(null);

    try {
      if (newPasswordForReset.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const response = await fetch(
        'https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/admin-users',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reset_password',
            userId: resettingPassword.id,
            newPassword: newPasswordForReset
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al resetear contraseña');
      }

      console.log('✅ Contraseña reseteada para:', resettingPassword.email);
      setSuccess(`Contraseña de ${resettingPassword.email} actualizada exitosamente`);
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        setShowResetPassword(false);
        setResettingPassword(null);
        setNewPasswordForReset('');
      }, 2000);

    } catch (err) {
      console.error('❌ Error reseteando contraseña:', err);
      setError(err.message || 'Error al resetear contraseña');
    } finally {
      setResetting(false);
    }
  };

  // Eliminar usuario usando Edge Function
  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`¿Eliminar usuario ${userEmail}?\n\n⚠️ Esta acción no se puede deshacer.`)) return;

    try {
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      // Llamar a Edge Function
      const response = await fetch(
        'https://oqhujdqbszbvozsuunkw.supabase.co/functions/v1/admin-users',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            userId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar usuario');
      }

      console.log('✅ Usuario eliminado:', userEmail);
      setSuccess(`Usuario ${userEmail} eliminado`);
      
      // Recargar lista
      await loadUsers();
    } catch (err) {
      console.error('❌ Error eliminando usuario:', err);
      setError(err.message || 'Error al eliminar usuario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Gestión de Usuarios
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            showCreateForm
              ? 'bg-slate-700 text-white'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{showCreateForm ? 'Cancelar' : 'Nuevo Usuario'}</span>
        </button>
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

      {/* Formulario de crear usuario */}
      {showCreateForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-700/50">
          <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-400" />
            Crear Nuevo Usuario
          </h4>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">La contraseña debe tener al menos 6 caracteres</p>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={newUserNombre}
                  onChange={(e) => setNewUserNombre(e.target.value)}
                  placeholder="Nombre del usuario"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Apellido
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={newUserApellido}
                  onChange={(e) => setNewUserApellido(e.target.value)}
                  placeholder="Apellido del usuario"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cargo
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={newUserCargo}
                  onChange={(e) => setNewUserCargo(e.target.value)}
                  placeholder="Ej: Analista, Operador, Comandante"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Organización */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Organización
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={newUserOrganizacion}
                  onChange={(e) => setNewUserOrganizacion(e.target.value)}
                  placeholder="Ej: Ejército, Marina, Fuerza Aérea"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rol del Usuario
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ROLES.map((roleOption) => {
                  const Icon = roleOption.icon;
                  return (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => setNewUserRole(roleOption.value)}
                      disabled={creating}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        newUserRole === roleOption.value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      } ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 ${roleOption.color} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${roleOption.color}`}>
                            {roleOption.label}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {roleOption.description}
                          </div>
                        </div>
                        {newUserRole === roleOption.value && (
                          <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón crear */}
            <button
              type="submit"
              disabled={creating}
              className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                creating
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
              }`}
            >
              {creating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando usuario...</span>
                </div>
              ) : (
                'Crear Usuario'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Modal de edición de usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg border border-purple-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                Editar Usuario
              </h4>
              <button
                onClick={handleCloseEdit}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                disabled={updating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {/* Email (solo lectura) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">El email no se puede modificar</p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={editingUser.nombre || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                    placeholder="Nombre del usuario"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={updating}
                  />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Apellido
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={editingUser.apellido || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, apellido: e.target.value })}
                    placeholder="Apellido del usuario"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={updating}
                  />
                </div>
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cargo
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={editingUser.cargo || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cargo: e.target.value })}
                    placeholder="Ej: Analista, Operador, Comandante"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={updating}
                  />
                </div>
              </div>

              {/* Organización */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Organización
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={editingUser.organizacion || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, organizacion: e.target.value })}
                    placeholder="Ej: Ejército, Marina, Fuerza Aérea"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={updating}
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Rol del Usuario
                </label>
                <div className="space-y-2">
                  {ROLES.map((roleOption) => {
                    const Icon = roleOption.icon;
                    const isSelected = editingUser.role === roleOption.value;
                    return (
                      <button
                        key={roleOption.value}
                        type="button"
                        onClick={() => setEditingUser({ ...editingUser, role: roleOption.value })}
                        disabled={updating}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                        } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${roleOption.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm ${roleOption.color}`}>
                              {roleOption.label}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {roleOption.description}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mensajes de error/éxito dentro del modal */}
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-400 text-xs">{success}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={updating}
                  className="w-full sm:flex-1 py-2.5 rounded-lg font-medium transition-all bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className={`w-full sm:flex-1 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${
                    updating
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                  }`}
                >
                  {updating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Usuarios del Sistema
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.email?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">
                      {user.nombre || user.apellido 
                        ? `${user.nombre || ''} ${user.apellido || ''}`.trim()
                        : user.email}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500">{user.email}</span>
                        {user.cargo && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-blue-400">{user.cargo}</span>
                          </>
                        )}
                        {user.organizacion && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-purple-400">{user.organizacion}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Badge de rol */}
                        {user.role && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-900/30 text-red-400 border border-red-700/50' :
                            user.role === 'operator' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' :
                            user.role === 'analyst' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/50' :
                            'bg-slate-700/30 text-slate-400 border border-slate-600/50'
                          }`}>
                            {user.role === 'admin' && <Crown className="w-3 h-3" />}
                            {user.role === 'operator' && <UserCheck className="w-3 h-3" />}
                            {user.role === 'analyst' && <UserCheck className="w-3 h-3" />}
                            {user.role === 'viewer' && <EyeIcon className="w-3 h-3" />}
                            {ROLES.find(r => r.value === user.role)?.label || user.role}
                          </span>
                        )}
                        <span className="text-slate-500">ID: {user.id.slice(0, 8)}...</span>
                        {user.last_sign_in_at && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>
                              Último acceso: {new Date(user.last_sign_in_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenResetPassword(user)}
                    className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Resetear contraseña"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar usuario"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Acerca de la Gestión de Usuarios
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span><strong>Autenticación:</strong> Supabase Auth (seguro y escalable)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span><strong>Passwords:</strong> Hasheadas con bcrypt (no se almacenan en texto plano)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span><strong>Email:</strong> Auto-confirmado (no requiere verificación por correo)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">⚠️</span>
            <span><strong>Nota:</strong> Solo administradores pueden crear/eliminar usuarios</span>
          </li>
        </ul>
      </div>

      {/* Modal de Reset de Contraseña */}
      {showResetPassword && resettingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-purple-700/50 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Resetear Contraseña</h2>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{resettingPassword.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setResettingPassword(null);
                  setNewPasswordForReset('');
                  setError(null);
                  setSuccess(null);
                }}
                disabled={resetting}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {/* Mensaje de éxito */}
              {success && (
                <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {!success && (
                <>
                  <p className="text-slate-300 text-sm">
                    Ingresa la nueva contraseña para el usuario <strong className="text-white">{resettingPassword.nombre || resettingPassword.email}</strong>
                  </p>

                  {/* Nueva contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPasswordForReset}
                        onChange={(e) => setNewPasswordForReset(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={resetting}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">La contraseña debe tener al menos 6 caracteres</p>
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResettingPassword(null);
                    setNewPasswordForReset('');
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-lg font-medium transition-all bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50"
                >
                  {success ? 'Cerrar' : 'Cancelar'}
                </button>
                {!success && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetting || !newPasswordForReset || newPasswordForReset.length < 6}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      resetting || !newPasswordForReset || newPasswordForReset.length < 6
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                    }`}
                  >
                    {resetting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Reseteando...</span>
                      </div>
                    ) : (
                      'Resetear Contraseña'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

