import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 👤 Hook para obtener el rol y permisos del usuario actual
 * Obtiene el rol desde user_profiles y permisos desde role_permissions
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserRole();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUserRole(null);
        setUserProfile(null);
        setPermissions({});
        return;
      }

      // Obtener perfil del usuario
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id, role, nombre, apellido, cargo, organizacion')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.warn('⚠️ Error cargando perfil de usuario:', error);
        setUserRole('viewer');
        setUserProfile(null);
        setPermissions({});
      } else {
        const role = profile?.role || 'viewer';
        setUserRole(role);
        setUserProfile(profile);

        // Cargar permisos del rol
        await loadRolePermissions(role);
      }
    } catch (err) {
      console.error('❌ Error en useUserRole:', err);
      setUserRole('viewer');
      setUserProfile(null);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (role) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', role)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Error cargando permisos:', error);
        // Usar permisos por defecto según el rol
        setPermissions(getDefaultPermissions(role));
      } else if (data) {
        setPermissions(data.permissions || {});
      } else {
        // Si no existe registro, usar permisos por defecto
        setPermissions(getDefaultPermissions(role));
      }
    } catch (err) {
      console.error('❌ Error cargando permisos:', err);
      setPermissions(getDefaultPermissions(role));
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
      colaborador: {
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
        access_settings: false
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

  // Funciones helper para verificar permisos específicos
  const hasPermission = (permissionKey) => {
    return permissions[permissionKey] === true;
  };

  // Funciones helper basadas en rol (retrocompatibilidad)
  const isAdmin = () => userRole === 'admin';
  const isCollaborator = () => userRole === 'colaborador' || userRole === 'admin';
  const isViewer = () => userRole === 'viewer';

  // Funciones helper basadas en permisos
  const canEdit = () => hasPermission('edit_entities');
  const canCreate = () => hasPermission('create_entities');
  const canDelete = () => hasPermission('delete_entities');
  const canManageUsers = () => hasPermission('manage_users');
  const canCreateTemplates = () => hasPermission('create_templates');
  const canManageTemplates = () => hasPermission('manage_templates');
  const canAccessSettings = () => hasPermission('access_settings');
  const canCreateEvents = () => hasPermission('create_events');
  const canEditEvents = () => hasPermission('edit_events');
  const canDeleteEvents = () => hasPermission('delete_events');

  return {
    userRole,
    permissions,
    userProfile,
    loading,
    // Funciones basadas en rol
    isAdmin,
    isCollaborator,
    isViewer,
    // Funciones basadas en permisos específicos
    hasPermission,
    canEdit,
    canCreate,
    canDelete,
    canManageUsers,
    canCreateTemplates,
    canManageTemplates,
    canAccessSettings,
    canCreateEvents,
    canEditEvents,
    canDeleteEvents,
    refresh: loadUserRole
  };
}

