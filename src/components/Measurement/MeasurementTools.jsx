import { useEffect, useState, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { Ruler, Circle, Pentagon, Trash2, X, Minimize2, Maximize2, Palette, Minus, Plus } from 'lucide-react';
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
  const [selectedColor, setSelectedColor] = useState('#22c55e'); // Verde por defecto
  const [lineWidth, setLineWidth] = useState(3); // Grosor de línea por defecto
  const drawRef = useRef(null);
  const labelsAddedRef = useRef(false); // Para evitar agregar source/layer múltiples veces

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
    const handleCreate = () => {
      // Obtener TODAS las features, no solo las nuevas
      const allFeatures = drawRef.current.getAll();
      calculateMeasurements(allFeatures.features);
    };

    const handleUpdate = () => {
      // Obtener TODAS las features, no solo las actualizadas
      const allFeatures = drawRef.current.getAll();
      calculateMeasurements(allFeatures.features);
    };

    const handleDelete = () => {
      // Recalcular con las features restantes
      const allFeatures = drawRef.current.getAll();
      if (allFeatures.features.length > 0) {
        calculateMeasurements(allFeatures.features);
      } else {
        // Si no quedan features, limpiar todo
        setMeasurements([]);
        const source = map.getSource('measurement-labels');
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      }
    };

    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);

    // Cleanup: Solo remover listeners, NO el control ni los labels
    // Esto permite que los dibujos persistan al ocultar la barra
    return () => {
      map.off('draw.create', handleCreate);
      map.off('draw.update', handleUpdate);
      map.off('draw.delete', handleDelete);
      
      // NO removemos el control ni los labels aquí
      // Solo se remueven cuando se llama explícitamente a handleClose()
    };
  }, [map]);

  // Listener para crear círculo al hacer clic/tap en el mapa (desktop + móvil)
  useEffect(() => {
    if (!map || activeTool !== 'circle' || !drawRef.current) return;

    // Cambiar a modo simple_select para permitir clicks en el mapa
    drawRef.current.changeMode('simple_select');

    const handleMapInteraction = (e) => {
      // Prevenir que el evento se propague
      e.preventDefault();
      
      createCircleAtLocation(e.lngLat);
      setActiveTool(null); // Desactivar herramienta después de crear
    };

    // Usar setTimeout para asegurar que el listener se agrega DESPUÉS de MapboxDraw
    const timeoutId = setTimeout(() => {
      // Eventos para desktop (mouse)
      map.on('click', handleMapInteraction);
      // Eventos para móvil (touch)
      map.on('touchend', handleMapInteraction);
      
      // Cambiar cursor para indicar que está en modo círculo
      map.getCanvas().style.cursor = 'crosshair';
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      map.off('click', handleMapInteraction);
      map.off('touchend', handleMapInteraction);
      map.getCanvas().style.cursor = '';
    };
  }, [map, activeTool, circleRadius]);

  // Calcular mediciones con Turf.js
  const calculateMeasurements = (features) => {
    const results = [];

    features.forEach(feature => {
      // LÍNEAS: Mostrar distancia
      if (feature.geometry.type === 'LineString') {
        const line = turf.lineString(feature.geometry.coordinates);
        const length = turf.length(line, { units: 'kilometers' });
        
        results.push({
          id: feature.id,
          type: 'distance',
          value: length,
          unit: 'km',
          label: `${length.toFixed(1)} km`,
          coordinates: feature.geometry.coordinates
        });
      }

      // POLÍGONOS (incluye círculos)
      if (feature.geometry.type === 'Polygon') {
        // Verificar si es un círculo (tiene propiedad custom)
        const isCircle = feature.properties?.isCircle;
        
        if (isCircle) {
          // CÍRCULO: Mostrar radio (no área)
          const radius = feature.properties.radius;
          results.push({
            id: feature.id,
            type: 'circle',
            value: radius,
            unit: 'km',
            label: `Radio: ${radius} km`,
            coordinates: feature.geometry.coordinates
          });
        } else {
          // POLÍGONO NORMAL: Mostrar área
          const polygon = turf.polygon(feature.geometry.coordinates);
          const area = turf.area(polygon) / 1000000; // Convertir m² a km²
          const perimeter = turf.length(turf.polygonToLine(polygon), { units: 'kilometers' });
          
          results.push({
            id: feature.id,
            type: 'area',
            value: area,
            perimeter: perimeter,
            unit: 'km²',
            label: `${area.toFixed(1)} km²`,
            perimeterLabel: `${perimeter.toFixed(1)} km`,
            coordinates: feature.geometry.coordinates
          });
        }
      }
    });

    setMeasurements(results);
    addLabelsToMap(results); // ✅ Agregar labels visuales al mapa
  };

  // Agregar labels al mapa mostrando mediciones directamente en las figuras
  const addLabelsToMap = (measurementsData) => {
    if (!map) return;

    // Agregar source y layer solo una vez
    if (!labelsAddedRef.current) {
      if (!map.getSource('measurement-labels')) {
        map.addSource('measurement-labels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      if (!map.getLayer('measurement-labels')) {
        map.addLayer({
          id: 'measurement-labels',
          type: 'symbol',
          source: 'measurement-labels',
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#22c55e',
            'text-halo-color': '#000000',
            'text-halo-width': 2,
            'text-halo-blur': 1
          }
        });
      }
      labelsAddedRef.current = true;
    }

    // Crear features para los labels
    const labelFeatures = measurementsData.map(m => {
      let coordinates;
      
      if (m.type === 'distance') {
        // Label en el punto medio de la línea
        const line = turf.lineString(m.coordinates);
        const midpoint = turf.along(line, turf.length(line) / 2, { units: 'kilometers' });
        coordinates = midpoint.geometry.coordinates;
      } else if (m.type === 'area' || m.type === 'circle') {
        // Label en el centroide del polígono (incluye círculos)
        const polygon = turf.polygon(m.coordinates);
        const centroid = turf.centroid(polygon);
        coordinates = centroid.geometry.coordinates;
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        properties: {
          label: m.label,
          id: m.id
        }
      };
    }).filter(f => f.geometry.coordinates);

    // Actualizar source con los labels
    const source = map.getSource('measurement-labels');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: labelFeatures
      });
    }
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

    // Marcar como círculo con propiedad custom
    circle.properties = { 
      ...circle.properties,
      isCircle: true,
      radius: circleRadius
    };

    // Agregar como polígono
    drawRef.current.add(circle);
    
    // Recalcular TODAS las mediciones (incluido el nuevo círculo)
    const allFeatures = drawRef.current.getAll();
    calculateMeasurements(allFeatures.features);
  };

  // Limpiar todo
  const clearAll = () => {
    if (!drawRef.current) return;
    drawRef.current.deleteAll();
    setMeasurements([]);
    setActiveTool(null);
    
    // Limpiar labels del mapa
    const source = map?.getSource('measurement-labels');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  };

  // Manejar cierre del componente (botón X - Destructivo)
  const handleClose = () => {
    // Limpiar todos los gráficos antes de cerrar
    clearAll();
    
    // Remover control de MapboxDraw del mapa
    if (drawRef.current && map) {
      try {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      } catch (err) {
        console.warn('Control already removed:', err);
      }
    }
    
    // Remover layers y sources de labels
    if (map) {
      if (map.getLayer('measurement-labels')) {
        map.removeLayer('measurement-labels');
      }
      if (map.getSource('measurement-labels')) {
        map.removeSource('measurement-labels');
      }
      labelsAddedRef.current = false;
    }
    
    // Llamar al callback de cierre
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mini menú flotante de iconos - MINIMALISTA - Debajo del botón Shapes */}
      <div className="fixed left-4 z-30 pointer-events-auto flex flex-col gap-2" style={{ top: '190px' }}>
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

        {/* Selector de colores */}
        <div className="flex gap-1.5">
          {[
            { color: '#22c55e', name: 'Verde (Aliado)' },
            { color: '#3b82f6', name: 'Azul (Neutral)' },
            { color: '#ef4444', name: 'Rojo (Enemigo)' },
            { color: '#f59e0b', name: 'Amarillo (Precaución)' }
          ].map((colorOption) => (
            <button
              key={colorOption.color}
              onClick={() => setSelectedColor(colorOption.color)}
              className={`w-8 h-8 rounded-md transition-all hover:scale-110 ${
                selectedColor === colorOption.color
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: colorOption.color }}
              title={colorOption.name}
            />
          ))}
        </div>

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

        {/* Borrar todo y cerrar */}
        {onClose && (
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-red-900/30 border-2 border-red-500/50 hover:border-red-500 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center hover:bg-red-500/30"
            title="Borrar todos los dibujos y cerrar"
          >
            <X className="w-5 h-5 text-red-400 hover:text-red-300" />
          </button>
        )}
      </div>
    </>
  );
}

