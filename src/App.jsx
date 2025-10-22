import MapContainer from './components/Map/MapContainer';
import EntityPalette from './components/Templates/EntityPalette';
import InstantiateModal from './components/Templates/InstantiateModal';
import TopNavigationBar from './components/Navigation/TopNavigationBar';
import RadarOverlay from './components/Radar/RadarOverlay';
import RadarCrosshair from './components/Radar/RadarCrosshair';
import MeasurementTools from './components/Measurement/MeasurementTools';
import IntelligenceChatbot from './components/Intelligence/IntelligenceChatbot';
import IntelligenceFeed from './components/Intelligence/IntelligenceFeed';
import { useState } from 'react';
import { useCreateEntity } from './hooks/useCreateEntity';
import { SelectionProvider } from './stores/SelectionContext';
import { LockProvider } from './stores/LockContext';
import { MaritimeBoundariesProvider } from './stores/MaritimeBoundariesContext';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showPalette, setShowPalette] = useState(false); // Paleta oculta por defecto
  const [mapInstance, setMapInstance] = useState(null); // Referencia al mapa para navbar
  const [showRadar, setShowRadar] = useState(false); // Control del radar
  const [radarCompact, setRadarCompact] = useState(true); // Radar en modo compacto por defecto
  const [showMeasurementTools, setShowMeasurementTools] = useState(false); // Control de herramientas de medición
  const [showIntelligenceFeed, setShowIntelligenceFeed] = useState(false); // Control del Intelligence Feed
  const { createFromTemplate, creating } = useCreateEntity();

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setDropPosition(null); // Reset position
  };

  const handleDragTemplate = (template, event) => {
    // Callback cuando se arrastra una plantilla
  };

  const handleTemplateDrop = (template, position) => {
    setSelectedTemplate(template);
    setDropPosition(position);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setDropPosition(null);
  };

  const handleConfirmCreate = async (entityData) => {
    if (!selectedTemplate) return;

    const result = await createFromTemplate(entityData, selectedTemplate);
    
    if (result.success) {
      handleCloseModal();
      
      // Agregar entidad directamente al estado sin refetch completo
      if (window.addEntityDirectly && result.data) {
        window.addEntityDirectly(result.data);
      }
    } else {
      alert(`Error al crear entidad: ${result.error}`);
    }
  };

  // Handler para detecciones del radar
  const handleRadarDetection = (detectedEntities) => {
    // Aquí puedes agregar sonidos, notificaciones, etc.
  };

  return (
    <LockProvider>
      <SelectionProvider>
        <MaritimeBoundariesProvider>
          {/* Navbar superior horizontal - Incluye menú Ver con todas las acciones */}
          <TopNavigationBar 
          onTogglePalette={() => setShowPalette(!showPalette)}
          paletteVisible={showPalette}
          map={mapInstance}
          onToggleRadar={() => setShowRadar(!showRadar)}
          radarVisible={showRadar}
          onToggleRadarMode={() => setRadarCompact(!radarCompact)}
          radarCompact={radarCompact}
          onToggleMeasurement={() => setShowMeasurementTools(!showMeasurementTools)}
          measurementVisible={showMeasurementTools}
          onToggleIntelligence={() => setShowIntelligenceFeed(!showIntelligenceFeed)}
          intelligenceVisible={showIntelligenceFeed}
        />

      {/* HeaderBar eliminado - Funcionalidad movida al menú "Ver" de la navbar */}
      
      <div className="h-screen">
        {/* Mapa ocupa todo el espacio */}
        <MapContainer 
          onRefetchNeeded={true}
          onTemplateDrop={handleTemplateDrop}
          showPalette={showPalette}
          onMapReady={setMapInstance}
        />
        
        {/* Paleta como overlay (fixed) */}
        {showPalette && (
          <EntityPalette 
            onSelectTemplate={handleSelectTemplate}
            onDragTemplate={handleDragTemplate}
            onClose={() => setShowPalette(false)}
          />
        )}

        {/* Modal de instanciación */}
        {selectedTemplate && (
          <InstantiateModal
            template={selectedTemplate}
            position={dropPosition}
            onClose={handleCloseModal}
            onConfirm={handleConfirmCreate}
          />
        )}

        {/* Crosshair del centro del radar */}
        {showRadar && <RadarCrosshair />}

        {/* Radar Overlay */}
        {showRadar && mapInstance && (
          <RadarOverlay
            map={mapInstance}
            onDetection={handleRadarDetection}
            compact={radarCompact}
          />
        )}

        {/* Herramientas de Medición */}
        {showMeasurementTools && mapInstance && (
          <MeasurementTools map={mapInstance} />
        )}

        {/* Intelligence Feed (Drawer derecho) */}
        {showIntelligenceFeed && (
          <IntelligenceFeed 
            onClose={() => setShowIntelligenceFeed(false)}
            map={mapInstance}
          />
        )}

        {/* Chatbot de Inteligencia (Bottom-right) */}
        <IntelligenceChatbot />

        {/* Indicador de creación */}
        {creating && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Creando entidad...</span>
          </div>
        )}
      </div>
        </MaritimeBoundariesProvider>
      </SelectionProvider>
    </LockProvider>
  );
}

export default App
