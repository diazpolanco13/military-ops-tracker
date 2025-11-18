import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, Minimize2, Maximize2 } from 'lucide-react';
import { useGrokChat } from '../../hooks/useGrokChat';

/**
 * 🤖 Chatbot de Inteligencia con Grok
 * Ubicación: Bottom-right corner
 * Estados: Colapsado (badge) / Expandido (chat completo)
 */
export default function IntelligenceChatbot() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null); // Ref para auto-resize del textarea
  
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearChat
  } = useGrokChat();

  // Escuchar eventos de apertura/cierre del modal de detalles
  useEffect(() => {
    const handleModalOpen = () => setDetailsModalOpen(true);
    const handleModalClose = () => setDetailsModalOpen(false);

    window.addEventListener('detailsModalOpen', handleModalOpen);
    window.addEventListener('detailsModalClose', handleModalClose);

    return () => {
      window.removeEventListener('detailsModalOpen', handleModalOpen);
      window.removeEventListener('detailsModalClose', handleModalClose);
    };
  }, []);

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🆕 Auto-resize del textarea según el contenido
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

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
      text: 'Analizar región Caribe',
      query: 'Dame un análisis estratégico de la situación militar actual en el Caribe'
    },
    {
      text: 'Fuerzas navales US',
      query: 'Cuéntame sobre las principales fuerzas navales de EE.UU. en el Caribe'
    },
    {
      text: 'Tácticas de patrullaje',
      query: '¿Cuáles son las mejores tácticas de patrullaje marítimo para el Mar Caribe?'
    }
  ];

  // ========================================================================
  // ESTADO COLAPSADO - Badge flotante
  // ========================================================================
  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${detailsModalOpen ? 'sm:block hidden' : 'block'}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="relative w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center hover:scale-110 transition-transform group overflow-hidden border-2 border-red-500/50"
          title="SAE - IA Assistant"
        >
          <img 
            src="/eva-avatar.jpg" 
            alt="EVA - SAE IA" 
            className="w-full h-full object-cover"
          />

          {/* Pulso animado */}
          <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
        </button>
      </div>
    );
  }

  // ========================================================================
  // ESTADO EXPANDIDO - Chat completo (responsive)
  // ========================================================================
  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMinimized 
        ? 'bottom-4 right-4' 
        : 'bottom-0 right-0 md:right-4 md:bottom-0 left-0 md:left-auto'
    }`}>
      <div className={`bg-slate-900/95 border-2 border-red-500/30 backdrop-blur-xl shadow-2xl shadow-red-500/20 transition-all ${
        isMinimized 
          ? 'w-80 h-16 rounded-2xl' 
          : 'w-full md:w-[450px] h-screen md:h-[600px] md:rounded-t-2xl md:border-b-0'
      }`}>
        
        {/* Header */}
        <div className="px-3 md:px-4 py-2.5 md:py-3 border-b border-red-500/20 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 md:rounded-t-2xl">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="relative w-8 md:w-10 h-8 md:h-10 rounded-full overflow-hidden border-2 border-red-500/50 bg-gradient-to-br from-red-600 to-orange-600">
              <img 
                src="/eva-avatar.jpg" 
                alt="EVA - SAE IA" 
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 md:w-2.5 h-2 md:h-2.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h3 className="text-red-300 font-bold text-xs md:text-sm">SAE - IA</h3>
              {!isMinimized && (
                <p className="text-slate-400 text-[10px] md:text-xs">Analista de Inteligencia • En línea</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Minimizar/Maximizar */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              title={isMinimized ? 'Maximizar' : 'Minimizar'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-slate-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Limpiar chat */}
            {!isMinimized && (
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="Nueva conversación"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* Cerrar */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Contenido del chat - Solo visible cuando no está minimizado */}
        {!isMinimized && (
          <div className="flex flex-col h-[calc(100vh-64px)] md:h-[536px]">
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 modern-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] md:max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                      : msg.isError
                        ? 'bg-red-900/30 border border-red-500/50 text-red-300'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/50'
                  } rounded-lg px-3 md:px-4 py-2 md:py-2.5 shadow-lg`}>
                    {/* Icono para assistant */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-start space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-red-500/50 bg-gradient-to-br from-red-600 to-orange-600 flex-shrink-0">
                          <img 
                            src="/eva-avatar.jpg" 
                            alt="EVA - SAE IA" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-red-400 text-xs font-bold">SAE - IA</span>
                      </div>
                    )}
                    
                    {/* Contenido del mensaje con links clickeables */}
                    <div className="text-sm leading-relaxed space-y-1">
                      {msg.content.split('\n').map((line, i) => {
                        // Detectar si la línea contiene una URL
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        const parts = line.split(urlRegex);
                        
                        return (
                          <div key={i} className="break-words">
                            {parts.map((part, j) => {
                              if (part.match(urlRegex)) {
                                return (
                                  <a
                                    key={j}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 underline font-semibold"
                                  >
                                    <span>🔗 Ver fuente</span>
                                  </a>
                                );
                              }
                              return <span key={j}>{part}</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-1.5 ${
                      msg.role === 'user' ? 'text-orange-200' : 'text-slate-500'
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
                  <div className="bg-slate-800 border border-slate-700/50 rounded-lg px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-red-500/50 flex-shrink-0">
                        <img 
                          src="/eva-avatar.jpg" 
                          alt="EVA - SAE IA" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-slate-400 text-xs">SAE - IA está pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preguntas rápidas - Dentro del área de mensajes cuando no hay conversación */}
              {messages.length <= 1 && (
                <div className="mt-4">
                  <div className="text-red-400/70 text-xs font-bold mb-2 md:mb-3">💡 Preguntas rápidas:</div>
                  <div className="flex flex-col gap-2">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputMessage(q.query);
                          setTimeout(() => handleSend(), 100);
                        }}
                        className="px-3 md:px-4 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs md:text-sm text-red-300 transition-colors text-left"
                      >
                        {q.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input - Fijo en la parte inferior con botón integrado */}
            <div className="flex-shrink-0 p-2 md:p-3 border-t border-red-500/20 bg-slate-800/50">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregúntale a SAE - IA..."
                  disabled={loading}
                  rows={1}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 md:pl-4 py-2 md:py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-xs md:text-sm disabled:opacity-50 resize-none overflow-y-auto max-h-24 md:max-h-32 modern-scrollbar"
                  style={{ minHeight: '40px', paddingRight: '52px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !inputMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center shadow-lg"
                  title="Enviar (Enter)"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-2 text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

