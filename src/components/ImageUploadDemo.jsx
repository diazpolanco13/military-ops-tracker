import { useState, useEffect } from 'react';
import { useEntities } from '../hooks/useEntities';
import ImageUploader from './ImageUploader';
import { X } from 'lucide-react';

/**
 * 🎨 Demo para probar la subida de imágenes a entidades
 * Permite seleccionar una entidad y subir su imagen
 */
export default function ImageUploadDemo({ onClose }) {
  const { entities, loading, refetch } = useEntities();
  const [selectedEntity, setSelectedEntity] = useState(null);

  const handleUploadComplete = (result) => {
    console.log('✅ Imagen subida:', result);
    // Refrescar entidades para ver la nueva imagen
    setTimeout(() => {
      refetch();
      setSelectedEntity(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            📸 Subir Imágenes de Entidades
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {!selectedEntity ? (
            <>
              <p className="text-slate-400 text-sm">
                Selecciona una entidad para subir su imagen:
              </p>

              {/* Lista de entidades */}
              <div className="grid grid-cols-1 gap-3">
                {entities.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity)}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
                          {entity.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {entity.class} • {entity.type}
                        </p>
                      </div>
                      
                      {entity.image_thumbnail_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500">
                          <img
                            src={entity.image_thumbnail_url}
                            alt={entity.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Entidad seleccionada */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {selectedEntity.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {selectedEntity.class}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    ← Cambiar entidad
                  </button>
                </div>

                {/* Uploader */}
                <ImageUploader
                  entityId={selectedEntity.id}
                  entityName={selectedEntity.name}
                  onUploadComplete={handleUploadComplete}
                />
              </div>

              {/* Instrucciones */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  <strong>💡 Tip:</strong> La imagen se optimizará automáticamente y se creará una miniatura para el mapa.
                  Después de subir, refresca el mapa para ver la imagen en el popup.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

