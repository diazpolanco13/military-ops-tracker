import { useState, useEffect } from 'react';
import { Search, X, Plus, Ship, Plane, Users, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Selector de entidades para asociar a eventos
 * Permite buscar y vincular entidades del mapa con eventos del timeline
 */
export default function EntitySelector({ selectedEntities = [], onEntitiesChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entities, setEntities] = useState([]);
  const [filteredEntities, setFilteredEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cargar todas las entidades al montar
  useEffect(() => {
    loadEntities();
  }, []);

  // Filtrar entidades según búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      console.log('Buscando:', searchTerm, 'en', entities.length, 'entidades');
      const filtered = entities.filter(entity => 
        entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('Resultados filtrados:', filtered.length);
      setFilteredEntities(filtered);
      setShowDropdown(true);
    } else {
      setFilteredEntities([]);
      setShowDropdown(false);
    }
  }, [searchTerm, entities]);

  const loadEntities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('id, name, class, type')
        .order('name');

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Entidades cargadas:', data?.length || 0);
      setEntities(data || []);
    } catch (error) {
      console.error('Error cargando entidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntity = (entity) => {
    // Evitar duplicados
    if (!selectedEntities.find(e => e.id === entity.id)) {
      onEntitiesChange([...selectedEntities, entity]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemoveEntity = (entityId) => {
    onEntitiesChange(selectedEntities.filter(e => e.id !== entityId));
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'destructor':
      case 'fragata':
      case 'portaaviones':
      case 'submarino':
        return <Ship size={14} className="text-blue-400" />;
      case 'avion':
      case 'caza':
      case 'helicoptero':
      case 'drone':
        return <Plane size={14} className="text-cyan-400" />;
      case 'tropas':
      case 'insurgente':
        return <Users size={14} className="text-green-400" />;
      case 'vehiculo':
      case 'tanque':
        return <Truck size={14} className="text-orange-400" />;
      default:
        return <Ship size={14} className="text-slate-400" />;
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      destructor: 'Destructor',
      fragata: 'Fragata',
      portaaviones: 'Portaaviones',
      submarino: 'Submarino',
      avion: 'Avión',
      caza: 'Caza',
      helicoptero: 'Helicóptero',
      drone: 'Drone',
      tropas: 'Tropas',
      insurgente: 'Insurgente',
      vehiculo: 'Vehículo',
      tanque: 'Tanque'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        <Ship size={14} className="inline mr-1" />
        Entidades Relacionadas
      </label>

      {/* Entidades seleccionadas */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
          {selectedEntities.map(entity => (
            <div
              key={entity.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-500/50 rounded-lg text-sm"
            >
              {getEntityIcon(entity.type)}
              <span className="text-white font-medium">{entity.name}</span>
              <span className="text-blue-300 text-xs">({getEntityTypeLabel(entity.type)})</span>
              <button
                type="button"
                onClick={() => handleRemoveEntity(entity.id)}
                className="ml-1 p-0.5 hover:bg-red-600/20 rounded transition-colors"
              >
                <X size={14} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            placeholder="Buscar entidad por nombre, código o tipo..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
            {loading && (
              <div className="p-4 text-center text-slate-400 text-sm">
                Cargando entidades...
              </div>
            )}

            {!loading && filteredEntities.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-sm">
                No se encontraron entidades
              </div>
            )}

            {!loading && filteredEntities.map(entity => (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleSelectEntity(entity)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left border-b border-slate-700 last:border-0"
                disabled={selectedEntities.find(e => e.id === entity.id)}
              >
                {getEntityIcon(entity.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {entity.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getEntityTypeLabel(entity.type)} {entity.class && `• ${entity.class}`}
                  </div>
                </div>
                {selectedEntities.find(e => e.id === entity.id) ? (
                  <span className="text-xs text-green-400">✓ Agregada</span>
                ) : (
                  <Plus size={16} className="text-blue-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        💡 Busca y asocia entidades del mapa relacionadas con este evento. Luego podrás filtrar el timeline por entidad.
      </p>
    </div>
  );
}

