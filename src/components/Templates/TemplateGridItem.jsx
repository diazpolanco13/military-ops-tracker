import { Star } from 'lucide-react';
import { useState } from 'react';
import { getTemplateIcon, getEntityIcon } from '../../config/i2Icons';

/**
 * Item de plantilla en vista de cuadrícula tipo IBM i2 Analyst's Notebook
 * Muestra solo icono y nombre, optimizado para visualización rápida
 */
export default function TemplateGridItem({ template, onDragStart, onClick, isFavorite, onToggleFavorite }) {
  const [isDragging, setIsDragging] = useState(false);

  // Obtener icono i2
  const iconPath = getTemplateIcon(template.code) || getEntityIcon(template.entity_type);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(template));
    
    // Imagen de drag invisible
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
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
        flex flex-col items-center justify-center
        bg-slate-800 border border-slate-700 rounded-lg
        p-3 cursor-grab
        transition-all duration-200
        hover:bg-slate-700 hover:border-blue-500 hover:scale-105
        hover:shadow-lg hover:shadow-blue-500/20
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        ${isFavorite ? 'ring-2 ring-yellow-500/50' : ''}
      `}
      title={template.display_name}
    >
      {/* Botón favorito - solo visible en hover */}
      <button
        onClick={handleToggleFavorite}
        className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-600 transition-all z-10"
      >
        <Star
          size={12}
          className={`${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'}`}
        />
      </button>

      {/* Icono i2 grande */}
      <div className="flex items-center justify-center w-12 h-12 mb-2">
        {iconPath ? (
          <img 
            src={iconPath} 
            alt={template.display_name}
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
          />
        ) : (
          <div 
            className="w-full h-full rounded-lg flex items-center justify-center text-2xl font-bold"
            style={{ 
              backgroundColor: `${template.icon_color}20`,
              color: template.icon_color 
            }}
          >
            {template.display_name.charAt(0)}
          </div>
        )}
      </div>

      {/* Nombre de la plantilla */}
      <div className="text-center w-full">
        <p className="text-xs font-medium text-white truncate px-1">
          {template.display_name}
        </p>
        {template.usage_count > 0 && (
          <p className="text-[10px] text-slate-500 mt-0.5">
            {template.usage_count} en uso
          </p>
        )}
      </div>

      {/* Indicador de arrastre - solo en hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <span className="text-[10px] text-blue-400 bg-slate-900/80 px-2 py-0.5 rounded whitespace-nowrap">
            🖱️ Arrastrar
          </span>
        </div>
      </div>

      {/* Efecto de arrastre activo */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-400 border-dashed rounded-lg" />
      )}
    </div>
  );
}

