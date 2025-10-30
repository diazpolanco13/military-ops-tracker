#!/bin/bash

# ============================================
# Script de Testing Docker Local
# ============================================

set -e

echo "🚀 Testing Docker Build para Dokploy"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
IMAGE_NAME="app-mapas-test"
CONTAINER_NAME="app-mapas-container"
PORT=3000

echo -e "${YELLOW}📦 Paso 1: Building Docker image...${NC}"
docker build -t $IMAGE_NAME . || {
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
}

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

echo -e "${YELLOW}🧹 Paso 2: Limpiando containers previos...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup done!${NC}"
echo ""

echo -e "${YELLOW}🚀 Paso 3: Starting container on port $PORT...${NC}"
docker run -d \
  -p $PORT:80 \
  --name $CONTAINER_NAME \
  $IMAGE_NAME || {
  echo -e "${RED}❌ Container failed to start!${NC}"
  exit 1
}

echo -e "${GREEN}✅ Container started!${NC}"
echo ""

echo -e "${YELLOW}⏳ Waiting for app to be ready...${NC}"
sleep 5

echo -e "${YELLOW}🔍 Paso 4: Testing health check...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health)

if [ "$HEALTH_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Health check passed!${NC}"
else
  echo -e "${RED}❌ Health check failed! Status: $HEALTH_STATUS${NC}"
  echo "Showing logs:"
  docker logs $CONTAINER_NAME
  exit 1
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ ¡TODO FUNCIONA!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📱 Accede a la app en: http://localhost:$PORT"
echo ""
echo "📊 Comandos útiles:"
echo "  - Ver logs:     docker logs -f $CONTAINER_NAME"
echo "  - Detener:      docker stop $CONTAINER_NAME"
echo "  - Eliminar:     docker rm $CONTAINER_NAME"
echo "  - Reiniciar:    docker restart $CONTAINER_NAME"
echo ""
echo "🎯 Si funciona aquí, funcionará en Dokploy!"
echo ""

