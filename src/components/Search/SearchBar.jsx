import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, MapPin, Ship, Plane, Users, Truck } from 'lucide-react';
import { useEntities } from '../../hooks/useEntities';

/**
 * 🔍 Barra de Búsqueda Siempre Visible
 * Flotando en la parte superior del mapa, limpia y elegante
 */
export default function SearchBar({ map, isVisible }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { entities } = useEntities();
  const inputRef = useRef(null);

  // Filtrar entidades según la búsqueda
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    
    return entities.filter(entity => 
      entity.name?.toLowerCase().includes(query) ||
      entity.type?.toLowerCase().includes(query) ||
      entity.class?.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [entities, searchQuery]);

  // Obtener icono según tipo de entidad
  const getEntityIcon = (type) => {
    const iconMap = {
      destructor: Ship,
      fragata: Ship,
      portaaviones: Ship,
      submarino: Ship,
      patrullero: Ship,
      avion: Plane,
      caza: Plane,
      helicoptero: Plane,
      drone: Plane,
      tropas: Users,
      insurgente: Users,
      vehiculo: Truck,
      tanque: Truck
    };
    
    const IconComponent = iconMap[type?.toLowerCase()] || MapPin;
    return <IconComponent className="w-4 h-4" />;
  };

  // Obtener color según tipo
  const getTypeColor = (type) => {
    const colorMap = {
      destructor: 'text-blue-400',
      fragata: 'text-blue-300',
      portaaviones: 'text-blue-500',
      submarino: 'text-cyan-400',
      patrullero: 'text-sky-400',
      avion: 'text-purple-400',
      caza: 'text-purple-500',
      helicoptero: 'text-purple-300',
      drone: 'text-violet-400',
      tropas: 'text-green-400',
      insurgente: 'text-red-400',
      vehiculo: 'text-yellow-400',
      tanque: 'text-orange-400'
    };
    
    return colorMap[type?.toLowerCase()] || 'text-slate-400';
  };

  // Manejar click en entidad
  const handleEntityClick = (entity) => {
    if (!map || !entity.latitude || !entity.longitude) return;

    // Centrar mapa en la entidad con animación (zoom 9 ≈ 20km)
    map.flyTo({
      center: [entity.longitude, entity.latitude],
      zoom: 9,
      duration: 2000,
      essential: true
    });

    // Limpiar búsqueda y cerrar resultados
    setSearchQuery('');
    inputRef.current?.blur();
  };

  // Manejar Escape para cerrar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // No renderizar si no es visible
  if (!isVisible) return null;

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-35 w-full max-w-2xl px-4 transition-all duration-300"
      style={{ top: '72px' }}
    >
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Buscar entidad por nombre, tipo o clase..."
          className="w-full pl-12 pr-12 py-3 bg-slate-900/95 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg backdrop-blur-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Resultados */}
      {searchQuery && (isFocused || filteredEntities.length > 0) && (
        <div className="mt-2 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header con contador */}
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
            <div className="text-slate-400 text-xs">
              {filteredEntities.length > 0 ? (
                <>
                  <span className="text-white font-semibold">{filteredEntities.length}</span> {filteredEntities.length === 1 ? 'resultado' : 'resultados'}
                </>
              ) : (
                <span className="text-red-400">Sin resultados</span>
              )}
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="max-h-[400px] overflow-y-auto modern-scrollbar">
            {filteredEntities.length > 0 ? (
              filteredEntities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => handleEntityClick(entity)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/80 border-b border-slate-800/30 last:border-b-0 transition-all group text-left"
                >
                  {/* Icono */}
                  <div className={`flex-shrink-0 ${getTypeColor(entity.type)}`}>
                    {getEntityIcon(entity.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                      {entity.name}
                    </div>
                    <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="capitalize">{entity.type}</span>
                      {entity.class && (
                        <>
                          <span>•</span>
                          <span className="truncate">{entity.class}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cantidad y Pin */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* Cantidad de unidades */}
                    {entity.quantity && entity.quantity > 1 && (
                      <div className="px-2 py-1 bg-blue-900/30 border border-blue-500/50 rounded-md">
                        <span className="text-blue-400 text-xs font-bold">
                          {entity.quantity >= 1000 
                            ? `${(entity.quantity / 1000).toFixed(1)}k`
                            : entity.quantity
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Pin de ubicación */}
                    {entity.latitude && entity.longitude && (
                      <div className="text-slate-600 text-xs group-hover:text-blue-500 transition-colors">
                        <MapPin className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No se encontró ninguna entidad con "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

