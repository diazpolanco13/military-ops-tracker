import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * 📄 Generador de PDF estilo SEBIN/Inteligencia Militar
 * Formato profesional para reportes de inteligencia
 */

// Configuración de colores (idénticos al documento SEBIN)
const COLORS = {
  RED: [255, 0, 0],           // Rojo puro para texto crítico
  YELLOW: [255, 255, 0],      // Amarillo puro para resaltado
  BLACK: [0, 0, 0],
  GRAY: [128, 128, 128],
  BLUE: [0, 0, 255],          // Azul puro para hashtags
  WHITE: [255, 255, 255],
  DARK_RED: [139, 0, 0],      // Rojo oscuro para "Importante"
};

// Mapeo de prioridades a colores
const PRIORITY_COLORS = {
  urgente: COLORS.RED,
  importante: [234, 179, 8], // Amarillo oscuro
  normal: COLORS.GRAY,
};

// Mapeo de tipos de eventos
const EVENT_TYPES = {
  evento: '🎯 EVENTO',
  noticia: '📰 NOTICIA',
  informe: '📄 INFORME',
};

/**
 * Genera el encabezado estilo SEBIN
 */
function generateHeader(doc, filterInfo, logoImage = null) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Banner superior ROJO con "CONFIDENCIAL"
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL', pageWidth / 2, 8, { align: 'center' });
  
  // Logo SAE en la esquina superior derecha (si existe)
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'PNG', pageWidth - 35, 14, 15, 15);
    } catch (err) {
      console.warn('No se pudo cargar el logo:', err);
    }
  }

  // Título principal
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text('CENTRO DE OPERACIONES TÁCTICAS', pageWidth / 2, 20, { align: 'center' });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 24, pageWidth - 20, 24);

  // Metadatos del reporte
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let yPos = 30;

  // DISTRIBUCIÓN
  doc.text('DISTRIBUCIÓN:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('COMANDO OPERACIONAL', 65, yPos);

  // FECHA
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(now.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase(), 65, yPos);

  // CLASIFICACIÓN
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('CLASIFICACIÓN:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('OPERACIONAL - USO INTERNO', 65, yPos);

  // FILTROS APLICADOS (si existen)
  if (filterInfo && filterInfo.length > 0) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('FILTRADO POR:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(filterInfo, 65, yPos);
  }

  // Línea separadora
  yPos += 4;
  doc.line(20, yPos, pageWidth - 20, yPos);

  // TÍTULO DEL REPORTE
  yPos += 8;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE EVENTOS', pageWidth / 2, yPos, { align: 'center' });

  return yPos + 8; // Retornar posición Y donde empieza el contenido
}

/**
 * Genera el resumen ejecutivo
 */
function generateSummary(doc, events, yPos) {
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, pageWidth - 40, 20, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RESUMEN EJECUTIVO', 25, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Contador de eventos
  const totalEventos = events.length;
  const urgentes = events.filter(e => e.priority_level === 'urgente').length;
  const importantes = events.filter(e => e.priority_level === 'importante').length;
  
  doc.text(`• Total de eventos: ${totalEventos}`, 25, yPos + 12);
  doc.text(`• Urgentes: ${urgentes} | Importantes: ${importantes}`, 25, yPos + 17);

  return yPos + 25;
}

/**
 * Formatea el texto con resaltados y negritas (estilo SEBIN exacto)
 */
function addFormattedText(doc, text, x, y, maxWidth, isHighlighted = false, isCritical = false) {
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;
  
  lines.forEach(line => {
    // Fondo amarillo INTENSO para texto resaltado (como SEBIN)
    if (isHighlighted) {
      const textWidth = doc.getTextWidth(line);
      doc.setFillColor(255, 255, 0); // Amarillo puro RGB
      doc.rect(x - 1, currentY - 3.5, textWidth + 2, 4.5, 'F');
    }
    
    // Color rojo BRILLANTE para texto crítico (como SEBIN)
    if (isCritical) {
      doc.setTextColor(255, 0, 0); // Rojo puro
      doc.setFont('helvetica', 'bold');
    } else if (isHighlighted) {
      doc.setTextColor(0, 0, 0); // Negro sobre amarillo
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'normal');
    }
    
    doc.text(line, x, currentY);
    currentY += 4.5;
  });
  
  return currentY;
}

/**
 * Genera un evento individual (estilo SEBIN exacto)
 */
