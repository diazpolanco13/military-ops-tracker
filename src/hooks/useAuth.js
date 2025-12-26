import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🔐 Hook de Autenticación con Auditoría
 * Gestiona el estado de autenticación con Supabase
 * Registra eventos de login/logout en el sistema de auditoría
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const lastEventRef = useRef(null);

  /**
   * Registrar evento de auditoría directamente
   * (No usamos el hook para evitar dependencia circular)
   */
  const logAuditEvent = useCallback(async (eventType, userEmail, success = true, errorMessage = null) => {
    try {
      const userAgent = navigator.userAgent;
      const deviceInfo = parseUserAgentBasic(userAgent);
      
      // Obtener IP para eventos de auth
      let ipAddress = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json', {
          signal: AbortSignal.timeout(3000)
        });
        const data = await response.json();
        ipAddress = data.ip;
      } catch { /* ignore */ }

      await supabase.rpc('log_user_event', {
        p_event_type: eventType,
        p_event_category: 'auth',
        p_event_description: eventType === 'login' 
          ? `Usuario ${userEmail} inició sesión`
          : eventType === 'logout'
          ? `Usuario ${userEmail} cerró sesión`
          : `Evento de autenticación: ${eventType}`,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_device_type: deviceInfo.deviceType,
        p_browser: deviceInfo.browser,
        p_os: deviceInfo.os,
        p_metadata: { 
          email: userEmail,
          url: window.location.href,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        p_success: success,
        p_error_message: errorMessage,
      });

      console.log(`📋 Auditoría: ${eventType} - ${userEmail}`);
    } catch (error) {
      console.error('Error registrando auditoría:', error);
    }
  }, []);

  useEffect(() => {
    // Obtener sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        console.log('✅ Sesión activa:', session.user.email);
      } else {
        console.log('⚠️ No hay sesión activa');
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Evitar registrar el mismo evento múltiples veces
      const eventKey = `${_event}-${session?.user?.email}`;
      if (lastEventRef.current === eventKey) return;
      lastEventRef.current = eventKey;
      
      // Registrar evento de auditoría según el tipo
      if (_event === 'SIGNED_IN' && session?.user?.email) {
        await logAuditEvent('login', session.user.email);
      } else if (_event === 'SIGNED_OUT') {
        // El email no está disponible aquí, pero el evento ya se registró en signOut
      } else if (_event === 'TOKEN_REFRESHED' && session?.user?.email) {
        // Opcional: registrar refresh de token
        // await logAuditEvent('session_refresh', session.user.email);
      }
      
      console.log('🔄 Estado de auth cambió:', _event, session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, [logAuditEvent]);

  // Función para cerrar sesión
  const signOut = async () => {
    const userEmail = user?.email;
    
    try {
      // Registrar logout ANTES de cerrar sesión (mientras tenemos el user)
      if (userEmail) {
        await logAuditEvent('logout', userEmail);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('👋 Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
    logAuditEvent, // Exponer para uso en LoginPage
  };
}

/**
 * Parser básico de User-Agent
 */
function parseUserAgentBasic(userAgent) {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  const ua = userAgent.toLowerCase();
  
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    deviceType = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile';
  }

  let browser = 'unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';

  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceType, browser, os };
}

