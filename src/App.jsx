import MapContainer from './components/Map/MapContainer';
import EntityPalette from './components/Templates/EntityPalette';
import InstantiateModal from './components/Templates/InstantiateModal';
import TopNavigationBar from './components/Navigation/TopNavigationBar';
import { useState } from 'react';
import { useCreateEntity } from './hooks/useCreateEntity';
import { SelectionProvider } from './stores/SelectionContext';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showPalette, setShowPalette] = useState(false); // Paleta oculta por defecto
  const [mapInstance, setMapInstance] = useState(null); // Referencia al mapa para navbar
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

  return (
    <SelectionProvider>
      {/* Navbar superior horizontal - Incluye menú Ver con todas las acciones */}
      <TopNavigationBar 
        onTogglePalette={() => setShowPalette(!showPalette)}
        paletteVisible={showPalette}
        map={mapInstance}
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

        {/* Indicador de creación */}
        {creating && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Creando entidad...</span>
          </div>
        )}
      </div>
    </SelectionProvider>
  );
}

export default App
