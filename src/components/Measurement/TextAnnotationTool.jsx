import React, { useState, useRef, useEffect } from 'react';
import { Type, X, Edit2, Move, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { useDrawingTools } from '../../stores/DrawingToolsContext';

const TextAnnotationTool = ({ mapInstance, isActive, onClose }) => {
  const { activateTool: setGlobalDrawingTool, deactivateTool: clearGlobalDrawingTool } = useDrawingTools();
  const [annotations, setAnnotations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [selectedSize, setSelectedSize] = useState('medium');
  const [isPanelMinimized, setIsPanelMinimized] = useState(false); // 🆕 Panel minimizado
  const dragStartPos = useRef({ x: 0, y: 0 });
  const annotationStartPos = useRef({ x: 0, y: 0 });

  // Tamaños de anotaciones
  const SIZES = {
    small: {
      fontSize: 'text-xs',
      padding: 'px-2 py-1',
      icon: Minimize2,
      label: 'Pequeña'
    },
    medium: {
      fontSize: 'text-sm',
      padding: 'px-3 py-1.5',
      icon: Type,
      label: 'Mediana'
    },
    large: {
      fontSize: 'text-lg',
      padding: 'px-4 py-2',
      icon: Maximize2,
      label: 'Grande'
    }
  };

  // Agregar anotación al hacer click en el mapa
  useEffect(() => {
    if (!mapInstance || !isActive) return;

    // 🔒 Bloquear selección de entidades mientras la herramienta está activa
    setGlobalDrawingTool('text');

    const handleMapClick = (e) => {
      const { lng, lat } = e.lngLat;
      const { x, y } = e.point;

      const newAnnotation = {
        id: Date.now(),
        text: 'Nueva etiqueta',
        lng,
        lat,
        x,
        y,
        size: selectedSize,
        isEditing: true
      };

      setAnnotations(prev => [...prev, newAnnotation]);
      setEditingId(newAnnotation.id);
    };

    mapInstance.getCanvas().style.cursor = 'crosshair';
    mapInstance.on('click', handleMapClick);

    return () => {
      mapInstance.getCanvas().style.cursor = '';
      mapInstance.off('click', handleMapClick);
      // 🔓 Desbloquear cuando se desactiva
      clearGlobalDrawingTool();
    };
  }, [mapInstance, isActive, selectedSize, setGlobalDrawingTool, clearGlobalDrawingTool]);

  // Actualizar posiciones al mover/zoom el mapa
  useEffect(() => {
    if (!mapInstance) return;

    const updatePositions = () => {
      setAnnotations(prev => prev.map(ann => {
        const point = mapInstance.project([ann.lng, ann.lat]);
        return { ...ann, x: point.x, y: point.y };
      }));
    };

    mapInstance.on('move', updatePositions);
    mapInstance.on('zoom', updatePositions);

    return () => {
      mapInstance.off('move', updatePositions);
      mapInstance.off('zoom', updatePositions);
    };
  }, [mapInstance]);

  // Actualizar texto
  const handleTextChange = (id, newText) => {
    setAnnotations(prev => prev.map(ann =>
      ann.id === id ? { ...ann, text: newText } : ann
    ));
  };

  // Finalizar edición
  const handleFinishEditing = (id) => {
    setEditingId(null);
    setAnnotations(prev => prev.map(ann =>
      ann.id === id ? { ...ann, isEditing: false } : ann
    ));
  };

  // Iniciar edición
  const handleStartEditing = (id) => {
    setEditingId(id);
    setAnnotations(prev => prev.map(ann =>
      ann.id === id ? { ...ann, isEditing: true } : ann
    ));
  };

  // Eliminar anotación
  const handleDelete = (id) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  // Iniciar drag
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setDraggingId(id);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const ann = annotations.find(a => a.id === id);
    annotationStartPos.current = { x: ann.x, y: ann.y };
  };

  // Durante drag
  useEffect(() => {
    if (draggingId === null) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      setAnnotations(prev => prev.map(ann => {
        if (ann.id === draggingId) {
          const newX = annotationStartPos.current.x + deltaX;
          const newY = annotationStartPos.current.y + deltaY;
          const lngLat = mapInstance.unproject([newX, newY]);
          return {
            ...ann,
            x: newX,
            y: newY,
            lng: lngLat.lng,
            lat: lngLat.lat
          };
        }
        return ann;
      }));
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, mapInstance]);

  if (!isActive) return null;

  return (
    <>
      {/* Panel de control - MINIMIZABLE */}
      <div className="absolute top-24 left-4 z-[35] bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg shadow-2xl w-72">
        {/* Header - Siempre visible */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-600/20 p-1.5 rounded border border-yellow-500/50">
              <Type size={16} className="text-yellow-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Anotaciones de Texto</h3>
            {annotations.length > 0 && (
              <span className="bg-yellow-600/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded border border-yellow-500/50">
                {annotations.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
              title={isPanelMinimized ? "Expandir panel" : "Minimizar panel"}
            >
              {isPanelMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-600/20 rounded text-slate-400 hover:text-red-400 transition-colors"
              title="Cerrar herramienta"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenido - Colapsable */}
        {!isPanelMinimized && (
          <div className="p-4 space-y-3">
            {/* Selector de tamaño */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Tamaño de etiqueta:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SIZES).map(([size, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                        selectedSize === size
                          ? 'bg-yellow-600/30 border-yellow-500 text-yellow-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-xs">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 space-y-1">
              <p className="text-xs text-yellow-300 font-semibold">Instrucciones:</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• <strong>Click en el mapa</strong> para agregar etiqueta</li>
                <li>• <strong>Arrastra</strong> para mover</li>
                <li>• <strong>Click doble</strong> para editar</li>
                <li>• <strong>Botón X</strong> para eliminar</li>
              </ul>
            </div>

            {/* Botón limpiar todo */}
            {annotations.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Eliminar todas las anotaciones?')) {
                    setAnnotations([]);
                  }
                }}
                className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 text-xs py-2 rounded-lg transition-colors font-semibold"
              >
                Eliminar todas ({annotations.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Renderizar anotaciones en el mapa */}
      {annotations.map(ann => {
        const sizeConfig = SIZES[ann.size];
        const isEditing = editingId === ann.id;
        const isDragging = draggingId === ann.id;

        return (
          <div
            key={ann.id}
            style={{
              position: 'absolute',
              left: `${ann.x}px`,
              top: `${ann.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => !isEditing && handleMouseDown(e, ann.id)}
            onDoubleClick={() => !isEditing && handleStartEditing(ann.id)}
          >
            <div
              className={`
                ${sizeConfig.fontSize} ${sizeConfig.padding}
                bg-gradient-to-br from-slate-800 to-slate-900 
                border-2 border-yellow-500/70
                text-yellow-400 font-bold
                rounded-lg shadow-2xl
                relative
                select-none
                ${isDragging ? 'opacity-80 scale-105' : 'opacity-100'}
                transition-all duration-150
              `}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {/* Indicador de arrastre */}
              {!isEditing && (
                <div className="absolute -left-1 -top-1 bg-blue-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move size={10} className="text-white" />
                </div>
              )}

              {/* Input editable o texto */}
              {isEditing ? (
                <input
                  type="text"
                  value={ann.text}
                  onChange={(e) => handleTextChange(ann.id, e.target.value)}
                  onBlur={() => handleFinishEditing(ann.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishEditing(ann.id);
                    if (e.key === 'Escape') handleFinishEditing(ann.id);
                  }}
                  autoFocus
                  className={`
                    ${sizeConfig.fontSize}
                    bg-transparent border-none outline-none text-yellow-400 font-bold
                    w-full min-w-[100px]
                  `}
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                />
              ) : (
                <span className="whitespace-nowrap">{ann.text}</span>
              )}

              {/* Botón eliminar */}
              {!isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ann.id);
                  }}
                  className="absolute -right-2 -top-2 bg-red-600 hover:bg-red-700 rounded-full p-1 shadow-lg transition-colors"
                  title="Eliminar anotación"
                >
                  <X size={12} className="text-white" />
                </button>
              )}

              {/* Flecha apuntando al punto */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid rgba(234, 179, 8, 0.7)',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
                }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
};

export default TextAnnotationTool;

