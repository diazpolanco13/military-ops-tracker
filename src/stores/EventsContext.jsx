import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Context global para eventos del timeline
 * Permite que todos los componentes compartan el mismo estado de eventos
 * y reciban actualizaciones en tiempo real
 */
const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar eventos
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos al inicio
  useEffect(() => {
    loadEvents();

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('🔄 Cambio detectado en eventos:', payload);
          loadEvents(); // Recargar todos los eventos
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Crear evento
  const createEvent = async (_, eventData) => {
    try {
      // Asegurar que event_date tenga segundos (:00) para formato completo ISO
      let eventDate = eventData.event_date;
      if (eventDate && eventDate.length === 16) {
        eventDate = eventDate + ':00'; // Agregar segundos
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

      // Actualizar estado local inmediatamente (optimistic update)
      setEvents(prev => [data, ...prev]);
      console.log('✅ Evento creado localmente:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error creando evento:', error);
      return { success: false, error: error.message };
    }
  };

  // Actualizar evento
  const updateEvent = async (id, eventData) => {
    try {
      // Limpiar datos: solo campos actualizables
      const { id: _, created_at, created_by, ...cleanData } = eventData;
      
      // Asegurar que event_date tenga segundos (:00) para formato completo ISO
      let eventDate = cleanData.event_date;
      if (eventDate && eventDate.length === 16) {
        eventDate = eventDate + ':00'; // Agregar segundos
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

      if (data) {
        // Actualizar estado local inmediatamente (optimistic update)
        setEvents(prev => 
          prev.map(event => event.id === id ? data : event)
        );
        console.log('✅ Evento actualizado localmente:', data);
      }
      
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

      // Actualizar estado local inmediatamente (optimistic update)
      setEvents(prev => prev.filter(event => event.id !== id));
      console.log('✅ Evento eliminado localmente:', id);
      
      return { success: true };
    } catch (error) {
      console.error('Error eliminando evento:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: loadEvents
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};

// Hook para usar el contexto de eventos
export const useEventsContext = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEventsContext debe usarse dentro de EventsProvider');
  }
  return context;
};

