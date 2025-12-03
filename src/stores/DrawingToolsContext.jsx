import { createContext, useContext, useState } from 'react';

/**
 * 🛠️ Contexto global para controlar herramientas de dibujo
 * - Bloquea la selección de entidades cuando se está dibujando
 * - Mejora UX evitando clicks accidentales en entidades
 */
const DrawingToolsContext = createContext();

export function DrawingToolsProvider({ children }) {
  const [isDrawingToolActive, setIsDrawingToolActive] = useState(false);
  const [activeToolName, setActiveToolName] = useState(null); // 'line', 'polygon', 'circle', 'arrow', 'text'

  const activateTool = (toolName) => {
    setIsDrawingToolActive(true);
    setActiveToolName(toolName);
  };

  const deactivateTool = () => {
    setIsDrawingToolActive(false);
    setActiveToolName(null);
  };

  return (
    <DrawingToolsContext.Provider
      value={{
        isDrawingToolActive,
        activeToolName,
        activateTool,
        deactivateTool
      }}
    >
      {children}
    </DrawingToolsContext.Provider>
  );
}

export function useDrawingTools() {
  const context = useContext(DrawingToolsContext);
  if (!context) {
    throw new Error('useDrawingTools debe usarse dentro de DrawingToolsProvider');
  }
  return context;
}

