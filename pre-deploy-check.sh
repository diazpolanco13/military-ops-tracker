#!/bin/bash

# ============================================
# Pre-Deploy Verification Script
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 Pre-Deploy Verification Script${NC}"
echo -e "${BLUE}  📦 app-mapas → Dokploy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Contador de errores
ERRORS=0
WARNINGS=0

# ============================================
# 1. Verificar Archivos Necesarios
# ============================================
echo -e "${YELLOW}📁 [1/8] Verificando archivos necesarios...${NC}"

check_file() {
  if [ -f "$1" ]; then
    echo -e "  ${GREEN}✓${NC} $1"
  else
    echo -e "  ${RED}✗${NC} $1 ${RED}(FALTA!)${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file "Dockerfile"
check_file "nginx.conf"
check_file ".dockerignore"
check_file ".gitignore"
check_file "package.json"
check_file "vite.config.js"
echo ""

# ============================================
# 2. Verificar Git
# ============================================
echo -e "${YELLOW}🔍 [2/8] Verificando Git...${NC}"

if [ -d ".git" ]; then
  echo -e "  ${GREEN}✓${NC} Git inicializado"
  
  # Ver remote
  REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")
  if [ "$REMOTE" != "none" ]; then
    echo -e "  ${GREEN}✓${NC} Remote: $REMOTE"
  else
    echo -e "  ${YELLOW}⚠${NC} No hay remote configurado"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Ver branch
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  echo -e "  ${GREEN}✓${NC} Branch actual: $BRANCH"
  
  # Ver commits
  COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
  echo -e "  ${GREEN}✓${NC} Commits: $COMMITS"
else
  echo -e "  ${RED}✗${NC} Git NO está inicializado"
  echo -e "    ${YELLOW}Ejecuta: git init${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 3. Verificar .gitignore
# ============================================
echo -e "${YELLOW}🔒 [3/8] Verificando .gitignore...${NC}"

if [ -f ".gitignore" ]; then
  if grep -q ".env" .gitignore; then
    echo -e "  ${GREEN}✓${NC} .env está ignorado"
  else
    echo -e "  ${RED}✗${NC} .env NO está en .gitignore (PELIGRO!)"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "node_modules" .gitignore; then
    echo -e "  ${GREEN}✓${NC} node_modules está ignorado"
  else
    echo -e "  ${YELLOW}⚠${NC} node_modules NO está ignorado"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${RED}✗${NC} .gitignore no existe"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 4. Verificar Variables de Entorno
# ============================================
echo -e "${YELLOW}🔑 [4/8] Verificando variables de entorno...${NC}"

if [ -f ".env" ]; then
  echo -e "  ${GREEN}✓${NC} .env existe localmente"
  
  # Verificar variables críticas
  if grep -q "VITE_MAPBOX_ACCESS_TOKEN" .env; then
    echo -e "  ${GREEN}✓${NC} VITE_MAPBOX_ACCESS_TOKEN configurada"
  else
    echo -e "  ${RED}✗${NC} VITE_MAPBOX_ACCESS_TOKEN falta"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo -e "  ${GREEN}✓${NC} VITE_SUPABASE_URL configurada"
  else
    echo -e "  ${RED}✗${NC} VITE_SUPABASE_URL falta"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo -e "  ${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY configurada"
  else
    echo -e "  ${RED}✗${NC} VITE_SUPABASE_ANON_KEY falta"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "  ${YELLOW}⚠${NC} .env no existe (normal si ya está en Dokploy)"
  echo -e "    ${YELLOW}Asegúrate de configurar variables en Dokploy${NC}"
fi

echo -e "\n  ${BLUE}ℹ${NC} Recuerda: Las variables VITE_* deben estar en Dokploy"
echo ""

# ============================================
# 5. Verificar Dependencias
# ============================================
echo -e "${YELLOW}📦 [5/8] Verificando dependencias...${NC}"

if [ -f "package.json" ]; then
  echo -e "  ${GREEN}✓${NC} package.json existe"
  
  if [ -f "package-lock.json" ]; then
    echo -e "  ${GREEN}✓${NC} package-lock.json existe"
  else
    echo -e "  ${YELLOW}⚠${NC} package-lock.json no existe"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Verificar node_modules
  if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} node_modules existe"
  else
    echo -e "  ${YELLOW}⚠${NC} node_modules no existe (ejecuta: npm install)"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${RED}✗${NC} package.json no existe"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 6. Test Build Local