function generateEvent(doc, event, index, yPos, pageHeight, pageWidth) {
  const marginLeft = 25;
  const maxWidth = pageWidth - 50;
  
  // Verificar si necesitamos nueva página
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }
  
  // Número de evento (bullet) - MÁS GRANDE
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.BLACK);
  doc.text(`${index + 1}.`, 20, yPos);
  
  // Tipo de evento + Título (TODO EN MAYÚSCULAS, NEGRITA, CON FONDO AMARILLO)
  const eventType = EVENT_TYPES[event.type] || '📋';
  const title = `${eventType} I N F O R M E : ${event.title.toUpperCase()}`;
  
  // Determinar estilo según prioridad
  const isUrgent = event.priority_level === 'urgente';
  const isImportant = event.priority_level === 'importante';
  
  // SIEMPRE con fondo amarillo para el título
  doc.setFontSize(10);
  yPos = addFormattedText(doc, title, marginLeft, yPos, maxWidth, true, false);
  
  // Fecha y hora
  yPos += 2;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.BLACK);
  const eventDate = new Date(event.event_date).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha: ${eventDate}`, marginLeft, yPos);
  
  // Clasificación de inteligencia (MÁS VISIBLE)
  if (event.source_reliability || event.info_credibility) {
    yPos += 4;
    doc.setTextColor(255, 0, 0); // Rojo para clasificación
    doc.setFont('helvetica', 'bold');
    const classification = `Clasificación: ${event.source_reliability || 'N/A'}${event.info_credibility || 'N/A'}`;
    doc.text(classification, marginLeft, yPos);
  }
  
  // Descripción (ROJO BRILLANTE si es urgente/importante)
  if (event.description) {
    yPos += 5;
    doc.setFontSize(9);
    
    if (isUrgent || isImportant) {
      // Texto ROJO BRILLANTE para eventos críticos
      doc.setTextColor(255, 0, 0);
      doc.setFont('helvetica', 'bold');
      yPos = addFormattedText(doc, event.description, marginLeft, yPos, maxWidth, false, true);
    } else {
      // Texto normal para eventos normales
      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'normal');
      yPos = addFormattedText(doc, event.description, marginLeft, yPos, maxWidth, false, false);
    }
  }
  
  // Ubicación (con emoji)
  if (event.location) {
    yPos += 4;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.BLACK);
    doc.setFont('helvetica', 'normal');
    doc.text(`📍 Ubicación: ${event.location}`, marginLeft, yPos);
  }
  
  // Entidades relacionadas
  if (event.entities && event.entities.length > 0) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.BLACK);
    doc.text('Entidades:', marginLeft, yPos);
    
    yPos += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    event.entities.forEach(entity => {
      doc.text(`• ${entity.name} (${entity.type})`, marginLeft + 5, yPos);
      yPos += 3.5;
    });
  }
  
  // Hashtags (azul puro, más pequeños)
  yPos += 4;
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 255); // Azul puro
  doc.setFont('helvetica', 'normal');
  const tags = event.tags || [];
  const hashtagsText = tags.map(tag => `#${tag}`).join(' ');
  if (hashtagsText) {
    doc.text(hashtagsText, marginLeft, yPos);
    yPos += 3;
  }
  
  // Separador entre eventos (MÁS GRUESO)
  yPos += 5;
  doc.setDrawColor(0, 0, 0); // Negro
  doc.setLineWidth(0.5); // Más grueso
  doc.line(marginLeft, yPos, pageWidth - 25, yPos);
  
  return yPos + 8;
}

/**
 * Carga el logo SAE como base64
 */
async function loadLogo() {
  try {
    const response = await fetch('/logo_sae.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error cargando logo:', err);
    return null;
  }
}

/**
 * Función principal de exportación
 */
export async function exportEventsToPDF(events, filterInfo = '') {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Cargar logo SAE
  const logoImage = await loadLogo();
  
  // Header
  let yPos = generateHeader(doc, filterInfo, logoImage);
  
  // Resumen ejecutivo
  yPos = generateSummary(doc, events, yPos);
  yPos += 5;
  
  // Eventos
  events.forEach((event, index) => {
    yPos = generateEvent(doc, event, index, yPos, pageHeight, pageWidth);
  });
  
  // Footer en todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.GRAY);
    doc.text(
      `Página ${i} de ${totalPages} - Generado: ${new Date().toLocaleString('es-ES')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Guardar PDF
  const filename = `REPORTE_EVENTOS_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

