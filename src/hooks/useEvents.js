import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * Hook para gestionar eventos del timeline
 * Optimizado: usa RealtimeManager centralizado
 */
export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar eventos
  const loadEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(100); // ✅ OPTIMIZACIÓN: Limitar a 100 eventos más recientes

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();

    // 🔄 Suscripción centralizada para eventos
    const unsubscribe = realtimeManager.subscribe('events', (payload) => {
      if (payload.eventType === 'INSERT') {
        setEvents(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
      } else if (payload.eventType === 'DELETE') {
        setEvents(prev => prev.filter(e => e.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadEvents]);

  // Crear evento
  const createEvent = async (_, eventData) => {
    try {
      let eventDate = eventData.event_date;
      if (eventDate && eventDate.length === 16) {
        eventDate = eventDate + ':00';
      }
      
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          event_date: eventDate,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // El realtime ya actualizará el estado
      return { success: true, data };
    } catch (error) {
      console.error('Error creando evento:', error);
      return { success: false, error: error.message };
    }
  };

  // Actualizar evento
  const updateEvent = async (id, eventData) => {
    try {
      const { id: _, created_at, created_by, ...cleanData } = eventData;
      
      let eventDate = cleanData.event_date;
      if (eventDate && eventDate.length === 16) {
        eventDate = eventDate + ':00';
      }
      
      const { data, error } = await supabase
        .from('events')
        .update({
          ...cleanData,
          event_date: eventDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error actualizando evento:', error);
      return { success: false, error: error.message };
    }
  };

  // Eliminar evento
  const deleteEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error eliminando evento:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: loadEvents
  };
}
