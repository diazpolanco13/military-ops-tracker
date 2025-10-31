import { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Componente para subir archivos PDF a Supabase Storage
 */
export default function PDFUploader({ onUploadComplete, onClose, currentFileUrl }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentFileUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar que sea PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (10MB máximo)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar los 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pdfs/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('event-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('event-files')
        .getPublicUrl(filePath);

      setUploadProgress(100);

      // Llamar callback con la información del archivo
      onUploadComplete({
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size
      });

      onClose();
    } catch (err) {
      console.error('Error subiendo PDF:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInput = (url) => {
    setPreview(url);
    if (url) {
      // Auto-extraer nombre del archivo de la URL
      const fileName = url.split('/').pop() || 'documento.pdf';
      onUploadComplete({
        file_url: url,
        file_name: fileName,
        file_size: null
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Subir Archivo PDF</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Opción 1: Subir archivo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              📤 Subir desde tu dispositivo
            </label>
            
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
                disabled={uploading}
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer block"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Haz clic para seleccionar un archivo PDF
                    </p>
                    <p className="text-sm text-slate-400">
                      Máximo 10MB • Solo archivos .pdf
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Preview del archivo seleccionado */}
            {file && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

            {/* Progress bar */}
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-300">Subiendo archivo...</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-800 text-sm text-slate-400">o</span>
            </div>
          </div>

          {/* Opción 2: URL externa */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              🔗 Pegar URL de archivo PDF
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/documento.pdf"
              onChange={(e) => handleUrlInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-2 text-xs text-slate-400">
              💡 También puedes usar URLs de Google Drive, Dropbox, etc.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Subir PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

