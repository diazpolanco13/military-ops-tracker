import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gestionar plantillas de entidades
 * Permite obtener, crear, actualizar y eliminar plantillas base
 */
export function useEntityTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  /**
   * Obtener todas las plantillas activas
   */
  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('entity_type', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Obtener plantillas por categoría
   * @param {string} category - Categoría (militar, civil, comercial)
   */
  async function getTemplatesByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('entity_type', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching templates by category:', err);
      return [];
    }
  }

  /**
   * Obtener plantillas por tipo
   * @param {string} entityType - Tipo de entidad (destructor, avion, etc)
   */
  async function getTemplatesByType(entityType) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching templates by type:', err);
      return [];
    }
  }

  /**
   * Obtener plantilla por código
   * @param {string} code - Código único de la plantilla
   */
  async function getTemplateByCode(code) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching template by code:', err);
      return null;
    }
  }

  /**
   * Obtener plantilla por ID
   * @param {string} id - UUID de la plantilla
   */
  async function getTemplateById(id) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching template by id:', err);
      return null;
    }
  }

  /**
   * Crear nueva plantilla
   * @param {object} templateData - Datos de la plantilla
   */
  async function createTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      
      // Refetch para actualizar la lista
      await fetchTemplates();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error creating template:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Actualizar plantilla existente
   * @param {string} id - UUID de la plantilla
   * @param {object} updates - Campos a actualizar
   */
  async function updateTemplate(id, updates) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refetch para actualizar la lista
      await fetchTemplates();
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating template:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Eliminar plantilla (soft delete)
   * @param {string} id - UUID de la plantilla
   */
  async function deleteTemplate(id) {
    try {
      const { error } = await supabase
        .from('entity_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      // Refetch para actualizar la lista
      await fetchTemplates();
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting template:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Obtener plantillas más usadas
   * @param {number} limit - Número de plantillas a retornar
   */
  async function getTopTemplates(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('entity_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching top templates:', err);
      return [];
    }
  }

  /**
   * Buscar plantillas por texto
   * @param {string} searchTerm - Término de búsqueda
   */
  async function searchTemplates(searchTerm) {
    try {
      const { data, error} = await supabase
        .from('entity_templates')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,class.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching templates:', err);
      return [];
    }
  }

  /**
   * Agrupar plantillas por categoría y tipo
   * @returns {object} - Objeto con estructura jerárquica
   */
  function getTemplatesHierarchy() {
    const hierarchy = {};

    templates.forEach(template => {
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
  }

  return {
    // Estado
    templates,
    loading,
    error,

    // Métodos de consulta
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

