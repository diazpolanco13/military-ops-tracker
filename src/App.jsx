import MapContainer from './components/Map/MapContainer';
import EntityPalette from './components/Templates/EntityPalette';
import InstantiateModal from './components/Templates/InstantiateModal';
import TopNavigationBar from './components/Navigation/TopNavigationBar';
import RadarOverlay from './components/Radar/RadarOverlay';
import RadarCrosshair from './components/Radar/RadarCrosshair';
import MeasurementTools from './components/Measurement/MeasurementTools';
import IntelligenceChatbot from './components/Intelligence/IntelligenceChatbot';
import EventTimeline from './components/Timeline/EventTimeline';
import CalendarView from './components/Calendar/CalendarView';
import AddEventModal from './components/Timeline/AddEventModal';
import SearchBar from './components/Search/SearchBar';
import LoginPage from './components/Auth/LoginPage';
import { useState } from 'react';
import { useCreateEntity } from './hooks/useCreateEntity';
import { useAuth } from './hooks/useAuth';
import { useEvents } from './hooks/useEvents';
import { SelectionProvider } from './stores/SelectionContext';
import { LockProvider } from './stores/LockContext';
import { MaritimeBoundariesProvider } from './stores/MaritimeBoundariesContext';
// Importar utils para exponer en window
import './utils/loadGADMBoundaries';
import './utils/loadTerrestrialBoundaries';

function App() {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const { events, loading: eventsLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showPalette, setShowPalette] = useState(false); // Paleta oculta por defecto
  const [mapInstance, setMapInstance] = useState(null); // Referencia al mapa para navbar
  const [showRadar, setShowRadar] = useState(false); // Control del radar
  const [radarCompact, setRadarCompact] = useState(true); // Radar en modo compacto por defecto
  const [showMeasurementTools, setShowMeasurementTools] = useState(false); // Control de herramientas de medición
  const [showEventTimeline, setShowEventTimeline] = useState(false); // Control del Timeline de Eventos
  const [showCalendar, setShowCalendar] = useState(false); // Control del Calendario de Eventos
  const [showSearch, setShowSearch] = useState(true); // Control de la barra de búsqueda (visible por defecto)
  const [eventToEdit, setEventToEdit] = useState(null); // Evento a editar desde el calendario
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

  // 🔐 Mostrar pantalla de carga mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Verificando autenticación...</p>
          <p className="text-slate-400 text-sm mt-2">🔒 Conexión segura con Supabase</p>
        </div>
      </div>
    );
  }

  // 🔐 Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
          onToggleTimeline={() => setShowEventTimeline(!showEventTimeline)}
          timelineVisible={showEventTimeline}
          onToggleCalendar={() => setShowCalendar(!showCalendar)}
          calendarVisible={showCalendar}
          onToggleSearch={() => setShowSearch(!showSearch)}
          searchVisible={showSearch}
          user={user}
          onSignOut={signOut}
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

        {/* Barra de Búsqueda - Siempre visible (controlable desde Ver) */}
        <SearchBar map={mapInstance} isVisible={showSearch} />

        {/* Timeline de Eventos - Sidebar derecho */}
        {showEventTimeline && (
          <EventTimeline 
            isOpen={showEventTimeline}
            onClose={() => setShowEventTimeline(false)}
          />
        )}

        {/* Calendario de Eventos - Vista completa */}
        {showCalendar && (
          <CalendarView
            events={events}
            loading={eventsLoading}
            onClose={() => setShowCalendar(false)}
            onCreateEvent={createEvent}
            onEditEvent={(event) => setEventToEdit(event)}
            onDeleteEvent={async (eventId) => {
              await deleteEvent(eventId);
            }}
          />
        )}

        {/* Modal de edición de evento desde calendario */}
        {eventToEdit && (
          <AddEventModal
            event={eventToEdit}
            onClose={() => setEventToEdit(null)}
            onCreate={async (_, data) => {
              return { success: false, error: 'Usar el timeline para crear eventos' };
            }}
            onUpdate={async (id, data) => {
              const result = await updateEvent(id, data);
              if (result.success) {
                setEventToEdit(null);
              }
              return result;
            }}
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
