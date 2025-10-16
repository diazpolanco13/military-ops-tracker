function App() {
  const handleContinue = () => {
    alert('🚀 ¡Listo para comenzar la Iteración 1!\n\nPróximo paso:\n- Instalar MapLibre GL JS\n- Crear componente MapContainer\n- Ver el mapa del Caribe en pantalla');
  };

  const handleRoadmap = () => {
    window.open('/ROADMAP.md', '_blank');
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-military-bg-primary">
      <div className="card-military p-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-military-text-primary mb-4">
          Military Ops Tracker
        </h1>
        <p className="text-military-text-secondary mb-6">
          Sistema de Monitoreo de Operaciones Militares - Caribe
        </p>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-military-bg-primary rounded-lg border border-slate-700">
              <div className="text-2xl font-bold text-military-accent-primary">React 19</div>
              <div className="text-sm text-military-text-secondary">Instalado</div>
            </div>
            <div className="flex-1 p-4 bg-military-bg-primary rounded-lg border border-slate-700">
              <div className="text-2xl font-bold text-military-accent-success">Tailwind 4.1</div>
              <div className="text-sm text-military-text-secondary">Configurado</div>
            </div>
          </div>

          <div className="p-4 bg-military-bg-primary rounded-lg border border-slate-700">
            <div className="text-lg font-semibold text-military-text-primary mb-2">
              Estado del Sistema
            </div>
            <ul className="space-y-2 text-military-text-secondary text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-military-accent-success"></span>
                Vite Dev Server
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-military-accent-success"></span>
                Tailwind CSS
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-military-accent-warning"></span>
                Supabase (Pendiente configuración)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-military-accent-warning"></span>
                Mapbox (Pendiente token)
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={handleContinue} className="btn-primary">
              Continuar con Iteración 1
            </button>
            <button onClick={handleRoadmap} className="btn-danger">
              Ver Roadmap
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-military-text-secondary text-sm">
        <p>Iteración 0: Setup Base - Completado ✅</p>
        <p className="text-xs mt-1">Próximo paso: Configurar MapLibre y visualizar el Caribe</p>
      </div>
    </div>
  )
}

export default App
