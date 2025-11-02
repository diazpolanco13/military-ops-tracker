#!/usr/bin/env node

/**
 * 🤖 MCP Server para Military Operations Tracker
 * Permite a la IA consultar entidades, eventos, estadísticas y más
 */

import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oqhujdqbszbvozsuunkw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_ANON_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Crear servidor MCP
const server = new Server(
  {
    name: 'military-ops-tracker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 📋 HERRAMIENTA 1: Obtener estadísticas generales
async function getDeploymentStats() {
  try {
    const { data: entities, error } = await supabase
      .from('entities')
      .select('*')
      .eq('is_visible', true)
      .is('archived_at', null);

    if (error) throw error;

    // Calcular estadísticas por tipo
    const stats = {};
    let totalEffectives = 0;

    entities.forEach(entity => {
      const type = entity.type;
      if (!stats[type]) {
        stats[type] = {
          count: 0,
          units: 0,
          personnel: 0
        };
      }

      stats[type].count++;
      stats[type].units += entity.quantity || 1;

      // Calcular efectivos según tipo
      if (['portaaviones', 'destructor', 'fragata', 'submarino', 'patrullero'].includes(type)) {
        const crew = entity.crew_count || 0;
        const embarked = entity.embarked_personnel || 0;
        stats[type].personnel += (crew + embarked);
        totalEffectives += (crew + embarked);
      } else if (['avion', 'caza', 'helicoptero', 'drone'].includes(type)) {
        const crew = entity.crew_count || 0;
        const quantity = entity.quantity || 1;
        stats[type].personnel += (crew * quantity);
        totalEffectives += (crew * quantity);
      } else if (['tropas', 'insurgente'].includes(type)) {
        const quantity = entity.quantity || 0;
        stats[type].personnel += quantity;
        totalEffectives += quantity;
      }
    });

    return {
      totalMarkers: entities.length,
      totalUnits: entities.reduce((sum, e) => sum + (e.quantity || 1), 0),
      totalEffectives,
      byType: stats,
      entities: entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        status: e.status,
        latitude: e.latitude,
        longitude: e.longitude
      }))
    };
  } catch (error) {
    throw new Error(`Error obteniendo estadísticas: ${error.message}`);
  }
}

// 📋 HERRAMIENTA 2: Obtener detalles de una entidad específica
async function getEntityDetails(entityName) {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .ilike('name', `%${entityName}%`)
      .limit(5);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { error: `No se encontró ninguna entidad con el nombre "${entityName}"` };
    }

    return data;
  } catch (error) {
    throw new Error(`Error buscando entidad: ${error.message}`);
  }
}

// 📋 HERRAMIENTA 3: Obtener eventos del timeline
async function getEvents(filters = {}) {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        event_entities (
          entity:entities (
            id,
            name,
            type
          )
        )
      `)
      .order('event_date', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Error obteniendo eventos: ${error.message}`);
  }
}

// 📋 HERRAMIENTA 4: Buscar entidades por tipo
async function getEntitiesByType(entityType) {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', entityType)
      .eq('is_visible', true)
      .is('archived_at', null);

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw new Error(`Error obteniendo entidades por tipo: ${error.message}`);
  }
}

// 📋 HERRAMIENTA 5: Análisis de región
async function analyzeRegion(bounds) {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('is_visible', true)
      .is('archived_at', null);

    if (error) throw error;

    // Filtrar por bounds si se proporcionan
    let filtered = data;
    if (bounds) {
      filtered = data.filter(e => {
        if (!e.latitude || !e.longitude) return false;
        return (
          e.latitude >= bounds.south &&
          e.latitude <= bounds.north &&
          e.longitude >= bounds.west &&
          e.longitude <= bounds.east
        );
      });
    }

    // Agrupar por tipo
    const byType = {};
    filtered.forEach(e => {
      if (!byType[e.type]) byType[e.type] = [];
      byType[e.type].push(e.name);
    });

    return {
      totalEntities: filtered.length,
      byType,
      entities: filtered.map(e => ({
        name: e.name,
        type: e.type,
        status: e.status,
        position: [e.latitude, e.longitude]
      }))
    };
  } catch (error) {
    throw new Error(`Error analizando región: ${error.message}`);
  }
}

// 📋 HERRAMIENTA 6: Obtener portaaviones con detalles completos
async function getCarrierDetails() {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('type', 'portaaviones')
      .eq('is_visible', true)
      .is('archived_at', null);

    if (error) throw error;

    return data.map(carrier => ({
      name: carrier.name,
      class: carrier.class,
      crew: carrier.crew_count,
      embarkedPersonnel: carrier.embarked_personnel,
      embarkedAircraft: carrier.embarked_aircraft,
      totalEffectives: (carrier.crew_count || 0) + (carrier.embarked_personnel || 0),
      status: carrier.status,
      position: [carrier.latitude, carrier.longitude],
      displacement: carrier.displacement_tons,
      capabilities: {
        surface_to_surface: carrier.has_surface_to_surface,
        surface_to_air: carrier.has_surface_to_air,
        cruise_missiles: carrier.has_cruise_missiles
      }
    }));
  } catch (error) {
    throw new Error(`Error obteniendo portaaviones: ${error.message}`);
  }
}

// Registrar herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_deployment_stats',
      description: 'Obtiene estadísticas generales del despliegue: total de marcadores, unidades, efectivos por tipo, etc.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_entity_details',
      description: 'Busca y obtiene detalles completos de una entidad específica por nombre',
      inputSchema: {
        type: 'object',
        properties: {
          entityName: {
            type: 'string',
            description: 'Nombre de la entidad a buscar (ej: "USS Gerald R. Ford", "22nd MEU")',
          },
        },
        required: ['entityName'],
      },
    },
    {
      name: 'get_events',
      description: 'Obtiene eventos del timeline con filtros opcionales',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Número máximo de eventos a retornar (default: todos)',
          },
          type: {
            type: 'string',
            description: 'Tipo de evento: "evento", "noticia", "informe"',
          },
        },
      },
    },
    {
      name: 'get_entities_by_type',
      description: 'Obtiene todas las entidades de un tipo específico',
      inputSchema: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            description: 'Tipo de entidad: "portaaviones", "destructor", "avion", "tropas", etc.',
          },
        },
        required: ['entityType'],
      },
    },
    {
      name: 'analyze_region',
      description: 'Analiza entidades en una región geográfica específica',
      inputSchema: {
        type: 'object',
        properties: {
          bounds: {
            type: 'object',
            description: 'Límites geográficos: {north, south, east, west}',
            properties: {
              north: { type: 'number' },
              south: { type: 'number' },
              east: { type: 'number' },
              west: { type: 'number' },
            },
          },
        },
      },
    },
    {
      name: 'get_carrier_details',
      description: 'Obtiene detalles completos de todos los portaaviones incluyendo tripulación, personal embarcado y aeronaves',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// Manejar llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_deployment_stats':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getDeploymentStats(), null, 2),
            },
          ],
        };

      case 'get_entity_details':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getEntityDetails(args.entityName), null, 2),
            },
          ],
        };

      case 'get_events':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getEvents(args), null, 2),
            },
          ],
        };

      case 'get_entities_by_type':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getEntitiesByType(args.entityType), null, 2),
            },
          ],
        };

      case 'analyze_region':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await analyzeRegion(args.bounds), null, 2),
            },
          ],
        };

      case 'get_carrier_details':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getCarrierDetails(), null, 2),
            },
          ],
        };

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🤖 Military Ops Tracker MCP Server iniciado');
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});

