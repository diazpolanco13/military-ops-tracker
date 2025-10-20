import { useState, useEffect } from 'react';
import { X, Users, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useEntityGroups } from '../../hooks/useEntityGroups';
import { useEntities } from '../../hooks/useEntities';
import CreateGroupModal from './CreateGroupModal';

/**
 * 🎯 Panel de Gestión de Grupos de Entidades
 * Sistema híbrido: sugerencias automáticas + control manual
 */
export default function GroupManagementPanel({ onClose }) {
  const { groups, createGroup, addEntitiesToGroup, suggestGroups } = useEntityGroups();
  const { entities } = useEntities();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Generar sugerencias al cargar
  useEffect(() => {
    if (entities && entities.length > 0) {
      const suggested = suggestGroups(entities);
      setSuggestions(suggested);
    }
  }, [entities, suggestGroups]);

  // Crear grupo desde sugerencia
  const handleAcceptSuggestion = async (suggestion) => {
    const groupData = {
      name: suggestion.name,
      description: `Grupo automático de ${suggestion.count} ${suggestion.class}`,
      group_type: 'squadron',
      icon_color: '#3b82f6'
    };

    const result = await createGroup(groupData);
    
    if (result.success) {
      const entityIds = suggestion.entities.map(e => e.id);
      await addEntitiesToGroup(result.data.id, entityIds);
      
      // Remover sugerencia aceptada
      setSuggestions(prev => prev.filter(s => s !== suggestion));
    }
  };

  // Crear grupo manual
  const handleCreateManualGroup = async (groupData, entityIds) => {
    const result = await createGroup(groupData);
    
    if (result.success) {
      await addEntitiesToGroup(result.data.id, entityIds);
    }
    
    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-lg shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Gestión de Grupos</h2>
              <p className="text-xs text-slate-400">Escuadrones, formaciones y flotas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          
          {/* Sugerencias Automáticas */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  SUGERENCIAS AUTOMÁTICAS ({suggestions.length})
                </h3>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Ocultar
                </button>
              </div>
              
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{suggestion.name}</span>
                          <span className="px-2 py-0.5 bg-blue-600/30 text-blue-400 rounded text-xs font-bold">
                            {suggestion.count} unidades
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {suggestion.entities.map(e => e.name).join(', ')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          📍 Centro: {suggestion.centerLat.toFixed(2)}°, {suggestion.centerLng.toFixed(2)}°
                        </p>
                      </div>
                      <button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        className="ml-3 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Crear Grupo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grupos Existentes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">GRUPOS CREADOS ({groups.length})</h3>
            
            {groups.length === 0 ? (
              <div className="bg-slate-800/30 rounded-lg p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-slate-400">No hay grupos creados</p>
                <p className="text-xs text-slate-500 mt-1">Acepta una sugerencia o crea uno manualmente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">{group.name}</h4>
                        <p className="text-xs text-slate-400">{group.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{group.count} miembros</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          {suggestions.length === 0 && groups.length === 0 && (
            <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">No hay sugerencias automáticas</p>
                  <p className="text-xs text-yellow-300/80">
                    Las sugerencias aparecen cuando hay 3+ entidades del mismo tipo y clase cerca (radio ~55km).
                    Por ejemplo: 10x F-35B en Roosevelt Roads se sugieren como "F-35B Squadron".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Grupo Manual
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de creación manual */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreateGroup={handleCreateManualGroup}
          entities={entities}
        />
      )}
    </div>
  );
}

