import { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Archive, 
  Trash2, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Ship,
  Plane,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useHiddenEntities } from '../../hooks/useHiddenEntities';

/**
 * 🫥 Panel de Entidades Ocultas
 * Muestra lista de entidades ocultas con opciones de gestión
 */
export default function HiddenEntitiesPanel({ onClose }) {
  const { 
    hiddenEntities, 
    loading, 
    error, 
    showEntity, 
    showAllEntities, 
    archiveEntity, 
    deleteEntity,
    count 
  } = useHiddenEntities();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // 🔍 Filtrar entidades
  const filteredEntities = hiddenEntities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.class?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || entity.type === selectedType;
    return matchesSearch && matchesType;
  });

  // 🎨 Obtener icono según tipo
  const getEntityIcon = (type) => {
    const icons = {
      destructor: Ship,
      fragata: Ship,
      avion: Plane,
      tropas: Users,
      tanque: Shield,
      submarino: Ship,
    };
    return icons[type] || Ship;
  };

  // 🎨 Obtener color según tipo
  const getEntityColor = (type) => {
    const colors = {
      destructor: 'text-blue-400',
      fragata: 'text-cyan-400',
      avion: 'text-gray-400',
      tropas: 'text-green-400',
      tanque: 'text-orange-400',
      submarino: 'text-purple-400',
    };
    return colors[type] || 'text-white';
  };

  // 🎨 Obtener color de estado
  const getStatusColor = (status) => {
    const colors = {
      activo: 'text-green-400',
      patrullando: 'text-blue-400',
      estacionado: 'text-yellow-400',
      en_transito: 'text-purple-400',
      en_vuelo: 'text-cyan-400',
      vigilancia: 'text-orange-400',
    };
    return colors[status] || 'text-gray-400';
  };

  // 🔄 Manejar acción individual
  const handleAction = async (action, entityId, entityName) => {
    setActionLoading(entityId);
    
    let result;
    let confirmMessage = '';
    
    switch (action) {
      case 'show':
        result = await showEntity(entityId);
        break;
      case 'archive':
        result = await archiveEntity(entityId);
        break;
      case 'delete':
        result = await deleteEntity(entityId);
        break;
      default:
        setActionLoading(null);
        return;
    }

    if (!result.success) {
      console.error('Error en acción:', result.error);
    }
    
    setActionLoading(null);
  };

  // 🔄 Manejar mostrar todas
  const handleShowAll = async () => {
    setActionLoading('show-all');
    const result = await showAllEntities();
    
    if (!result.success) {
      console.error('Error al mostrar todas las entidades:', result.error);
    }
    
    setActionLoading(null);
  };

  // 📊 Obtener estadísticas por tipo
  const getTypeStats = () => {
    const stats = {};
    hiddenEntities.forEach(entity => {
      stats[entity.type] = (stats[entity.type] || 0) + 1;
    });
    return stats;
  };

  const typeStats = getTypeStats();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 flex items-center gap-3">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-white">Cargando entidades ocultas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-white font-semibold">Error</span>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <EyeOff className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-white font-semibold text-lg">Entidades Ocultas</h2>
              <p className="text-slate-400 text-sm">
                {count} entidad{count !== 1 ? 'es' : ''} oculta{count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controles */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex gap-3 mb-3">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o clase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filtro por tipo */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="destructor">Destructores</option>
              <option value="fragata">Fragatas</option>
              <option value="avion">Aviones</option>
              <option value="tropas">Tropas</option>
              <option value="tanque">Tanques</option>
              <option value="submarino">Submarinos</option>
            </select>
          </div>

          {/* Estadísticas y acciones */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-slate-400">
              {Object.entries(typeStats).map(([type, count]) => (
                <span key={type} className="flex items-center gap-1">
                  <span className="capitalize">{type}:</span>
                  <span className="text-white font-medium">{count}</span>
                </span>
              ))}
            </div>

            {/* Botón mostrar todas */}
            {count > 0 && (
              <button
                onClick={handleShowAll}
                disabled={actionLoading === 'show-all'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {actionLoading === 'show-all' ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Mostrar Todas ({count})
              </button>
            )}
          </div>
        </div>

        {/* Lista de entidades */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredEntities.length === 0 ? (
            <div className="text-center py-8">
              <EyeOff className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-400 text-lg font-medium mb-2">
                {searchTerm || selectedType !== 'all' 
                  ? 'No se encontraron entidades' 
                  : 'No hay entidades ocultas'
                }
              </h3>
              <p className="text-slate-500 text-sm">
                {searchTerm || selectedType !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Las entidades ocultas aparecerán aquí'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntities.map((entity) => {
                const EntityIcon = getEntityIcon(entity.type);
                const isExpanded = expandedEntity === entity.id;
                const isLoading = actionLoading === entity.id;

                return (
                  <div
                    key={entity.id}
                    className="bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    {/* Entidad principal */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center`}>
                            <EntityIcon className={`w-5 h-5 ${getEntityColor(entity.type)}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{entity.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              <span className="capitalize">{entity.type}</span>
                              {entity.class && (
                                <>
                                  <span>•</span>
                                  <span>{entity.class}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className={`${getStatusColor(entity.status)}`}>
                                {entity.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Botón expandir */}
                          <button
                            onClick={() => setExpandedEntity(isExpanded ? null : entity.id)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {/* Acciones */}
                          <div className="flex items-center gap-1">
                            {/* Mostrar */}
                            <button
                              onClick={() => handleAction('show', entity.id, entity.name)}
                              disabled={isLoading}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Mostrar en mapa"
                            >
                              {isLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>

                            {/* Archivar */}
                            <button
                              onClick={() => handleAction('archive', entity.id, entity.name)}
                              disabled={isLoading}
                              className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Archivar"
                            >
                              <Archive className="w-4 h-4" />
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => handleAction('delete', entity.id, entity.name)}
                              disabled={isLoading}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detalles expandidos */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-600">
                        <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">ID:</span>
                            <span className="text-white ml-2 font-mono text-xs">{entity.id}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Creado:</span>
                            <span className="text-white ml-2">
                              {new Date(entity.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {entity.displacement_tons && (
                            <div>
                              <span className="text-slate-400">Desplazamiento:</span>
                              <span className="text-white ml-2">{entity.displacement_tons} toneladas</span>
                            </div>
                          )}
                          {entity.crew_count && (
                            <div>
                              <span className="text-slate-400">Tripulación:</span>
                              <span className="text-white ml-2">{entity.crew_count} miembros</span>
                            </div>
                          )}
                          {entity.country_origin && (
                            <div>
                              <span className="text-slate-400">País:</span>
                              <span className="text-white ml-2">{entity.country_origin}</span>
                            </div>
                          )}
                          {entity.manufacturer && (
                            <div>
                              <span className="text-slate-400">Fabricante:</span>
                              <span className="text-white ml-2">{entity.manufacturer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Mostrando {filteredEntities.length} de {count} entidades
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Mostrar
              </span>
              <span className="flex items-center gap-1">
                <Archive className="w-4 h-4" />
                Archivar
              </span>
              <span className="flex items-center gap-1">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
