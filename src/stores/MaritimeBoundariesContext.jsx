import { createContext, useContext, useState } from 'react';
import { CARIBBEAN_COUNTRIES } from '../hooks/useMaritimeBoundariesLocal';

/**
 * 🌊 Contexto para gestionar visualización de límites territoriales
 * 
 * Controla 3 capas independientes:
 * - Límites Marítimos (EEZ 200mn)
 * - Límites Terrestres (fronteras)
 * - Zona en Reclamación (Guayana Esequiba)
 */
const MaritimeBoundariesContext = createContext();

export function MaritimeBoundariesProvider({ children }) {
  // 🌊 Estado para Límites Marítimos (EEZ)
  const [showMaritime, setShowMaritime] = useState(() => {
    const saved = localStorage.getItem('showMaritimeBoundaries');
    return saved === null ? true : saved === 'true';
  });

  // 🗺️ Estado para Límites Terrestres
  const [showTerrestrial, setShowTerrestrial] = useState(() => {
    const saved = localStorage.getItem('showTerrestrialBoundaries');
    return saved === null ? true : saved === 'true';
  });

  // 🔺 Estado para Zona en Reclamación (Guayana Esequiba)
  const [showEsequiboClaim, setShowEsequiboClaim] = useState(() => {
    const saved = localStorage.getItem('showEsequiboClaim');
    return saved === null ? true : saved === 'true';
  });

  // ✏️ Estado para modo edición del polígono Esequibo
  const [isEsequiboEditing, setIsEsequiboEditing] = useState(false);

  // 🌍 Países seleccionados
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

  // 🌊 Toggle Límites Marítimos
  const toggleMaritime = () => {
    setShowMaritime(prev => {
      const newValue = !prev;
      localStorage.setItem('showMaritimeBoundaries', newValue);
      console.log('🌊 Maritime boundaries:', newValue ? 'visible' : 'hidden');
      return newValue;
    });
  };

  // 🗺️ Toggle Límites Terrestres
  const toggleTerrestrial = () => {
    setShowTerrestrial(prev => {
      const newValue = !prev;
      localStorage.setItem('showTerrestrialBoundaries', newValue);
      console.log('🗺️ Terrestrial boundaries:', newValue ? 'visible' : 'hidden');
      return newValue;
    });
  };

  // 🔺 Toggle Zona en Reclamación
  const toggleEsequiboClaim = () => {
    setShowEsequiboClaim(prev => {
      const newValue = !prev;
      localStorage.setItem('showEsequiboClaim', newValue);
      console.log('🔺 Esequibo claim zone:', newValue ? 'visible' : 'hidden');
      return newValue;
    });
  };

  // ✏️ Toggle modo edición del polígono
  const toggleEsequiboEditing = () => {
    setIsEsequiboEditing(prev => !prev);
  };

  // 🌍 Actualizar países seleccionados
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

  // Compatibilidad: showBoundaries ahora es true si cualquiera de los dos está activo
  const showBoundaries = showMaritime || showTerrestrial;
  
  // Toggle general (activa/desactiva ambos)
  const toggleBoundaries = () => {
    const newValue = !showBoundaries;
    setShowMaritime(newValue);
    setShowTerrestrial(newValue);
    localStorage.setItem('showMaritimeBoundaries', newValue);
    localStorage.setItem('showTerrestrialBoundaries', newValue);
  };

  return (
    <MaritimeBoundariesContext.Provider value={{ 
      // Estados individuales
      showMaritime, 
      toggleMaritime,
      showTerrestrial,
      toggleTerrestrial,
      showEsequiboClaim,
      toggleEsequiboClaim,
      isEsequiboEditing,
      toggleEsequiboEditing,
      // Compatibilidad (toggle general)
      showBoundaries, 
      toggleBoundaries,
      // Países
      selectedCountries,
      updateCountries,
      toggleCountry
    }}>
      {children}
    </MaritimeBoundariesContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de límites territoriales
 */
export function useMaritimeBoundariesContext() {
  const context = useContext(MaritimeBoundariesContext);
  if (!context) {
    throw new Error('useMaritimeBoundariesContext debe usarse dentro de MaritimeBoundariesProvider');
  }
  return context;
}
