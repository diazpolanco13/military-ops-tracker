import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { singleflight } from '../lib/singleflight';

/**
 * 📋 Hook para gestionar plantillas de entidades
 * 
 * ✅ OPTIMIZADO: Cache compartido en memoria (singleton)
 * - Las plantillas cambian muy poco (solo 25 registros)
 * - Se cachean por 5 minutos
 * - Todos los componentes comparten la misma data
 * - Evita queries duplicadas al montar múltiples componentes
 */

// ========== CACHE COMPARTIDO (Module Scope) ==========
let sharedTemplates = [];
let sharedLoading = true;
let sharedError = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const listeners = new Set();

function notifyListeners() {
  listeners.forEach(cb => {
    try { cb({ templates: sharedTemplates, loading: sharedLoading, error: sharedError }); } 
    catch { /* ignore */ }
  });
}

function subscribe(callback) {
  listeners.add(callback);
  // Emitir estado actual inmediatamente
  callback({ templates: sharedTemplates, loading: sharedLoading, error: sharedError });
  return () => listeners.delete(callback);
}

// ========== FUNCIÓN DE FETCH CON DEDUPE ==========
async function fetchTemplatesInternal(force = false) {
  const now = Date.now();
  
  // Si el cache es válido y no es forzado, no hacer nada
  if (!force && sharedTemplates.length > 0 && (now - lastFetchTime) < CACHE_TTL_MS) {
    return sharedTemplates;
  }

  // Usar singleflight para evitar queries duplicadas simultáneas
  return singleflight('entity-templates-fetch', async () => {
    sharedLoading = true;
    sharedError = null;
    notifyListeners();

    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('entity_type', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;

      sharedTemplates = data || [];
      lastFetchTime = Date.now();
      sharedError = null;
      console.log(`📋 Templates cacheados: ${sharedTemplates.length} (válido por 5 min)`);
    } catch (err) {
      console.error('Error fetching templates:', err);
      sharedError = err.message;
    } finally {
      sharedLoading = false;
      notifyListeners();
    }

    return sharedTemplates;
  }, { ttlMs: 2000 });
}

// ========== HOOK PRINCIPAL ==========
export function useEntityTemplates() {
  const [state, setState] = useState({
    templates: sharedTemplates,
    loading: sharedLoading,
    error: sharedError
  });

  useEffect(() => {
    // Suscribirse al cache compartido
    const unsubscribe = subscribe(setState);

    // Trigger fetch si es necesario (dedupe automático)
    fetchTemplatesInternal();

    return unsubscribe;
  }, []);

  // ========== MÉTODOS DE CONSULTA ==========

  /**
   * Refrescar plantillas (fuerza reload)
   */
  const fetchTemplates = useCallback(() => {
    return fetchTemplatesInternal(true);
  }, []);

  /**
   * Obtener plantillas por categoría (desde cache)
   */
  const getTemplatesByCategory = useCallback((category) => {
    return state.templates.filter(t => t.category === category);
  }, [state.templates]);

  /**
   * Obtener plantillas por tipo (desde cache)
   */
  const getTemplatesByType = useCallback((entityType) => {
    return state.templates.filter(t => t.entity_type === entityType);
  }, [state.templates]);

  /**
   * Obtener plantilla por código (desde cache)
   */
  const getTemplateByCode = useCallback((code) => {
    return state.templates.find(t => t.code === code) || null;
  }, [state.templates]);

  /**
   * Obtener plantilla por ID (desde cache)
   */
  const getTemplateById = useCallback((id) => {
    return state.templates.find(t => t.id === id) || null;
  }, [state.templates]);

  /**
   * Obtener plantillas más usadas (desde cache)
   */
  const getTopTemplates = useCallback((limit = 5) => {
    return [...state.templates]
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, limit);
  }, [state.templates]);

  /**
   * Buscar plantillas por texto (desde cache)
   */
  const searchTemplates = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    
    return state.templates.filter(template => {
      const searchableText = [
        template.name,
        template.display_name,
        template.description,
        template.class,
        template.code,
        template.entity_type,
        template.category,
        template.sub_type
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [state.templates]);

  /**
   * Agrupar plantillas por categoría y tipo
   */
  const getTemplatesHierarchy = useCallback(() => {
    const hierarchy = {};

    state.templates.forEach(template => {
      const { category, entity_type } = template;

      if (!hierarchy[category]) {
        hierarchy[category] = {};
      }

      if (!hierarchy[category][entity_type]) {
        hierarchy[category][entity_type] = [];
      }

      hierarchy[category][entity_type].push(template);
    });

    return hierarchy;
  }, [state.templates]);

  // ========== MÉTODOS DE MODIFICACIÓN ==========

  /**
   * Crear nueva plantilla
   */
  const createTemplate = useCallback(async (templateData) => {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidar cache y refetch
      await fetchTemplatesInternal(true);
      
      return { success: true, data };
    } catch (err) {
      console.error('Error creating template:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Actualizar plantilla existente
   */
  const updateTemplate = useCallback(async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidar cache y refetch
      await fetchTemplatesInternal(true);
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating template:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Eliminar plantilla (soft delete)
   */
  const deleteTemplate = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('entity_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      // Invalidar cache y refetch
      await fetchTemplatesInternal(true);
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting template:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    // Estado
    templates: state.templates,
    loading: state.loading,
    error: state.error,

    // Métodos de consulta (desde cache - sin queries)
    fetchTemplates,
    getTemplatesByCategory,
    getTemplatesByType,
    getTemplateByCode,
    getTemplateById,
    getTopTemplates,
    searchTemplates,
    getTemplatesHierarchy,

    // Métodos de modificación
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
