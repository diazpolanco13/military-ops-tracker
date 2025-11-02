# 🤖 MCP Server - Military Operations Tracker

## 📋 Descripción

Servidor MCP (Model Context Protocol) personalizado que permite a la IA consultar toda la información del sistema Military Operations Tracker, incluyendo:

- 📊 Estadísticas de despliegue
- 🚢 Detalles de entidades (barcos, aviones, tropas)
- 📅 Timeline de eventos
- 🗺️ Análisis de regiones geográficas
- 🎖️ Información detallada de portaaviones

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd /home/diazpolanco13/military-ops-tracker
npm install @modelcontextprotocol/sdk
```

### 2. Hacer el servidor ejecutable

```bash
chmod +x mcp-server.js
```

### 3. Reiniciar Cursor

Para que Cursor detecte el nuevo MCP, necesitas reiniciar la aplicación.

## 🛠️ Herramientas Disponibles

### 1. `get_deployment_stats`
Obtiene estadísticas generales del despliegue militar.

**Ejemplo de pregunta:**
- "¿Cuántos efectivos hay desplegados en total?"
- "Dame las estadísticas generales del despliegue"
- "¿Cuántos marcadores hay en el mapa?"

**Responde con:**
- Total de marcadores
- Total de unidades
- Total de efectivos
- Desglose por tipo (portaaviones, destructores, aviones, tropas, etc.)

### 2. `get_entity_details`
Busca y obtiene detalles completos de una entidad específica.

**Parámetros:**
- `entityName` (string): Nombre de la entidad

**Ejemplo de pregunta:**
- "Dame detalles del USS Gerald R. Ford"
- "¿Qué información tienes sobre el 22nd MEU?"
- "Busca el USS Iwo Jima"

**Responde con:**
- Nombre, clase, tipo
- Posición (latitud, longitud)
- Status
- Tripulación y personal embarcado
- Aeronaves embarcadas
- Capacidades militares
- Especificaciones técnicas

### 3. `get_events`
Obtiene eventos del timeline.

**Parámetros opcionales:**
- `limit` (number): Número máximo de eventos
- `type` (string): "evento", "noticia", "informe"

**Ejemplo de pregunta:**
- "¿Qué eventos recientes hay?"
- "Muéstrame los últimos 10 eventos"
- "Dame todas las noticias del timeline"

**Responde con:**
- Lista de eventos con fecha
- Tipo de evento
- Descripción
- Entidades relacionadas
- Links externos

### 4. `get_entities_by_type`
Obtiene todas las entidades de un tipo específico.

**Parámetros:**
- `entityType` (string): "portaaviones", "destructor", "fragata", "avion", "tropas", etc.

**Ejemplo de pregunta:**
- "¿Cuántos destructores hay?"
- "Lista todos los portaaviones"
- "Dame información de todas las tropas"

**Responde con:**
- Lista completa de entidades del tipo solicitado
- Todos los campos disponibles

### 5. `analyze_region`
Analiza entidades en una región geográfica específica.

**Parámetros opcionales:**
- `bounds` (object): {north, south, east, west}

**Ejemplo de pregunta:**
- "¿Qué hay en el Caribe?"
- "Analiza la región del Mediterráneo"
- "¿Cuántas entidades hay en el Mar Caribe?"

**Responde con:**
- Total de entidades en la región
- Desglose por tipo
- Lista de entidades con posiciones

### 6. `get_carrier_details`
Obtiene detalles completos de todos los portaaviones.

**Ejemplo de pregunta:**
- "Dame todos los portaaviones con sus tripulaciones"
- "¿Cuántos portaaviones hay y cuál es su personal?"
- "Detalles completos de los portaaviones"

**Responde con:**
- Nombre y clase
- Tripulación
- Personal embarcado (CVW)
- Aeronaves embarcadas
- Total de efectivos
- Status y posición
- Capacidades militares
- Desplazamiento

## 📝 Ejemplos de Uso

### Ejemplo 1: Consulta General

**Pregunta:** "Hola SAE-IA, ¿cuántos efectivos hay desplegados en total?"

**Respuesta:** La IA usará `get_deployment_stats` y responderá:
```
Actualmente hay 14,409 efectivos desplegados en 24 marcadores:

• Portaaviones: 7,426 efectivos (2 unidades)
  - USS Gerald R. Ford: 4,539 efectivos
  - USS Iwo Jima: 2,887 efectivos

