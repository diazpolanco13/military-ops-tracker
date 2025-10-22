import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🎯 Hook para gestionar eventos de inteligencia
 * CRUD completo + filtros + búsqueda
 */
export function useIntelligenceEvents(filters = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch inicial
  useEffect(() => {
    fetchEvents();
    subscribeToEvents();
  }, []);

  // Fetch events con filtros
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('intelligence_events')
        .select('*')
        .order('event_date', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        // Por defecto, no mostrar archivados
        query = query.neq('status', 'archived');
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.source_credibility) {
        query = query.eq('source_credibility', filters.source_credibility);
      }

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEvents(data || []);

      // Contar no leídos (pending)
      const pending = data?.filter(e => e.status === 'pending').length || 0;
      setUnreadCount(pending);

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching intelligence events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Suscripción Realtime
  const subscribeToEvents = () => {
    const subscription = supabase
      .channel('intelligence_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intelligence_events'
        },
        (payload) => {
          console.log('🔄 Cambio en intelligence_events:', payload);
          fetchEvents(); // Refetch cuando cambia
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // ========================================================================
  // ACCIONES
  // ========================================================================

  /**
   * Verificar un evento (marcarlo como confirmado)
   */
  const verifyEvent = async (eventId) => {
    try {
      const { error: updateError } = await supabase
        .from('intelligence_events')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      await fetchEvents();
      return { success: true };
    } catch (err) {
      console.error('Error verifying event:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Descartar un evento
   */
  const dismissEvent = async (eventId) => {
    try {
      const { error: updateError } = await supabase
        .from('intelligence_events')
        .update({ status: 'dismissed' })
        .eq('id', eventId);

      if (updateError) throw updateError;

      await fetchEvents();
      return { success: true };
    } catch (err) {
      console.error('Error dismissing event:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Archivar un evento
   */
  const archiveEvent = async (eventId) => {
    try {
      const { error: updateError } = await supabase
        .from('intelligence_events')
        .update({ status: 'archived' })
        .eq('id', eventId);

      if (updateError) throw updateError;

      await fetchEvents();
      return { success: true };
    } catch (err) {
      console.error('Error archiving event:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Marcar como accionado (usuario tomó acción)
   */
  const markAsActioned = async (eventId, actionDescription) => {
    try {
      const { error: updateError } = await supabase
        .from('intelligence_events')
        .update({
          status: 'actioned',
          action_taken: actionDescription
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      await fetchEvents();
      return { success: true };
    } catch (err) {
      console.error('Error marking as actioned:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Agregar notas a un evento
   */
  const addNotes = async (eventId, notes) => {
    try {
      const { error: updateError } = await supabase
        .from('intelligence_events')
        .update({ notes })
        .eq('id', eventId);

      if (updateError) throw updateError;

      await fetchEvents();
      return { success: true };
    } catch (err) {
      console.error('Error adding notes:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Ejecutar monitor RSS de noticias
   */
  const runRSSMonitor = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL no configurada');
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/rss-news-monitor`;

      console.log('📰 Ejecutando monitor RSS de noticias...');

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchEvents();
        return { success: true, stats: result.stats };
      } else {
        throw new Error(result.error || 'Error ejecutando monitor RSS');
      }
    } catch (err) {
      console.error('Error running RSS monitor:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Ejecutar monitor manualmente
   */
  const runMonitor = async () => {
    try {
      // Obtener URL del proyecto desde las variables de entorno
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL no configurada');
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/intelligence-monitor`;

      console.log('🚀 Ejecutando monitor de inteligencia...');

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchEvents();
        return { success: true, stats: result.stats };
      } else {
        throw new Error(result.error || 'Error ejecutando monitor');
      }
    } catch (err) {
      console.error('Error running monitor:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    events,
    loading,
    error,
    unreadCount,
    refetch: fetchEvents,
    verifyEvent,
    dismissEvent,
    archiveEvent,
    markAsActioned,
    addNotes,
    runMonitor,
    runRSSMonitor
  };
}

/**
 * Hook simple para contar eventos sin leer
 */
export function useUnreadIntelligenceCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();

    const subscription = supabase
      .channel('intelligence_unread_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intelligence_events'
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCount = async () => {
    const { count: unreadCount } = await supabase
      .from('intelligence_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setCount(unreadCount || 0);
  };

  return count;
}

