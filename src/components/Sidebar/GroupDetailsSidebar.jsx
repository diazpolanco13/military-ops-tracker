import { X, Users, Plane, Ship, MapPin, Gauge, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../Common/ConfirmDialog';

/**
 * 📊 Sidebar de Detalles de Grupo
 * Muestra información del escuadrón/formación y lista de miembros
 */
export default function GroupDetailsSidebar({ group, onClose, onSelectMember, onDissolveGroup, isOpen = false }) {
  const [expandedMember, setExpandedMember] = useState(null);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);

  if (!group) {
    return (
      <div
        className={`fixed w-[380px] bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          right: 0,
          top: '56px',
          height: 'calc(100vh - 56px)',
          zIndex: 60 
        }}
      >
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-slate-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" strokeWidth={1} />
            <p className="text-sm">Selecciona un grupo del mapa</p>
          </div>
        </div>
      </div>
    );
  }

  const firstEntity = group.members[0]?.entity;
  const Icon = firstEntity?.type === 'avion' ? Plane : Ship;
  const color = group.icon_color || '#3b82f6';

  return (
    <div
      className={`fixed w-[380px] bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ 
        right: 0,
        top: '56px',
        height: 'calc(100vh - 56px)',
        zIndex: 60 
      }}
    >
      {/* Header con icono del grupo */}
      <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {/* Icono grande del grupo */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="w-24 h-24 rounded-lg border-4 flex items-center justify-center bg-slate-800 shadow-2xl"
            style={{ borderColor: color }}
          >
            <Icon size={48} style={{ color: color }} strokeWidth={2} />
          </div>
          
          {/* Badge con contador */}
          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center border-4 border-slate-900 font-bold text-lg shadow-xl">
            {group.count}
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm rounded-lg transition-colors z-20 border border-slate-700"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Badge de tipo de grupo */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 z-20">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {group.group_type || 'grupo'}
          </span>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Nombre y descripción */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {group.name}
            </h2>
            {group.description && (
              <p className="text-sm text-slate-400">
                {group.description}
              </p>
            )}
          </div>

          {/* Estadísticas del grupo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400 font-semibold">Miembros</span>
              </div>
              <p className="text-white font-mono text-2xl font-bold">
                {group.count}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400 font-semibold">Tipo</span>
              </div>
              <p className="text-white font-mono text-sm font-bold capitalize">
                {firstEntity?.type || 'N/A'}
              </p>
            </div>
          </div>

          {/* Lista de Miembros */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Miembros del {group.group_type || 'Grupo'}
            </h3>

            <div className="space-y-2">
              {group.members?.map((member) => {
                const entity = member.entity;
                if (!entity) return null;

                return (
                  <button
                    key={member.id}
                    onClick={() => onSelectMember(entity)}
                    className="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-3 border border-slate-700/30 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white">{entity.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {entity.class}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entity.latitude?.toFixed(2)}°, {entity.longitude?.toFixed(2)}°
                          </div>
                          {entity.speed > 0 && (
                            <div className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {entity.speed} kn
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                          <Icon size={16} style={{ color: color }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones del Grupo */}
          <div className="pt-4 border-t border-slate-700/50 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Acciones del Grupo
            </h3>

            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Eye size={16} />
              Ver Todas en Mapa
            </button>

            <button
              onClick={() => setShowDissolveConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Disolver Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación de disolución */}
      <ConfirmDialog
        isOpen={showDissolveConfirm}
        onClose={() => setShowDissolveConfirm(false)}
        onConfirm={async () => {
          if (onDissolveGroup) {
            await onDissolveGroup(group.id);
            onClose();
          }
        }}
        title="¿Disolver este grupo?"
        message={`El grupo "${group.name}" será disuelto. Las ${group.count} entidades volverán a aparecer individualmente en el mapa.`}
        confirmText="Disolver Grupo"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
}

