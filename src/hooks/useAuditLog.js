import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 📋 SISTEMA DE AUDITORÍA DE USUARIOS
 * 
 * Hook para registrar actividad de usuarios en el sistema.
 * Captura: login, logout, acciones, errores, navegación.
 */

// Tipos de eventos
export const AUDIT_EVENTS = {
  // Autenticación
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SESSION_REFRESH: 'session_refresh',
  PASSWORD_CHANGE: 'password_change',
  
  // Navegación
  PAGE_VIEW: 'page_view',
  
  // Acciones en entidades
  ENTITY_CREATE: 'entity_create',
  ENTITY_UPDATE: 'entity_update',
  ENTITY_DELETE: 'entity_delete',
  ENTITY_ARCHIVE: 'entity_archive',
  
  // Eventos
  EVENT_CREATE: 'event_create',
  EVENT_UPDATE: 'event_update',
  EVENT_DELETE: 'event_delete',
  
  // Configuración
  SETTINGS_CHANGE: 'settings_change',
  
  // Errores
  ERROR: 'error',
};

// Categorías
export const AUDIT_CATEGORIES = {
  AUTH: 'auth',
  NAVIGATION: 'navigation',
  ENTITY: 'entity',
  EVENT: 'event',
  SETTINGS: 'settings',
  SYSTEM: 'system',
};

/**
 * Parsear User-Agent para extraer información del dispositivo
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  const ua = userAgent.toLowerCase();
  
  // Detectar tipo de dispositivo
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile';
  }

  // Detectar navegador
  let browser = 'unknown';
  let browserVersion = '';
  
  if (ua.includes('firefox')) {
    browser = 'Firefox';
    browserVersion = ua.match(/firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/edg\/(\d+)/)?.[1] || '';
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
    browserVersion = ua.match(/chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // Detectar sistema operativo
  let os = 'unknown';
  let osVersion = '';
  
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 11')) osVersion = '11';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    osVersion = ua.match(/mac os x (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    osVersion = ua.match(/android (\d+)/)?.[1] || '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    osVersion = ua.match(/os (\d+)/)?.[1] || '';
  }

  return { deviceType, browser, browserVersion, os, osVersion };
}

/**
 * Obtener IP del cliente (aproximada desde el frontend)
 */
async function getClientIP() {
  try {
    // Usar servicio externo para obtener IP pública
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
}

/**
 * Hook de Auditoría
 */
export function useAuditLog() {
  /**
   * Registrar evento de auditoría
   */
  const logEvent = useCallback(async ({
    eventType,
    category = null,
    description = null,
    metadata = {},
    success = true,
    errorMessage = null,
    includeIP = false,
  }) => {
    try {
      const userAgent = navigator.userAgent;
      const { deviceType, browser, browserVersion, os, osVersion } = parseUserAgent(userAgent);
      
      // Obtener IP si se requiere (solo para eventos importantes como login)
      let ipAddress = null;
      if (includeIP) {
        ipAddress = await getClientIP();
      }

      // Preparar metadata enriquecida
      const enrichedMetadata = {
        ...metadata,
        url: window.location.href,
        referrer: document.referrer || null,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp_local: new Date().toISOString(),
      };

      // Llamar a la función de Supabase
      const { data, error } = await supabase.rpc('log_user_event', {
        p_event_type: eventType,
        p_event_category: category,
        p_event_description: description,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_device_type: deviceType,
        p_browser: browser,
        p_os: os,
        p_metadata: enrichedMetadata,
        p_success: success,
        p_error_message: errorMessage,
      });

      if (error) {
        console.error('❌ Error registrando evento de auditoría:', error);
        return null;
      }

      console.log(`📋 Auditoría: ${eventType}`, { category, success });
      return data;
    } catch (error) {
      console.error('❌ Error en sistema de auditoría:', error);
      return null;
    }
  }, []);

  /**
   * Registrar login exitoso
   */
  const logLogin = useCallback(async (userEmail) => {
    return logEvent({
      eventType: AUDIT_EVENTS.LOGIN,
      category: AUDIT_CATEGORIES.AUTH,
      description: `Usuario ${userEmail} inició sesión`,
      includeIP: true,
      metadata: { email: userEmail },
    });
  }, [logEvent]);

  /**
   * Registrar login fallido
   */
  const logLoginFailed = useCallback(async (email, reason) => {
    return logEvent({
      eventType: AUDIT_EVENTS.LOGIN_FAILED,
      category: AUDIT_CATEGORIES.AUTH,
      description: `Intento de login fallido para ${email}`,
      success: false,
      errorMessage: reason,
      includeIP: true,
      metadata: { email },
    });
  }, [logEvent]);

  /**
   * Registrar logout
   */
  const logLogout = useCallback(async () => {
    return logEvent({
      eventType: AUDIT_EVENTS.LOGOUT,
      category: AUDIT_CATEGORIES.AUTH,
      description: 'Usuario cerró sesión',
    });
  }, [logEvent]);

  /**
   * Registrar acción en entidad
   */
  const logEntityAction = useCallback(async (action, entityType, entityName, entityId) => {
    const eventType = {
      create: AUDIT_EVENTS.ENTITY_CREATE,
      update: AUDIT_EVENTS.ENTITY_UPDATE,
      delete: AUDIT_EVENTS.ENTITY_DELETE,
      archive: AUDIT_EVENTS.ENTITY_ARCHIVE,
    }[action] || 'entity_action';

    return logEvent({
      eventType,
      category: AUDIT_CATEGORIES.ENTITY,
      description: `${action} ${entityType}: ${entityName}`,
      metadata: { entityType, entityName, entityId, action },
    });
  }, [logEvent]);

  /**
   * Registrar cambio de configuración
   */
  const logSettingsChange = useCallback(async (settingName, oldValue, newValue) => {
    return logEvent({
      eventType: AUDIT_EVENTS.SETTINGS_CHANGE,
      category: AUDIT_CATEGORIES.SETTINGS,
      description: `Configuración modificada: ${settingName}`,
      metadata: { settingName, oldValue, newValue },
    });
  }, [logEvent]);

  /**
   * Registrar error
   */
  const logError = useCallback(async (errorMessage, context = {}) => {
    return logEvent({
      eventType: AUDIT_EVENTS.ERROR,
      category: AUDIT_CATEGORIES.SYSTEM,
      description: errorMessage,
      success: false,
      errorMessage,
      metadata: context,
    });
  }, [logEvent]);

  return {
    logEvent,
    logLogin,
    logLoginFailed,
    logLogout,
    logEntityAction,
    logSettingsChange,
    logError,
    AUDIT_EVENTS,
    AUDIT_CATEGORIES,
  };
}

export default useAuditLog;

