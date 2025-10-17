import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para crear nuevas entidades (con o sin plantilla)
 */
export function useCreateEntity() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Crear una nueva entidad
   * @param {object} entityData - Datos de la entidad a crear
   * @returns {object} - { success: boolean, data?: object, error?: string }
   */
  async function createEntity(entityData) {
    try {
      setCreating(true);
      setError(null);

      // Construir el objeto geography POINT para PostGIS
      const position = `POINT(${entityData.longitude} ${entityData.latitude})`;

      // Preparar datos para inserción
      const insertData = {
        name: entityData.name,
        class: entityData.code || entityData.class || null, // 'code' va a 'class'
        type: entityData.type,
        status: entityData.status || 'activo',
        position, // PostGIS geography
        heading: entityData.heading || 0,
        speed: entityData.speed || 0,
        altitude: entityData.altitude || 0,
        template_id: entityData.template_id || null,
        
        // Campos opcionales que pueden sobrescribir la plantilla
        commissioned_year: entityData.commissioned_year || null,
        displacement_tons: entityData.displacement_tons || null,
        length_meters: entityData.length_meters || null,
        beam_meters: entityData.beam_meters || null,
        max_speed_knots: entityData.max_speed_knots || null,
        crew_count: entityData.crew_count || null,
        range_km: entityData.range_km || null,
        air_wing: entityData.air_wing || null,
        propulsion: entityData.propulsion || null,
        thrust_hp: entityData.thrust_hp || null,
        country_origin: entityData.country_origin || null,
        manufacturer: entityData.manufacturer || null,
        armamento: entityData.armamento || null,
        image_url: entityData.image_url || null,
        image_thumbnail_url: entityData.image_thumbnail_url || null,
      };

      const { data, error: insertError } = await supabase
        .from('entities')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error al crear entidad:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCreating(false);
    }
  }

  /**
   * Crear entidad desde plantilla
   * Simplifica el proceso heredando valores de la plantilla
   * @param {object} formData - Datos del formulario (solo campos únicos)
   * @param {object} template - Plantilla base
   */
  async function createFromTemplate(formData, template) {
    const entityData = {
      ...formData,
      template_id: template.id,
      type: template.entity_type,
      // Los campos NULL se heredarán automáticamente de la plantilla
      // mediante COALESCE en las queries
    };

    return await createEntity(entityData);
  }

  return {
    createEntity,
    createFromTemplate,
    creating,
    error,
  };
}

