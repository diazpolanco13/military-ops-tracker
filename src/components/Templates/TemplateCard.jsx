import { Ship, Plane, Users, Shield, Star } from 'lucide-react';
import { useState } from 'react';

/**
 * Tarjeta de plantilla arrastrable tipo IBM Analyst's Notebook
 * Muestra información resumida y permite arrastrar al mapa
 */
export default function TemplateCard({ template, onDragStart, onClick, isFavorite, onToggleFavorite }) {
  const [isDragging, setIsDragging] = useState(false);

  // Iconos por tipo de entidad
  const ENTITY_ICONS = {
    destructor: Ship,
    fragata: Ship,
    portaaviones: Ship,
    submarino: Ship,
    avion: Plane,
    tropas: Users,
    tanque: Shield,
  };

  const Icon = ENTITY_ICONS[template.entity_type] || Ship;

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(template));
    
    // Crear una imagen de drag vacía para que no tape nada
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Callback para el padre
    if (onDragStart) {
      onDragStart(template, e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(template);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(template.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`
        relative group
        bg-slate-800 border border-slate-700 rounded-lg 
        transition-all duration-200 cursor-grab
        hover:bg-slate-700 hover:border-blue-500 hover:scale-[1.02]
        hover:shadow-lg hover:shadow-blue-500/20
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        ${isFavorite ? 'border-l-4 border-l-yellow-500' : ''}
      `}
    >
      {/* Badge de favorito */}
      <button
        onClick={handleToggleFavorite}
        className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-slate-600 transition-colors"
        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Star
          size={14}
          className={`${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'}`}
        />
      </button>

      {/* Contenido principal */}
      <div className="p-3 space-y-2">
        {/* Icono y nombre */}
        <div className="flex items-start space-x-2">
          <div
            className="flex-shrink-0 p-2 rounded-lg"
            style={{ backgroundColor: `${template.icon_color}20` }}
          >
            <Icon
              size={24}
              style={{ color: template.icon_color }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate pr-4">
              {template.display_name}
            </h3>
            <p className="text-xs text-slate-400">
              {template.class || template.name}
            </p>
          </div>
        </div>

        {/* Especificaciones clave */}
        <div className="grid grid-cols-2 gap-1 text-xs text-slate-300">
          {template.length_meters && (
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">📏</span>
              <span>{template.length_meters}m</span>
            </div>
          )}
          {template.displacement_tons && (
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">⚖️</span>
              <span>{template.displacement_tons.toLocaleString()}t</span>
            </div>
          )}
          {template.max_speed_knots && (
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">⚡</span>
              <span>{template.max_speed_knots} kn</span>
            </div>
          )}
          {template.crew_count && (
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">👥</span>
              <span>{template.crew_count}</span>
            </div>
          )}
        </div>

        {/* Badge de país y era */}
        <div className="flex items-center justify-between pt-1">
          {template.country_origin && (
            <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
              {template.country_origin}
            </span>
          )}
          {template.usage_count > 0 && (
            <span className="text-xs text-slate-500">
              {template.usage_count} en mapa
            </span>
          )}
        </div>

        {/* Indicador de arrastrable */}
        <div className="pt-2 border-t border-slate-700 text-center">
          <span className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
            🖱️ Arrastrar al mapa
          </span>
        </div>
      </div>

      {/* Efecto de arrastre */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

