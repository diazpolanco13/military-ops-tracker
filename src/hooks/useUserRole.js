import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 👤 Hook para obtener el rol y permisos del usuario actual
 * Optimizado: usa RealtimeManager centralizado
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const loadUserRole = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUserRole(null);
        setUserProfile(null);
        setPermissions({});
        return;
      }

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
  }, []);

  const loadRolePermissions = async (role) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', role)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Error cargando permisos:', error);
        setPermissions(getDefaultPermissions(role));
      } else if (data) {
        setPermissions(data.permissions || {});
      } else {
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
        access_settings: true
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
        access_settings: true
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

  useEffect(() => {
    loadUserRole();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserRole();
    });

    // 🔄 Suscripción centralizada para role_permissions
    const unsubscribe = realtimeManager.subscribe('role_permissions', () => {
      console.log('🔄 Permisos actualizados en BD');
      loadUserRole();
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
    };
  }, [loadUserRole]);

  const hasPermission = (permissionKey) => {
    return permissions[permissionKey] === true;
  };

  const isAdmin = () => userRole === 'admin';
  const isCollaborator = () => userRole === 'operator' || userRole === 'analyst' || userRole === 'admin';
  const isViewer = () => userRole === 'viewer';

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
    isAdmin,
    isCollaborator,
    isViewer,
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
