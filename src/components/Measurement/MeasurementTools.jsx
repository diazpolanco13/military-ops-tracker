import { useEffect, useState, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { Ruler, Circle, Pentagon, Trash2, X, Minimize2, Maximize2, Palette, Minus, Plus, ArrowRight, Undo2, Type } from 'lucide-react';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import TextAnnotationTool from './TextAnnotationTool';
import { useDrawingTools } from '../../stores/DrawingToolsContext';

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
  const { activateTool: setGlobalDrawingTool, deactivateTool: clearGlobalDrawingTool } = useDrawingTools();
  const [measurements, setMeasurements] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [circleRadius, setCircleRadius] = useState(100); // km
  const [selectedColor, setSelectedColor] = useState('#22c55e'); // Verde por defecto
  const [lineWidth, setLineWidth] = useState(3); // Grosor de línea (1-8)
  const [lineStyle, setLineStyle] = useState('solid'); // 'solid', 'dashed', 'dotted'
  const [showTextTool, setShowTextTool] = useState(false); // 🆕 Herramienta de texto
  const drawRef = useRef(null);
  const labelsAddedRef = useRef(false); // Para evitar agregar source/layer múltiples veces
  const arrowIdsRef = useRef(new Set()); // Set de IDs de features que son flechas
  const currentToolRef = useRef(null); // Guardar el tool actual para handleCreate
  const historyRef = useRef([]); // Historial de features para deshacer (max 20)

  // Inicializar Mapbox Draw cada vez que se monta el componente
  useEffect(() => {
    if (!map) return;

    // Verificar si ya existe un MapboxDraw en el mapa (por ID de source)
    // Si existe, no crear otro
    if (map.getSource('mapbox-gl-draw-cold')) {
      // Si tenemos referencia, cargar features existentes
      if (drawRef.current) {
        try {
          const allFeatures = drawRef.current.getAll();
          calculateMeasurements(allFeatures.features);
        } catch (err) {
          console.error('Error obteniendo features:', err);
        }
      }
      return;
    }

    // Si hay un draw en el ref pero no en el mapa, limpiar ref
    if (drawRef.current) {
      drawRef.current = null;
    }

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
      // Usar currentToolRef en lugar de activeTool (más confiable)
      if (currentToolRef.current === 'arrow' && e.features) {
        e.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            arrowIdsRef.current.add(feature.id);
          }
        });
      }
      
      // Limpiar currentToolRef después de crear (para que no afecte el siguiente dibujo)
      currentToolRef.current = null;
      
      // 🔓 Desbloquear selección de entidades después de dibujar
      setActiveTool(null);
      clearGlobalDrawingTool();
      
      // Obtener TODAS las features actualizadas
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

  // Actualizar colores de las capas de MapboxDraw cuando cambia el color seleccionado
  useEffect(() => {
    if (!map) return;

    
    // Listar TODAS las capas que contienen "draw" en su ID
    const allLayers = map.getStyle().layers;
    const drawLayers = allLayers.filter(l => l.id.includes('draw') || l.id.includes('gl-draw'));

    // Actualizar paint properties de TODAS las capas de dibujo encontradas
    try {
      drawLayers.forEach(layer => {
        const layerId = layer.id;
        
        // Líneas
        if (layer.type === 'line') {
          map.setPaintProperty(layerId, 'line-color', selectedColor);
        }
        
        // Polígonos (fill)
        if (layer.type === 'fill') {
          map.setPaintProperty(layerId, 'fill-color', selectedColor);
        }
        
        // Círculos (vértices y puntos)
        if (layer.type === 'circle') {
          map.setPaintProperty(layerId, 'circle-color', selectedColor);
        }
      });

      // Actualizar color de labels
      if (map.getLayer('measurement-labels')) {
        map.setPaintProperty('measurement-labels', 'text-color', selectedColor);
      }

      // Actualizar color de puntas de flecha
      if (map.getLayer('arrow-heads')) {
        map.setPaintProperty('arrow-heads', 'text-color', selectedColor);
      }
    } catch (err) {
      console.error('❌ Error actualizando colores:', err);
    }
  }, [map, selectedColor]);

  // Actualizar grosor de líneas Y tamaño de flechas cuando cambia lineWidth
  useEffect(() => {
    if (!map) return;


    try {
      const allLayers = map.getStyle().layers;
      const lineLayers = allLayers.filter(l => 
        (l.id.includes('draw') || l.id.includes('gl-draw')) && l.type === 'line'
      );

      lineLayers.forEach(layer => {
        map.setPaintProperty(layer.id, 'line-width', lineWidth);
      });

      // Actualizar tamaño de flechas proporcionalmente
      if (map.getLayer('arrow-heads')) {
        const newSize = 16 + (lineWidth * 4);
        const newHalo = 1 + lineWidth * 0.3;
        map.setLayoutProperty('arrow-heads', 'text-size', newSize);
        map.setPaintProperty('arrow-heads', 'text-halo-width', newHalo);
      }
    } catch (err) {
      console.error('❌ Error actualizando grosor:', err);
    }
  }, [map, lineWidth]);

  // Actualizar estilo de líneas (sólida, punteada, discontinua)
  useEffect(() => {
    if (!map) return;


    // Configuración de dasharray según estilo
    const dashArrays = {
      solid: [1, 0],         // Línea continua (alternativa a null)
      dashed: [6, 3],        // 6px línea, 3px espacio (más visible)
      dotted: [0.5, 3]       // 0.5px punto, 3px espacio
    };

    try {
      const allLayers = map.getStyle().layers;
      const lineLayers = allLayers.filter(l => 
        (l.id.includes('draw') || l.id.includes('gl-draw')) && l.type === 'line'
      );


      lineLayers.forEach(layer => {
        try {
          // Usar setPaintProperty para line-dasharray (algunos layers lo tienen en paint)
          map.setPaintProperty(layer.id, 'line-dasharray', dashArrays[lineStyle]);
        } catch (paintErr) {
          // Si falla en paint, intentar en layout
          try {
            map.setLayoutProperty(layer.id, 'line-dasharray', dashArrays[lineStyle]);
          } catch (layoutErr) {
            console.warn('⚠️ No se pudo actualizar dasharray en:', layer.id);
          }
        }
      });
    } catch (err) {
      console.error('❌ Error actualizando estilo:', err);
    }
  }, [map, lineStyle]);

  // Atajo de teclado: Ctrl+Z para deshacer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      // LÍNEAS: Mostrar distancia (incluye flechas)
      if (feature.geometry.type === 'LineString') {
        const line = turf.lineString(feature.geometry.coordinates);
        const length = turf.length(line, { units: 'kilometers' });
        
        // Verificar si es una flecha (consultar el Set de IDs)
        const isArrow = arrowIdsRef.current.has(feature.id);
        
        results.push({
          id: feature.id,
          type: isArrow ? 'arrow' : 'distance',
          isArrow: isArrow,
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

  // Agregar labels y flechas al mapa
  const addLabelsToMap = (measurementsData) => {
    if (!map) return;

    // Agregar source y layers solo una vez
    if (!labelsAddedRef.current) {
      // Source para labels de texto
      if (!map.getSource('measurement-labels')) {
        map.addSource('measurement-labels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Source para puntas de flecha
      if (!map.getSource('arrow-heads')) {
        map.addSource('arrow-heads', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Layer para labels de texto
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
            'text-color': selectedColor,
            'text-halo-color': '#000000',
            'text-halo-width': 2,
            'text-halo-blur': 1
          }
        });
      } else {
        map.setPaintProperty('measurement-labels', 'text-color', selectedColor);
      }

      // Layer para puntas de flecha usando símbolos de texto
      if (!map.getLayer('arrow-heads')) {
        map.addLayer({
          id: 'arrow-heads',
          type: 'symbol',
          source: 'arrow-heads',
          layout: {
            'text-field': '▶',
            'text-size': 16 + (lineWidth * 4), // Escala con grosor: 20-48px
            'text-rotate': ['get', 'bearing'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true
          },
          paint: {
            'text-color': selectedColor,
            'text-halo-color': '#000000',
            'text-halo-width': 1 + lineWidth * 0.3 // Halo proporcional
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

    // Crear puntas de flecha para líneas marcadas como flechas
    const arrowsOnly = measurementsData.filter(m => m.type === 'arrow' || m.isArrow);
    
    const arrowHeads = arrowsOnly
      .map(m => {
        // Obtener el último punto de la línea (donde va la flecha)
        const coords = m.coordinates;
        const lastPoint = coords[coords.length - 1];
        const secondLastPoint = coords[coords.length - 2];

        if (!lastPoint || !secondLastPoint) return null;

        // Calcular el ángulo de la línea para rotar la flecha
        // turf.bearing devuelve ángulo en grados (-180 a 180)
        // Mapbox necesita 0-360 con 0 = Norte
        let bearing = turf.bearing(
          turf.point(secondLastPoint),
          turf.point(lastPoint)
        );
        
        // Ajustar bearing: turf.bearing usa Norte=0, Este=90
        // Pero el símbolo ▶ apunta a la derecha (Este), necesitamos rotar -90°
        bearing = bearing - 90;

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: lastPoint
          },
          properties: {
            bearing: bearing
          }
        };
      })
      .filter(f => f);

    // Actualizar source de puntas de flecha
    const arrowSource = map.getSource('arrow-heads');
    if (arrowSource) {
      arrowSource.setData({
        type: 'FeatureCollection',
        features: arrowHeads
      });
    } else {
      console.warn('⚠️ Source arrow-heads no existe');
    }
  };

  // Activar herramienta de línea
  const activateLineTool = () => {
    if (!drawRef.current) return;
    currentToolRef.current = 'line'; // Guardar en ref
    drawRef.current.changeMode('draw_line_string');
    setActiveTool('line');
    setGlobalDrawingTool('line'); // 🔒 Bloquear selección de entidades
  };

  // Activar herramienta de polígono
  const activatePolygonTool = () => {
    if (!drawRef.current) return;
    currentToolRef.current = 'polygon'; // Guardar en ref
    drawRef.current.changeMode('draw_polygon');
    setActiveTool('polygon');
    setGlobalDrawingTool('polygon'); // 🔒 Bloquear selección de entidades
  };

  // Activar modo círculo (no crea círculo aún, espera click en mapa)
  const activateCircleTool = () => {
    currentToolRef.current = 'circle'; // Guardar en ref
    setActiveTool('circle');
    setGlobalDrawingTool('circle'); // 🔒 Bloquear selección de entidades
    // No crear círculo aquí, esperar a que usuario haga clic en el mapa
  };

  // Activar herramienta de flecha (dibuja línea con punta de flecha)
  const activateArrowTool = () => {
    if (!drawRef.current) return;
    currentToolRef.current = 'arrow'; // Guardar en ref
    drawRef.current.changeMode('draw_line_string');
    setActiveTool('arrow');
    setGlobalDrawingTool('arrow'); // 🔒 Bloquear selección de entidades
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
    
    // 🔓 Desbloquear selección de entidades después de crear círculo
    setActiveTool(null);
    clearGlobalDrawingTool();
    
    // Recalcular TODAS las mediciones (incluido el nuevo círculo)
    const allFeatures = drawRef.current.getAll();
    calculateMeasurements(allFeatures.features);
  };

  // Deshacer última acción
  const undoLast = () => {
    if (!drawRef.current) return;
    
    try {
      const allFeatures = drawRef.current.getAll();
      
      if (allFeatures.features.length === 0) return;
      
      // Eliminar la última feature creada
      const lastFeature = allFeatures.features[allFeatures.features.length - 1];
      drawRef.current.delete(lastFeature.id);
      
      // Eliminar del set de flechas si es una flecha
      arrowIdsRef.current.delete(lastFeature.id);
      
      // Recalcular mediciones
      const updatedFeatures = drawRef.current.getAll();
      calculateMeasurements(updatedFeatures.features);
    } catch (err) {
      console.error('Error en undo:', err);
    }
  };

  // Limpiar todo
  const clearAll = () => {
    if (!drawRef.current) return;
    
    try {
      drawRef.current.deleteAll();
      setMeasurements([]);
      setActiveTool(null);
      arrowIdsRef.current.clear(); // Limpiar set de flechas
      
      // Limpiar labels y flechas del mapa
      const labelsSource = map?.getSource('measurement-labels');
      if (labelsSource) {
        labelsSource.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      
      const arrowsSource = map?.getSource('arrow-heads');
      if (arrowsSource) {
        arrowsSource.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
    } catch (err) {
      console.error('Error en clearAll:', err);
    }
  };

  // Manejar cierre del componente (botón X - Destructivo)
  const handleClose = () => {
    // 1. Limpiar todos los gráficos dibujados
    if (drawRef.current) {
      try {
        drawRef.current.deleteAll();
      } catch (err) {
        console.warn('Error deleting all:', err);
      }
    }
    
    // 2. Remover control de MapboxDraw del mapa
    if (drawRef.current && map) {
      try {
        map.removeControl(drawRef.current);
        drawRef.current = null; // ✅ Limpiar referencia para forzar recreación
      } catch (err) {
        console.warn('Control already removed:', err);
      }
    }
    
    // 3. Remover layers y sources de labels y flechas
    if (map) {
      try {
        if (map.getLayer('measurement-labels')) {
          map.removeLayer('measurement-labels');
        }
        if (map.getSource('measurement-labels')) {
          map.removeSource('measurement-labels');
        }
        if (map.getLayer('arrow-heads')) {
          map.removeLayer('arrow-heads');
        }
        if (map.getSource('arrow-heads')) {
          map.removeSource('arrow-heads');
        }
        labelsAddedRef.current = false;
      } catch (err) {
        console.warn('Error removing labels:', err);
      }
    }
    
    // 4. Limpiar estado local
    setMeasurements([]);
    setActiveTool(null);
    
    // 5. Llamar al callback de cierre
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Herramienta de anotaciones de texto */}
      {showTextTool && (
        <TextAnnotationTool
          mapInstance={map}
          isActive={showTextTool}
          onClose={() => setShowTextTool(false)}
        />
      )}

      {/* Mini menú flotante de iconos - MINIMALISTA - Debajo del botón Shapes */}
      <div className="fixed left-4 z-30 pointer-events-auto flex flex-col gap-2" style={{ top: '190px' }}>
        {/* Herramienta de texto/anotaciones */}
        <button
          onClick={() => setShowTextTool(!showTextTool)}
          className={`w-10 h-10 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center ${
            showTextTool
              ? 'bg-yellow-500 border-2 border-yellow-400'
              : 'bg-slate-900/95 border-2 border-slate-700 hover:border-yellow-500'
          }`}
          title="Anotaciones de Texto (Agregar etiquetas al mapa)"
        >
          <Type className={`w-5 h-5 ${showTextTool ? 'text-white' : 'text-yellow-400'}`} />
        </button>

        {/* Separador si hay herramienta de texto activa */}
        {showTextTool && <div className="h-px bg-slate-700 my-1"></div>}

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

        {/* Flecha direccional */}
        <button
          onClick={activateArrowTool}
          className={`w-10 h-10 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center ${
            activeTool === 'arrow'
              ? 'bg-purple-500 border-2 border-purple-400'
              : 'bg-slate-900/95 border-2 border-slate-700 hover:border-purple-500'
          }`}
          title="Flecha Direccional (Indica movimiento/ruta)"
        >
          <ArrowRight className={`w-5 h-5 ${activeTool === 'arrow' ? 'text-white' : 'text-purple-400'}`} />
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

        {/* Control de grosor */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 5, 8].map((width) => (
            <button
              key={width}
              onClick={() => setLineWidth(width)}
              className={`w-8 h-8 rounded-md bg-slate-800/50 border transition-all hover:scale-110 flex items-center justify-center ${
                lineWidth === width
                  ? 'border-white bg-slate-700'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              title={`Grosor: ${width}px`}
            >
              <div 
                className="bg-white rounded-full" 
                style={{ 
                  width: `${Math.min(width * 2, 16)}px`, 
                  height: `${Math.min(width * 2, 16)}px` 
                }}
              />
            </button>
          ))}
        </div>

        {/* Estilo de línea */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setLineStyle('solid')}
            className={`flex-1 h-8 rounded-md bg-slate-800/50 border transition-all hover:scale-105 flex items-center justify-center ${
              lineStyle === 'solid'
                ? 'border-white bg-slate-700'
                : 'border-slate-700 hover:border-slate-500'
            }`}
            title="Línea Sólida"
          >
            <div className="w-6 h-0.5 bg-white rounded"></div>
          </button>
          <button
            onClick={() => setLineStyle('dashed')}
            className={`flex-1 h-8 rounded-md bg-slate-800/50 border transition-all hover:scale-105 flex items-center justify-center ${
              lineStyle === 'dashed'
                ? 'border-white bg-slate-700'
                : 'border-slate-700 hover:border-slate-500'
            }`}
            title="Línea Discontinua"
          >
            <div className="flex gap-0.5">
              <div className="w-1.5 h-0.5 bg-white"></div>
              <div className="w-1.5 h-0.5 bg-white"></div>
              <div className="w-1.5 h-0.5 bg-white"></div>
            </div>
          </button>
          <button
            onClick={() => setLineStyle('dotted')}
            className={`flex-1 h-8 rounded-md bg-slate-800/50 border transition-all hover:scale-105 flex items-center justify-center ${
              lineStyle === 'dotted'
                ? 'border-white bg-slate-700'
                : 'border-slate-700 hover:border-slate-500'
            }`}
            title="Línea Punteada"
          >
            <div className="flex gap-0.5">
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
            </div>
          </button>
        </div>

        {/* Separador */}
        <div className="h-px bg-slate-700 my-1"></div>

        {/* Deshacer última acción */}
        <button
          onClick={undoLast}
          className="w-10 h-10 bg-slate-900/95 border-2 border-yellow-500/50 hover:border-yellow-500 rounded-lg backdrop-blur-md shadow-lg transition-all hover:scale-110 flex items-center justify-center hover:bg-yellow-500/20"
          title="Deshacer (Ctrl+Z) - Elimina el último dibujo"
        >
          <Undo2 className="w-5 h-5 text-yellow-400" />
        </button>

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

