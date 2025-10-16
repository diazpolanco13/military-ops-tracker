# 📸 Cómo Subir la Imagen del USS The Sullivans

## Opción 1: Usando la Interfaz Web (RECOMENDADO) 🖱️

### Paso 1: Iniciar el servidor
```bash
npm run dev
```

### Paso 2: Abrir en navegador
```
http://localhost:5173
```

### Paso 3: Click en "Subir Imágenes"
- Botón azul en la esquina superior derecha del mapa

### Paso 4: Seleccionar "USS The Sullivans"
- Click en la tarjeta del USS The Sullivans

### Paso 5: Arrastrar la imagen
- Arrastra `images/USS The Sullivans.png`
- O click en el área y selecciona el archivo

### Paso 6: Subir
- Click en "Subir imagen de USS The Sullivans"
- Espera el mensaje de confirmación verde ✅

### Paso 7: Ver resultado
- Cierra el modal
- Click en el marcador rojo del USS The Sullivans en el mapa
- ¡Disfruta del popup profesional con imagen! 🎉

---

## Opción 2: Usando Supabase Dashboard (Manual) 📊

### Paso 1: Ir a Supabase Dashboard
```
https://app.supabase.com
```

### Paso 2: Ir a Storage
- Sidebar izquierdo → Storage
- Click en bucket `entity-images`

### Paso 3: Crear carpeta
- Click "New folder"
- Nombre: `entities`
- Click dentro de la carpeta `entities`
- Click "New folder"
- Nombre: `a30d5844-a723-4a72-9d2e-e623f3c7d9d8`

### Paso 4: Subir archivos
- Click dentro de la carpeta del UUID
- Click "Upload file"
- Selecciona `images/USS The Sullivans.png`
- Renombra a: `image.jpg`
- Repite y renombra a: `thumbnail.jpg`

### Paso 5: Obtener URLs
- Click derecho en `image.jpg` → "Copy URL"
- Click derecho en `thumbnail.jpg` → "Copy URL"

### Paso 6: Actualizar base de datos
En el SQL Editor de Supabase:
```sql
UPDATE entities 
SET 
  image_url = 'URL_COPIADA_DE_IMAGE',
  image_thumbnail_url = 'URL_COPIADA_DE_THUMBNAIL'
WHERE id = 'a30d5844-a723-4a72-9d2e-e623f3c7d9d8';
```

---

## Opción 3: Usando el Script Node.js 🔧

### Requisitos previos:
```bash
# Asegúrate de tener las variables de entorno configuradas
# Crea un archivo .env en la raíz con:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Ejecutar:
```bash
node scripts/upload-test-image.js
```

### Resultado:
```
🚀 Iniciando subida de imagen de prueba...
📂 Leyendo imagen desde: /root/app-mapas/images/USS The Sullivans.png
✅ Imagen leída: XXX KB
⬆️  Subiendo imagen principal...
✅ Imagen principal subida
⬆️  Subiendo miniatura...
✅ Miniatura subida
🔗 URLs generadas
💾 Actualizando registro en base de datos...
✅ Base de datos actualizada
🎉 ¡IMAGEN SUBIDA CORRECTAMENTE!
```

---

## 🐛 Problemas Comunes

### "Bucket no encontrado"
**Solución:** El bucket se creó automáticamente en Supabase. Verifica en:
- Dashboard → Storage → `entity-images`

### "No puedo subir archivos"
**Solución:** Verifica las políticas de Storage:
```sql
-- Ver políticas actuales
SELECT * FROM storage.objects WHERE bucket_id = 'entity-images';

-- Recrear políticas si es necesario
-- (Ya están configuradas automáticamente)
```

### "La imagen no aparece en el popup"
**Solución:**
1. Verifica que `image_thumbnail_url` tiene valor en la BD
2. Refresca el navegador (Ctrl+R o Cmd+R)
3. Revisa la consola del navegador para errores

### "Error CORS"
**Solución:** Supabase Storage ya tiene CORS configurado por defecto

---

## 📊 Información de la Entidad

```
ID: a30d5844-a723-4a72-9d2e-e623f3c7d9d8
Nombre: USS The Sullivans
Clase: DDG-68
Tipo: destructor
Coordenadas: 15.7014°N, -74.8046°W
```

---

## ✅ Checklist de Verificación

Antes de probar, asegúrate que:
- [ ] Servidor está corriendo (`npm run dev`)
- [ ] Navegador apunta a `localhost:5173`
- [ ] Botón "Subir Imágenes" es visible
- [ ] Archivo `images/USS The Sullivans.png` existe
- [ ] Supabase está configurado (URL y Key en .env)
- [ ] Bucket `entity-images` existe en Supabase

Después de subir:
- [ ] Mensaje de confirmación verde aparece
- [ ] Marcador rojo está visible en el mapa
- [ ] Click en marcador abre popup
- [ ] Popup muestra imagen del USS The Sullivans
- [ ] Popup muestra coordenadas correctas
- [ ] Popup muestra información completa

---

**¡Listo para probar!** 🚀

La opción más fácil es la **Opción 1** usando la interfaz web que acabamos de crear.

