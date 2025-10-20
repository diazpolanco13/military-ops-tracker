#!/bin/bash

# ===========================================
# 🚀 Military Ops Tracker - Inicio Limpio con PM2
# ===========================================

echo "🧹 Iniciando Military Ops Tracker de forma limpia..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar si PM2 está instalado
log_info "Verificando instalación de PM2..."
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 no está instalado. Instálalo con: npm install -g pm2"
    exit 1
fi
log_success "PM2 está instalado"

# 2. Detener cualquier instancia anterior de PM2
echo ""
log_info "Deteniendo instancias anteriores de PM2..."
pm2 stop app-mapas 2>/dev/null
pm2 delete app-mapas 2>/dev/null
log_success "Instancias anteriores detenidas"

# 3. Limpiar cachés y archivos temporales
echo ""
log_info "Limpiando cachés y archivos temporales..."
rm -rf node_modules/.vite 2>/dev/null
rm -rf dist 2>/dev/null
rm -rf .tmp 2>/dev/null
log_success "Cachés limpiados"

# 4. Verificar dependencias de Node.js
echo ""
log_info "Verificando dependencias de Node.js..."
if [ ! -d "node_modules" ]; then
    log_warning "Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Error instalando dependencias"
        exit 1
    fi
    log_success "Dependencias instaladas"
else
    log_success "Dependencias ya instaladas"
fi

# 5. Verificar variables de entorno
echo ""
log_info "Verificando variables de entorno..."
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    log_warning "No se encontró archivo de variables de entorno (.env.local o .env)"
    log_warning "Asegúrate de configurar las variables necesarias:"
    echo "  - VITE_MAPBOX_ACCESS_TOKEN"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
else
    log_success "Archivo de variables de entorno encontrado"
fi

# 6. Construir la aplicación
echo ""
log_info "Construyendo aplicación..."
npm run build
if [ $? -ne 0 ]; then
    log_error "Error durante el build"
    exit 1
fi
log_success "Build completado"

# 7. Verificar que el build existe
if [ ! -d "dist" ]; then
    log_error "Directorio 'dist' no encontrado después del build"
    exit 1
fi

# 8. Iniciar con PM2
echo ""
log_info "Iniciando aplicación con PM2..."
pm2 start ecosystem.config.cjs
if [ $? -ne 0 ]; then
    log_error "Error iniciando con PM2"
    exit 1
fi

# 9. Esperar un momento y verificar estado
echo ""
log_info "Verificando estado de PM2..."
sleep 3
pm2 status

# 10. Mostrar información de acceso
echo ""
echo -e "${GREEN}🎉 Military Ops Tracker iniciado exitosamente!${NC}"
echo ""
echo -e "${BLUE}📊 Información de la aplicación:${NC}"
echo "   🌐 URL: http://localhost:8080"
echo "   📁 Directorio: $(pwd)"
echo "   📝 PM2 App Name: app-mapas"
echo ""
echo -e "${YELLOW}🔧 Comandos útiles:${NC}"
echo "   pm2 status              # Ver estado"
echo "   pm2 logs app-mapas      # Ver logs"
echo "   pm2 restart app-mapas   # Reiniciar"
echo "   pm2 stop app-mapas      # Detener"
echo "   pm2 delete app-mapas    # Eliminar de PM2"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 11. Mostrar logs iniciales
echo ""
log_info "Mostrando logs iniciales (presiona Ctrl+C para salir)..."
echo ""
pm2 logs app-mapas --lines 10 --nostream
