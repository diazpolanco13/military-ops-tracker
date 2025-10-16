#!/bin/bash

echo "🔄 Reiniciando Military Ops Tracker..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Detener procesos en puerto 5173 (Vite)
echo -e "${YELLOW}🛑 Deteniendo procesos en puerto 5173...${NC}"
PORT_PID=$(lsof -ti:5173)
if [ ! -z "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null
    echo -e "${GREEN}✅ Procesos detenidos${NC}"
else
    echo -e "${YELLOW}⚠️  No hay procesos corriendo en puerto 5173${NC}"
fi

# 2. Limpiar caché de Vite
echo ""
echo -e "${YELLOW}🧹 Limpiando caché de Vite...${NC}"
rm -rf node_modules/.vite
rm -rf dist
echo -e "${GREEN}✅ Caché limpiada${NC}"

# 3. Esperar un momento
echo ""
echo -e "${YELLOW}⏳ Esperando 2 segundos...${NC}"
sleep 2

# 4. Reiniciar servidor de desarrollo
echo ""
echo -e "${GREEN}🚀 Iniciando servidor de desarrollo...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

npm run dev