• Tropas: 5,700 efectivos
• Destructores: 1,180 efectivos (9 unidades)
• Aviones: 103 efectivos (25 unidades)
```

### Ejemplo 2: Consulta Específica

**Pregunta:** "Dame todos los detalles del USS Gerald R. Ford"

**Respuesta:** La IA usará `get_entity_details` y responderá:
```
🇺🇸 USS GERALD R. FORD (CVN-78)

PERSONAL:
• Tripulación del buque: 2,600 marineros
• Personal del ala aérea (CVW-8): 1,939 aviadores
• TOTAL: 4,539 efectivos

ALA AÉREA:
• Carrier Air Wing 8 (CVW-8)
• 75 aeronaves embarcadas
• 9 escuadrones

ESPECIFICACIONES:
• Desplazamiento: 100,000 tons
• Longitud: 333 m
• Velocidad: 30 knots

UBICACIÓN:
• Status: Patrullando
• Región: Caribe (SOUTHCOM)
• Posición: [lat, lon]
```

### Ejemplo 3: Análisis de Región

**Pregunta:** "¿Qué fuerzas navales hay en el Caribe?"

**Respuesta:** La IA usará `analyze_region` (posiblemente con bounds del Caribe):
```
FUERZAS NAVALES EN EL CARIBE:

Total: 15 entidades

PORTAAVIONES:
• USS Gerald R. Ford (CVN-78)
• USS Iwo Jima (LHD-7)

DESTRUCTORES:
• USS San Antonio
• USS Gravely
• USS Lake Erie
...

AERONAVES:
• 4× MH-60 Seahawk
• 6× F-35B Lightning II
...

TROPAS:
• 22nd MEU: 2,200 marines
• Fort Buchanan Garrison: 2,000 personal
...
```

### Ejemplo 4: Timeline

**Pregunta:** "¿Qué eventos importantes han ocurrido en los últimos días?"

**Respuesta:** La IA usará `get_events`:
```
EVENTOS RECIENTES:

📅 2 Nov 2025 - Operación Caribe Shield
Tipo: Evento
Entidades: USS Gerald R. Ford, 22nd MEU
Descripción: Inicio de ejercicios conjuntos...

📰 1 Nov 2025 - Reubicación desde Mediterráneo
Tipo: Noticia
Entidades: USS Gerald R. Ford
Link: [fuente]

📄 30 Oct 2025 - Informe de Inteligencia
Tipo: Informe
Archivo: operacion_caribe.pdf
...
```

## 🎯 Preguntas Tipo que Puede Responder

### Estadísticas:
- "¿Cuántos efectivos hay en total?"
- "¿Cuántos portaaviones tengo?"
- "¿Cuál es el desglose por tipo de unidad?"

### Detalles Específicos:
- "Dame información del USS Gerald R. Ford"
- "¿Cuántas aeronaves tiene el USS Iwo Jima?"
- "¿Qué tripulación tiene el destructor USS Gravely?"

### Análisis:
- "¿Qué hay desplegado en el Caribe?"
- "Lista todas las tropas"
- "¿Cuántos F-35 hay?"

### Timeline:
- "¿Qué eventos recientes hay?"
- "Muéstrame las noticias de esta semana"
- "¿Qué informes tengo?"

### Comparaciones:
- "Compara los dos portaaviones"
- "¿Cuál tiene más personal embarcado?"
- "Diferencia entre USS Gerald R. Ford y USS Iwo Jima"

## 🔧 Solución de Problemas

### El MCP no aparece en Cursor

1. Verifica que instalaste las dependencias:
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. Reinicia Cursor completamente

3. Verifica que `mcp.json` esté correctamente configurado en `~/.cursor/mcp.json`

### Error de permisos

```bash
chmod +x /home/diazpolanco13/military-ops-tracker/mcp-server.js
```

### Error de conexión a Supabase

Verifica que las variables de entorno estén correctas en `mcp.json`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📊 Arquitectura

```
┌─────────────┐
│   SAE-IA    │ (Tu asistente de IA)
└──────┬──────┘
       │
       │ Usa herramientas MCP
       │
┌──────▼────────────────────┐
│  MCP Server               │
│  military-ops-tracker     │
└──────┬────────────────────┘
       │
       │ Consulta datos
       │
┌──────▼──────────┐
│   Supabase DB   │
│   (PostgreSQL)  │
└─────────────────┘
```

## ✅ Verificación

Para probar que funciona:

1. Abre Cursor
2. Pregúntale a la IA: "¿Cuántos efectivos hay desplegados?"
3. La IA debería usar `get_deployment_stats` y darte una respuesta precisa

---

**🎉 ¡Tu IA SAE-IA ahora tiene acceso completo a toda la información del sistema!**

