#!/bin/bash

# Script para crear vista materializada en Supabase
# Usa la API de Management de Supabase

PROJECT_REF="oqhujdqbszbvozsuunkw"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Falta SUPABASE_ACCESS_TOKEN en el entorno."
  echo "💡 Exporta la variable y vuelve a ejecutar:"
  echo "   export SUPABASE_ACCESS_TOKEN=\"TU_ACCESS_TOKEN\""
  exit 1
fi

echo "🚀 Creando vista materializada en Supabase..."
echo "📍 Proyecto: $PROJECT_REF"
echo ""

# Leer el SQL del archivo
SQL_CONTENT=$(cat sql/execute_bundle.sql)

# Usar la API de Supabase Management para ejecutar SQL
# Nota: Esto requiere el Management API endpoint
echo "⏳ Ejecutando SQL..."

# Método alternativo: Usar supabase db remote sql
export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"

# Crear archivo temporal con el SQL
TMP_FILE=$(mktemp)
cat sql/execute_bundle.sql > "$TMP_FILE"

echo "📄 Archivo temporal: $TMP_FILE"
echo ""

# Nota: Como no tenemos psql ni una API directa,
# necesitamos usar el Dashboard de Supabase

echo "════════════════════════════════════════════════════"
echo "  ⚠️  ACCIÓN MANUAL REQUERIDA"
echo "════════════════════════════════════════════════════"
echo ""
echo "El CLI de Supabase actual no soporta ejecución directa de SQL."
echo "Por favor, sigue estos pasos:"
echo ""
echo "1. Abre: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo "2. Copia el contenido de: sql/execute_bundle.sql"
echo "3. Pega en el SQL Editor"
echo "4. Click en 'Run' (▶️)"
echo ""
echo "El contenido del SQL está disponible aquí:"
echo "   $TMP_FILE"
echo ""
echo "O puedes ejecutar:"
echo "   cat sql/execute_bundle.sql"
echo ""
echo "════════════════════════════════════════════════════"

# Abrir el SQL en el editor por defecto
if command -v open &> /dev/null; then
    echo "📝 Abriendo archivo SQL..."
    open sql/execute_bundle.sql
fi

# Limpiar
# rm -f "$TMP_FILE"
