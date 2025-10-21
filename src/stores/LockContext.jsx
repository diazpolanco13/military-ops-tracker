import { createContext, useContext, useState } from 'react';

/**
 * 🔒 Contexto para gestionar el bloqueo global de movimiento de entidades
 */
const LockContext = createContext();

export function LockProvider({ children }) {
  const [isLocked, setIsLocked] = useState(true); // 🔒 Bloqueado por defecto - posiciones verificadas

  const toggleLock = () => {
    setIsLocked(prev => !prev);
  };

  const lock = () => {
    setIsLocked(true);
  };

  const unlock = () => {
    setIsLocked(false);
  };

  return (
    <LockContext.Provider value={{ isLocked, toggleLock, lock, unlock }}>
      {children}
    </LockContext.Provider>
  );
}

/**
 * Hook para acceder al estado de bloqueo
 */
export function useLock() {
  const context = useContext(LockContext);
  if (!context) {
    throw new Error('useLock debe usarse dentro de LockProvider');
  }
  return context;
}

