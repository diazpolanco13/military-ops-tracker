import { useState, useEffect } from 'react';
import { 
  X, Eye, EyeOff, Archive, RotateCcw, Search, Filter,
  ChevronDown, ChevronUp, Loader2, AlertTriangle, Trash2
} from 'lucide-react';
import { useHiddenEntities } from '../../hooks/useHiddenEntities';
import { useArchivedEntities } from '../../hooks/useArchivedEntities';
import { format } from 'date-fns';

/**
 * 📱 Modal Unificado para Gestión de Entidades
 * Diseñado específicamente para tablets - simple y táctil
 */
export default function EntitiesManagementModal({ type, onClose }) {
  const isHidden = type === 'hidden';
  const isArchived = type === 'archived';
  
  // Hooks según el tipo
  const hiddenData = useHiddenEntities();
  const archivedData = useArchivedEntities();
  
  const {
    entities,
    loading,
    error,
    showEntity,
    showAllEntities,
    archiveEntity,
    deleteEntity,
    count,
    getEntityCountsByType
  } = isHidden ? hiddenData : archivedData;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const filteredEntities = (entities || []).filter(entity => {
    const matchesSearch = searchTerm === '' || 
                          entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (entity.class && entity.class.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || entity.type === selectedType;
    const result = matchesSearch && matchesType;
    
    // Debug temporal
    if (!result) {
      console.log('Entity filtered out:', {
        name: entity.name,
        type: entity.type,
        class: entity.class,
        searchTerm,
        selectedType,
        matchesSearch,
        matchesType
      });
    }
    
    return result;
  });

  const entityTypes = [...new Set((entities || []).map(entity => entity.type))];
  const entityCountsByType = getEntityCountsByType ? getEntityCountsByType() : {};

  // 🔄 Manejar acción individual
  const handleAction = async (action, entityId, entityName) => {
    setActionLoading(entityId);
    
    let result;
    
    if (isHidden) {
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
    } else {
      switch (action) {
        case 'restore':
          result = await archivedData.restoreEntity(entityId);
          break;
        case 'delete':
          result = await archivedData.deleteArchivedEntity(entityId);
          break;
        default:
          setActionLoading(null);
          return;
      }
    }

    if (!result.success) {
      console.error('Error en acción:', result.error);
    }
    
    setActionLoading(null);
  };

  // 🔄 Manejar acción en lote
  const handleBatchAction = async (action) => {
    setActionLoading(action);
    
    let result;
    
    if (isHidden) {
      result = await showAllEntities();
    } else {
      result = await archivedData.restoreAllEntities();
    }
    
    if (!result.success) {
      console.error('Error en acción en lote:', result.error);
    }
    
    setActionLoading(null);
    onClose(); // Cerrar el modal después de la acción en lote
  };

  const getTitle = () => isHidden ? 'Entidades Ocultas' : 'Entidades Archivadas';
  const getIcon = () => isHidden ? EyeOff : Archive;
  const getColor = () => isHidden ? 'text-red-400' : 'text-yellow-400';
  const getBatchActionText = () => isHidden ? 'Mostrar Todas' : 'Restaurar Todas';
  const getBatchActionIcon = () => isHidden ? Eye : RotateCcw;
  const getBatchActionColor = () => isHidden ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700';

  // Validaciones de seguridad
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <div className="flex items-center gap-3 text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Cargando entidades...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <span>Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  const TitleIcon = getIcon();
  const BatchIcon = getBatchActionIcon();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col animate-in zoom-in-90 duration-300">
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <TitleIcon className={`w-7 h-7 ${getColor()}`} />
            <div>
              <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
              <p className="text-sm text-slate-400">{count} entidades</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controles de Búsqueda y Filtro */}
        <div className="p-4 flex gap-3 border-b border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o clase..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 rounded-lg text-white border border-slate-700 focus:border-blue-500 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <select
              className="w-full pl-10 pr-4 py-2 bg-slate-800 rounded-lg text-white border border-slate-700 focus:border-blue-500 focus:ring-blue-500 text-sm appearance-none"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-hidden flex">
          {/* Panel Lateral - Estadísticas y Acción Global */}
          <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-4">
            <h3 className="text-white font-semibold text-sm mb-2">Estadísticas por Tipo</h3>
            {Object.keys(entityCountsByType).length > 0 ? (
              <ul className="text-slate-300 text-sm space-y-1">
                {Object.entries(entityCountsByType).map(([type, count]) => (
                  <li key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}:</span>
                    <span className={`font-medium ${isHidden ? 'text-blue-300' : 'text-yellow-300'}`}>{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-xs">No hay tipos de entidades.</p>
            )}

            <div className="mt-auto pt-4 border-t border-slate-700">
              <button
                onClick={() => handleBatchAction('batch')}
                disabled={count === 0 || actionLoading === 'batch'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${count === 0 || actionLoading === 'batch'
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : `${getBatchActionColor()} text-white shadow-lg`
                  }`}
              >
                {actionLoading === 'batch' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BatchIcon className="w-4 h-4" />
                )}
                {getBatchActionText()} ({count})
              </button>
            </div>
          </div>

          {/* Lista de Entidades */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-blue-400">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                Cargando entidades...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-400">
                <AlertTriangle className="w-10 h-10 mb-3" />
                <p className="text-lg font-semibold">Error al cargar entidades</p>
                <p className="text-sm text-slate-400">{error}</p>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <TitleIcon className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold">No hay entidades</h3>
                <p className="text-sm text-slate-400 mt-2">Las entidades aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredEntities.map((entity) => (
                  <div key={entity.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={entity.image_url || `/placeholders/${entity.type || 'default'}.png`} 
                          alt={entity.name} 
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <div>
                          <h4 className="text-base font-semibold text-white">{entity.name}</h4>
                          <p className="text-xs text-slate-400">
                            <span className="capitalize">{entity.type}</span> • {entity.class} • {entity.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setExpandedEntity(expandedEntity === entity.id ? null : entity.id)}
                          className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Ver detalles"
                        >
                          {expandedEntity === entity.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button 
                          onClick={() => handleAction(isHidden ? 'show' : 'restore', entity.id, entity.name)}
                          disabled={actionLoading === entity.id}
                          className={`p-1 rounded-full ${isHidden ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isHidden ? "Mostrar en mapa" : "Restaurar entidad"}
                        >
                          {actionLoading === entity.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (isHidden ? <Eye size={18} /> : <RotateCcw size={18} />)}
                        </button>
                      </div>
                    </div>
                    {expandedEntity === entity.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-300">
                        <p><strong>ID:</strong> {entity.id}</p>
                        <p><strong>Creado:</strong> {format(new Date(entity.created_at), 'dd/MM/yyyy HH:mm')}</p>
                        {isArchived && entity.archived_at && <p><strong>Archivado:</strong> {format(new Date(entity.archived_at), 'dd/MM/yyyy HH:mm')}</p>}
                        {entity.last_seen_at && <p><strong>Última vez visto:</strong> {format(new Date(entity.last_seen_at), 'dd/MM/yyyy HH:mm')}</p>}
                        {entity.metadata && (
                          <div className="mt-2">
                            <strong>Metadatos:</strong>
                            <pre className="bg-slate-700 p-2 rounded-md text-xs overflow-x-auto mt-1">{JSON.stringify(entity.metadata, null, 2)}</pre>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => handleAction(isHidden ? 'archive' : 'delete', entity.id, entity.name)}
                            disabled={actionLoading === entity.id}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-1 rounded-md ${isHidden ? 'bg-yellow-700 hover:bg-yellow-800' : 'bg-red-700 hover:bg-red-800'} text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {actionLoading === entity.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isHidden ? <Archive size={14} /> : <Trash2 size={14} />)}
                            {isHidden ? 'Archivar' : 'Eliminar permanentemente'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Mostrando {filteredEntities.length} de {count} entidades</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {isHidden ? <Eye className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                <span>{isHidden ? 'Mostrar' : 'Restaurar'}</span>
              </div>
              <div className="flex items-center gap-1">
                {isHidden ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                <span>{isHidden ? 'Archivar' : 'Eliminar'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
