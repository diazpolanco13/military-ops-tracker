#!/bin/bash

echo "🛑 Deteniendo Military Ops Tracker..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detener procesos en puerto 5173 (Vite)
echo -e "${YELLOW}Buscando procesos en puerto 5173...${NC}"
PORT_PID=$(lsof -ti:5173)

if [ ! -z "$PORT_PID" ]; then
    echo -e "${YELLOW}Encontrado proceso con PID: ${PORT_PID}${NC}"
    kill -9 $PORT_PID 2>/dev/null
    echo -e "${GREEN}✅ Servidor detenido exitosamente${NC}"
else
    echo -e "${YELLOW}⚠️  No hay procesos corriendo en puerto 5173${NC}"
fi

echo ""
echo -e "${GREEN}✓ Listo${NC}"

