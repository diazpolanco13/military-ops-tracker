import MapContainer from './components/Map/MapContainer';
import EntityPalette from './components/Templates/EntityPalette';
import { useState } from 'react';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelectTemplate = (template) => {
    console.log('Template seleccionada:', template);
    setSelectedTemplate(template);
  };

  const handleDragTemplate = (template, event) => {
    console.log('Arrastrando template:', template);
  };

  return (
    <div className="flex h-screen">
      <EntityPalette 
        onSelectTemplate={handleSelectTemplate}
        onDragTemplate={handleDragTemplate}
      />
      <div className="flex-1">
        <MapContainer />
      </div>
    </div>
  );
}

export default App
