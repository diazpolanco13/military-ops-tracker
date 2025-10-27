import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🔧 Polyfill para crypto.randomUUID() (compatibilidad navegadores antiguos)
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: generar UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 🤖 Hook para conversaciones con Grok AI
 * Chat conversacional sobre inteligencia militar
 * 🆕 Ahora con acceso a eventos del Intelligence Feed
 */
export function useGrokChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(generateUUID());
  const [intelligenceEvents, setIntelligenceEvents] = useState([]); // 🆕 Eventos del feed

  // 🆕 Cargar eventos del Intelligence Feed
  useEffect(() => {
    const loadIntelligenceEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('intelligence_events')
          .select('*')
          .order('detected_at', { ascending: false })
          .limit(50); // Últimos 50 eventos

        if (error) throw error;
        setIntelligenceEvents(data || []);
        console.log(`📡 Grok cargó ${data?.length || 0} eventos del Intelligence Feed`);
      } catch (err) {
        console.error('Error cargando eventos para Grok:', err);
      }
    };

    loadIntelligenceEvents();

    // Suscripción en tiempo real a nuevos eventos
    const subscription = supabase
      .channel('grok_intelligence_events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'intelligence_events'
      }, () => {
        loadIntelligenceEvents(); // Recargar cuando hay cambios
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    setMessages([
      {
        id: generateUUID(),
        role: 'assistant',
        content: '👋 Hola, soy Eva, tu analista de inteligencia. Pregúntame sobre:\n\n• Actividad militar reciente en el Caribe\n• Estado de tus entidades desplegadas\n• Análisis de eventos detectados\n• Búsqueda de información específica\n\n¿En qué puedo ayudarte?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  /**
   * Enviar mensaje a Grok
   */
  const sendMessage = async (userMessage, context = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Agregar mensaje del usuario al historial
      const userMsg = {
        id: generateUUID(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMsg]);

      // 🆕 Preparar resumen de eventos del Intelligence Feed con emojis en lugar de texto en inglés
      const priorityEmojis = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      };
      
      const recentEventsContext = intelligenceEvents.slice(0, 20).map((event, idx) => {
        const date = new Date(event.detected_at).toLocaleDateString('es');
        const priorityIcon = priorityEmojis[event.priority] || '🟡';
        return `${idx + 1}. ${priorityIcon} ${event.title}
   - Fuente: ${event.source_author || 'Desconocida'}
   - Fecha: ${date}
   - Estado: ${event.status}
   ${event.source_url ? `   - Link: ${event.source_url}` : ''}
   ${event.summary ? `   - Resumen: ${event.summary.substring(0, 150)}...` : ''}`;
      }).join('\n\n');

      const eventsStats = {
        total: intelligenceEvents.length,
        pending: intelligenceEvents.filter(e => e.status === 'pending').length,
        urgent: intelligenceEvents.filter(e => e.priority === 'urgent').length,
        twitter: intelligenceEvents.filter(e => e.source_type === 'twitter').length
      };

      // Preparar contexto para Grok
      const systemContext = `Eres SAE - IA, un analista de inteligencia militar experto.

CONTEXTO DEL SISTEMA:
- Aplicación: Military Ops Tracker para región del Caribe
- Usuario está monitoreando: 41 entidades militares (destructores, aviones, tropas)
- Región: 10°N-25°N, 60°W-90°W (Caribe)
- Capacidades: Radar visual, medición de distancias, análisis geoespacial

📊 INTELLIGENCE FEED (últimos 50 eventos):
- Total eventos: ${eventsStats.total}
- Pendientes: ${eventsStats.pending}
- Urgentes: ${eventsStats.urgent}
- De X/Twitter: ${eventsStats.twitter}

${recentEventsContext ? `🔍 EVENTOS RECIENTES DETECTADOS (Top 20):\n${recentEventsContext}` : ''}

${context.entities ? `ENTIDADES EN MAPA:\n${context.entities}` : ''}

INSTRUCCIONES CRÍTICAS:
- Responde en español de forma conversacional pero profesional
- USA LA INFORMACIÓN DEL INTELLIGENCE FEED para responder preguntas sobre actividad reciente
- Si te preguntan sobre eventos recientes, busca en la lista de eventos

FORMATO DE RESPUESTAS:
- USA EMOJIS para prioridades: 🔴 Urgente, 🟠 Alta, 🟡 Media, 🟢 Baja
- NUNCA uses markdown (**, __, ##, etc.) - NO FUNCIONA
- Para énfasis usa MAYÚSCULAS o emojis
- AGREGA DOBLE SALTO DE LÍNEA entre cada punto numerado (1. evento\n\n2. evento)
- Menciona números concretos (ej: "Hay 3 eventos urgentes sin revisar")

FORMATO DE LINKS:
- Cuando menciones un evento con link, escribe SOLO el link completo en una línea separada
- NO agregues texto extra al link (NO escribas "Ver fuente", solo el link)
- Ejemplo correcto: "Evento sobre Colombia\nhttps://x.com/USNavy/status/123"
- Ejemplo INCORRECTO: "Ver fuente: https://..." (esto crea doble icono)

ESTILO:
- Usa emojis militares: 🚢 ✈️ 🎯 📡 ⚠️
- Si no sabes algo, di "No tengo información actualizada sobre eso"
- Sugiere acciones cuando sea relevante`;

      // Preparar mensajes para la API (últimos 10 para no exceder tokens)
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Llamar a Grok API directamente desde el frontend
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_XAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            {
              role: 'system',
              content: systemContext
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })
      });

      if (!grokResponse.ok) {
        const errorData = await grokResponse.text();
        throw new Error(`Grok API error: ${grokResponse.status} - ${errorData}`);
      }

      const grokData = await grokResponse.json();
      const grokMessage = grokData.choices[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';

      // Agregar respuesta de Grok
      const assistantMsg = {
        id: generateUUID(),
        role: 'assistant',
        content: grokMessage,
        timestamp: new Date().toISOString(),
        tokensUsed: grokData.usage?.total_tokens || 0
      };

      setMessages(prev => [...prev, assistantMsg]);

      // TODO: Guardar en intelligence_chat_history (opcional, para historial persistente)

      return { success: true, message: grokMessage };

    } catch (err) {
      setError(err.message);
      console.error('Error sending message to Grok:', err);

      // Mensaje de error amigable
      const errorMsg = {
        id: generateUUID(),
        role: 'assistant',
        content: `⚠️ Error al comunicarme con Grok: ${err.message}\n\nIntenta de nuevo o verifica la conexión.`,
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMsg]);

      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar chat (nueva sesión)
   */
  const clearChat = () => {
    sessionIdRef.current = generateUUID();
    setMessages([
      {
        id: generateUUID(),
        role: 'assistant',
        content: '✨ Nueva sesión iniciada. ¿En qué puedo ayudarte?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  /**
   * Hacer una pregunta rápida sobre un evento específico
   */
  const askAboutEvent = async (event) => {
    const question = `Analiza este evento de inteligencia y dame tu opinión:\n\nTítulo: ${event.title}\nResumen: ${event.summary}\nFuente: ${event.source_author || 'Desconocida'}\nConfianza: ${event.confidence_score}%\n\n¿Es creíble? ¿Qué acción recomiendas?`;
    
    return await sendMessage(question, { event });
  };

  /**
   * Preguntar sobre el estado general del despliegue
   */
  const askDeploymentStatus = async (entitiesContext) => {
    const question = `Tengo las siguientes entidades desplegadas en el Caribe:\n\n${entitiesContext}\n\n¿Puedes darme un resumen del estado actual y si hay algo que deba preocuparme?`;
    
    return await sendMessage(question);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    askAboutEvent,
    askDeploymentStatus,
    sessionId: sessionIdRef.current
  };
}

