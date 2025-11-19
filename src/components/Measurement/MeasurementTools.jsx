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
 * - Botón de cierre rápido
 * - Cleanup correcto al cerrar/abrir
 */
export default function MeasurementTools({ map, onClose }) {
  const [measurements, setMeasurements] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [circleRadius, setCircleRadius] = useState(100); // km
  const drawRef = useRef(null);

  // Inicializar Mapbox Draw cada vez que se monta el componente
  useEffect(() => {
    if (!map) return;

    // Si ya existe un draw, no crear otro
    if (drawRef.current) return;

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

    // Cleanup: Remover control y listeners al desmontar
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      
      // Remover el control del mapa si existe
      if (drawRef.current) {
        try {
          map.removeControl(drawRef.current);
          drawRef.current = null; // Limpiar referencia
        } catch (err) {
          // Ignorar errores si el control ya fue removido
          console.warn('Control already removed:', err);
        }
      }
    };
  }, [map]);

  // Listener para crear círculo al hacer clic en el mapa
  useEffect(() => {
    if (!map || activeTool !== 'circle') return;

    const handleMapClick = (e) => {
      createCircleAtLocation(e.lngLat);
      setActiveTool(null); // Desactivar herramienta después de crear
    };

    map.on('click', handleMapClick);

    // Cambiar cursor para indicar que está en modo círculo
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [map, activeTool, circleRadius]);

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

  // Activar modo círculo (no crea círculo aún, espera click en mapa)
  const activateCircleTool = () => {
    setActiveTool('circle');
    // No crear círculo aquí, esperar a que usuario haga clic en el mapa
  };

  // Crear círculo en la ubicación donde el usuario hace clic
  const createCircleAtLocation = (lngLat) => {
    if (!drawRef.current) return;

    const options = { steps: 64, units: 'kilometers' };
    const circle = turf.circle([lngLat.lng, lngLat.lat], circleRadius, options);

    // Agregar como polígono
    const ids = drawRef.current.add(circle);
    
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
    <>
      {/* Mini menú flotante de iconos - MINIMALISTA */}
      <div className="fixed left-4 z-30 pointer-events-auto flex flex-col gap-2" style={{ top: '140px' }}>
        {/* Medir distancia */}
        <button
          onClick={activateLineTool}
          className={`w-10 h-10 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center ${
            activeTool === 'line'
              ? 'bg-green-500 border-2 border-green-400'
              : 'bg-slate-900/95 border-2 border-slate-700 hover:border-green-500'
          }`}
          title="Medir Distancia (Click para agregar puntos)"
        >
          <Ruler className={`w-5 h-5 ${activeTool === 'line' ? 'text-white' : 'text-green-400'}`} />
        </button>

        {/* Medir área */}
        <button
          onClick={activatePolygonTool}
          className={`w-10 h-10 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center ${
            activeTool === 'polygon'
              ? 'bg-blue-500 border-2 border-blue-400'
              : 'bg-slate-900/95 border-2 border-slate-700 hover:border-blue-500'
          }`}
          title="Medir Área (Dibujar polígono)"
        >
          <Pentagon className={`w-5 h-5 ${activeTool === 'polygon' ? 'text-white' : 'text-blue-400'}`} />
        </button>

        {/* Círculo de alcance */}
        <button
          onClick={activateCircleTool}
          className={`w-10 h-10 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center ${
            activeTool === 'circle'
              ? 'bg-cyan-500 border-2 border-cyan-400'
              : 'bg-slate-900/95 border-2 border-slate-700 hover:border-cyan-500'
          }`}
          title={activeTool === 'circle' ? `Click en el mapa para crear círculo de ${circleRadius} km` : `Círculo de Alcance (${circleRadius} km)`}
        >
          <Circle className={`w-5 h-5 ${activeTool === 'circle' ? 'text-white' : 'text-cyan-400'}`} />
        </button>

        {/* Control de radio del círculo - Solo visible cuando círculo está activo */}
        {activeTool === 'circle' && (
          <div className="bg-slate-900/98 border border-cyan-500/50 rounded-lg backdrop-blur-md shadow-xl p-2 w-48">
            <div className="text-cyan-400 text-xs font-semibold mb-1.5">
              Radio: {circleRadius} km
            </div>
            <input
              type="range"
              min="10"
              max="6000"
              step="50"
              value={circleRadius}
              onChange={(e) => setCircleRadius(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>10</span>
              <span>6000 km</span>
            </div>
          </div>
        )}

        {/* Separador */}
        <div className="h-px bg-slate-700 my-1"></div>

        {/* Limpiar todo */}
        <button
          onClick={clearAll}
          className="w-10 h-10 bg-slate-900/95 border-2 border-red-500/50 hover:border-red-500 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center hover:bg-red-500/20"
          title="Limpiar Todo (Borrar mediciones)"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>

        {/* Cerrar */}
        {onClose && (
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-slate-900/95 border-2 border-slate-600 hover:border-red-500 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center hover:bg-red-500/20"
            title="Cerrar herramientas (borra dibujos)"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-red-400" />
          </button>
        )}
      </div>
    </>
  );
}

