import { useEffect, useState, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { Ruler, Circle, Pentagon, Trash2, X, Minimize2, Maximize2 } from 'lucide-react';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

/**
 * 🛠️ Herramientas de Medición Militar
 * - Medir distancias entre puntos
 * - Calcular áreas de polígonos
 * - Crear círculos de alcance (radio de acción)
 * - Visualización en tiempo real con Turf.js
 * - Panel minimizable (los dibujos persisten en el mapa)
 * - Botón de cierre rápido
 */
export default function MeasurementTools({ map, onClose }) {
  const [measurements, setMeasurements] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [circleRadius, setCircleRadius] = useState(100); // km
  const [isMinimized, setIsMinimized] = useState(false); // Estado de minimización
  const drawRef = useRef(null);
  const drawInitializedRef = useRef(false); // Evitar reinicializar Draw

  // Inicializar Mapbox Draw SOLO UNA VEZ (persiste incluso al minimizar)
  useEffect(() => {
    if (!map || drawInitializedRef.current) return;

    // Estilos militares personalizados para Draw
    const drawStyles = [
      // Líneas activas (verde militar)
      {
        'id': 'gl-draw-line',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#22c55e',
          'line-width': 3,
          'line-opacity': 0.8
        }
      },
      // Polígonos rellenos (verde translúcido)
      {
        'id': 'gl-draw-polygon-fill',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        'paint': {
          'fill-color': '#22c55e',
          'fill-opacity': 0.15
        }
      },
      // Bordes de polígonos
      {
        'id': 'gl-draw-polygon-stroke-active',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#22c55e',
          'line-width': 3,
          'line-opacity': 0.9
        }
      },
      // Vértices (puntos de control)
      {
        'id': 'gl-draw-polygon-and-line-vertex-active',
        'type': 'circle',
        'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
        'paint': {
          'circle-radius': 6,
          'circle-color': '#22c55e',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      },
      // Puntos
      {
        'id': 'gl-draw-point',
        'type': 'circle',
        'filter': ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'vertex']],
        'paint': {
          'circle-radius': 8,
          'circle-color': '#22c55e',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      }
    ];

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: drawStyles,
      controls: {}
    });

    map.addControl(draw, 'top-left');
    drawRef.current = draw;
    drawInitializedRef.current = true; // Marcar como inicializado

    // Eventos de dibujo
    const handleCreate = (e) => {
      calculateMeasurements(e.features);
    };

    const handleUpdate = (e) => {
      calculateMeasurements(e.features);
    };

    const handleDelete = () => {
      setMeasurements([]);
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    // NO removemos el control al desmontar, queremos que persista
    // Solo limpiamos los event listeners
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
    };
  }, [map]);

  // Calcular mediciones con Turf.js
  const calculateMeasurements = (features) => {
    const results = [];

    features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        const line = turf.lineString(feature.geometry.coordinates);
        const length = turf.length(line, { units: 'kilometers' });
        
        results.push({
          id: feature.id,
          type: 'distance',
          value: length,
          unit: 'km',
          label: `${length.toFixed(2)} km`,
          coordinates: feature.geometry.coordinates
        });
      }

      if (feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        const area = turf.area(polygon) / 1000000; // Convertir m² a km²
        const perimeter = turf.length(turf.polygonToLine(polygon), { units: 'kilometers' });
        
        results.push({
          id: feature.id,
          type: 'area',
          value: area,
          perimeter: perimeter,
          unit: 'km²',
          label: `${area.toFixed(2)} km²`,
          perimeterLabel: `${perimeter.toFixed(2)} km`,
          coordinates: feature.geometry.coordinates
        });
      }
    });

    setMeasurements(results);
  };

  // Activar herramienta de línea
  const activateLineTool = () => {
    if (!drawRef.current) return;
    drawRef.current.changeMode('draw_line_string');
    setActiveTool('line');
  };

  // Activar herramienta de polígono
  const activatePolygonTool = () => {
    if (!drawRef.current) return;
    drawRef.current.changeMode('draw_polygon');
    setActiveTool('polygon');
  };

  // Crear círculo de alcance
  const createCircle = () => {
    if (!drawRef.current || !map) return;

    const center = map.getCenter();
    const options = { steps: 64, units: 'kilometers' };
    const circle = turf.circle([center.lng, center.lat], circleRadius, options);

    // Agregar como polígono
    const ids = drawRef.current.add(circle);
    setActiveTool('circle');
    
    // Calcular mediciones
    calculateMeasurements([{
      id: ids[0],
      geometry: circle.geometry
    }]);
  };

  // Limpiar todo
  const clearAll = () => {
    if (!drawRef.current) return;
    drawRef.current.deleteAll();
    setMeasurements([]);
    setActiveTool(null);
  };

  // Manejar cierre del componente
  const handleClose = () => {
    // Limpiar todos los gráficos antes de cerrar
    clearAll();
    // Llamar al callback de cierre
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed top-20 left-4 z-30 pointer-events-auto max-w-[320px]">
      {/* Panel de herramientas SIEMPRE expandido - Más profesional */}
      <div className="bg-slate-900/98 border border-slate-700 rounded-lg backdrop-blur-md shadow-2xl w-80">
        {/* Header compacto */}
        <div className="px-3 py-2 border-b border-slate-700/50 bg-gradient-to-r from-green-900/20 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-green-400" />
            <h3 className="text-green-400 font-semibold text-xs uppercase tracking-wide">
              Medición
            </h3>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title="Cerrar (borra dibujos)"
            >
              <X className="w-3.5 h-3.5 text-red-400/60 hover:text-red-400" />
            </button>
          )}
        </div>

        {/* Herramientas - Diseño compacto */}
        <div className="p-2.5 space-y-1.5">
          {/* Medir distancia */}
          <button
            onClick={activateLineTool}
            className={`w-full px-3 py-2 rounded-md border transition-all flex items-center gap-2.5 ${
              activeTool === 'line'
                ? 'bg-green-500/20 border-green-500/70 text-green-400'
                : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:border-green-500/50 hover:bg-slate-800/50'
            }`}
          >
            <Ruler className="w-4 h-4 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-xs">Medir Distancia</div>
              <div className="text-[10px] opacity-60">Click para puntos</div>
            </div>
          </button>

          {/* Medir área */}
          <button
            onClick={activatePolygonTool}
            className={`w-full px-3 py-2 rounded-md border transition-all flex items-center gap-2.5 ${
              activeTool === 'polygon'
                ? 'bg-blue-500/20 border-blue-500/70 text-blue-400'
                : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:border-blue-500/50 hover:bg-slate-800/50'
            }`}
          >
            <Pentagon className="w-4 h-4 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-xs">Medir Área</div>
              <div className="text-[10px] opacity-60">Dibujar polígono</div>
            </div>
          </button>

          {/* Círculo de alcance - Compacto */}
          <div className={`border rounded-md transition-all ${
            activeTool === 'circle'
              ? 'bg-cyan-500/20 border-cyan-500/70'
              : 'bg-slate-800/30 border-slate-700/50'
          }`}>
            <button
              onClick={createCircle}
              className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-slate-800/30 transition-colors"
            >
              <Circle className={`w-4 h-4 flex-shrink-0 ${activeTool === 'circle' ? 'text-cyan-400' : 'text-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-xs ${activeTool === 'circle' ? 'text-cyan-400' : 'text-slate-300'}`}>
                  Círculo de Alcance
                </div>
                <div className={`text-[10px] ${activeTool === 'circle' ? 'text-cyan-400/60' : 'text-slate-500'}`}>
                  {circleRadius} km • 
                  {circleRadius < 500 ? ' Corto' : 
                   circleRadius < 1500 ? ' Medio' : 
                   circleRadius < 3500 ? ' Largo' : 
                   ' Intercontinental'}
                </div>
              </div>
            </button>
            
            {/* Control de radio - Más compacto */}
            <div className="px-3 pb-2 space-y-1">
              <input
                type="range"
                min="10"
                max="6000"
                step="50"
                value={circleRadius}
                onChange={(e) => setCircleRadius(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>10</span>
                <span>6000 km</span>
              </div>
            </div>
          </div>

          {/* Limpiar todo - Compacto */}
          <button
            onClick={clearAll}
            className="w-full px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center gap-2.5"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-xs">Limpiar Todo</div>
              <div className="text-[10px] opacity-60">Borrar mediciones</div>
            </div>
          </button>
        </div>

        {/* Panel de resultados - Compacto */}
        {measurements.length > 0 && (
          <div className="border-t border-slate-700/50 p-2.5">
            <div className="text-green-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              📊 Resultados
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar-transparent">
              {measurements.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="bg-slate-800/30 rounded-md p-2 border border-slate-700/30"
                >
                  {m.type === 'distance' && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 text-[10px] font-semibold">📏 Distancia</span>
                      <span className="text-green-400 font-mono font-bold text-xs">{m.label}</span>
                    </div>
                  )}
                  
                  {m.type === 'area' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 text-[10px] font-semibold">📐 Área</span>
                        <span className="text-blue-400 font-mono font-bold text-xs">{m.label}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-blue-400/50 text-[9px]">Perímetro</span>
                        <span className="text-blue-400/70 font-mono text-[10px]">{m.perimeterLabel}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ayuda - Compacta */}
        <div className="border-t border-slate-700/50 p-2.5 bg-slate-800/20">
          <div className="text-slate-500 text-[10px] space-y-0.5">
            <div><strong className="text-green-400">Enter:</strong> Finalizar</div>
            <div><strong className="text-yellow-400">Esc:</strong> Cancelar</div>
            <div><strong className="text-red-400">Delete:</strong> Borrar seleccionado</div>
            <div><strong className="text-red-400">Cerrar (X):</strong> Borra todos los dibujos</div>
          </div>
        </div>
      </div>
    </div>
  );
}

