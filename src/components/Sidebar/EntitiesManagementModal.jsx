import { useState, useEffect } from 'react';
import { 
  X, Eye, EyeOff, Archive, RotateCcw, Search, Filter,
  ChevronDown, ChevronUp, Loader2, AlertTriangle, Trash2, Ship
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
    hiddenEntities,
    loading: hiddenLoading,
    error: hiddenError,
    showEntity,
    showAllEntities,
    archiveEntity,
    deleteEntity,
    count: hiddenCount,
    getEntityCountsByType: hiddenGetEntityCountsByType
  } = hiddenData;

  const {
    archivedEntities,
    loading: archivedLoading,
    error: archivedError,
    restoreEntity,
    restoreAllEntities,
    deleteArchivedEntity,
    count: archivedCount,
    getEntityCountsByType: archivedGetEntityCountsByType
  } = archivedData;

  // Seleccionar datos según el tipo
  const entities = isHidden ? hiddenEntities : archivedEntities;
  const loading = isHidden ? hiddenLoading : archivedLoading;
  const error = isHidden ? hiddenError : archivedError;
  const count = isHidden ? hiddenCount : archivedCount;
  const getEntityCountsByType = isHidden ? hiddenGetEntityCountsByType : archivedGetEntityCountsByType;

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
      result = await restoreAllEntities();
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
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col animate-in zoom-in-90 duration-300">
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <TitleIcon className={`w-6 h-6 ${getColor()}`} />
            <div>
              <h2 className="text-lg font-bold text-white">{getTitle()}</h2>
              <p className="text-xs text-slate-400">{count} entidades</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controles de Búsqueda y Filtro */}
        <div className="p-3 flex gap-2 border-b border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 rounded text-white border border-slate-700 focus:border-blue-500 focus:ring-blue-500 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 rounded text-white border border-slate-700 focus:border-blue-500 focus:ring-blue-500 text-xs appearance-none"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Botón de Acción Masiva */}
        {count > 0 && (
          <div className="px-3 py-2 border-b border-slate-800">
            <button
              onClick={() => handleBatchAction('batch')}
              disabled={count === 0 || actionLoading === 'batch'}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                ${count === 0 || actionLoading === 'batch'
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : `${getBatchActionColor()} text-white shadow-lg`
                }`}
            >
              {actionLoading === 'batch' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BatchIcon className="w-3 h-3" />
              )}
              {getBatchActionText()} ({count})
            </button>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Lista de Entidades */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-blue-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-red-400">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="text-sm font-semibold">Error al cargar entidades</p>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <TitleIcon className="w-10 h-10 mb-3" />
                <h3 className="text-sm font-semibold">No hay entidades {isHidden ? 'ocultas' : 'archivadas'}</h3>
                <p className="text-xs text-slate-400 mt-1">Las entidades aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredEntities.map((entity) => (
                  <div key={entity.id} className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <EntityImage entity={entity} />
                        <div>
                          <h4 className="text-sm font-semibold text-white">{entity.name}</h4>
                          <p className="text-xs text-slate-400">
                            <span className="capitalize">{entity.type}</span> • {entity.class}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setExpandedEntity(expandedEntity === entity.id ? null : entity.id)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Ver detalles"
                        >
                          {expandedEntity === entity.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button 
                          onClick={() => handleAction(isHidden ? 'show' : 'restore', entity.id, entity.name)}
                          disabled={actionLoading === entity.id}
                          className={`p-1.5 rounded ${isHidden ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isHidden ? "Mostrar en mapa" : "Restaurar entidad"}
                        >
                          {actionLoading === entity.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (isHidden ? <Eye size={16} /> : <RotateCcw size={16} />)}
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
        {count > 0 && (
          <div className="px-3 py-2 border-t border-slate-700 bg-slate-800/30">
            <div className="text-xs text-slate-400 text-center">
              Mostrando {filteredEntities.length} de {count} entidades
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 🖼️ Componente de Imagen de Entidad con Fallback
 */
function EntityImage({ entity }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Resetear estado cuando cambie la entidad
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [entity.id]);

  if (!entity.image_url || imageError) {
    // Mostrar icono placeholder si no hay imagen o falló la carga
    return (
      <div className="w-10 h-10 bg-slate-700 rounded-md flex items-center justify-center">
        <Ship className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-700 rounded-md flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
      )}
      <img 
        src={entity.image_url} 
        alt={entity.name}
        className="w-10 h-10 object-cover rounded-md"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
    </div>
  );
}
