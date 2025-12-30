import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, MapPin, Ship, Plane, Users, Truck, Radio, Database, Navigation } from 'lucide-react';
import { useEntities } from '../../hooks/useEntities';
import { useFlightRadar } from '../../hooks/useFlightRadar';
import { useAircraftRegistry } from '../../hooks/useAircraftRegistry';

/**
 * 🔍 Barra de Búsqueda Unificada
 * Busca en: Entidades del mapa, Vuelos activos (FlightRadar24), Inventario de aeronaves
 */
export default function SearchBar({ map, isVisible, onAircraftSelect, onFlightSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { entities } = useEntities();
  const { flights } = useFlightRadar();
  const { aircraft: inventoryAircraft } = useAircraftRegistry();
  const inputRef = useRef(null);

  // Combinar resultados de todas las fuentes
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { entities: [], flights: [], inventory: [], total: 0 };

    const query = searchQuery.toLowerCase();
    
    // 1. Entidades del mapa
    const filteredEntities = entities.filter(entity => 
      entity.name?.toLowerCase().includes(query) ||
      entity.type?.toLowerCase().includes(query) ||
      entity.class?.toLowerCase().includes(query)
    ).slice(0, 5);

    // 2. Vuelos activos (FlightRadar24)
    const filteredFlights = (flights || []).filter(flight => 
      flight.callsign?.toLowerCase().includes(query) ||
      flight.aircraft?.model?.toLowerCase().includes(query) ||
      flight.aircraft?.type?.toLowerCase().includes(query) ||
      flight.registration?.toLowerCase().includes(query) ||
      flight.airline?.name?.toLowerCase().includes(query)
    ).slice(0, 5);

    // 3. Inventario de aeronaves
    const filteredInventory = (inventoryAircraft || []).filter(aircraft => 
      aircraft.icao24?.toLowerCase().includes(query) ||
      aircraft.registration?.toLowerCase().includes(query) ||
      aircraft.aircraft_type?.toLowerCase().includes(query) ||
      aircraft.model?.common_name?.toLowerCase().includes(query) ||
      aircraft.country?.toLowerCase().includes(query) ||
      (aircraft.callsigns_used || []).some(cs => cs.toLowerCase().includes(query))
    ).slice(0, 5);

    return {
      entities: filteredEntities,
      flights: filteredFlights,
      inventory: filteredInventory,
      total: filteredEntities.length + filteredFlights.length + filteredInventory.length
    };
  }, [entities, flights, inventoryAircraft, searchQuery]);

  // Alias para compatibilidad
  const filteredEntities = searchResults.entities;

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

  // Manejar click en entidad del mapa
  const handleEntityClick = (entity) => {
    if (!map || !entity.latitude || !entity.longitude) return;

    map.flyTo({
      center: [entity.longitude, entity.latitude],
      zoom: 9,
      duration: 2000,
      essential: true
    });

    setSearchQuery('');
    inputRef.current?.blur();
  };

  // Manejar click en vuelo activo
  const handleFlightClick = (flight) => {
    if (!map || !flight.latitude || !flight.longitude) return;

    map.flyTo({
      center: [flight.longitude, flight.latitude],
      zoom: 8,
      duration: 2000,
      essential: true
    });

    // Notificar al componente padre si existe el callback
    onFlightSelect?.(flight);

    setSearchQuery('');
    inputRef.current?.blur();
  };

  // Manejar click en aeronave del inventario
  const handleInventoryClick = (aircraft) => {
    // Emitir evento global para abrir el panel de inventario con la aeronave
    window.dispatchEvent(new CustomEvent('openAircraftFromSearch', { 
      detail: { aircraft } 
    }));
    
    // También notificar al componente padre si existe el callback
    onAircraftSelect?.(aircraft);

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
          placeholder="Buscar vuelos, aeronaves, buques, tropas..."
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
      {searchQuery && (isFocused || searchResults.total > 0) && (
        <div className="mt-2 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Header con contador */}
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
            <div className="text-slate-400 text-xs">
              {searchResults.total > 0 ? (
                <>
                  <span className="text-white font-semibold">{searchResults.total}</span> {searchResults.total === 1 ? 'resultado' : 'resultados'}
                </>
              ) : (
                <span className="text-red-400">Sin resultados</span>
              )}
            </div>
          </div>

          {/* Lista de resultados por categoría */}
          <div className="max-h-[400px] overflow-y-auto modern-scrollbar">
            {searchResults.total > 0 ? (
              <>
                {/* 🛩️ Vuelos Activos (FlightRadar24) */}
                {searchResults.flights.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-green-900/20 border-b border-green-800/30">
                      <span className="text-green-400 text-xs font-medium flex items-center gap-1.5">
                        <Radio className="w-3 h-3" />
                        Vuelos Activos ({searchResults.flights.length})
                      </span>
                    </div>
                    {searchResults.flights.map((flight) => (
                      <button
                        key={flight.id}
                        onClick={() => handleFlightClick(flight)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-900/20 border-b border-slate-800/30 transition-all group text-left"
                      >
                        <div className="flex-shrink-0 text-green-400">
                          <Navigation className="w-4 h-4" style={{ transform: `rotate(${flight.heading || 0}deg)` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm truncate group-hover:text-green-400 transition-colors font-mono">
                            {flight.callsign || 'N/A'}
                          </div>
                          <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                            <span>{flight.aircraft?.model || flight.aircraft?.type || 'Unknown'}</span>
                            {flight.airline?.name && (
                              <>
                                <span>•</span>
                                <span className="truncate">{flight.airline.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-green-500 text-xs">
                          <span className="px-1.5 py-0.5 bg-green-900/50 rounded text-[10px]">EN VIVO</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 📦 Inventario de Aeronaves */}
                {searchResults.inventory.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-amber-900/20 border-b border-amber-800/30">
                      <span className="text-amber-400 text-xs font-medium flex items-center gap-1.5">
                        <Database className="w-3 h-3" />
                        Inventario ({searchResults.inventory.length})
                      </span>
                    </div>
                    {searchResults.inventory.map((aircraft) => {
                      // Obtener el callsign más usado o el primero disponible
                      const primaryCallsign = aircraft.callsigns_used?.[0] || null;
                      const displayName = primaryCallsign || aircraft.model?.common_name || aircraft.aircraft_type || aircraft.icao24;
                      
                      return (
                        <button
                          key={aircraft.id}
                          onClick={() => handleInventoryClick(aircraft)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-900/20 border-b border-slate-800/30 transition-all group text-left"
                        >
                          <div className="flex-shrink-0 text-amber-400">
                            <Plane className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm truncate group-hover:text-amber-400 transition-colors flex items-center gap-2">
                              {primaryCallsign && (
                                <span className="font-mono bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-300 text-xs">
                                  {primaryCallsign}
                                </span>
                              )}
                              <span>{aircraft.model?.common_name || aircraft.aircraft_type || 'Aeronave'}</span>
                            </div>
                            <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{aircraft.icao24?.toUpperCase()}</span>
                              {aircraft.registration && (
                                <>
                                  <span>•</span>
                                  <span>{aircraft.registration}</span>
                                </>
                              )}
                              {aircraft.country && (
                                <>
                                  <span>•</span>
                                  <span>{aircraft.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 🗺️ Entidades del Mapa */}
                {searchResults.entities.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-blue-900/20 border-b border-blue-800/30">
                      <span className="text-blue-400 text-xs font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Entidades ({searchResults.entities.length})
                      </span>
                    </div>
                    {searchResults.entities.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => handleEntityClick(entity)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-900/20 border-b border-slate-800/30 transition-all group text-left"
                      >
                        <div className={`flex-shrink-0 ${getTypeColor(entity.type)}`}>
                          {getEntityIcon(entity.type)}
                        </div>
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
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No se encontró nada con "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

