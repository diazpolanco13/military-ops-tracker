import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para acciones sobre entidades (editar, ocultar, archivar, eliminar)
 */
export function useEntityActions() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Toggle visibilidad de una entidad en el mapa
   */
  async function toggleVisibility(entityId, currentVisibility) {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from('entities')
        .update({ is_visible: !currentVisibility })
        .eq('id', entityId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error al cambiar visibilidad:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }

  /**
   * Archivar una entidad (soft delete)
   */
  async function archiveEntity(entityId) {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from('entities')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', entityId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error al archivar entidad:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }

  /**
   * Restaurar una entidad archivada
   */
  async function unarchiveEntity(entityId) {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from('entities')
        .update({ archived_at: null })
        .eq('id', entityId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error al restaurar entidad:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }

  /**
   * Eliminar entidad permanentemente (hard delete)
   */
  async function deleteEntity(entityId) {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar entidad:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }

  /**
   * Actualizar entidad completa
   */
  async function updateEntity(entityId, updates) {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', entityId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error al actualizar entidad:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }

  return {
    toggleVisibility,
    archiveEntity,
    unarchiveEntity,
    deleteEntity,
    updateEntity,
    processing,
    error,
  };
}

