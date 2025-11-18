import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import { useEventsContext } from '../../stores/EventsContext';
import AddEventModal from '../Timeline/AddEventModal';

/**
 * Botón flotante global para crear eventos
 * Visible en todas las vistas excepto cuando el panel de configuración está abierto
 * USA CONTEXTO GLOBAL: Todos los componentes ven el evento creado inmediatamente
 * Se oculta en móvil cuando hay un modal de detalles abierto
 */
export default function GlobalAddEventButton({ settingsPanelOpen = false }) {
  const { canCreateEvents } = useUserRole();
  const { createEvent } = useEventsContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Escuchar eventos de apertura/cierre del modal de detalles
  useEffect(() => {
    const handleModalOpen = () => setDetailsModalOpen(true);
    const handleModalClose = () => setDetailsModalOpen(false);

    window.addEventListener('detailsModalOpen', handleModalOpen);
    window.addEventListener('detailsModalClose', handleModalClose);

    return () => {
      window.removeEventListener('detailsModalOpen', handleModalOpen);
      window.removeEventListener('detailsModalClose', handleModalClose);
    };
  }, []);

  // No mostrar si no tiene permiso o si el panel de configuración está abierto
  if (!canCreateEvents() || settingsPanelOpen) {
    return null;
  }

  return (
    <>
      {/* Botón flotante - Esquina inferior izquierda - Se oculta en móvil cuando hay modal de detalles */}
      <button
        onClick={() => setShowCreateModal(true)}
        className={`fixed bottom-8 left-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-[60] border-2 border-blue-400 ${
          detailsModalOpen ? 'sm:flex hidden' : 'flex'
        }`}
        title="Crear nuevo evento"
        aria-label="Crear nuevo evento"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Modal de creación de evento */}
      {showCreateModal && (
        <AddEventModal
          event={null}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (_, data) => {
            const result = await createEvent(_, data);
            if (result.success) {
              setShowCreateModal(false);
            }
            return result;
          }}
          onUpdate={() => {}}
        />
      )}
    </>
  );
}

