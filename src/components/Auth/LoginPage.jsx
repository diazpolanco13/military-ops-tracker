import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 🔐 Página de Login
 * Autenticación con Supabase Auth
 */
export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      console.log('✅ Login exitoso:', data.user.email);
      
      // Notificar al componente padre
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('❌ Error de login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Fondo animado con efecto militar */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

      {/* Card de Login */}
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur-xl opacity-25 animate-pulse" />
        
        {/* Card principal */}
        <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo grande e imponente */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Glow effect detrás del logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-40 animate-pulse" />
                
                {/* Logo */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                  <img 
                    src="/logo_sae.png" 
                    alt="SAE Logo" 
                    className="w-full h-full object-contain drop-shadow-2xl filter brightness-110"
                  />
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-wide">
              SAE - MONITOR
            </h1>
            <p className="text-slate-400 text-base">
              Sistema de Análisis Estratégico
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="w-12 h-px bg-slate-700"></div>
              <span>ACCESO RESTRINGIDO</span>
              <div className="w-12 h-px bg-slate-700"></div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 text-sm font-medium">Error de autenticación</p>
                <p className="text-red-400 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all shadow-lg ${
                loading
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/50 hover:shadow-blue-500/70'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </div>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-500 text-xs">
              🔒 Conexión segura con Supabase Auth
            </p>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-4 text-center text-slate-400 text-xs">
          <p>Sistema de Inteligencia Militar</p>
          <p className="mt-1">Acceso restringido - Personal autorizado únicamente</p>
        </div>
      </div>
    </div>
  );
}

