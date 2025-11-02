import { useState, useEffect } from 'react';
import { X, Plus, Calendar, Link as LinkIcon, Image as ImageIcon, MessageSquare, Filter, Search, Clock, MapPin, ExternalLink, Ship } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import EventCard from './EventCard';
import AddEventModal from './AddEventModal';
import { supabase } from '../../lib/supabase';

/**
 * Timeline de Eventos - Sidebar Derecho
 * Registro cronológico de eventos con multimedia
 */
export default function EventTimeline({ isOpen, onClose }) {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, evento, noticia, informe
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Estados para filtro por entidades (multi-selección)
  const [selectedFilterEntities, setSelectedFilterEntities] = useState([]);
  const [entitySearchTerm, setEntitySearchTerm] = useState('');
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [entitiesWithEvents, setEntitiesWithEvents] = useState([]);
  
  // Cargar entidades que tienen eventos asociados
  useEffect(() => {
    loadEntitiesWithEvents();
  }, [events]);

  const loadEntitiesWithEvents = async () => {
    try {
      // Obtener todas las entidades únicas que tienen eventos
      const { data: entityRelations, error: relError } = await supabase
        .from('event_entities')
        .select('entity_id, entities:entity_id(id, name, type)');

      if (relError) throw relError;

      // Filtrar y obtener entidades únicas
      const uniqueEntities = [];
      const seenIds = new Set();
      
      entityRelations?.forEach(rel => {
        if (rel.entities && !seenIds.has(rel.entities.id)) {
          seenIds.add(rel.entities.id);
          uniqueEntities.push(rel.entities);
        }
      });

      // Ordenar por nombre
      uniqueEntities.sort((a, b) => a.name.localeCompare(b.name));
      setEntitiesWithEvents(uniqueEntities);
    } catch (error) {
      console.error('Error cargando entidades:', error);
    }
  };

  // Filtrar entidades según búsqueda
  const filteredEntitiesForSearch = entitiesWithEvents.filter(entity =>
    entity.name.toLowerCase().includes(entitySearchTerm.toLowerCase())
  );

  // Función para verificar si un evento contiene TODAS las entidades seleccionadas
  const eventMatchesEntities = async (eventId, selectedEntityIds) => {
    if (selectedEntityIds.length === 0) return true;

    try {
      const { data, error } = await supabase
        .from('event_entities')
        .select('entity_id')
        .eq('event_id', eventId);

      if (error) throw error;

      const eventEntityIds = data?.map(rel => rel.entity_id) || [];
      
      // Verificar que el evento tenga TODAS las entidades seleccionadas
      return selectedEntityIds.every(entityId => eventEntityIds.includes(entityId));
    } catch (error) {
      console.error('Error verificando entidades del evento:', error);
      return false;
    }
  };

  // Filtrar y ordenar eventos por fecha (más reciente primero)
  const [filteredEventsList, setFilteredEventsList] = useState([]);

  useEffect(() => {
    const filterEvents = async () => {
      // Aplicar filtros básicos primero
      let filtered = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || event.type === filterType;
        return matchesSearch && matchesType;
      });

      // Si hay entidades seleccionadas, filtrar por ellas
      if (selectedFilterEntities.length > 0) {
        const selectedEntityIds = selectedFilterEntities.map(e => e.id);
        const matchingEvents = [];

        for (const event of filtered) {
          const matches = await eventMatchesEntities(event.id, selectedEntityIds);
          if (matches) {
            matchingEvents.push(event);
          }
        }

        filtered = matchingEvents;
      }

      // Ordenar por fecha
      filtered.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      setFilteredEventsList(filtered);
    };

    filterEvents();
  }, [events, searchTerm, filterType, selectedFilterEntities]);

  const filteredEvents = filteredEventsList;

  // Agrupar eventos por fecha
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.event_date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowAddModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (confirm('¿Eliminar este evento?')) {
      await deleteEvent(eventId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar derecho - Responsive */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[450px] md:w-[500px] lg:w-[550px] bg-slate-900 border-l border-slate-700 shadow-2xl z-[40] flex flex-col" style={{ paddingTop: '56px' }}>
        {/* Header */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">Timeline de Eventos</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Entidades (Multi-selección) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Ship size={12} />
              Filtrar por Entidades
            </label>

            {/* Entidades seleccionadas */}
            {selectedFilterEntities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                {selectedFilterEntities.map(entity => (
                  <div
                    key={entity.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-blue-900/30 border border-blue-500/50 rounded text-xs"
                  >
                    <span className="text-blue-300 font-medium">{entity.name}</span>
                    <button
                      onClick={() => setSelectedFilterEntities(prev => prev.filter(e => e.id !== entity.id))}
                      className="hover:bg-red-600/20 rounded transition-colors"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Buscador de entidades */}
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={entitySearchTerm}
                  onChange={(e) => setEntitySearchTerm(e.target.value)}
                  onFocus={() => setShowEntityDropdown(true)}
                  placeholder="Buscar entidades para filtrar..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dropdown de resultados */}
              {showEntityDropdown && entitySearchTerm && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                  {filteredEntitiesForSearch.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      No se encontraron entidades
                    </div>
                  ) : (
                    filteredEntitiesForSearch.map(entity => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => {
                          if (!selectedFilterEntities.find(e => e.id === entity.id)) {
                            setSelectedFilterEntities(prev => [...prev, entity]);
                          }
                          setEntitySearchTerm('');
                          setShowEntityDropdown(false);
                        }}
                        disabled={selectedFilterEntities.find(e => e.id === entity.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors text-left border-b border-slate-700 last:border-0 disabled:opacity-50"
                      >
                        <Ship size={14} className="text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">
                            {entity.name}
                          </div>
                        </div>
                        {selectedFilterEntities.find(e => e.id === entity.id) ? (
                          <span className="text-xs text-green-400">✓ Agregada</span>
                        ) : (
                          <Plus size={14} className="text-blue-400" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedFilterEntities.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">
                💡 Mostrando eventos que incluyen {selectedFilterEntities.length === 1 ? 'esta entidad' : `estas ${selectedFilterEntities.length} entidades`}
              </p>
            )}
          </div>

          {/* Filtros */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 sm:px-3 py-1 rounded text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('evento')}
              className={`px-2.5 sm:px-3 py-1 rounded text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === 'evento' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🎯 Eventos
            </button>
            <button
              onClick={() => setFilterType('noticia')}
              className={`px-2.5 sm:px-3 py-1 rounded text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === 'noticia' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📰 Noticias
            </button>
            <button
              onClick={() => setFilterType('informe')}
              className={`px-2.5 sm:px-3 py-1 rounded text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === 'informe' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📄 Informes
            </button>
          </div>
        </div>

        {/* Timeline vertical */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 no-scrollbar">
          {loading && (
            <div className="text-center text-slate-400 py-6 sm:py-8">
              <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs sm:text-sm">Cargando eventos...</p>
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
            <div className="text-center text-slate-400 py-8 sm:py-12">
              <Clock size={40} className="sm:w-12 sm:h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-xs sm:text-sm font-semibold mb-1">Sin eventos</p>
              <p className="text-[10px] sm:text-xs text-slate-500 px-4">
                {searchTerm || filterType !== 'all' 
                  ? 'No se encontraron eventos con estos filtros'
                  : 'Agrega tu primer evento al timeline'}
              </p>
            </div>
          )}

          {!loading && Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              {/* Fecha del grupo */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="h-px flex-1 bg-slate-700"></div>
                <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-800 border border-slate-700 rounded-full">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-300">{date}</span>
                </div>
                <div className="h-px flex-1 bg-slate-700"></div>
              </div>

              {/* Eventos del día */}
              <div className="space-y-2 sm:space-y-3 relative pl-4 sm:pl-6">
                {/* Línea vertical del timeline */}
                <div className="absolute left-1.5 sm:left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-slate-700 to-transparent"></div>

                {dayEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    isLast={index === dayEvents.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Botón agregar evento */}
        <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={handleAddEvent}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Agregar Evento</span>
          </button>
        </div>
      </div>

      {/* Modal agregar/editar evento */}
      {showAddModal && (
        <AddEventModal
          event={selectedEvent}
          onClose={() => setShowAddModal(false)}
          onCreate={createEvent}
          onUpdate={updateEvent}
        />
      )}
    </>
  );
}

