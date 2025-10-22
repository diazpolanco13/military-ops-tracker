import { useEffect, useState, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { Ruler, Circle, Pentagon, Trash2, X } from 'lucide-react';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

/**
 * 🛠️ Herramientas de Medición Militar
 * - Medir distancias entre puntos
 * - Calcular áreas de polígonos
 * - Crear círculos de alcance (radio de acción)
 * - Visualización en tiempo real con Turf.js
 */
export default function MeasurementTools({ map }) {
  const [measurements, setMeasurements] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [circleRadius, setCircleRadius] = useState(100); // km
  const drawRef = useRef(null);

  // Inicializar Mapbox Draw
  useEffect(() => {
    if (!map) return;

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

    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      
      if (drawRef.current) {
        map.removeControl(drawRef.current);
      }
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

  return (
    <div className="fixed top-20 left-4 z-20 pointer-events-auto">
      {/* Panel de herramientas */}
      <div className="bg-slate-900/95 border-2 border-green-500/50 rounded-lg backdrop-blur-md shadow-2xl shadow-green-500/20 min-w-[280px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-green-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5 text-green-400" />
            <h3 className="text-green-400 font-bold uppercase tracking-wider text-sm">
              Herramientas de Medición
            </h3>
          </div>
        </div>

        {/* Botones de herramientas */}
        <div className="p-3 space-y-2">
          {/* Medir distancia */}
          <button
            onClick={activateLineTool}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center space-x-3 ${
              activeTool === 'line'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-green-500/50 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-bold text-sm">Medir Distancia</div>
              <div className="text-xs opacity-70">Click para agregar puntos</div>
            </div>
          </button>

          {/* Medir área */}
          <button
            onClick={activatePolygonTool}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center space-x-3 ${
              activeTool === 'polygon'
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-blue-500/50 hover:bg-slate-800'
            }`}
          >
            <Pentagon className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-bold text-sm">Medir Área</div>
              <div className="text-xs opacity-70">Dibujar polígono</div>
            </div>
          </button>

          {/* Círculo de alcance */}
          <div className={`border-2 rounded-lg transition-all ${
            activeTool === 'circle'
              ? 'bg-cyan-500/20 border-cyan-500'
              : 'bg-slate-800/50 border-slate-700'
          }`}>
            <button
              onClick={createCircle}
              className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-slate-800/30 transition-colors rounded-t-lg"
            >
              <Circle className={`w-5 h-5 ${activeTool === 'circle' ? 'text-cyan-400' : 'text-slate-300'}`} />
              <div className="flex-1">
                <div className={`font-bold text-sm ${activeTool === 'circle' ? 'text-cyan-400' : 'text-slate-300'}`}>
                  Círculo de Alcance
                </div>
                <div className={`text-xs ${activeTool === 'circle' ? 'text-cyan-400/70' : 'text-slate-400'}`}>
                  Radio: {circleRadius} km
                </div>
              </div>
            </button>
            
            {/* Control de radio */}
            <div className="px-4 pb-3 space-y-2">
              <input
                type="range"
                min="10"
                max="6000"
                step="50"
                value={circleRadius}
                onChange={(e) => setCircleRadius(parseInt(e.target.value))}
                className="w-full h-1 bg-cyan-500/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-cyan-400/60 font-mono">
                <span>10 km</span>
                <span>6,000 km</span>
              </div>
              <div className="text-xs text-cyan-400/70 text-center">
                {circleRadius < 500 ? '🎯 Corto alcance' : 
                 circleRadius < 1500 ? '🚀 Alcance medio' : 
                 circleRadius < 3500 ? '⚡ Largo alcance' : 
                 '☢️ Intercontinental'}
              </div>
            </div>
          </div>

          {/* Limpiar todo */}
          <button
            onClick={clearAll}
            className="w-full px-4 py-3 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all flex items-center space-x-3"
          >
            <Trash2 className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-bold text-sm">Limpiar Todo</div>
              <div className="text-xs opacity-70">Borrar mediciones</div>
            </div>
          </button>
        </div>

        {/* Panel de resultados */}
        {measurements.length > 0 && (
          <div className="border-t border-green-500/30 p-3">
            <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
              📊 Resultados
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto modern-scrollbar">
              {measurements.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
                >
                  {m.type === 'distance' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 text-xs font-bold">📏 DISTANCIA</span>
                        <span className="text-green-400 font-mono font-bold">{m.label}</span>
                      </div>
                    </>
                  )}
                  
                  {m.type === 'area' && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-400 text-xs font-bold">📐 ÁREA</span>
                        <span className="text-blue-400 font-mono font-bold">{m.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400/70 text-xs">Perímetro:</span>
                        <span className="text-blue-400/70 font-mono text-xs">{m.perimeterLabel}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ayuda */}
        <div className="border-t border-green-500/20 p-3 bg-slate-800/30">
          <div className="text-green-400/60 text-xs space-y-1">
            <div>💡 <strong>Línea/Polígono:</strong> Click para agregar puntos</div>
            <div>💡 <strong>Enter:</strong> Finalizar dibujo</div>
            <div>💡 <strong>Esc:</strong> Cancelar</div>
            <div>💡 <strong>Delete:</strong> Borrar seleccionado</div>
          </div>
        </div>
      </div>
    </div>
  );
}

