import { Ship, Plane, Users, Anchor, Target, Activity, Truck, Package } from 'lucide-react';
import { useEntities } from '../../hooks/useEntities';
import { useState, useEffect, useMemo } from 'react';

/**
 * 📊 Dashboard de Estadísticas de Despliegue - DINÁMICO
 * Contabiliza todas las entidades presentes usando el campo quantity
 * Se adapta automáticamente a cualquier tipo de entidad
 */
export default function DeploymentStats() {
  const { entities } = useEntities();
  const [isExpanded, setIsExpanded] = useState(false);

  // Mapeo de iconos por tipo (se adapta dinámicamente)
  const iconMap = {
    destructor: Ship,
    fragata: Ship,
    portaaviones: Anchor,
    submarino: Target,
    patrullero: Ship,
    avion: Plane,
    caza: Plane,
    helicoptero: Plane,
    drone: Plane,
    tropas: Users,
    insurgente: Users,
    vehiculo: Truck,
    tanque: Truck,
  };

  // Mapeo de colores por tipo
  const colorMap = {
    destructor: '#ef4444',
    fragata: '#3b82f6',
    portaaviones: '#f59e0b',
    submarino: '#8b5cf6',
    patrullero: '#06b6d4',
    avion: '#6b7280',
    caza: '#dc2626',
    helicoptero: '#10b981',
    drone: '#a855f7',
    tropas: '#22c55e',
    insurgente: '#f87171',
    vehiculo: '#eab308',
    tanque: '#fb923c',
  };

  // Calcular estadísticas dinámicamente
  const stats = useMemo(() => {
    if (!entities || entities.length === 0) return null;

    // Filtrar solo entidades visibles y no archivadas
    const activeEntities = entities.filter(e => e.is_visible !== false && !e.archived_at);

    // Agrupar por tipo DINÁMICAMENTE
    const byType = {};
    
    activeEntities.forEach(entity => {
      const type = entity.type;
      if (!type) return;

      // Inicializar el tipo si no existe
      if (!byType[type]) {
        byType[type] = {
          count: 0,
          totalUnits: 0, // Total considerando quantity
          personnel: 0,
          icon: iconMap[type] || Package,
          color: colorMap[type] || '#64748b',
          label: type.charAt(0).toUpperCase() + type.slice(1) // Capitalizar
        };
      }

      // Contar marcadores
      byType[type].count++;
      
      // Sumar unidades reales (quantity o 1 si no existe)
      const quantity = entity.quantity || 1;
      byType[type].totalUnits += quantity;
      
      // ========================================
      // CÁLCULO DE EFECTIVOS - LÓGICA CORREGIDA
      // ========================================
      
      const crewCount = entity.crew_count || 0;
      const embarkedPersonnel = entity.embarked_personnel || 0;
      
      // EMBARCACIONES (Únicas, con identidad propia)
      // quantity siempre es 1, cada barco tiene nombre
      if (['portaaviones', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(type)) {
        // Tripulación + Personal embarcado (marines, tropas)
        byType[type].personnel += (crewCount + embarkedPersonnel);
      }
      
      // AVIONES/HELICÓPTEROS (Agrupados por tipo)
      // quantity = número de aeronaves idénticas
      // crew_count = tripulación por aeronave
      else if (['avion', 'caza', 'helicoptero', 'drone'].includes(type)) {
        byType[type].personnel += crewCount * quantity;
      }
      
      // TROPAS/INSURGENTES (Agrupados)
      // quantity = número total de efectivos
      else if (['tropas', 'insurgente'].includes(type)) {
        byType[type].personnel += quantity;
      }
      
      // VEHÍCULOS/TANQUES (Agrupados)
      // quantity = número de vehículos
      // crew_count = tripulación por vehículo
      else {
        byType[type].personnel += crewCount * quantity;
      }
    });

    // Calcular totales
    const totalMarkers = activeEntities.length;
    const totalUnits = Object.values(byType).reduce((sum, t) => sum + t.totalUnits, 0);
    const totalPersonnel = Object.values(byType).reduce((sum, t) => sum + t.personnel, 0);

    return {
      byType,
      totalMarkers,
      totalUnits,
      totalPersonnel
    };
  }, [entities]);

  if (!stats) return null;

  return (
    <>
      {/* Badge compacto (siempre visible) - Centrado en la parte inferior */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl transition-all hover:scale-105 hover:border-blue-500"
      >
        <div className="px-4 py-2 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <div className="text-white font-bold text-sm">
              {stats.totalMarkers} marcadores • {stats.totalUnits} unidades
            </div>
            <div className="text-slate-400 text-xs">
              {stats.totalPersonnel.toLocaleString()} efectivos
            </div>
          </div>
        </div>
      </button>

      {/* Panel expandido (al hacer click) - Centrado en la parte inferior */}
      {isExpanded && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-900">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              ESTADO DEL DESPLIEGUE
            </h3>
            <p className="text-slate-400 text-xs mt-1">SOUTHCOM - Caribe - Octubre 2025</p>
          </div>

          {/* Estadísticas Generales */}
          <div className="p-4 grid grid-cols-3 gap-3 border-b border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalMarkers}</div>
              <div className="text-xs text-slate-400 font-semibold">MARCADORES</div>
            </div>
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
              .filter(([_, data]) => data.totalUnits > 0)
              .sort((a, b) => b[1].totalUnits - a[1].totalUnits)
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
                      <div className="text-white font-bold text-xl">{data.totalUnits}</div>
                      <div className="text-slate-500 text-xs">
                        {data.count > 1 ? `${data.count} grupos` : 'unidades'}
                      </div>
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

