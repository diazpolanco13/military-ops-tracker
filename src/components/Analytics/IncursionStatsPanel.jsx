import { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  BarChart3, 
  Clock, 
  Calendar,
  Compass,
  Plane,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { useIncursionStats, formatTimePeriod, formatQuadrant, getQuadrantColor } from '../../hooks/useIncursionStats';

/**
 * 📊 PANEL DE ESTADÍSTICAS DE INCURSIONES
 * 
 * Muestra patrones predictivos y estadísticas de incursiones aéreas
 */
export default function IncursionStatsPanel({ isOpen, onClose }) {
  const { 
    summary, 
    hourlyPatterns, 
    weeklyPatterns, 
    quadrantPatterns, 
    aircraftPatterns,
    recentIncursions,
    loading, 
    refresh 
  } = useIncursionStats();
  
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'temporal', label: 'Temporal', icon: Clock },
    { id: 'spatial', label: 'Espacial', icon: Compass },
    { id: 'aircraft', label: 'Aeronaves', icon: Plane },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header - Responsive */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500/20 flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-white truncate">Inteligencia de Incursiones</h2>
            <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Patrones predictivos y análisis estadístico</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-700 hover:bg-red-500/50 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Tabs - Responsive con scroll horizontal en móvil */}
      <div className="flex gap-1 px-3 sm:px-6 py-2 sm:py-3 bg-slate-800/50 border-b border-slate-700 overflow-x-auto custom-scrollbar-horizontal flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content - Responsive */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar-transparent">
        {loading && !summary ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm sm:text-base">Cargando estadísticas...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab summary={summary} recentIncursions={recentIncursions} />
            )}
            {activeTab === 'temporal' && (
              <TemporalTab hourlyPatterns={hourlyPatterns} weeklyPatterns={weeklyPatterns} />
            )}
            {activeTab === 'spatial' && (
              <SpatialTab quadrantPatterns={quadrantPatterns} />
            )}
            {activeTab === 'aircraft' && (
              <AircraftTab aircraftPatterns={aircraftPatterns} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================
// TAB: RESUMEN GENERAL
// =============================================
function OverviewTab({ summary, recentIncursions }) {
  if (!summary) {
    return (
      <div className="text-center py-8 sm:py-12">
        <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl text-white mb-2">Sin datos suficientes</h3>
        <p className="text-sm sm:text-base text-slate-400">El sistema está recolectando datos. Los patrones aparecerán pronto.</p>
      </div>
    );
  }

  const kpiCards = [
    { 
      label: 'Total Incursiones', 
      value: summary.total_incursions || 0, 
      icon: AlertTriangle, 
      color: 'text-red-400',
      bg: 'bg-red-500/20'
    },
    { 
      label: 'Aeronaves Únicas', 
      value: summary.unique_aircraft || 0, 
      icon: Plane, 
      color: 'text-blue-400',
      bg: 'bg-blue-500/20'
    },
    { 
      label: 'Días con Actividad', 
      value: summary.days_with_activity || 0, 
      icon: Calendar, 
      color: 'text-green-400',
      bg: 'bg-green-500/20'
    },
    { 
      label: 'Hora Pico (UTC)', 
      value: summary.peak_hour_utc !== null ? `${summary.peak_hour_utc}:00` : 'N/A', 
      icon: Clock, 
      color: 'text-amber-400',
      bg: 'bg-amber-500/20'
    },
  ];

  const predictionCards = [
    {
      label: 'Período Preferido',
      value: formatTimePeriod(summary.peak_time_period),
      icon: Zap,
      description: 'Mayor probabilidad de incursiones'
    },
    {
      label: 'Día Más Activo',
      value: summary.peak_day || 'N/A',
      icon: Calendar,
      description: 'Históricamente más incursiones'
    },
    {
      label: 'Cuadrante Caliente',
      value: formatQuadrant(summary.hottest_quadrant),
      icon: Target,
      description: 'Zona de entrada más común'
    },
    {
      label: 'Aeronave Típica',
      value: summary.most_common_aircraft || 'N/A',
      icon: Plane,
      description: 'Modelo más frecuente'
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPIs - Grid responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className={`p-1.5 sm:p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.color}`} />
              </div>
              <span className="text-xs sm:text-sm text-slate-400 leading-tight">{kpi.label}</span>
            </div>
            <div className={`text-xl sm:text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Predicciones */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          Patrones Predictivos
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {predictionCards.map((card, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-slate-400">{card.label}</span>
              </div>
              <div className="text-sm sm:text-lg font-semibold text-white mb-0.5 sm:mb-1 truncate">{card.value}</div>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Incursiones Recientes - Cards en móvil, tabla en desktop */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          Incursiones Recientes
        </h3>
        
        {/* Vista móvil: Cards */}
        <div className="sm:hidden space-y-2">
          {recentIncursions.slice(0, 5).map((inc, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-amber-400 font-semibold">{inc.callsign}</span>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: `${getQuadrantColor(inc.entry_quadrant)}20`,
                    color: getQuadrantColor(inc.entry_quadrant)
                  }}
                >
                  {inc.entry_quadrant || 'N/A'}
                </span>
              </div>
              <div className="text-sm text-white mb-1">{inc.aircraft_model || inc.aircraft_type}</div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  {new Date(inc.started_at).toLocaleDateString('es-VE', { 
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
                <span>{inc.avg_altitude ? `${Math.round(inc.avg_altitude).toLocaleString()} ft` : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Vista desktop: Tabla */}
        <div className="hidden sm:block bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Callsign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Aeronave</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Cuadrante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Altitud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {recentIncursions.slice(0, 5).map((inc, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-amber-400">{inc.callsign}</td>
                    <td className="px-4 py-3 text-sm text-white">{inc.aircraft_model || inc.aircraft_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(inc.started_at).toLocaleDateString('es-VE', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getQuadrantColor(inc.entry_quadrant)}20`,
                          color: getQuadrantColor(inc.entry_quadrant)
                        }}
                      >
                        {inc.entry_quadrant || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {inc.avg_altitude ? `${Math.round(inc.avg_altitude).toLocaleString()} ft` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// TAB: PATRONES TEMPORALES
// =============================================
function TemporalTab({ hourlyPatterns, weeklyPatterns }) {
  const maxHourly = Math.max(...hourlyPatterns.map(h => h.total_incursions), 1);
  const maxWeekly = Math.max(...weeklyPatterns.map(w => w.total_incursions), 1);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Patrones por Hora */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          Actividad por Hora del Día (UTC)
        </h3>
        <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-slate-700">
          <div className="flex items-end gap-0.5 sm:gap-1 h-32 sm:h-48">
            {Array.from({ length: 24 }, (_, hour) => {
              const data = hourlyPatterns.find(h => h.hour_of_day === hour);
              const count = data?.total_incursions || 0;
              const height = count > 0 ? (count / maxHourly) * 100 : 2;
              const isActive = count > 0;
              
              return (
                <div key={hour} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isActive 
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300' 
                          : 'bg-slate-700'
                      }`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    {isActive && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                        <span className="bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded shadow-lg">
                          {count}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Mostrar solo algunas horas en móvil */}
                  <span className={`text-[8px] sm:text-xs text-slate-500 mt-1 sm:mt-2 ${hour % 3 === 0 ? '' : 'hidden sm:inline'}`}>
                    {hour}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-500">
            <span>🌙 <span className="hidden sm:inline">Madrugada</span></span>
            <span>🌅 <span className="hidden sm:inline">Mañana</span></span>
            <span>☀️ <span className="hidden sm:inline">Tarde</span></span>
            <span>🌆 <span className="hidden sm:inline">Noche</span></span>
          </div>
        </div>
      </div>

      {/* Patrones por Día */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          Actividad por Día de la Semana
        </h3>
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayShort, i) => {
            const dayFull = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i];
            const data = weeklyPatterns.find(w => w.day_of_week === i);
            const count = data?.total_incursions || 0;
            const percentage = count > 0 ? (count / maxWeekly) * 100 : 0;
            
            return (
              <div key={i} className="bg-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-slate-700 text-center">
                <div className="text-[10px] sm:text-sm text-slate-400 mb-1 sm:mb-2">
                  <span className="sm:hidden">{dayShort}</span>
                  <span className="hidden sm:inline">{dayFull}</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">{count}</div>
                <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================
// TAB: PATRONES ESPACIALES
// =============================================
function SpatialTab({ quadrantPatterns }) {
  const total = quadrantPatterns.reduce((sum, q) => sum + q.total_incursions, 0);
  
  const quadrantData = {
    NW: quadrantPatterns.find(q => q.entry_quadrant === 'NW') || { total_incursions: 0 },
    NE: quadrantPatterns.find(q => q.entry_quadrant === 'NE') || { total_incursions: 0 },
    SW: quadrantPatterns.find(q => q.entry_quadrant === 'SW') || { total_incursions: 0 },
    SE: quadrantPatterns.find(q => q.entry_quadrant === 'SE') || { total_incursions: 0 },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        Distribución por Cuadrante de Entrada
      </h3>
      
      {/* Mapa de cuadrantes */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto">
        {['NW', 'NE', 'SW', 'SE'].map((quad) => {
          const data = quadrantData[quad];
          const percentage = total > 0 ? ((data.total_incursions / total) * 100).toFixed(1) : 0;
          
          return (
            <div 
              key={quad}
              className="bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 transition-all hover:scale-[1.02] sm:hover:scale-105"
              style={{ borderColor: getQuadrantColor(quad) }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-lg sm:text-2xl font-bold" style={{ color: getQuadrantColor(quad) }}>
                  {formatQuadrant(quad)}
                </span>
                <div className="text-right">
                  <div className="text-xl sm:text-3xl font-bold text-white">{data.total_incursions}</div>
                  <div className="text-xs sm:text-sm text-slate-400">{percentage}%</div>
                </div>
              </div>
              
              {data.aircraft_types && data.aircraft_types.length > 0 && (
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-700">
                  <div className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">Aeronaves detectadas:</div>
                  <div className="flex flex-wrap gap-1">
                    {data.aircraft_types.slice(0, 3).map((type, i) => (
                      <span key={i} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-700 rounded text-[10px] sm:text-xs text-slate-300">
                        {type}
                      </span>
                    ))}
                    {data.aircraft_types.length > 3 && (
                      <span className="text-[10px] sm:text-xs text-slate-500">+{data.aircraft_types.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
              
              {data.avg_altitude_ft && (
                <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-400">
                  <span className="hidden sm:inline">Altitud promedio: </span>
                  <span className="sm:hidden">Alt: </span>
                  <span className="text-white">{Math.round(data.avg_altitude_ft).toLocaleString()} ft</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda del mapa */}
      <div className="text-center text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4">
        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
        <span className="hidden sm:inline">Centro de referencia: 13°N, 66°W (Mar Caribe venezolano)</span>
        <span className="sm:hidden">Ref: 13°N, 66°W</span>
      </div>
    </div>
  );
}

// =============================================
// TAB: PATRONES POR AERONAVE
// =============================================
function AircraftTab({ aircraftPatterns }) {
  const maxIncursions = Math.max(...aircraftPatterns.map(a => a.total_incursions), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        Patrones por Tipo de Aeronave
      </h3>
      
      <div className="space-y-2 sm:space-y-3">
        {aircraftPatterns.map((aircraft, i) => {
          const percentage = (aircraft.total_incursions / maxIncursions) * 100;
          
          return (
            <div key={i} className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="min-w-0 flex-1 mr-3">
                  <div className="text-sm sm:text-base text-white font-semibold truncate">{aircraft.aircraft_model}</div>
                  <div className="text-xs sm:text-sm text-slate-400">{aircraft.aircraft_type}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-bold text-amber-400">{aircraft.total_incursions}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">incursiones</div>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden mb-2 sm:mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Detalles - Grid responsive */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-[10px] sm:text-xs">Altitud típica:</span>
                  <div className="text-white font-medium">{aircraft.typical_altitude_ft ? `${Math.round(aircraft.typical_altitude_ft).toLocaleString()} ft` : 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] sm:text-xs">Velocidad típica:</span>
                  <div className="text-white font-medium">{aircraft.typical_speed_kts ? `${Math.round(aircraft.typical_speed_kts)} kts` : 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] sm:text-xs">Horario preferido:</span>
                  <div className="text-white font-medium">{formatTimePeriod(aircraft.preferred_time)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] sm:text-xs">Entrada común:</span>
                  <div className="text-white font-medium">{formatQuadrant(aircraft.preferred_entry_quadrant)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
