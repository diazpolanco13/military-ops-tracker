/**
 * Sistema de clasificación de inteligencia
 * Basado en estándares OTAN/militares
 */

// Confiabilidad de la fuente
export const SOURCE_RELIABILITY = {
  A: {
    code: 'A',
    label: 'Completamente confiable',
    description: 'Fuente con historial comprobado de confiabilidad',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500/50'
  },
  B: {
    code: 'B',
    label: 'Usualmente confiable',
    description: 'Fuente que ha sido confiable en el pasado',
    color: 'text-lime-400',
    bgColor: 'bg-lime-900/30',
    borderColor: 'border-lime-500/50'
  },
  C: {
    code: 'C',
    label: 'Regularmente confiable',
    description: 'Fuente que ha sido confiable algunas veces',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500/50'
  },
  D: {
    code: 'D',
    label: 'No usualmente confiable',
    description: 'Fuente que raramente ha sido confiable',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-500/50'
  },
  E: {
    code: 'E',
    label: 'No confiable',
    description: 'Fuente con historial de información incorrecta',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500/50'
  },
  F: {
    code: 'F',
    label: 'No se puede juzgar',
    description: 'Fuente desconocida o sin historial',
    color: 'text-slate-400',
    bgColor: 'bg-slate-900/30',
    borderColor: 'border-slate-500/50'
  }
};

// Credibilidad de la información
export const INFO_CREDIBILITY = {
  '1': {
    code: '1',
    label: 'Confirmada',
    description: 'Información confirmada por otras fuentes independientes',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500/50'
  },
  '2': {
    code: '2',
    label: 'Probablemente cierta',
    description: 'Información consistente con otros reportes',
    color: 'text-lime-400',
    bgColor: 'bg-lime-900/30',
    borderColor: 'border-lime-500/50'
  },
  '3': {
    code: '3',
    label: 'Posiblemente cierta',
    description: 'Información que podría ser correcta',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500/50'
  },
  '4': {
    code: '4',
    label: 'Dudosa',
    description: 'Información cuestionable o inconsistente',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-500/50'
  },
  '5': {
    code: '5',
    label: 'Improbable',
    description: 'Información probablemente incorrecta',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500/50'
  },
  '6': {
    code: '6',
    label: 'No se puede juzgar',
    description: 'Insuficiente información para evaluar',
    color: 'text-slate-400',
    bgColor: 'bg-slate-900/30',
    borderColor: 'border-slate-500/50'
  }
};

// Niveles de prioridad
export const PRIORITY_LEVELS = {
  normal: {
    code: 'normal',
    label: 'Normal',
    icon: '📋',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-600',
    badgeClass: 'bg-slate-700 text-slate-300'
  },
  importante: {
    code: 'importante',
    label: 'Importante',
    icon: '⚠️',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
    badgeClass: 'bg-yellow-600 text-white'
  },
  urgente: {
    code: 'urgente',
    label: 'Urgente',
    icon: '🚨',
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    badgeClass: 'bg-red-600 text-white animate-pulse'
  }
};

// Función helper para obtener clasificación completa (ej: "A1", "C3")
export const getClassificationCode = (sourceReliability, infoCredibility) => {
  return `${sourceReliability || 'F'}${infoCredibility || '6'}`;
};

// Función helper para obtener descripción completa
export const getClassificationDescription = (sourceReliability, infoCredibility) => {
  const source = SOURCE_RELIABILITY[sourceReliability] || SOURCE_RELIABILITY.F;
  const info = INFO_CREDIBILITY[infoCredibility] || INFO_CREDIBILITY['6'];
  return `${source.label} / ${info.label}`;
};

// Función helper para obtener color del badge según clasificación
export const getClassificationColor = (sourceReliability, infoCredibility) => {
  // Priorizar el nivel más bajo (peor)
  const sourceLevel = sourceReliability?.charCodeAt(0) || 70; // F = 70
  const infoLevel = parseInt(infoCredibility) || 6;
  
  // Si ambos son buenos (A-B y 1-2), verde
  if (sourceLevel <= 66 && infoLevel <= 2) {
    return { bg: 'bg-green-900/30', border: 'border-green-500/50', text: 'text-green-400' };
  }
  // Si son medianos (C-D y 3-4), amarillo
  if (sourceLevel <= 68 && infoLevel <= 4) {
    return { bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', text: 'text-yellow-400' };
  }
  // Si son malos (E-F o 5-6), rojo
  return { bg: 'bg-red-900/30', border: 'border-red-500/50', text: 'text-red-400' };
};

