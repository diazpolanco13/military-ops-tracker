import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Context para gestionar selección múltiple de entidades
 * Permite Ctrl+Click para seleccionar múltiples entidades tipo IBM i2
 */
const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // Detectar tecla Ctrl globalmente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) { // Ctrl en Windows/Linux, Cmd en Mac
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    // Perder foco de ventana
    const handleBlur = () => {
      setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Seleccionar una entidad
  const selectEntity = useCallback((entityId) => {
    setSelectedIds(new Set([entityId]));
  }, []);

  // Agregar a selección (con Ctrl)
  const addToSelection = useCallback((entityId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId); // Toggle: si ya está, quitar
      } else {
        newSet.add(entityId); // Si no está, agregar
      }
      return newSet;
    });
  }, []);

  // Deseleccionar una entidad
  const deselectEntity = useCallback((entityId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(entityId);
      return newSet;
    });
  }, []);

  // Deseleccionar todas
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Seleccionar múltiples
  const selectMultiple = useCallback((entityIds) => {
    setSelectedIds(new Set(entityIds));
  }, []);

  // Verificar si está seleccionada
  const isSelected = useCallback((entityId) => {
    return selectedIds.has(entityId);
  }, [selectedIds]);

  // Obtener todas las seleccionadas
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  // Contar seleccionadas
  const getSelectedCount = useCallback(() => {
    return selectedIds.size;
  }, [selectedIds]);

  const value = {
    selectedIds,
    isCtrlPressed,
    setIsCtrlPressed,
    selectEntity,
    addToSelection,
    deselectEntity,
    clearSelection,
    selectMultiple,
    isSelected,
    getSelectedIds,
    getSelectedCount,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection debe usarse dentro de SelectionProvider');
  }
  return context;
}

