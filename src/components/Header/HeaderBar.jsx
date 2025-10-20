import { useState } from 'react';
import { Eye, EyeOff, Archive, Trash2, X, ChevronDown } from 'lucide-react';
import { useSelection } from '../../stores/SelectionContext';
import { useEntityActions } from '../../hooks/useEntityActions';

/**
 * Header superior estilo IBM i2 Analyst's Notebook
 * Muestra contador de selección y menú de acciones
 */
export default function HeaderBar({ paletteVisible }) {
  const { getSelectedCount, getSelectedIds, clearSelection } = useSelection();
  const { toggleVisibility, archiveEntity, deleteEntity } = useEntityActions();
  const [showMenu, setShowMenu] = useState(false);

  const selectedCount = getSelectedCount();
  const selectedIds = getSelectedIds();

  // Acciones en lote
  const handleHideSelected = async () => {
    for (const id of selectedIds) {
      await toggleVisibility(id, true); // true = actualmente visible
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(id);
      }
    }
    clearSelection();
    setShowMenu(false);
  };

  const handleArchiveSelected = async () => {
    for (const id of selectedIds) {
      await archiveEntity(id);
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(id);
      }
    }
    clearSelection();
    setShowMenu(false);
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await deleteEntity(id);
      if (window.removeEntityDirectly) {
        window.removeEntityDirectly(id);
      }
    }
    clearSelection();
    setShowMenu(false);
  };

  // Si no hay selección, no mostrar nada
  if (selectedCount === 0) return null;

  const leftOffset = paletteVisible ? '320px' : '0px'; // Ajustar según paleta (sin NavigationBar lateral)

  return (
    <div 
      className="fixed right-0 z-[60] bg-gradient-to-r from-yellow-900/20 via-slate-900/95 to-slate-900/95 backdrop-blur-md border-b-2 border-yellow-500/30 shadow-xl transition-all duration-300"
      style={{ 
        left: leftOffset,
        top: '56px' // Después de TopNavbar
      }}
    >
      <div className="flex items-center justify-between px-6 py-2.5">
        {/* Contador de selección */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
            <span className="text-yellow-100 font-bold text-sm">
              {selectedCount}
            </span>
            <span className="text-yellow-200/80 text-xs">
              {selectedCount === 1 ? 'seleccionada' : 'seleccionadas'}
            </span>
          </div>

          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all text-sm font-medium border border-slate-600 hover:border-yellow-500/50 shadow-lg"
            >
              <span>Acciones en Lote</span>
              <ChevronDown size={16} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown de acciones */}
            {showMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800/98 backdrop-blur-md border border-yellow-500/20 rounded-lg shadow-2xl overflow-hidden">
                <div className="p-2 border-b border-slate-700">
                  <p className="text-xs text-slate-400 px-2">
                    Aplicar a {selectedCount} entidad{selectedCount !== 1 ? 'es' : ''}
                  </p>
                </div>

                <button
                  onClick={handleHideSelected}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/70 text-slate-200 hover:text-white transition-all text-sm group"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-slate-700 group-hover:bg-slate-600 rounded-lg transition-colors">
                    <EyeOff size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Ocultar del Mapa</div>
                    <div className="text-xs text-slate-400">Permanecen en base de datos</div>
                  </div>
                </button>

                <button
                  onClick={handleArchiveSelected}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-900/20 text-slate-200 hover:text-yellow-200 transition-all text-sm border-t border-slate-700 group"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-yellow-900/30 group-hover:bg-yellow-900/50 rounded-lg transition-colors">
                    <Archive size={16} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Archivar</div>
                    <div className="text-xs text-slate-400">Se pueden restaurar después</div>
                  </div>
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-all text-sm border-t border-slate-700 group"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-red-900/30 group-hover:bg-red-900/50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Eliminar Permanentemente</div>
                    <div className="text-xs text-slate-400">⚠️ No se puede deshacer</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botón deseleccionar */}
        <button
          onClick={clearSelection}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all text-sm border border-slate-600 hover:border-slate-500"
        >
          <X size={16} />
          <span>Deseleccionar</span>
        </button>
      </div>
    </div>
  );
}

