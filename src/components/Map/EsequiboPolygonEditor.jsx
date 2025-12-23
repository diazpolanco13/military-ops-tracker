/**
 * 🔧 Editor de Polígono del Esequibo
 * 
 * Permite editar visualmente los vértices del polígono de la zona en reclamación.
 * El usuario puede arrastrar los puntos para ajustar el polígono al mapa.
 * 
 * Cuando termines de editar, presiona "Exportar Coordenadas" y
 * se copiarán al portapapeles para guardarlas permanentemente.
 */

import { useEffect, useState, useCallback } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { ESEQUIBO_CLAIM_ZONE } from '../../data/esequiboClaimZone';
import { Download, Save, X, RotateCcw } from 'lucide-react';

export default function EsequiboPolygonEditor({ map, visible, onClose }) {
  const [draw, setDraw] = useState(null);
  const [vertexCount, setVertexCount] = useState(0);
  const [lastExport, setLastExport] = useState(null);

  // Inicializar MapboxDraw
  useEffect(() => {
    if (!map || !visible) return;

    // Configurar estilos del Draw
    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        trash: false,
      },
      styles: [
        // Estilo del polígono
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#ef4444',
            'fill-opacity': 0.3,
          },
        },
        // Borde del polígono
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#ef4444',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        },
        // Líneas de edición
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString']],
          paint: {
            'line-color': '#fbbf24',
            'line-width': 2,
          },
        },
        // Vértices (puntos editables)
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#fbbf24',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        },
        // Punto medio (para añadir nuevos vértices)
        {
          id: 'gl-draw-point-midpoint',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#22c55e',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
          },
        },
      ],
    });

    map.addControl(drawInstance, 'top-left');
    setDraw(drawInstance);

    // Añadir el polígono de Guyana
    const feature = ESEQUIBO_CLAIM_ZONE.features[0];
    drawInstance.add(feature);
    
    // Seleccionar el polígono para editarlo
    const ids = drawInstance.getAll().features.map((f) => f.id);
    if (ids.length > 0) {
      drawInstance.changeMode('direct_select', { featureId: ids[0] });
    }

    setVertexCount(feature.geometry.coordinates[0].length);

    // Evento cuando se actualizan los puntos
    const onUpdate = () => {
      const data = drawInstance.getAll();
      if (data.features.length > 0) {
        const coords = data.features[0].geometry.coordinates[0];
        setVertexCount(coords.length);
      }
    };

    map.on('draw.update', onUpdate);
    map.on('draw.selectionchange', onUpdate);

    return () => {
      map.off('draw.update', onUpdate);
      map.off('draw.selectionchange', onUpdate);
      if (map.hasControl(drawInstance)) {
        map.removeControl(drawInstance);
      }
    };
  }, [map, visible]);

  // Exportar coordenadas
  const handleExport = useCallback(() => {
    if (!draw) return;

    const data = draw.getAll();
    if (data.features.length === 0) {
      alert('No hay polígono para exportar');
      return;
    }

    const coordinates = data.features[0].geometry.coordinates[0];
    
    // Formatear las coordenadas para copiar
    const formattedCoords = coordinates
      .map(([lng, lat]) => `          [${lng.toFixed(6)}, ${lat.toFixed(6)}],`)
      .join('\n');

    const fullExport = `// Coordenadas del Polígono Esequibo - Editadas manualmente
// Total de vértices: ${coordinates.length}
// Fecha: ${new Date().toISOString()}

coordinates: [[
${formattedCoords}
]]`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(fullExport).then(() => {
      setLastExport(new Date().toLocaleTimeString());
      alert('✅ Coordenadas copiadas al portapapeles!\n\nPégalas en la consola o envíamelas para guardarlas permanentemente.');
    }).catch(() => {
      // Fallback: mostrar en consola
      console.log('📍 COORDENADAS EDITADAS:');
      console.log(fullExport);
      alert('Las coordenadas se mostraron en la consola del navegador (F12)');
    });
  }, [draw]);

  // Restablecer polígono original
  const handleReset = useCallback(() => {
    if (!draw) return;
    
    if (confirm('¿Restablecer el polígono original? Se perderán todos los cambios.')) {
      draw.deleteAll();
      draw.add(ESEQUIBO_CLAIM_ZONE.features[0]);
      
      const ids = draw.getAll().features.map((f) => f.id);
      if (ids.length > 0) {
        draw.changeMode('direct_select', { featureId: ids[0] });
      }
      
      setVertexCount(ESEQUIBO_CLAIM_ZONE.features[0].geometry.coordinates[0].length);
    }
  }, [draw]);

  if (!visible) return null;

  return (
    <>
      {/* Panel de control del editor */}
      <div className="absolute top-20 left-4 z-50 bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700 p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            <h3 className="text-white font-semibold">Editor de Polígono</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Instrucciones */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm">
            <p className="text-amber-400 font-medium mb-2">📍 Instrucciones:</p>
            <ul className="text-slate-300 space-y-1 text-xs">
              <li>• <strong>Arrastra</strong> los puntos amarillos para mover vértices</li>
              <li>• <strong>Clic</strong> en puntos verdes para añadir nuevos vértices</li>
              <li>• <strong>Delete/Backspace</strong> para eliminar un vértice seleccionado</li>
            </ul>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Vértices:</span>
            <span className="text-white font-mono">{vertexCount}</span>
          </div>

          {lastExport && (
            <div className="text-xs text-green-400">
              ✓ Última exportación: {lastExport}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Nota importante */}
          <p className="text-xs text-slate-500 italic">
            Cuando termines, exporta las coordenadas y envíamelas para guardarlas permanentemente.
          </p>
        </div>
      </div>

      {/* Indicador visual en el mapa */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-amber-500/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          Modo Edición Activo - Arrastra los puntos para ajustar
        </div>
      </div>
    </>
  );
}