# ============================================
echo -e "${YELLOW}🔨 [6/8] Probando build local...${NC}"

if command -v npm &> /dev/null; then
  echo -e "  ${GREEN}✓${NC} npm está instalado"
  
  # Verificar si node_modules existe
  if [ -d "node_modules" ]; then
    echo -e "  ${BLUE}→${NC} Ejecutando: npm run build"
    
    if npm run build > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓${NC} Build exitoso!"
      
      # Verificar dist/
      if [ -d "dist" ]; then
        echo -e "  ${GREEN}✓${NC} Carpeta dist/ creada"
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo -e "  ${GREEN}✓${NC} Tamaño del build: $DIST_SIZE"
      fi
    else
      echo -e "  ${RED}✗${NC} Build falló (ver arriba para detalles)"
      echo -e "    ${YELLOW}Ejecuta manualmente: npm run build${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} Saltando build (node_modules no existe)"
    echo -e "    ${YELLOW}Ejecuta: npm install && npm run build${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${RED}✗${NC} npm no está instalado"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 7. Verificar Dockerfile
# ============================================
echo -e "${YELLOW}🐳 [7/8] Verificando Dockerfile...${NC}"

if [ -f "Dockerfile" ]; then
  # Verificar multi-stage
  if grep -q "FROM node" Dockerfile && grep -q "FROM nginx" Dockerfile; then
    echo -e "  ${GREEN}✓${NC} Multi-stage build configurado"
  else
    echo -e "  ${YELLOW}⚠${NC} No parece ser multi-stage"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Verificar COPY nginx.conf
  if grep -q "nginx.conf" Dockerfile; then
    echo -e "  ${GREEN}✓${NC} nginx.conf se copia en Dockerfile"
  else
    echo -e "  ${RED}✗${NC} nginx.conf NO se copia en Dockerfile"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Verificar EXPOSE 80
  if grep -q "EXPOSE 80" Dockerfile; then
    echo -e "  ${GREEN}✓${NC} Puerto 80 expuesto"
  else
    echo -e "  ${YELLOW}⚠${NC} Puerto 80 no está expuesto"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${RED}✗${NC} Dockerfile no existe"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 8. Verificar Git Status
# ============================================
echo -e "${YELLOW}📝 [8/8] Verificando Git status...${NC}"

if [ -d ".git" ]; then
  CHANGED=$(git status --porcelain | wc -l)
  
  if [ $CHANGED -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Working directory limpio"
    echo -e "  ${GREEN}✓${NC} Todo está commiteado"
  else
    echo -e "  ${YELLOW}⚠${NC} Hay $CHANGED archivos sin commitear"
    echo -e "    ${YELLOW}Archivos modificados:${NC}"
    git status --short | head -10
    echo ""
    echo -e "    ${YELLOW}Ejecuta:${NC}"
    echo -e "      git add ."
    echo -e "      git commit -m 'Preparar para deploy'"
    echo -e "      git push"
    WARNINGS=$((WARNINGS + 1))
  fi
fi
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 RESUMEN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ ¡PERFECTO! Todo listo para deploy${NC}"
  echo ""
  echo -e "${GREEN}Próximos pasos:${NC}"
  echo -e "  1. ${GREEN}git push${NC} (si hay cambios sin subir)"
  echo -e "  2. Ir a ${GREEN}https://operativus.net${NC}"
  echo -e "  3. Conectar GitHub y deployar"
  echo -e "  4. Configurar variables de entorno en Dokploy"
  echo -e "  5. Añadir dominio: ${GREEN}maps.operativus.net${NC}"
  echo ""
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Hay $WARNINGS advertencias (no críticas)${NC}"
  echo ""
  echo -e "${YELLOW}Puedes continuar, pero revisa las advertencias arriba.${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Hay $ERRORS errores críticos${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Y $WARNINGS advertencias${NC}"
  fi
  echo ""
  echo -e "${RED}Por favor, corrige los errores antes de deployar.${NC}"
  echo ""
  exit 1
fi

