import MapContainer from './components/Map/MapContainer';
import EntityPalette from './components/Templates/EntityPalette';
import InstantiateModal from './components/Templates/InstantiateModal';
import { useState } from 'react';
import { useCreateEntity } from './hooks/useCreateEntity';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const { createFromTemplate, creating } = useCreateEntity();

  const handleSelectTemplate = (template) => {
    console.log('Template seleccionada:', template);
    setSelectedTemplate(template);
    setDropPosition(null); // Reset position
  };

  const handleDragTemplate = (template, event) => {
    console.log('Arrastrando template:', template);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setDropPosition(null);
  };

  const handleConfirmCreate = async (entityData) => {
    if (!selectedTemplate) return;

    const result = await createFromTemplate(entityData, selectedTemplate);
    
    if (result.success) {
      console.log('✅ Entidad creada exitosamente:', result.data);
      handleCloseModal();
      
      // Refrescar entidades para que aparezca inmediatamente (silencioso)
      if (window.refetchEntities) {
        setTimeout(() => {
          window.refetchEntities(true); // true = silent (sin mostrar loading)
          console.log('🔄 Refrescando entidades silenciosamente...');
        }, 300); // Delay reducido para respuesta más rápida
      }
      
      // TODO: Mostrar toast de éxito
    } else {
      alert(`Error al crear entidad: ${result.error}`);
    }
  };

  return (
    <div className="flex h-screen">
      <EntityPalette 
        onSelectTemplate={handleSelectTemplate}
        onDragTemplate={handleDragTemplate}
      />
      <div className="flex-1">
        <MapContainer onRefetchNeeded={true} />
      </div>

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
  );
}

export default App
