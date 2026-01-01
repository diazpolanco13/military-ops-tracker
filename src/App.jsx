import MapContainer from './components/Map/MapContainer';
import EntityPalette from './components/Templates/EntityPalette';
import InstantiateModal from './components/Templates/InstantiateModal';
import TopNavigationBar from './components/Navigation/TopNavigationBar';
import RadarOverlay from './components/Radar/RadarOverlay';
import RadarCrosshair from './components/Radar/RadarCrosshair';
import MeasurementTools from './components/Measurement/MeasurementTools';
import EventTimeline from './components/Timeline/EventTimeline';
import CalendarView from './components/Calendar/CalendarView';
import AddEventModal from './components/Timeline/AddEventModal';
import SearchBar from './components/Search/SearchBar';
import LoginPage from './components/Auth/LoginPage';
import GlobalAddEventButton from './components/Common/GlobalAddEventButton';
import ScreenshotView from './components/Screenshot/ScreenshotView';
import SituationScreenshotView from './components/Screenshot/SituationScreenshotView';
import { useState, useEffect, useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { useCreateEntity } from './hooks/useCreateEntity';
import { useAuth } from './hooks/useAuth';
import { useFlightRadar } from './hooks/useFlightRadar';
import { SelectionProvider } from './stores/SelectionContext';
import { LockProvider } from './stores/LockContext';
import { MaritimeBoundariesProvider } from './stores/MaritimeBoundariesContext';
import { EventsProvider } from './stores/EventsContext';
import { DrawingToolsProvider } from './stores/DrawingToolsContext';
// Importar utils para exponer en window
import './utils/loadGADMBoundaries';
import './utils/loadTerrestrialBoundaries';

// 📸 Token secreto para modo screenshot (cambiar en producción)
const SCREENSHOT_TOKEN = import.meta.env.VITE_SCREENSHOT_TOKEN || 'sae-screenshot-secret-2025';

function App() {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  
  // 📸 Detectar modo screenshot desde URL
  const screenshotMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('screenshot_token');
    const hasScreenshotFlag = params.get('screenshot') === 'true';
    const mode = params.get('mode') || 'entry'; // 'entry', 'exit', 'situation'
    
    // Validar token secreto para acceso sin login
    if (hasScreenshotFlag && token === SCREENSHOT_TOKEN) {
      console.log(`📸 Modo Screenshot activado: ${mode}`);
      return mode;
    }
    return null;
  }, []);
  
  const isScreenshotMode = screenshotMode !== null;
  
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
  const [preSelectedEntityId, setPreSelectedEntityId] = useState(null); // Entidad pre-seleccionada para filtrar timeline
  const [showSettingsPanel, setShowSettingsPanel] = useState(false); // Estado del panel de configuración
  const { createFromTemplate, creating } = useCreateEntity();

  // ✈️ FlightRadar (DEDUP): una sola instancia para toda la app.
  // Esto evita que `SearchBar` y `MapContainer` creen polling/realtime duplicados.
  const [isFlightRadarEnabled, setIsFlightRadarEnabled] = useState(true);
  const flightRadar = useFlightRadar({
    autoUpdate: true,
    updateInterval: 30000,
    enabled: isFlightRadarEnabled,
    militaryOnly: false,
  });

  // Escuchar eventos para abrir/cerrar panel de configuración
  useEffect(() => {
    const handleSettingsPanelOpen = () => setShowSettingsPanel(true);
    const handleSettingsPanelClose = () => setShowSettingsPanel(false);

    window.addEventListener('settingsPanelOpen', handleSettingsPanelOpen);
    window.addEventListener('settingsPanelClose', handleSettingsPanelClose);

    return () => {
      window.removeEventListener('settingsPanelOpen', handleSettingsPanelOpen);
      window.removeEventListener('settingsPanelClose', handleSettingsPanelClose);
    };
  }, []);

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

  // Handler para ver timeline de una entidad específica
  const handleViewEntityTimeline = (entityId) => {
    setPreSelectedEntityId(entityId);
    setShowEventTimeline(true);
  };

  // 📸 Modo Screenshot - Vista pública sin autenticación
  if (isScreenshotMode) {
    // Modo situación: múltiples aeronaves
    if (screenshotMode === 'situation') {
      return <SituationScreenshotView />;
    }
    // Modo individual: entry/exit
    return <ScreenshotView />;
  }

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
    <EventsProvider>
      <LockProvider>
        <SelectionProvider>
          <DrawingToolsProvider>
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
          onViewTimeline={handleViewEntityTimeline}
          timelineVisible={showEventTimeline}
          onToggleTimeline={() => setShowEventTimeline(!showEventTimeline)}
          calendarVisible={showCalendar}
          onToggleCalendar={() => setShowCalendar(!showCalendar)}
          flightRadar={flightRadar}
          isFlightRadarEnabled={isFlightRadarEnabled}
          setIsFlightRadarEnabled={setIsFlightRadarEnabled}
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

        {/* Botón flotante toggle para herramientas - Siempre visible */}
        {mapInstance && (
          <button
            onClick={() => setShowMeasurementTools(!showMeasurementTools)}
            className={`fixed left-4 w-10 h-10 rounded-lg backdrop-blur-md shadow-xl flex items-center justify-center transition-all hover:scale-110 z-30 group ${
              showMeasurementTools
                ? 'bg-green-500 border-2 border-green-400'
                : 'bg-slate-900/95 hover:bg-slate-800 border-2 border-green-500/50 hover:border-green-500 hover:shadow-green-500/30'
            }`}
            style={{ top: showSearch ? '140px' : '72px' }}
            title={showMeasurementTools ? "Ocultar herramientas (mantiene dibujos)" : "Abrir herramientas de medición"}
          >
            <Shapes className={`w-5 h-5 ${showMeasurementTools ? 'text-white' : 'text-green-400 group-hover:text-green-300'}`} />
          </button>
        )}

        {/* Panel de Herramientas de Medición */}
        {showMeasurementTools && mapInstance && (
          <MeasurementTools 
            map={mapInstance} 
            onClose={() => setShowMeasurementTools(false)}
          />
        )}

        {/* Barra de Búsqueda - Montar SOLO si está visible (evita hooks en background) */}
        {showSearch && (
          <SearchBar map={mapInstance} isVisible={showSearch} flights={flightRadar.flights} />
        )}

        {/* Timeline de Eventos - Sidebar derecho */}
        {showEventTimeline && (
          <EventTimeline 
            isOpen={showEventTimeline}
            onClose={() => {
              setShowEventTimeline(false);
              setPreSelectedEntityId(null); // Limpiar selección al cerrar
            }}
            preSelectedEntityId={preSelectedEntityId}
          />
        )}

        {/* Calendario de Eventos - Vista completa */}
        {showCalendar && (
          <CalendarView
            onClose={() => setShowCalendar(false)}
          />
        )}


        {/* Modal de edición de evento desde calendario - AHORA SE MANEJA DENTRO DE CalendarView */}

        {/* Botón global para añadir evento - Visible en todas las vistas excepto configuración */}
        <GlobalAddEventButton settingsPanelOpen={showSettingsPanel} />

        {/* Indicador de creación */}
        {creating && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Creando entidad...</span>
          </div>
        )}
      </div>
            </MaritimeBoundariesProvider>
          </DrawingToolsProvider>
        </SelectionProvider>
      </LockProvider>
    </EventsProvider>
  );
}

export default App
