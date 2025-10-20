import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadEntityImage } from '../services/imageService';
import { formatFileSize } from '../utils/imageOptimizer';

/**
 * 📤 Componente para subir imágenes de entidades
 * - Drag & Drop
 * - Preview de imagen
 * - Optimización automática
 * - Feedback visual del proceso
 */
export default function ImageUploader({ entityId, entityName, onUploadComplete, allowTemplateUpload = false }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Manejar selección de archivo
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validar tipo de archivo (permitir imágenes y videos para plantillas)
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/') || selectedFile.name.match(/\.(webm|mp4)$/i);
    
    if (!isImage && !isVideo) {
      setError('Por favor selecciona una imagen (JPG, PNG, WebP) o video (WEBM, MP4)');
      return;
    }

    // Validar tamaño (10MB máximo para videos, 5MB para imágenes)
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${isVideo ? '10MB' : '5MB'}.`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);

    // Crear preview (funciona para imagen y video)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Manejar drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  // Manejar drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Subir imagen
  const handleUpload = async () => {
    if (!file) return;
    
    // Para plantillas, usar un ID temporal
    const uploadId = entityId || `template-${Date.now()}`;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadEntityImage(file, uploadId);
      
      setSuccess(true);
      setUploading(false);

      // Notificar al componente padre
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Limpiar después de 2 segundos
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  // Limpiar selección
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Área de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-all duration-200
          ${file 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-600 hover:border-blue-500 bg-slate-800/50'
          }
        `}
      >
        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowTemplateUpload ? "image/*,video/webm,video/mp4" : "image/*"}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {!file ? (
          // Estado vacío
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-3 text-slate-500" />
            <p className="text-sm text-slate-300 mb-1">
              Arrastra {allowTemplateUpload ? 'una imagen o video' : 'una imagen'} aquí o haz click
            </p>
            <p className="text-xs text-slate-500">
              {allowTemplateUpload ? 'PNG, JPG, WEBM, MP4 (máx. 10MB)' : 'JPG, PNG o WebP (máx. 5MB)'}
            </p>
          </div>
        ) : (
          // Preview de imagen o video
          <div className="space-y-3">
            <div className="relative">
              {file.type.startsWith('video/') || file.name.match(/\.(webm|mp4)$/i) ? (
                <video
                  src={preview}
                  className="w-full h-48 object-cover rounded-md bg-black"
                  controls
                  loop
                  muted
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              <p className="font-semibold truncate">{file.name}</p>
              <p>{formatFileSize(file.size)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Botón de subir */}
      {file && !success && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          disabled={uploading}
          className={`
            mt-3 w-full py-2 px-4 rounded-md font-semibold
            flex items-center justify-center gap-2
            transition-all duration-200
            ${uploading
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" />
              Subir imagen de {entityName}
            </>
          )}
        </button>
      )}

      {/* Mensaje de éxito */}
      {success && (
        <div className="mt-3 p-3 bg-green-500/20 border border-green-500/50 rounded-md flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400">
            ¡Imagen subida y optimizada correctamente!
          </p>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

