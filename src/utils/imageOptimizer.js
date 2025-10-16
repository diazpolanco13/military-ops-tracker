/**
 * 🖼️ Utilidades para optimización de imágenes
 * - Redimensionar imágenes antes de subir
 * - Comprimir para reducir tamaño
 * - Convertir a formatos optimizados
 */

/**
 * Redimensiona una imagen manteniendo el aspect ratio y TRANSPARENCIA
 * @param {File} file - Archivo de imagen original
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<Blob>} - Imagen optimizada
 */
export async function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.95) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Si la imagen es pequeña (menor a 100x100), NO redimensionar
        if (width <= 100 && height <= 100) {
          console.log('🎨 Imagen pequeña detectada, manteniendo tamaño original:', width, 'x', height);
          width = img.width;
          height = img.height;
        } else if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }
        
        // Crear canvas y redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // ⚠️ NO limpiar el canvas para preservar transparencia
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Detectar si es PNG para mantener transparencia
        const isPNG = file.type === 'image/png';
        const mimeType = isPNG ? 'image/png' : 'image/jpeg';
        
        // Convertir a Blob (PNG mantiene transparencia, JPEG no)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ Imagen optimizada: ${mimeType}, ${(blob.size / 1024).toFixed(2)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Error al convertir canvas a blob'));
            }
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Crea una miniatura de la imagen MANTENIENDO TRANSPARENCIA
 * @param {File} file - Archivo de imagen original
 * @param {number} size - Tamaño de la miniatura (mantiene aspect ratio si es pequeña)
 * @returns {Promise<Blob>} - Miniatura optimizada
 */
export async function createThumbnail(file, size = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Si la imagen original es muy pequeña (menor a 100x100), usar su tamaño
        const isSmallImage = img.width <= 100 && img.height <= 100;
        const targetSize = isSmallImage ? Math.max(img.width, img.height) : size;
        
        console.log('🖼️ Creando miniatura:', {
          original: `${img.width}x${img.height}`,
          target: `${targetSize}x${targetSize}`,
          isSmall: isSmallImage
        });
        
        // Crear canvas
        const canvas = document.createElement('canvas');
        
        if (isSmallImage) {
          // Para imágenes pequeñas, mantener tamaño original
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0);
        } else {
          // Para imágenes grandes, crear miniatura cuadrada centrada
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          const ctx = canvas.getContext('2d');
          
          // Calcular recorte para centrar la imagen
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          // Dibujar imagen centrada y recortada
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            targetSize,
            targetSize
          );
        }
        
        // Detectar formato para mantener transparencia
        const isPNG = file.type === 'image/png';
        const mimeType = isPNG ? 'image/png' : 'image/jpeg';
        
        // Convertir a Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ Miniatura creada: ${mimeType}, ${(blob.size / 1024).toFixed(2)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Error al crear miniatura'));
            }
          },
          mimeType,
          0.95
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Valida que el archivo sea una imagen válida
 * @param {File} file - Archivo a validar
 * @returns {boolean} - true si es válido
 */
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato no válido. Solo se permiten JPG, PNG y WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('La imagen es demasiado grande. Máximo 5MB.');
  }
  
  return true;
}

/**
 * Convierte un Blob a File
 * @param {Blob} blob - Blob a convertir
 * @param {string} filename - Nombre del archivo
 * @returns {File} - Archivo
 */
export function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Formatea el tamaño de archivo en formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

