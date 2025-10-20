import { X, Users, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSelection } from '../../stores/SelectionContext';

/**
 * 🎯 Modal para Crear Grupo Manual
 * Permite agrupar entidades seleccionadas manualmente
 */
export default function CreateGroupModal({ onClose, onCreateGroup, entities }) {
  const { getSelectedIds, getSelectedCount } = useSelection();
  const selectedIds = getSelectedIds();
  const selectedCount = getSelectedCount();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState('squadron');

  const selectedEntities = entities.filter(e => selectedIds.includes(e.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Por favor ingresa un nombre para el grupo');
      return;
    }

    if (selectedCount === 0) {
      alert('Selecciona al menos 1 entidad en el mapa (Ctrl+Click)');
      return;
    }

    await onCreateGroup({
      name: groupName,
      description: groupDescription,
      group_type: groupType,
      icon_color: '#3b82f6'
    }, selectedIds);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Crear Grupo Manual</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Task Force Alpha, Strike Group 1..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Describe la misión u objetivo del grupo..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Tipo de grupo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de Grupo
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="squadron">Escuadrón</option>
              <option value="fleet">Flota</option>
              <option value="formation">Formación</option>
              <option value="task_force">Fuerza de Tarea</option>
            </select>
          </div>

          {/* Entidades seleccionadas */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              ENTIDADES SELECCIONADAS ({selectedCount})
            </h3>
            
            {selectedCount === 0 ? (
              <p className="text-xs text-slate-500">
                Usa Ctrl+Click en el mapa para seleccionar entidades
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {selectedEntities.map(entity => (
                  <div key={entity.id} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {entity.name} ({entity.class})
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedCount === 0 || !groupName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Crear Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

