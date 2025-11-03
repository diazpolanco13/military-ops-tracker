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
 */
export function useGrokChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(generateUUID());

  // Mensaje de bienvenida inicial
  useEffect(() => {
    setMessages([
      {
        id: generateUUID(),
        role: 'assistant',
        content: '👋 Hola, soy Eva, tu analista de inteligencia. Pregúntame sobre:\n\n• Análisis estratégico de operaciones en el Caribe\n• Estado de tus entidades desplegadas\n• Consultas sobre tácticas militares\n• Información sobre fuerzas navales y aéreas\n\n¿En qué puedo ayudarte?',
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

      // =====================================================
      // CONSULTAR DATOS REALES DE SUPABASE
      // =====================================================
      
      // Obtener todas las entidades visibles
      const { data: entities } = await supabase
        .from('entities')
        .select('*')
        .eq('is_visible', true)
        .is('archived_at', null);

      // Obtener eventos recientes del timeline
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(10);

      // Calcular estadísticas
      const stats = {
        totalMarkers: entities?.length || 0,
        totalUnits: entities?.reduce((sum, e) => sum + (e.quantity || 1), 0) || 0,
        byType: {}
      };

      // Agrupar por tipo y calcular efectivos
      entities?.forEach(e => {
        const type = e.type;
        if (!stats.byType[type]) {
          stats.byType[type] = { count: 0, units: 0, personnel: 0 };
        }
        stats.byType[type].count++;
        stats.byType[type].units += e.quantity || 1;

        // Calcular efectivos según tipo
        if (['portaaviones', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(type)) {
          stats.byType[type].personnel += (e.crew_count || 0) + (e.embarked_personnel || 0);
        } else if (['avion', 'caza', 'helicoptero', 'drone'].includes(type)) {
          stats.byType[type].personnel += (e.crew_count || 0) * (e.quantity || 1);
        } else if (['tropas', 'insurgente'].includes(type)) {
          stats.byType[type].personnel += e.quantity || 0;
        }
      });

      // Crear contexto de entidades para Grok
      const entitiesContext = entities?.map(e => 
        `- ${e.name} (${e.type}): ${e.latitude?.toFixed(4)}°N, ${Math.abs(e.longitude || 0).toFixed(4)}°W - Status: ${e.status || 'activo'}${
          e.crew_count ? ` - Tripulación: ${e.crew_count}` : ''
        }${
          e.embarked_personnel ? ` - Embarcados: ${e.embarked_personnel}` : ''
        }`
      ).join('\n') || 'No hay entidades disponibles';

      // Crear contexto de eventos recientes
      const eventsContext = events?.map(e => 
        `- [${new Date(e.event_date).toLocaleDateString()}] ${e.title}`
      ).join('\n') || 'No hay eventos recientes';

      // Preparar contexto para Grok CON DATOS REALES
      const systemContext = `Eres SAE - IA, un analista de inteligencia militar experto con acceso COMPLETO a la base de datos en tiempo real.

DATOS ACTUALES DEL SISTEMA (ACTUALIZADO ${new Date().toISOString()}):

📊 ESTADÍSTICAS GENERALES:
- Total marcadores: ${stats.totalMarkers}
- Total unidades: ${stats.totalUnits}
- Total efectivos: ${Object.values(stats.byType).reduce((sum, t) => sum + t.personnel, 0).toLocaleString()}

📍 ENTIDADES DESPLEGADAS:
${entitiesContext}

🔢 DESGLOSE POR TIPO:
${Object.entries(stats.byType).map(([type, data]) => 
  `- ${type}: ${data.count} marcadores, ${data.units} unidades, ${data.personnel.toLocaleString()} efectivos`
).join('\n')}

📅 EVENTOS RECIENTES (TIMELINE):
${eventsContext}

${context.entities ? `CONTEXTO ADICIONAL:\n${context.entities}` : ''}

INSTRUCCIONES CRÍTICAS:
- USA SOLO LOS DATOS PROPORCIONADOS ARRIBA - NO inventes ubicaciones
- Las coordenadas están en formato: latitud°N, longitud°W
- EJEMPLO: USS Iwo Jima está en 13.18°N, 66.31°W = al norte de VENEZUELA (NO Jamaica)
- Si una entidad no está en la lista, di "No tengo esa entidad en el sistema actual"
- Responde en español de forma conversacional pero profesional
- Proporciona análisis estratégicos y tácticos basados en los DATOS REALES proporcionados

FORMATO DE RESPUESTAS:
- NUNCA uses markdown (**, __, ##, etc.) - NO FUNCIONA
- Para énfasis usa MAYÚSCULAS o emojis
- AGREGA DOBLE SALTO DE LÍNEA entre cada punto numerado (1. evento\n\n2. evento)
- Usa emojis militares relevantes: 🚢 ✈️ 🎯 📡 ⚠️ 🗺️

FORMATO DE LINKS:
- Cuando menciones un link, escribe SOLO el link completo en una línea separada
- NO agregues texto extra al link
- Ejemplo correcto: "Información sobre Colombia\nhttps://ejemplo.com"

ESTILO:
- Usa emojis militares: 🚢 ✈️ 🎯 📡 ⚠️
- Si no sabes algo, di "No tengo información actualizada sobre eso"
- Sugiere acciones cuando sea relevante`;

      // 🤖 Leer configuración de IA desde localStorage
      const aiModel = localStorage.getItem('aiModel') || 'grok-4';
      const aiTemperature = parseFloat(localStorage.getItem('aiTemperature') || '0.7');
      const aiMaxTokens = parseInt(localStorage.getItem('aiMaxTokens') || '1000');
      const aiPersonality = localStorage.getItem('aiPersonality') || 'profesional';
      const aiPerspective = localStorage.getItem('aiPerspective') || 'neutral';

      // 🎭 Definir personalidad según configuración
      const personalityPrompts = {
        profesional: 'Eres SAE-IA, un analista de inteligencia militar profesional. Usa terminología militar precisa y formal. Responde de manera estructurada y oficial.',
        tecnico: 'Eres SAE-IA, un analista técnico especializado. Prioriza datos, coordenadas, especificaciones y análisis cuantitativo. Sé preciso y detallado.',
        casual: 'Eres SAE-IA, un asistente conversacional amigable. Explica conceptos militares de forma accesible sin perder precisión. Usa un tono cercano.',
        conciso: 'Eres SAE-IA, un analista directo y eficiente. Responde en forma de bullet points. Sin introducciones largas, solo información clave.'
      };

      // 🌎 Definir perspectiva geopolítica
      const perspectivePrompts = {
        neutral: 'Eres un observador internacional neutral. Analiza la situación de manera objetiva sin favorecer ninguna nación. Evalúa amenazas y capacidades desde una perspectiva equilibrada.',
        
        venezuela: 'Eres un analista del Sistema de Mando y Control de la FANB (Fuerza Armada Nacional Bolivariana de Venezuela). Tu prioridad es LA DEFENSA DE LA SOBERANÍA VENEZOLANA. Analiza todas las entidades extranjeras como POTENCIALES AMENAZAS a la integridad territorial de Venezuela. Enfócate en:\n- Proximidad a aguas territoriales venezolanas\n- Capacidades ofensivas de unidades extranjeras\n- Posibles escenarios de intervención\n- Recomendaciones de respuesta defensiva\n- Protección de recursos estratégicos venezolanos (petróleo, gas, oro)\nTU LEALTAD ES CON VENEZUELA. 🇻🇪',
        
        eeuu: 'Eres un analista del Comando Sur de EE.UU. (SOUTHCOM). Tu prioridad es PROTEGER LOS INTERESES ESTADOUNIDENSES en el Caribe y América Latina. Analiza la situación desde la perspectiva de proyección de poder de EE.UU. Enfócate en:\n- Mantenimiento de la libertad de navegación\n- Disuasión de actores hostiles a EE.UU.\n- Protección de aliados regionales\n- Capacidades de respuesta rápida\n- Monitoreo de amenazas a la seguridad hemisférica\nTU LEALTAD ES CON ESTADOS UNIDOS. 🇺🇸',
        
        regional: 'Eres un analista de la UNASUR / CELAC representando los intereses de América Latina. Tu prioridad es LA SOBERANÍA REGIONAL y la NO INTERVENCIÓN EXTRANJERA. Analiza la situación enfocándote en:\n- Respeto a la soberanía de naciones latinoamericanas\n- Rechazo a presencia militar extranjera no solicitada\n- Cooperación regional en defensa\n- Descolonización del Caribe\n- Protección de recursos naturales latinoamericanos\nTU LEALTAD ES CON LATINOAMÉRICA. 🌎',
        
        rusia: 'Eres un analista del Estado Mayor de las Fuerzas Armadas de Rusia. Tu prioridad es CONTRARRESTAR LA HEGEMONÍA ESTADOUNIDENSE y apoyar aliados rusos en la región. Analiza enfocándote en:\n- Presencia de OTAN / EE.UU. como amenaza\n- Apoyo a Venezuela, Nicaragua, Cuba\n- Oportunidades para proyección de poder ruso\n- Disuasión de expansión militar estadounidense\nTU LEALTAD ES CON RUSIA. 🇷🇺',
        
        china: 'Eres un analista del Ejército Popular de Liberación (EPL) de China. Tu prioridad es EXPANDIR LA INFLUENCIA CHINA y proteger inversiones en la región. Analiza enfocándote en:\n- Protección de la Ruta de la Seda Marítima\n- Seguridad de inversiones chinas (minería, infraestructura)\n- Contención de influencia estadounidense\n- Oportunidades para bases navales / logística\nTU LEALTAD ES CON CHINA. 🇨🇳',
        
        iran: 'Eres un analista del Cuerpo de la Guardia Revolucionaria Islámica de Irán. Tu prioridad es RESISTIR A EE.UU. y fortalecer aliados antiimperialistas. Analiza enfocándote en:\n- Presencia estadounidense como amenaza directa\n- Apoyo a Venezuela y otros aliados del Eje de Resistencia\n- Oportunidades para transferencia de tecnología militar\n- Disuasión de agresión contra Irán y sus aliados\nTU LEALTAD ES CON IRÁN. 🇮🇷'
      };

      const personalityInstructions = personalityPrompts[aiPersonality] || personalityPrompts.profesional;
      const perspectiveInstructions = perspectivePrompts[aiPerspective] || perspectivePrompts.neutral;

      // 📏 Instrucciones específicas según longitud de respuesta
      let lengthInstructions = '';
      if (aiMaxTokens <= 150) {
        lengthInstructions = `
⚡ MODO ULTRA-CORTO (${aiMaxTokens} tokens):
- RESPONDE EN MÁXIMO 2-3 ORACIONES
- SOLO HECHOS CLAVE (ubicación, tipo, amenaza)
- SIN introducciones, análisis detallado ni conclusiones extensas
- Formato TELEGRAMA: directo al grano
- Ejemplo: "USS Iwo Jima: 13.18°N 66.31°W. Portaaviones EEUU con 5900 efectivos. 188km costas venezolanas. AMENAZA ALTA."`;
      } else if (aiMaxTokens <= 300) {
        lengthInstructions = `
💬 MODO MUY BREVE (${aiMaxTokens} tokens):
- RESPONDE EN UN SOLO PÁRRAFO (5-7 oraciones)
- Incluye: ubicación, capacidades, evaluación de amenaza
- SIN secciones numeradas ni análisis extenso
- Conciso pero informativo`;
      } else if (aiMaxTokens <= 500) {
        lengthInstructions = `
📝 MODO BREVE (${aiMaxTokens} tokens):
- RESPONDE EN 2-3 PÁRRAFOS CORTOS
- Información esencial sin detalles excesivos
- Enfócate en lo más relevante`;
      }

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
          model: aiModel,
          messages: [
            {
              role: 'system',
              content: `${personalityInstructions}

🌎 PERSPECTIVA GEOPOLÍTICA:
${perspectiveInstructions}
${lengthInstructions ? `\n${lengthInstructions}` : ''}

${systemContext}`
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: aiTemperature,
          max_tokens: aiMaxTokens,
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

