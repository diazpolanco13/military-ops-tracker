import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 🎯 Hook para gestionar grupos de entidades
 * Permite crear, actualizar y gestionar formaciones militares
 */
export function useEntityGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar grupos con sus miembros
  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Obtener grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from('entity_groups')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Para cada grupo, obtener sus miembros
      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: members, error: membersError } = await supabase
            .from('entity_group_members')
            .select(`
              id,
              role,
              joined_at,
              entity:entities(*)
            `)
            .eq('group_id', group.id);

          if (membersError) {
            console.error('Error loading members:', membersError);
            return { ...group, members: [] };
          }

          return {
            ...group,
            members: members || [],
            count: members?.length || 0
          };
        })
      );

      setGroups(groupsWithMembers);
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * Crear nuevo grupo
   */
  const createGroup = async (groupData) => {
    try {
      const { data, error } = await supabase
        .from('entity_groups')
        .insert(groupData)
        .select()
        .single();

      if (error) throw error;

      await fetchGroups();
      return { success: true, data };
    } catch (err) {
      console.error('Error creating group:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Agregar entidades a un grupo
   */
  const addEntitiesToGroup = async (groupId, entityIds, role = 'member') => {
    try {
      const members = entityIds.map(entityId => ({
        group_id: groupId,
        entity_id: entityId,
        role: role
      }));

      const { error } = await supabase
        .from('entity_group_members')
        .insert(members);

      if (error) throw error;

      await fetchGroups();
      return { success: true };
    } catch (err) {
      console.error('Error adding entities to group:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Remover entidad de un grupo
   */
  const removeEntityFromGroup = async (groupId, entityId) => {
    try {
      const { error } = await supabase
        .from('entity_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('entity_id', entityId);

      if (error) throw error;

      await fetchGroups();
      return { success: true };
    } catch (err) {
      console.error('Error removing entity from group:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Eliminar grupo completo
   */
  const deleteGroup = async (groupId) => {
    try {
      const { error } = await supabase
        .from('entity_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      await fetchGroups();
      return { success: true };
    } catch (err) {
      console.error('Error deleting group:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Sugerir grupos automáticos basados en proximidad y tipo
   */
  const suggestGroups = (entities) => {
    const suggestions = [];
    const processed = new Set();

    entities.forEach((entity, idx) => {
      if (processed.has(entity.id)) return;

      // Buscar entidades cercanas del mismo tipo y clase
      const nearby = entities.filter((other, otherIdx) => {
        if (otherIdx === idx || processed.has(other.id)) return false;
        if (other.type !== entity.type) return false;
        if (other.class !== entity.class) return false;

        // Calcular distancia aproximada (simplificado)
        const latDiff = Math.abs(entity.latitude - other.latitude);
        const lngDiff = Math.abs(entity.longitude - other.longitude);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        // Agrupar si están a menos de 0.5 grados (~55km)
        return distance < 0.5;
      });

      if (nearby.length >= 1) { // ✅ Cambiado de 2 a 1 (mínimo 2 entidades totales)
        const groupEntities = [entity, ...nearby];
        groupEntities.forEach(e => processed.add(e.id));

        suggestions.push({
          name: `${entity.class} Squadron`,
          type: entity.type,
          class: entity.class,
          entities: groupEntities,
          count: groupEntities.length,
          centerLat: groupEntities.reduce((sum, e) => sum + parseFloat(e.latitude), 0) / groupEntities.length,
          centerLng: groupEntities.reduce((sum, e) => sum + parseFloat(e.longitude), 0) / groupEntities.length,
        });
      }
    });

    return suggestions;
  };

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    addEntitiesToGroup,
    removeEntityFromGroup,
    deleteGroup,
    suggestGroups,
  };
}

