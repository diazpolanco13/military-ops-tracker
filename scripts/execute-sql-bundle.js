#!/usr/bin/env node
/**
 * Script para ejecutar la vista materializada en Supabase
 * Usa el SDK de Supabase directamente
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const SUPABASE_URL = 'https://oqhujdqbszbvozsuunkw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  console.error('💡 Exporta la variable y vuelve a ejecutar:');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"');
  process.exit(1);
}

console.log('🔧 Conectando a Supabase...');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log('');

// Crear cliente con Service Role Key (permisos completos)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLScript() {
  try {
    // Leer script SQL
    const sqlPath = join(__dirname, '..', 'sql', 'execute_bundle.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📄 Leyendo script SQL...');
    console.log(`📁 Archivo: ${sqlPath}`);
    console.log('');

    // Dividir el script en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 Total de comandos: ${commands.length}`);
    console.log('');

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const commandPreview = command.substring(0, 50).replace(/\n/g, ' ');

      console.log(`⏳ [${i + 1}/${commands.length}] Ejecutando: ${commandPreview}...`);

      try {
        // Usar rpc para ejecutar SQL directo
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command
        });

        if (error) {
          // Si exec_sql no existe, intentar método alternativo
          if (error.message.includes('function') || error.message.includes('does not exist')) {
            console.log('   ⚠️  exec_sql no disponible, usando método alternativo...');

            // Método alternativo: usar el endpoint REST directamente
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({ sql: command })
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            console.log('   ✅ Ejecutado correctamente');
          } else {
            throw error;
          }
        } else {
          console.log('   ✅ Ejecutado correctamente');
        }
      } catch (cmdError) {
        console.error(`   ❌ Error: ${cmdError.message}`);

        // Si es el comando de REFRESH CONCURRENTLY, intentar sin CONCURRENTLY
        if (command.includes('REFRESH MATERIALIZED VIEW CONCURRENTLY')) {
          console.log('   🔄 Intentando sin CONCURRENTLY...');
          const altCommand = command.replace('CONCURRENTLY', '');

          const { error: retryError } = await supabase.rpc('exec_sql', {
            sql: altCommand
          });

          if (retryError) {
            console.error(`   ❌ Error en reintento: ${retryError.message}`);
          } else {
            console.log('   ✅ Ejecutado correctamente (sin CONCURRENTLY)');
          }
        }
      }

      console.log('');
    }

    console.log('🎉 Script ejecutado completamente');
    console.log('');

    // Verificar que la vista se creó correctamente
    console.log('🔍 Verificando vista materializada...');
    const { data: viewData, error: viewError } = await supabase
      .from('incursion_stats_bundle')
      .select('id, last_updated')
      .single();

    if (viewError) {
      console.error('❌ Error al verificar vista:', viewError.message);
      console.error('⚠️  La vista puede no haberse creado correctamente.');
      console.error('💡 Ejecuta el SQL manualmente en Supabase Dashboard');
    } else {
      console.log('✅ Vista materializada creada correctamente');
      console.log(`📊 ID: ${viewData.id}`);
      console.log(`🕒 Última actualización: ${viewData.last_updated}`);
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERROR CRÍTICO:');
    console.error(error.message);
    console.error('');
    console.error('📚 SOLUCIONES:');
    console.error('1. Ejecutar SQL manualmente en Supabase Dashboard');
    console.error('   URL: https://supabase.com/dashboard/project/oqhujdqbszbvozsuunkw/sql');
    console.error('2. Copiar contenido de sql/execute_bundle.sql');
    console.error('3. Pegar y ejecutar en SQL Editor');
    console.error('');
    process.exit(1);
  }
}

// Ejecutar script
console.log('');
console.log('════════════════════════════════════════════════════');
console.log('  🚀 EJECUTAR VISTA MATERIALIZADA EN SUPABASE');
console.log('════════════════════════════════════════════════════');
console.log('');

executeSQLScript()
  .then(() => {
    console.log('════════════════════════════════════════════════════');
    console.log('  ✅ PROCESO COMPLETADO');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('════════════════════════════════════════════════════');
    console.error('  ❌ PROCESO FALLIDO');
    console.error('════════════════════════════════════════════════════');
    console.error('');
    console.error(error);
    process.exit(1);
  });
