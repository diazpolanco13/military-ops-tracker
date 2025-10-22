import { useState, useRef, useEffect } from 'react';

/**
 * 🤖 Hook para conversaciones con Grok AI
 * Chat conversacional sobre inteligencia militar
 */
export function useGrokChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Mensaje de bienvenida inicial
  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '👋 Hola, soy Grok, tu analista de inteligencia militar. Pregúntame sobre:\n\n• Actividad militar reciente en el Caribe\n• Estado de tus entidades desplegadas\n• Análisis de eventos detectados\n• Búsqueda de información específica\n\n¿En qué puedo ayudarte?',
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
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMsg]);

      // Preparar contexto para Grok
      const systemContext = `Eres Grok, un analista de inteligencia militar experto.

CONTEXTO DEL SISTEMA:
- Aplicación: Military Ops Tracker para región del Caribe
- Usuario está monitoreando: 41 entidades militares (destructores, aviones, tropas)
- Región: 10°N-25°N, 60°W-90°W (Caribe)
- Capacidades: Radar visual, medición de distancias, análisis geoespacial

${context.recentEvents ? `EVENTOS RECIENTES DETECTADOS:\n${context.recentEvents}` : ''}
${context.entities ? `ENTIDADES EN MAPA:\n${context.entities}` : ''}

INSTRUCCIONES:
- Responde en español de forma conversacional pero profesional
- Usa datos concretos cuando los tengas
- Si no sabes algo, di "No tengo información actualizada sobre eso"
- Sugiere acciones cuando sea relevante (ej: "Deberías verificar la posición de...")
- Usa emojis militares apropiados: 🚢 ✈️ 🎯 📡 ⚠️`;

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
          model: 'grok-beta',
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
    sessionIdRef.current = crypto.randomUUID();
    setMessages([
      {
        id: crypto.randomUUID(),
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

