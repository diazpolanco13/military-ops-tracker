# 🌦️ Guía de Configuración: Capas Meteorológicas

## 📋 Resumen

Este sistema integra **OpenWeatherMap API** con tu aplicación para mostrar capas meteorológicas en tiempo real sobre el mapa de operaciones militares.

---

## 🚀 Configuración Rápida (5 minutos)

### **1️⃣ Obtener API Key de OpenWeatherMap**

1. Ve a: **https://openweathermap.org/api**
2. Click en **"Get API Key"** o **"Sign Up"**
3. Crea una cuenta gratuita
4. Ve a tu perfil → **API Keys**
5. Copia tu API key (formato: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

**Plan Gratuito incluye:**
- ✅ 1,000 llamadas/día (más que suficiente)
- ✅ Datos meteorológicos en tiempo real
- ✅ 5 capas: nubes, precipitación, temperatura, viento, presión
- ✅ Sin necesidad de tarjeta de crédito

---

### **2️⃣ Agregar API Key al Proyecto**

Abre tu archivo `.env` y agrega:

```env
# 🌦️ OpenWeatherMap API
VITE_OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**⚠️ IMPORTANTE:** Reemplaza `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` con tu API key real.

---

### **3️⃣ Reiniciar el Servidor de Desarrollo**

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

---

### **4️⃣ Activar Capas de Clima**

1. En la aplicación, click en **"Config"** (navbar superior)
2. Click en el tab **"Clima"** ☁️
3. Activa las capas que necesites:
   - ☁️ Cobertura de Nubes
   - 🌧️ Precipitación
   - 🌡️ Temperatura
   - 💨 Viento
   - 📊 Presión Atmosférica
4. Click en **"Aplicar y Cerrar"**

**¡Las capas aparecerán instantáneamente sobre el mapa!** 🎉

---

## 🎛️ Presets Rápidos

En el tab "Clima", puedes usar estos botones para activar combinaciones comunes:

### **🌧️ Solo Lluvia y Nubes**
```
Activa: ☁️ Nubes + 🌧️ Precipitación
Uso: Planificar vuelos y operaciones aéreas
```

### **🌡️ Temp + Viento**
```
Activa: 🌡️ Temperatura + 💨 Viento
Uso: Despliegue de tropas en terreno
```

### **✅ Todas las Capas**
```
Activa: Todas las 5 capas
Uso: Análisis meteorológico completo
```

### **❌ Ninguna**
```
Desactiva: Todas las capas
Uso: Limpiar el mapa
```

---

## 📊 Variables de Entorno Completas

Tu archivo `.env` debería verse así:

```env
# 🗺️ Mapbox
VITE_MAPBOX_TOKEN=tu_token_mapbox

# 📍 Centro y Zoom del Mapa
VITE_MAP_CENTER_LAT=14.2095
VITE_MAP_CENTER_LNG=-66.1057
VITE_MAP_DEFAULT_ZOOM=6

# 🎥 Cámara del Mapa
VITE_MAP_DEFAULT_PITCH=0       # 0-85° (inclinación)
VITE_MAP_DEFAULT_BEARING=0     # 0-360° (rotación)

# 🌦️ OpenWeatherMap (NUEVO)
VITE_OPENWEATHER_API_KEY=tu_api_key_openweather

# 🤖 Grok AI
VITE_XAI_API_KEY=tu_api_key_grok

# 🗄️ Supabase
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_supabase
```

---

## 🎯 Casos de Uso Militar

### **1. Operaciones Aéreas**
```
Capas activas: ☁️ Nubes + 💨 Viento + 🌧️ Precipitación

Análisis:
- Nubes: Verificar visibilidad para vuelos
- Viento: Calcular trayectorias de drones
- Precipitación: Evitar tormentas
```

### **2. Operaciones Anfibias**
```
Capas activas: 🌧️ Precipitación + 💨 Viento + 🌡️ Temperatura

Análisis:
- Precipitación: Condiciones de mar
- Viento: Oleaje y navegación
- Temperatura: Condiciones para tropas
```

### **3. Despliegue de Tropas**
```
Capas activas: 🌡️ Temperatura + 🌧️ Precipitación

Análisis:
- Temperatura: Condiciones extremas
- Precipitación: Movilidad en terreno
```

### **4. Análisis Estratégico**
```
Capas activas: 📊 Presión + 🌧️ Precipitación

Análisis:
- Presión: Predecir tormentas (24-48h)
- Precipitación: Planificación de operaciones
```

---

## 🔧 Características Técnicas

### **Fuente de Datos**
- **API:** OpenWeatherMap Weather Maps API 2.0
- **Formato:** Tiles raster (PNG)
- **Resolución:** 256x256px
- **Actualización:** Cada 10 minutos (automático)
- **Cobertura:** Global

### **Integración**
- **Tipo de capa:** `raster` (Mapbox GL JS)
- **Z-index:** Sobre el mapa base, bajo los marcadores
- **Opacidad:** Configurable (60-70% por defecto)
- **Persistencia:** localStorage

### **Rendimiento**
- **Ligero:** Solo se cargan tiles visibles
- **Cache:** Mapbox cachea tiles automáticamente
- **Sin impacto:** No afecta rendimiento del mapa

---

## ❓ Solución de Problemas

### **Las capas no aparecen**

1. ✅ Verifica que `VITE_OPENWEATHER_API_KEY` esté en `.env`
2. ✅ Reinicia el servidor (`npm run dev`)
3. ✅ Verifica en consola del navegador (F12) si hay errores de API
4. ✅ Confirma que tu API key esté activa (puede tardar 10min después de crearla)

### **Capas borrosas o de baja calidad**

Esto es normal. OpenWeatherMap provee tiles de 256px. Para mayor resolución, considera:
- Plan de pago de OpenWeatherMap
- Alternativas: Mapbox Weather (integrado), WeatherAPI, Meteomatics

### **Error 401 (Unauthorized)**

- Tu API key es inválida o ha expirado
- Regenera tu API key en OpenWeatherMap
- Verifica que no haya espacios extra en `.env`

---

## 🔗 Links Útiles

- **OpenWeatherMap API Docs:** https://openweathermap.org/api/weathermaps
- **Mapbox Weather Layers:** https://docs.mapbox.com/mapbox-gl-js/example/
- **Obtener API Key:** https://home.openweathermap.org/api_keys

---

## 📸 Screenshots

![Tab de Clima en Configuración](#)
*Panel de control con 5 toggles independientes y presets rápidos*

![Mapa con Capa de Precipitación](#)
*Vista del mapa con capa de lluvia activa sobre el Caribe*

---

## 🎊 Resultado Final

Con este sistema, los analistas militares pueden:
- ✅ Ver condiciones meteorológicas en tiempo real
- ✅ Planificar operaciones según el clima
- ✅ Combinar múltiples capas para análisis completo
- ✅ Activar/desactivar capas instantáneamente
- ✅ Todo integrado en el mismo mapa táctico

**¡La planificación militar nunca fue tan precisa!** 🎯

