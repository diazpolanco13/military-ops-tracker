import { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 🔐 Modal para Cambiar Contraseña
 * Permite al usuario cambiar su propia contraseña
 */
export default function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      // Usar Supabase Auth para cambiar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Cerrar después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Cambiar Contraseña</h2>
              <p className="text-xs text-slate-400">Actualiza tu contraseña de acceso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mensaje de éxito */}
          {success && (
            <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-300 font-medium">¡Contraseña actualizada!</p>
                <p className="text-green-400/70 text-sm">El cambio se aplicó correctamente</p>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Indicador de coincidencia */}
              {newPassword && confirmPassword && (
                <div className={`flex items-center gap-2 text-sm ${
                  newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'
                }`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Las contraseñas coinciden</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Las contraseñas no coinciden</span>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-medium transition-all bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50"
            >
              {success ? 'Cerrar' : 'Cancelar'}
            </button>
            {!success && (
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  loading || !newPassword || !confirmPassword
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cambiando...</span>
                  </div>
                ) : (
                  'Cambiar Contraseña'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

