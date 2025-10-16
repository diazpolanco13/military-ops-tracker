# 📸 Sistema de Imágenes de Entidades - Guía Completa

## ✅ Lo que se ha implementado

### 1. Base de Datos
- ✅ Columnas `image_url` y `image_thumbnail_url` añadidas a tabla `entities`
- ✅ Storage Bucket `entity-images` creado en Supabase
- ✅ Políticas de seguridad configuradas (lectura pública, escritura autenticada)

### 2. Optimización Automática
- ✅ **Imagen Principal**: Redimensionada a máximo 800x800px
- ✅ **Miniatura**: Cuadrada de 200x200px para el mapa
- ✅ **Compresión**: JPEG con 85% de calidad
- ✅ **Validación**: Solo JPG, PNG, WebP (máx. 5MB)

### 3. Componentes UI

#### `EnhancedEntityPopup.jsx` - Popup Ultra Profesional 🎖️
- Diseño estilo militar táctico
- Imagen de la entidad con overlay y blur de fondo
- Badges de tipo y estado con animaciones
- Grid de información (coordenadas, rumbo, velocidad, altitud)
- Sección de armamento destacada
- Timestamp de última actualización

#### `ImageUploader.jsx` - Subida de Imágenes 📤
- Drag & Drop de archivos
- Preview de la imagen antes de subir
- Optimización automática en el navegador
- Feedback visual del proceso (loading, success, error)
- Validación de tipo y tamaño

#### `ImageUploadDemo.jsx` - Demo Interactivo 🎨
- Lista de todas las entidades
- Selección de entidad para subir imagen
- Preview de imágenes existentes
- Integración con el sistema de entidades

### 4. Servicios

#### `imageService.js` - API de Imágenes
```javascript
// Subir imagen (optimiza automáticamente)
await uploadEntityImage(file, entityId);

// Eliminar imagen
await deleteEntityImage(entityId);

// Obtener URLs
await getEntityImageUrls(entityId);
```

#### `imageOptimizer.js` - Utilidades de Optimización
```javascript
// Redimensionar imagen
await resizeImage(file, 800, 800, 0.85);

// Crear miniatura
await createThumbnail(file, 200);

// Validar archivo
validateImageFile(file);
```

## 🚀 Cómo usar

### En la aplicación:

1. **Abrir el uploader**:
   - Click en el botón "Subir Imágenes" (esquina superior derecha del mapa)

2. **Seleccionar entidad**:
   - Elige la entidad a la que quieres asignar una imagen

3. **Subir imagen**:
   - Arrastra la imagen o haz click para seleccionar
   - El sistema optimiza automáticamente
   - ¡Listo! La imagen se verá en el popup del mapa

### Estructura en Supabase Storage:
```
entity-images/
└── entities/
    └── {entity-id}/
        ├── image.jpg        (800x800 optimizada)
        └── thumbnail.jpg    (200x200 miniatura)
```

## 🎨 Resultado Visual

### Popup Profesional:
- **Header con imagen**: Fondo blur + imagen centrada + badges de tipo y estado
- **Grid de datos**: 2 columnas con iconos (coordenadas, rumbo, velocidad, altitud)
- **Armamento**: Sección destacada con gradiente rojo
- **Footer**: Timestamp + indicador "Arrastrable"

### Colores y Estilo:
- Fondo: Gradiente slate-900 → slate-800 → slate-900
- Borders: slate-700 con transparencia
- Backdrop blur para efecto glassmorphism
- Animación pulse en badge de estado

## 📊 Optimización Automática

**Antes de subir:**
- Imagen original: 2.5 MB (3000x2000px)

**Después de optimizar:**
- Imagen principal: ~150 KB (800x600px, JPEG 85%)
- Miniatura: ~20 KB (200x200px, JPEG 90%)
- **Total: ~170 KB** (93% de reducción 🚀)

## 🔧 Configuración en Supabase

### Variables de entorno necesarias:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Verificar Storage Bucket:
1. Ve a Supabase Dashboard → Storage
2. Busca el bucket `entity-images`
3. Debe ser **público** (public: true)
4. Límite de tamaño: 5MB por archivo

## 🎯 Próximos pasos sugeridos

1. **Galería de imágenes**: Permitir múltiples imágenes por entidad
2. **Editor de imágenes**: Recorte y rotación en el navegador
3. **Imágenes históricas**: Guardar imágenes en diferentes momentos
4. **Upload bulk**: Subir múltiples imágenes a la vez
5. **CDN**: Configurar Cloudflare/CloudFront para mejor performance

## ⚠️ Limitaciones actuales

- Solo 1 imagen por entidad (se sobrescribe si subes otra)
- Formatos soportados: JPG, PNG, WebP
- Tamaño máximo: 5MB
- Sin autenticación (por ahora cualquiera puede subir)

## 🐛 Troubleshooting

### "Error al subir imagen"
- Verifica que el bucket `entity-images` existe
- Revisa las políticas de Storage (deben permitir INSERT)
- Chequea la consola del navegador para más detalles

### "Imagen no se muestra en el popup"
- Espera 2-3 segundos y refresca el mapa
- Verifica que `image_thumbnail_url` tiene valor en la BD
- Revisa la consola para errores de CORS

### "Bucket no encontrado"
- Ejecuta la migración de creación del bucket nuevamente
- Verifica en Supabase Dashboard → Storage

---

**Última actualización**: 16 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completamente funcional

