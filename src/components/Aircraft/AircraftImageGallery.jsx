import { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Star, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  Check,
  ExternalLink
} from 'lucide-react';
import { useAircraftImages } from '../../hooks/useAircraftImages';

/**
 * 📷 GALERÍA DE IMÁGENES DE AERONAVE
 * 
 * Permite:
 * - Ver galería de imágenes del modelo
 * - Subir nuevas imágenes
 * - Establecer imagen primaria
 * - Eliminar imágenes
 */
export default function AircraftImageGallery({ aircraftType, aircraftModel, readOnly = false }) {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadSource, setUploadSource] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const fileInputRef = useRef(null);

  const {
    images,
    primaryImage,
    loading,
    uploading,
    uploadImage,
    deleteImage,
    setPrimaryImage,
  } = useAircraftImages(aircraftType);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }

    const result = await uploadImage(file, {
      aircraftType,
      aircraftModel,
      caption: uploadCaption,
      source: uploadSource || 'User Upload',
      isPrimary: makePrimary || images.length === 0, // Primera imagen es primaria automáticamente
    });

    if (result.success) {
      setShowUploader(false);
      setUploadCaption('');
      setUploadSource('');
      setMakePrimary(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      alert('Error al subir imagen: ' + result.error);
    }
  };

  const handleDelete = async (img) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    
    const result = await deleteImage(img.id, img.image_url);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
  };

  const handleSetPrimary = async (img) => {
    const result = await setPrimaryImage(img.id, aircraftType);
    if (!result.success) {
      alert('Error: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Galería de Imágenes
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Imagen
          </button>
        )}
      </div>

      {/* Uploader */}
      {showUploader && (
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Nueva Imagen</span>
            <button 
              onClick={() => setShowUploader(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drop zone */}
          <label className="block border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-sky-500/50 hover:bg-slate-700/30 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
                <span className="text-sm text-slate-400">Subiendo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-sm text-slate-400">
                  Click o arrastra una imagen aquí
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WEBP • Max 5MB
                </span>
              </div>
            )}
          </label>

          {/* Campos adicionales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Descripción</label>
              <input
                type="text"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="ej: Vista lateral en vuelo"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fuente</label>
              <input
                type="text"
                value={uploadSource}
                onChange={(e) => setUploadSource(e.target.value)}
                placeholder="ej: US Navy, Wikipedia"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={makePrimary}
              onChange={(e) => setMakePrimary(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
            />
            Establecer como imagen principal
          </label>
        </div>
      )}

      {/* Galería */}
      {images.length === 0 ? (
        <div className="text-center py-8 bg-slate-700/30 rounded-lg">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Sin imágenes</p>
          {!readOnly && (
            <p className="text-xs text-slate-500 mt-1">
              Sube la primera imagen de este modelo
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div 
              key={img.id}
              className="relative group rounded-lg overflow-hidden bg-slate-700"
            >
              {/* Imagen */}
              <img
                src={img.thumbnail_url || img.image_url}
                alt={img.image_caption || aircraftModel}
                className="w-full aspect-video object-cover cursor-pointer"
                onClick={() => setSelectedImage(img)}
              />

              {/* Badge Primary */}
              {img.is_primary && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Principal
                </div>
              )}

              {/* Overlay con acciones */}
              {!readOnly && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(img)}
                      className="p-2 bg-amber-500/80 rounded-full hover:bg-amber-500 transition-colors"
                      title="Establecer como principal"
                    >
                      <Star className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <button
                    onClick={() => window.open(img.image_url, '_blank')}
                    className="p-2 bg-slate-500/80 rounded-full hover:bg-slate-500 transition-colors"
                    title="Ver tamaño completo"
                  >
                    <ExternalLink className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(img)}
                    className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {/* Caption */}
              {img.image_caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white truncate">{img.image_caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <img
            src={selectedImage.image_url}
            alt={selectedImage.image_caption || aircraftModel}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Info */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-white text-sm">{selectedImage.image_caption || 'Sin descripción'}</p>
            {selectedImage.image_source && (
              <p className="text-slate-400 text-xs mt-1">Fuente: {selectedImage.image_source}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

