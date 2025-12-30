import { useState, useEffect, useCallback } from 'react';
import { supabase, safeQuery } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';
import { singleflight } from '../lib/singleflight';

/**
 * 👤 Hook para obtener el rol y permisos del usuario actual
 * V3: Mejor manejo de sesión expirada
 */
export function useUserRole() {
  // ---- Store compartido (singleton) ----
  // Problema: este hook se usa en muchos componentes (Navbar, Settings, etc.)
  // y cada instancia disparaba getSession() + queries + suscripciones.
  // Solución: un store compartido + dedupe (singleflight) y 1 sola suscripción global.
  const [state, setState] = useState(() => sharedState);

  const getDefaultPermissions = useCallback((role) => {
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
  }, []);

  const loadRolePermissions = useCallback(async (role) => {
    try {
      const { data, error } = await safeQuery(
        supabase
          .from('role_permissions')
          .select('permissions')
          .eq('role', role)
          .single(),
        5000
      );

      if (error || !data) {
        return getDefaultPermissions(role);
      }
      return data.permissions || getDefaultPermissions(role);
    } catch {
      return getDefaultPermissions(role);
    }
  }, [getDefaultPermissions]);

  const loadUserRole = useCallback(async ({ force = false } = {}) => {
    return singleflight(
      'useUserRole:load',
      async () => {
        const now = Date.now();
        // Cache suave: si ya tenemos rol y se cargó hace <30s, no refetch salvo force.
        if (!force && sharedState.lastLoadedAt && now - sharedState.lastLoadedAt < 30000) {
          return sharedState;
        }

        setSharedState({ ...sharedState, loading: true });

        // Timeout (8s) para evitar cuelgues. OJO: timeout != sesión expirada.
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
        } catch {
          // Red saturada: degradar a defaults sin marcar expiración
          const degraded = {
            ...sharedState,
            loading: false,
            sessionExpired: false,
            userRole: sharedState.userRole || 'viewer',
            permissions: Object.keys(sharedState.permissions || {}).length
              ? sharedState.permissions
              : getDefaultPermissions(sharedState.userRole || 'viewer'),
            lastLoadedAt: now,
          };
          setSharedState(degraded);
          return degraded;
        }

        // Errores reales de auth: token expirado/invalid, etc.
        if (sessionError) {
          const errorMsg = sessionError.message?.toLowerCase() || '';
          const isRealExpiration =
            errorMsg.includes('expired') ||
            errorMsg.includes('invalid') ||
            errorMsg.includes('refresh token') ||
            errorMsg.includes('not found') ||
            sessionError.status === 401;

          if (isRealExpiration) {
            const expired = {
              userRole: null,
              permissions: {},
              userProfile: null,
              loading: false,
              sessionExpired: true,
              lastLoadedAt: now,
            };
            setSharedState(expired);
            return expired;
          }
        }

        if (!session?.user) {
          const anon = {
            userRole: null,
            permissions: {},
            userProfile: null,
            loading: false,
            sessionExpired: false,
            lastLoadedAt: now,
          };
          setSharedState(anon);
          return anon;
        }

        const { data: profile, error } = await safeQuery(
          supabase
            .from('user_profiles')
            .select('id, role, nombre, apellido, cargo, organizacion')
            .eq('id', session.user.id)
            .single(),
          8000
        );

        const role = profile?.role || 'viewer';
        const permissions = await loadRolePermissions(role);

        const next = {
          userRole: role,
          permissions,
          userProfile: error ? null : profile,
          loading: false,
          sessionExpired: false,
          lastLoadedAt: now,
        };
        setSharedState(next);
        return next;
      },
      { ttlMs: 2500 } // dedupe ráfagas cercanas (muchos componentes montando a la vez)
    );
  }, [getDefaultPermissions, loadRolePermissions]);

  useEffect(() => {
    // Suscribirse al store compartido
    const unsubscribeLocal = subscribeShared(setState);

    // Inicializar (una sola vez globalmente)
    ensureSharedSubscriptions(() => loadUserRole({ force: true }));

    // Carga inicial (dedupe)
    loadUserRole();

    return () => {
      unsubscribeLocal();
    };
  }, [loadUserRole]);

  const hasPermission = (permissionKey) => {
    return state.permissions?.[permissionKey] === true;
  };

  const isAdmin = () => state.userRole === 'admin';
  const isCollaborator = () => state.userRole === 'operator' || state.userRole === 'analyst' || state.userRole === 'admin';
  const isViewer = () => state.userRole === 'viewer';

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
    userRole: state.userRole,
    permissions: state.permissions,
    userProfile: state.userProfile,
    loading: state.loading,
    sessionExpired: state.sessionExpired,
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
    refresh: () => loadUserRole({ force: true })
  };
}

// ---------- Store compartido (module scope) ----------
let sharedState = {
  userRole: null,
  permissions: {},
  userProfile: null,
  loading: true,
  sessionExpired: false,
  lastLoadedAt: 0,
};

const sharedListeners = new Set(); // Set<(state)=>void>
let sharedSubscriptionsReady = false;

function setSharedState(next) {
  sharedState = { ...next };
  sharedListeners.forEach((cb) => {
    try { cb(sharedState); } catch { /* ignore */ }
  });
}

function subscribeShared(cb) {
  sharedListeners.add(cb);
  // Emitir inmediatamente estado actual
  cb(sharedState);
  return () => {
    sharedListeners.delete(cb);
  };
}

function ensureSharedSubscriptions(onInvalidate) {
  if (sharedSubscriptionsReady) return;
  sharedSubscriptionsReady = true;

  // Auth changes (una sola vez)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
    onInvalidate?.();
  });

  // Permisos cambiaron (una sola vez)
  const unsubscribeRealtime = realtimeManager.subscribe('role_permissions', () => {
    onInvalidate?.();
  });

  // Limpieza best-effort si se recarga el módulo (HMR)
  if (typeof import.meta !== 'undefined' && import.meta.hot) {
    import.meta.hot.dispose(() => {
      try { subscription.unsubscribe(); } catch { /* ignore */ }
      try { unsubscribeRealtime(); } catch { /* ignore */ }
      sharedSubscriptionsReady = false;
    });
  }
}
