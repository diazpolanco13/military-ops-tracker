import { Ship, Plane, Users, Anchor, Target, Activity } from 'lucide-react';
import { useEntities } from '../../hooks/useEntities';
import { useState, useEffect } from 'react';

/**
 * 📊 Dashboard de Estadísticas de Despliegue
 * Muestra cantidad de unidades y personal por tipo
 */
export default function DeploymentStats() {
  const { entities } = useEntities();
  const [stats, setStats] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!entities || entities.length === 0) return;

    // Filtrar solo entidades visibles y no archivadas
    const activeEntities = entities.filter(e => e.is_visible !== false && !e.archived_at);

    // Calcular estadísticas por tipo
    const byType = {
      destructor: { count: 0, personnel: 0, icon: Ship, color: '#ef4444', label: 'Buques' },
      fragata: { count: 0, personnel: 0, icon: Anchor, color: '#3b82f6', label: 'Fragatas' },
      avion: { count: 0, personnel: 0, icon: Plane, color: '#6b7280', label: 'Aeronaves' },
      tropas: { count: 0, personnel: 0, icon: Users, color: '#22c55e', label: 'Tropas' },
      submarino: { count: 0, personnel: 0, icon: Target, color: '#8b5cf6', label: 'Submarinos' },
    };

    activeEntities.forEach(entity => {
      if (byType[entity.type]) {
        byType[entity.type].count++;
        byType[entity.type].personnel += entity.crew_count || 0;
      }
    });

    const totalUnits = activeEntities.length;
    const totalPersonnel = Object.values(byType).reduce((sum, t) => sum + t.personnel, 0);

    setStats({
      byType,
      totalUnits,
      totalPersonnel
    });
  }, [entities]);

  if (!stats) return null;

  return (
    <>
      {/* Badge compacto (siempre visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl transition-all hover:scale-105 hover:border-blue-500"
      >
        <div className="px-4 py-2 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <div className="text-white font-bold text-sm">
              {stats.totalUnits} unidades activas
            </div>
            <div className="text-slate-400 text-xs">
              {stats.totalPersonnel.toLocaleString()} efectivos
            </div>
          </div>
        </div>
      </button>

      {/* Panel expandido (al hacer click) */}
      {isExpanded && (
        <div className="absolute bottom-20 right-4 w-96 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-900">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              ESTADO DEL DESPLIEGUE
            </h3>
            <p className="text-slate-400 text-xs mt-1">SOUTHCOM - Caribe - Octubre 2025</p>
          </div>

          {/* Estadísticas Generales */}
          <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-800">
            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-900/30 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalUnits}</div>
              <div className="text-xs text-blue-400 font-semibold">UNIDADES</div>
            </div>
            <div className="bg-green-900/20 rounded-lg p-3 border border-green-900/30 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalPersonnel.toLocaleString()}</div>
              <div className="text-xs text-green-400 font-semibold">EFECTIVOS</div>
            </div>
          </div>

          {/* Desglose por tipo */}
          <div className="p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Desglose por Tipo
            </h4>
            
            {Object.entries(stats.byType)
              .filter(([_, data]) => data.count > 0)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([type, data]) => {
                const Icon = data.icon;
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${data.color}20`, borderColor: data.color, borderWidth: '2px' }}
                      >
                        <Icon size={20} style={{ color: data.color }} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{data.label}</div>
                        {data.personnel > 0 && (
                          <div className="text-slate-400 text-xs">
                            {data.personnel.toLocaleString()} efectivos
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-xl">{data.count}</div>
                      <div className="text-slate-500 text-xs">unidades</div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Footer con indicador */}
          <div className="p-3 border-t border-slate-800 bg-slate-800/30 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Actualización en tiempo real</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

