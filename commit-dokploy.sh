#!/bin/bash

# ============================================
# Commit para Dokploy Deployment
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📦 Preparando commit para Dokploy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar que no haya .env
echo -e "${YELLOW}🔍 Verificando archivos sensibles...${NC}"
if git status --porcelain | grep -E "\.env$|\.env\.local|\.env\.production"; then
  echo -e "${RED}❌ PELIGRO: Archivo .env detectado!${NC}"
  echo -e "${RED}   NO debes subir archivos .env a GitHub${NC}"
  exit 1
else
  echo -e "${GREEN}✓ No hay archivos .env en staging${NC}"
fi
echo ""

# Mostrar archivos que se van a agregar
echo -e "${YELLOW}📝 Archivos que se agregarán:${NC}"
echo ""
git status --short
echo ""

# Agregar todos los archivos
echo -e "${YELLOW}📦 Agregando archivos al staging...${NC}"
git add .

echo -e "${GREEN}✓ Archivos agregados${NC}"
echo ""

# Crear commit
echo -e "${YELLOW}💾 Creando commit...${NC}"
git commit -m "feat: Add Dokploy deployment configuration

- Add Dockerfile with multi-stage build (Node → Nginx)
- Add nginx.conf with security headers and SPA routing
- Add docker-compose.yml for local testing
- Add .dockerignore to optimize build
- Update vite.config.js for production deployment
- Add deployment guides:
  - GITHUB-DOKPLOY-SETUP.md (complete guide)
  - DEPLOYMENT-OPERATIVUS.md (operativus.net specific)
  - DEPLOY-RAPIDO.md (5-minute quickstart)
  - DOKPLOY-DEPLOYMENT.md (general Dokploy guide)
- Add helper scripts:
  - pre-deploy-check.sh (verify before deploy)
  - test-docker.sh (test Docker build locally)

Ready to deploy at: https://maps.operativus.net
Dokploy panel: https://operativus.net

Build configuration:
- Port: 80
- Health check: /health
- Auto SSL with Let's Encrypt
- Nginx with gzip compression
- Code splitting optimized

Environment variables required in Dokploy:
- VITE_MAPBOX_ACCESS_TOKEN
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- NODE_ENV=production"

echo -e "${GREEN}✓ Commit creado exitosamente!${NC}"
echo ""

# Mostrar resumen
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ✅ Commit listo para push${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}Próximos pasos:${NC}"
echo ""
echo -e "  1. Revisa el commit:"
echo -e "     ${YELLOW}git show${NC}"
echo ""
echo -e "  2. Push a GitHub:"
echo -e "     ${YELLOW}git push${NC}"
echo ""
echo -e "  3. Dokploy detectará el push automáticamente"
echo -e "     y comenzará el deployment"
echo ""
echo -e "  4. Monitorea el deploy en:"
echo -e "     ${BLUE}https://operativus.net${NC}"
echo ""
echo -e "  5. Una vez completado, verifica:"
echo -e "     ${BLUE}https://maps.operativus.net${NC}"
echo ""
echo -e "${GREEN}🚀 ¡Listo para deployar!${NC}"
echo ""

