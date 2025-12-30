import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, safeQuery } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * 👤 Hook para obtener el rol y permisos del usuario actual
 * V3: Mejor manejo de sesión expirada
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false); // NUEVO: flag de sesión expirada
  const loadingRef = useRef(false); // Evitar cargas duplicadas
  const retryCountRef = useRef(0); // Contador de reintentos

  const loadUserRole = useCallback(async () => {
    // Evitar cargas simultáneas
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      
      // Timeout más largo (8s) para dar tiempo al refresh
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 8000)
      );
      
      let session;
      let sessionError = null;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result?.data?.session;
        sessionError = result?.error;
      } catch (e) {
        // ⚠️ TIMEOUT NO significa sesión expirada, puede ser saturación de conexión
        console.warn('⚠️ Session timeout (puede ser saturación de red)');
        
        // Usar permisos en cache si existen, NO mostrar como expirada
        if (retryCountRef.current < 1) {
          retryCountRef.current++;
          loadingRef.current = false;
          // Esperar más tiempo antes de reintentar (3s)
          setTimeout(() => loadUserRole(), 3000);
          return;
        }
        
        // Después de reintentos, usar defaults pero NO marcar como expirada
        // Un timeout es diferente a una sesión realmente expirada
        console.warn('⚠️ Usando permisos por defecto (timeout de red)');
        setUserRole('viewer');
        setPermissions(getDefaultPermissions('viewer'));
        // NO setSessionExpired(true) - un timeout no es expiración
        return;
      }
      
      // Resetear contador de reintentos si tuvo éxito
      retryCountRef.current = 0;
      
      // Si hay error de sesión REAL (token expirado, refresh token inválido)
      if (sessionError) {
        const errorMsg = sessionError.message?.toLowerCase() || '';
        const isRealExpiration = 
          errorMsg.includes('expired') || 
          errorMsg.includes('invalid') ||
          errorMsg.includes('refresh token') ||
          errorMsg.includes('not found') ||
          sessionError.status === 401;
        
        if (isRealExpiration) {
          console.error('❌ Sesión REALMENTE expirada:', sessionError.message);
          setSessionExpired(true);
          setUserRole(null);
          setUserProfile(null);
          setPermissions({});
          return;
        } else {
          // Otro tipo de error (red, etc.) - usar defaults
          console.warn('⚠️ Error de sesión (no expiración):', sessionError.message);
          setUserRole('viewer');
          setPermissions(getDefaultPermissions('viewer'));
          return;
        }
      }
      
      if (!session?.user) {
        setUserRole(null);
        setUserProfile(null);
        setPermissions({});
        setSessionExpired(false); // No está expirada, simplemente no hay sesión
        return;
      }
      
      // Sesión válida
      setSessionExpired(false);

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
    sessionExpired, // NUEVO: indica si la sesión expiró
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
