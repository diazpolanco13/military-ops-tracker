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
    anfibio: Ship,  // Buques de asalto anfibio (LHD/LHA)
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
    anfibio: '#14b8a6',  // Teal para diferenciar de portaaviones
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

  // Mapeo de labels personalizados por tipo
  const labelMap = {
    destructor: 'Buques de Combate', // Engloba destructores + cruceros
    fragata: 'Fragata',
    portaaviones: 'Portaaviones',
    anfibio: 'Buque Anfibio',  // LHD/LHA - Asalto anfibio
    submarino: 'Submarino',
    patrullero: 'Patrullero',
    avion: 'Avión',
    caza: 'Caza',
    helicoptero: 'Helicóptero',
    drone: 'Drone',
    tropas: 'Tropas',
    insurgente: 'Insurgente',
    vehiculo: 'Vehículo',
    tanque: 'Tanque',
    lugar: 'Lugar',
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
          label: labelMap[type] || type.charAt(0).toUpperCase() + type.slice(1) // Usar label personalizado
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
      if (['portaaviones', 'anfibio', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(type)) {
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
      {/* Badge compacto (siempre visible) - Esquina inferior derecha */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl transition-all hover:scale-105 hover:border-blue-500 z-40"
      >
        <div className="px-3 py-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <div className="text-left">
            <div className="text-white font-bold text-xs">
              {stats.totalMarkers} marcadores • {stats.totalUnits} unidades
            </div>
            <div className="text-slate-400 text-[10px]">
              {stats.totalPersonnel.toLocaleString()} efectivos
            </div>
          </div>
        </div>
      </button>

      {/* Panel expandido (al hacer click) - Esquina inferior derecha */}
      {isExpanded && (
        <div className="fixed bottom-16 right-4 w-80 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl animate-in slide-in-from-bottom duration-300 z-40 max-h-[70vh] overflow-y-auto custom-scrollbar-transparent">
          
          {/* Header compacto */}
          <div className="p-3 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  DESPLIEGUE
                </h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Caribe • Nov 2025</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Estadísticas Generales - Compactas */}
          <div className="p-3 grid grid-cols-3 gap-2 border-b border-slate-800">
            <div className="bg-slate-800/50 rounded p-2 border border-slate-700/50 text-center">
              <div className="text-lg font-bold text-white">{stats.totalMarkers}</div>
              <div className="text-[9px] text-slate-400 font-semibold uppercase">Marcadores</div>
            </div>
            <div className="bg-blue-900/20 rounded p-2 border border-blue-900/30 text-center">
              <div className="text-lg font-bold text-white">{stats.totalUnits}</div>
              <div className="text-[9px] text-blue-400 font-semibold uppercase">Unidades</div>
            </div>
            <div className="bg-green-900/20 rounded p-2 border border-green-900/30 text-center">
              <div className="text-lg font-bold text-white">{stats.totalPersonnel.toLocaleString()}</div>
              <div className="text-[9px] text-green-400 font-semibold uppercase">Efectivos</div>
            </div>
          </div>

          {/* Desglose por tipo - Compacto */}
          <div className="p-3 space-y-1.5">
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Desglose por Tipo
            </h4>
            
            {Object.entries(stats.byType)
              .filter(([_, data]) => data.totalUnits > 0)
              .sort((a, b) => b[1].personnel - a[1].personnel)  // Ordenar por efectivos
              .map(([type, data]) => {
                const Icon = data.icon;
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between px-2.5 py-2 bg-slate-800/30 hover:bg-slate-800/50 rounded-md border border-slate-700/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${data.color}20`, borderColor: data.color, borderWidth: '1px' }}
                      >
                        <Icon size={14} style={{ color: data.color }} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-xs truncate">{data.label}</div>
                        {data.personnel > 0 && (
                          <div className="text-slate-500 text-[10px]">
                            {data.personnel.toLocaleString()} efectivos
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white font-bold text-base">{data.totalUnits}</div>
                      <div className="text-slate-500 text-[9px]">
                        {data.count} {data.count > 1 ? 'grupos' : 'unidad'}
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

