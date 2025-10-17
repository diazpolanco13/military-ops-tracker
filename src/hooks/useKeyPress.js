import { useEffect } from 'react';

/**
 * Hook para detectar teclas presionadas globalmente
 */
export function useKeyPress(targetKey, onPress, onRelease) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === targetKey || e.code === targetKey) {
        onPress?.();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === targetKey || e.code === targetKey) {
        onRelease?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [targetKey, onPress, onRelease]);
}

