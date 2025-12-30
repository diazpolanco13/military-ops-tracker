import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, safeQuery } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 👤 Hook para obtener el rol y permisos del usuario actual
 * V2: Con timeout para no bloquear la UI
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const loadingRef = useRef(false); // Evitar cargas duplicadas

  const loadUserRole = useCallback(async () => {
    // Evitar cargas simultáneas
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      
      // Timeout rápido para getSession
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );
      
      let session;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result?.data?.session;
      } catch (e) {
        console.warn('⚠️ Session timeout, usando defaults');
        setUserRole('viewer');
        setPermissions(getDefaultPermissions('viewer'));
        return;
      }
      
      if (!session?.user) {
        setUserRole(null);
        setUserProfile(null);
        setPermissions({});
        return;
      }

      // Query con timeout de 8 segundos
      const { data: profile, error } = await safeQuery(
        supabase
          .from('user_profiles')
          .select('id, role, nombre, apellido, cargo, organizacion')
          .eq('id', session.user.id)
          .single(),
        8000
      );

      if (error || !profile) {
        // Fallback a viewer si hay error
        setUserRole('viewer');
        setUserProfile(null);
        setPermissions(getDefaultPermissions('viewer'));
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
      setPermissions(getDefaultPermissions('viewer'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadRolePermissions = async (role) => {
    try {
      // Query con timeout de 5 segundos
      const { data, error } = await safeQuery(
        supabase
          .from('role_permissions')
          .select('permissions')
          .eq('role', role)
          .single(),
        5000
      );

      if (error || !data) {
        // Usar defaults inmediatamente, no esperar
        setPermissions(getDefaultPermissions(role));
      } else {
        setPermissions(data.permissions || getDefaultPermissions(role));
      }
    } catch (err) {
      // Silencioso: usar defaults
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
