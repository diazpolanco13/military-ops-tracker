import { createContext, useContext, useState } from 'react';
import { CARIBBEAN_COUNTRIES } from '../hooks/useMaritimeBoundaries';

/**
 * 🌊 Contexto para gestionar visualización de límites marítimos
 * 🗺️ Incluye zona en reclamación (Guayana Esequiba)
 */
const MaritimeBoundariesContext = createContext();

export function MaritimeBoundariesProvider({ children }) {
  const [showBoundaries, setShowBoundaries] = useState(() => {
    return localStorage.getItem('showMaritimeBoundaries') === 'true';
  });

  // 🗺️ Estado para Zona en Reclamación (Guayana Esequiba)
  // Por defecto ACTIVADO para todos los usuarios
  const [showEsequiboClaim, setShowEsequiboClaim] = useState(() => {
    const saved = localStorage.getItem('showEsequiboClaim');
    // Si no hay valor guardado, mostrar por defecto (true)
    return saved === null ? true : saved === 'true';
  });

  // ✏️ Estado para modo edición del polígono
  const [isEsequiboEditing, setIsEsequiboEditing] = useState(false);

  const [selectedCountries, setSelectedCountries] = useState(() => {
    const saved = localStorage.getItem('maritimeCountries');
    return saved ? JSON.parse(saved) : [
      CARIBBEAN_COUNTRIES.VENEZUELA,
      CARIBBEAN_COUNTRIES.CUBA,
      CARIBBEAN_COUNTRIES.COLOMBIA,
      CARIBBEAN_COUNTRIES.JAMAICA,
      CARIBBEAN_COUNTRIES.HAITI,
      CARIBBEAN_COUNTRIES.DOMINICAN_REPUBLIC,
      CARIBBEAN_COUNTRIES.PUERTO_RICO,
      CARIBBEAN_COUNTRIES.TRINIDAD_TOBAGO,
      CARIBBEAN_COUNTRIES.GUYANA,
    ];
  });

  const toggleBoundaries = () => {
    setShowBoundaries(prev => {
      const newValue = !prev;
      localStorage.setItem('showMaritimeBoundaries', newValue);
      return newValue;
    });
  };

  // 🗺️ Toggle para Zona en Reclamación
  const toggleEsequiboClaim = () => {
    setShowEsequiboClaim(prev => {
      const newValue = !prev;
      localStorage.setItem('showEsequiboClaim', newValue);
      console.log('🗺️ Esequibo claim zone:', newValue ? 'visible' : 'hidden');
      return newValue;
    });
  };

  // ✏️ Toggle para modo edición del polígono
  const toggleEsequiboEditing = () => {
    setIsEsequiboEditing(prev => !prev);
  };

  const updateCountries = (countries) => {
    setSelectedCountries(countries);
    localStorage.setItem('maritimeCountries', JSON.stringify(countries));
  };

  const toggleCountry = (countryCode) => {
    setSelectedCountries(prev => {
      const newCountries = prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode];
      
      localStorage.setItem('maritimeCountries', JSON.stringify(newCountries));
      return newCountries;
    });
  };

  return (
    <MaritimeBoundariesContext.Provider value={{ 
      showBoundaries, 
      toggleBoundaries,
      showEsequiboClaim,
      toggleEsequiboClaim,
      isEsequiboEditing,
      toggleEsequiboEditing,
      selectedCountries,
      updateCountries,
      toggleCountry
    }}>
      {children}
    </MaritimeBoundariesContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de límites marítimos
 */
export function useMaritimeBoundariesContext() {
  const context = useContext(MaritimeBoundariesContext);
  if (!context) {
    throw new Error('useMaritimeBoundariesContext debe usarse dentro de MaritimeBoundariesProvider');
  }
  return context;
}

