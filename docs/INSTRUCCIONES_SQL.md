# 🚀 INSTRUCCIONES FINALES - Ejecutar SQL en Supabase

## ✅ CAMBIOS COMPLETADOS Y COMMITEADOS

El código ha sido optimizado y está listo. **Commit**: `9759f03`

```bash
git log -1 --oneline
# 9759f03 feat: optimizar consultas Supabase (reducción 50%)
```

---

## ⚠️ PASO CRÍTICO PENDIENTE

Para completar la optimización, debes ejecutar el script SQL en Supabase:

---

## 📋 MÉTODO 1: Dashboard de Supabase (RECOMENDADO)

### Paso 1: Abrir SQL Editor
1. Ve a: https://supabase.com/dashboard/project/oqhujdqbszbvozsuunkw
2. En el menú lateral, click en **"SQL Editor"**
3. Click en **"New query"**

### Paso 2: Copiar y ejecutar SQL
1. Abre el archivo: [`sql/execute_bundle.sql`](sql/execute_bundle.sql)
2. **Copia TODO el contenido** (Cmd+A, Cmd+C)
3. **Pega** en el SQL Editor de Supabase
4. Click en **"Run"** (o Cmd+Enter)

### Paso 3: Verificar éxito
Deberías ver mensajes como:
```
✅ DROP MATERIALIZED VIEW
✅ CREATE MATERIALIZED VIEW
✅ CREATE INDEX
✅ GRANT SELECT (2x)
✅ REFRESH MATERIALIZED VIEW
```

### Paso 4: Validar
Ejecuta esta query para verificar:
```sql
SELECT * FROM incursion_stats_bundle;
```

**Resultado esperado**: 1 fila con datos en formato JSON

---

## 📋 MÉTODO 2: Supabase CLI (Alternativo)

Si tienes Supabase CLI instalado:

```bash
# En el directorio del proyecto
supabase db execute --file sql/execute_bundle.sql --project-ref oqhujdqbszbvozsuunkw
```

---

## 🔍 VERIFICACIÓN POST-IMPLEMENTACIÓN

### 1. Verificar en Supabase Dashboard

```sql
-- Ver estructura de la vista
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'incursion_stats_bundle';

-- Ver contenido
SELECT
  id,
  last_updated,
  summary->>'total_incursions' as total_incursions,
  json_array_length(hourly_patterns) as hourly_count
FROM incursion_stats_bundle;
```

**Resultado esperado**:
- `id`: 1
- `last_updated`: timestamp actual
- `total_incursions`: número > 0
- `hourly_count`: 24

---

### 2. Verificar en la aplicación

```bash
# Iniciar servidor de desarrollo
npm run dev
```

Luego en **consola del navegador**:

```javascript
// Resetear métricas
window.resetSupabaseMetrics()

// Navegar por la app (especialmente Analytics/Incursion Stats)

// Ver métricas después de 1-2 minutos
window.supabaseMetrics()
```

**Resultado esperado**:
```javascript
{
  total: ~50,  // Antes era ~100+
  byPath: {
    "/rest/v1/incursion_stats_bundle": 1,  // ✅ Nueva vista
    // Las siguientes NO deben aparecer o tener count muy bajo:
    "/rest/v1/incursion_patterns_hourly": 0,    // ❌ Antes 1-2
    "/rest/v1/incursion_patterns_weekly": 0,    // ❌ Antes 1-2
    "/rest/v1/incursion_patterns_quadrant": 0,  // ❌ Antes 1-2
    // ... (otras 4 tablas también en 0)
  },
  byStatus: {
    "200": 48,
    "429": 0  // ✅ Sin rate limiting
  }
}
```

---

## 🐛 TROUBLESHOOTING

### Error: "relation does not exist"
**Causa**: Una o más tablas base no existen

**Solución**: Verificar que existan las tablas:
```sql
SELECT tablename FROM pg_tables
WHERE tablename IN (
  'incursion_prediction_summary',
  'incursion_patterns_hourly',
  'incursion_patterns_weekly',
  'incursion_patterns_quadrant',
  'incursion_patterns_aircraft',
  'incursion_heatmap',
  'incursion_sessions'
);
```

---

### Error: "permission denied"
**Causa**: Usuario no tiene permisos para crear vistas materializadas

**Solución**: Ejecutar como usuario postgres (admin) o solicitar a administrador

---

### Error: "CONCURRENTLY cannot be used"
**Causa**: No se puede usar CONCURRENTLY en primera creación

**Solución**: Editar `sql/execute_bundle.sql` y cambiar última línea:
```sql
-- Antes
REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;

-- Después
REFRESH MATERIALIZED VIEW incursion_stats_bundle;
```

---

## 🔄 REFRESH MANUAL DE LA VISTA

Si necesitas actualizar manualmente los datos:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY incursion_stats_bundle;
```

**Recomendado**: Configurar cron job para refresh automático cada 10 minutos (ver `sql/create_incursion_stats_bundle.sql` línea 158+)

---

## 📊 MONITOREO CONTINUO

### En producción

```javascript
// Cada 1 hora, ejecutar en consola
window.supabaseMetrics()

// Buscar:
// 1. Total < 2000 queries/hora con 10 usuarios
// 2. byStatus["429"] = 0 (sin rate limiting)
// 3. byPath["/rest/v1/incursion_stats_bundle"] > 0
```

---

## ✅ CHECKLIST FINAL

Antes de considerar completado:

- [ ] ✅ Código commiteado (`git log` muestra commit 9759f03)
- [ ] ⚠️ **Script SQL ejecutado en Supabase Dashboard**
- [ ] ⚠️ Query de validación retorna 1 fila
- [ ] Testing en desarrollo (npm run dev)
- [ ] No hay errores en consola
- [ ] `window.supabaseMetrics()` muestra reducción de queries
- [ ] Panel de Analytics/Incursion Stats funciona correctamente
- [ ] Deploy a producción
- [ ] Monitoreo 24h sin rate limiting

---

## 📞 SIGUIENTE PASO

Una vez ejecutado el SQL, puedes hacer:

```bash
# Push a repositorio
git push origin main

# O si usas otra rama
git push origin <tu-rama>
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Guía completa**: [OPTIMIZACION_SUPABASE.md](OPTIMIZACION_SUPABASE.md)
- **Script SQL completo**: [sql/create_incursion_stats_bundle.sql](sql/create_incursion_stats_bundle.sql)
- **Script ejecutable**: [sql/execute_bundle.sql](sql/execute_bundle.sql)

---

## 🛡️ Nota de seguridad (IMPORTANTE)

- **No hardcodees tokens/keys** en scripts o archivos del repo.
- Para ejecutar SQL/automatizaciones:
  - Usa variables de entorno (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`).
  - Si una key se expuso, **róta** la credencial en Supabase antes de continuar.

---

**Generado**: 2026-01-01
**Commit**: 9759f03
**Proyecto**: Military Ops Tracker v2.0
