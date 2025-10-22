/**
 * Punto de referencia en el centro del mapa
 * Indica que ese punto es el centro del radar
 */
export default function RadarCrosshair() {
  return (
    <div className="fixed top-1/2 left-1/2 pointer-events-none z-40">
      {/* Punto central verde - centrado exacto */}
      <div className="absolute -left-[6px] -top-[6px] w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50 animate-pulse"></div>
      
      {/* Anillo exterior pulsante - centrado exacto */}
      <div className="absolute -left-3 -top-3 w-6 h-6 border-2 border-green-500/50 rounded-full animate-ping"></div>
      
      {/* Líneas de cruz (crosshair) - mucho más pequeñas */}
      {/* Línea horizontal izquierda */}
      <div className="absolute -top-[0.5px] -left-6 w-4 h-[1px] bg-green-500/70"></div>
      {/* Línea horizontal derecha */}
      <div className="absolute -top-[0.5px] left-2 w-4 h-[1px] bg-green-500/70"></div>
      
      {/* Línea vertical arriba */}
      <div className="absolute -left-[0.5px] -top-6 w-[1px] h-4 bg-green-500/70"></div>
      {/* Línea vertical abajo */}
      <div className="absolute -left-[0.5px] top-2 w-[1px] h-4 bg-green-500/70"></div>
    </div>
  );
}

