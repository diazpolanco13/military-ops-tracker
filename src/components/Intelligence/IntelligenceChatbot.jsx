import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, Minimize2, Maximize2 } from 'lucide-react';
import { useGrokChat } from '../../hooks/useGrokChat';
import { useUnreadIntelligenceCount } from '../../hooks/useIntelligenceEvents';

/**
 * 🤖 Chatbot de Inteligencia con Grok
 * Ubicación: Bottom-right corner
 * Estados: Colapsado (badge) / Expandido (chat completo)
 */
export default function IntelligenceChatbot() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearChat
  } = useGrokChat();

  const unreadCount = useUnreadIntelligenceCount();

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manejar envío de mensaje
  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    await sendMessage(message);
  };

  // Manejar Enter para enviar
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Preguntas rápidas sugeridas
  const quickQuestions = [
    {
      text: '¿Qué hay de nuevo?',
      query: '¿Hay alguna actividad militar nueva en las últimas horas en el Caribe?'
    },
    {
      text: 'Estado del despliegue',
      query: 'Dame un resumen del estado actual de mis 41 unidades desplegadas'
    },
    {
      text: 'Analizar eventos',
      query: 'Analiza los eventos de inteligencia más recientes y dime si hay algo urgente'
    }
  ];

  // ========================================================================
  // ESTADO COLAPSADO - Badge flotante
  // ========================================================================
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center hover:scale-110 transition-transform z-50 group"
        title="Grok Intelligence Assistant"
      >
        <Bot className="w-8 h-8 text-white animate-pulse" />
        
        {/* Badge de eventos sin leer */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
            <span className="text-white text-xs font-bold">{unreadCount}</span>
          </div>
        )}

        {/* Pulso animado */}
        <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping"></div>
      </button>
    );
  }

  // ========================================================================
  // ESTADO EXPANDIDO - Chat completo
  // ========================================================================
  return (
    <div className={`fixed right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'bottom-4' : 'bottom-4'
    }`}>
      <div className={`bg-slate-900/95 border-2 border-purple-500/50 rounded-2xl backdrop-blur-xl shadow-2xl shadow-purple-500/20 transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bot className="w-5 h-5 text-purple-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></div>
            </div>
            <div>
              <h3 className="text-purple-300 font-bold text-sm">Grok Intelligence</h3>
              {!isMinimized && (
                <p className="text-purple-400/60 text-xs">Analista AI • En línea</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Badge de eventos */}
            {unreadCount > 0 && (
              <div className="px-2 py-1 bg-red-500/20 rounded-full border border-red-500/50">
                <span className="text-red-400 text-xs font-bold">{unreadCount}</span>
              </div>
            )}

            {/* Minimizar/Maximizar */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
              title={isMinimized ? 'Maximizar' : 'Minimizar'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-purple-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-purple-400" />
              )}
            </button>

            {/* Limpiar chat */}
            {!isMinimized && (
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Nueva conversación"
              >
                <Trash2 className="w-4 h-4 text-purple-400" />
              </button>
            )}

            {/* Cerrar */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Contenido del chat - Solo visible cuando no está minimizado */}
        {!isMinimized && (
          <>
            {/* Mensajes */}
            <div className="h-[440px] overflow-y-auto p-4 space-y-3 modern-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.isError
                        ? 'bg-red-900/30 border border-red-500/50 text-red-300'
                        : 'bg-slate-800 text-slate-200'
                  } rounded-lg px-4 py-2.5 shadow-lg`}>
                    {/* Icono para assistant */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-start space-x-2 mb-1">
                        <Bot className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-purple-400 text-xs font-bold">Grok</span>
                      </div>
                    )}
                    
                    {/* Contenido del mensaje */}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-1.5 ${
                      msg.role === 'user' ? 'text-purple-200' : 'text-slate-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString('es', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Indicador de carga */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-lg px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-slate-400 text-xs">Grok está pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Preguntas rápidas - Solo si es el primer mensaje */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 border-t border-purple-500/20">
                <div className="text-purple-400/70 text-xs font-bold mb-2 mt-2">💡 Preguntas rápidas:</div>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputMessage(q.query);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 transition-colors"
                    >
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-purple-500/30 bg-slate-800/50">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregúntale a Grok..."
                  disabled={loading}
                  className="flex-1 bg-slate-900 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
                  title="Enviar (Enter)"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-2 text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

