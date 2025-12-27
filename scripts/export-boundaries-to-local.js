/**
 * 📥 Script para exportar límites de Supabase a archivos locales
 * 
 * Ejecutar: node scripts/export-boundaries-to-local.js
 * 
 * Genera:
 * - src/data/maritimeBoundaries.js
 * - src/data/terrestrialBoundaries.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración Supabase (usa las mismas variables de entorno)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oqhujdqbszbvozsuunkw.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY no está definida');
  console.log('Ejecuta: export VITE_SUPABASE_ANON_KEY="tu-key-aqui"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

async function exportMaritimeBoundaries() {
  console.log('🌊 Descargando límites marítimos...');
  
  const { data, error } = await supabase
    .from('maritime_boundaries_cache')
    .select('country_code, country_name, zone_name, mrgid, geojson');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`   ✅ ${data.length} zonas marítimas descargadas`);

  // Agrupar por país
  const byCountry = {};
  data.forEach(row => {
    if (!byCountry[row.country_code]) {
      byCountry[row.country_code] = [];
    }
    byCountry[row.country_code].push(row.geojson);
  });

  // Crear FeatureCollection
  const featureCollection = {
    type: 'FeatureCollection',
    features: data.map(row => row.geojson)
  };

  const fileContent = `/**
 * 🌊 Límites Marítimos - Zonas Económicas Exclusivas (EEZ)
 * 
 * Fuente: Marine Regions API (geo.vliz.be)
 * Exportado desde Supabase: ${new Date().toISOString().split('T')[0]}
 * 
 * Países incluidos: ${Object.keys(byCountry).join(', ')}
 * Total de zonas: ${data.length}
 * 
 * ⚠️ NO EDITAR MANUALMENTE - Generado por scripts/export-boundaries-to-local.js
 */

const MARITIME_BOUNDARIES = ${JSON.stringify(featureCollection, null, 2)};

export { MARITIME_BOUNDARIES };
export default MARITIME_BOUNDARIES;
`;

  const filePath = path.join(DATA_DIR, 'maritimeBoundaries.js');
  fs.writeFileSync(filePath, fileContent);
  console.log(`   💾 Guardado: ${filePath}`);
  console.log(`   📊 Tamaño: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
}

async function exportTerrestrialBoundaries() {
  console.log('🗺️ Descargando límites terrestres...');
  
  const { data, error } = await supabase
    .from('terrestrial_boundaries_cache')
    .select('country_code, country_name, source, geojson');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`   ✅ ${data.length} países descargados`);

  // Crear FeatureCollection
  const featureCollection = {
    type: 'FeatureCollection',
    features: data.map(row => ({
      ...row.geojson,
      properties: {
        ...row.geojson.properties,
        country_code: row.country_code,
        country_name: row.country_name,
        source: row.source
      }
    }))
  };

  const countries = data.map(r => r.country_code).join(', ');

  const fileContent = `/**
 * 🗺️ Límites Terrestres - Fronteras de países
 * 
 * Fuente: Natural Earth 1:50m
 * Exportado desde Supabase: ${new Date().toISOString().split('T')[0]}
 * 
 * Países incluidos: ${countries}
 * Total: ${data.length} países
 * 
 * ⚠️ NO EDITAR MANUALMENTE - Generado por scripts/export-boundaries-to-local.js
 */

const TERRESTRIAL_BOUNDARIES = ${JSON.stringify(featureCollection, null, 2)};

export { TERRESTRIAL_BOUNDARIES };
export default TERRESTRIAL_BOUNDARIES;
`;

  const filePath = path.join(DATA_DIR, 'terrestrialBoundaries.js');
  fs.writeFileSync(filePath, fileContent);
  console.log(`   💾 Guardado: ${filePath}`);
  console.log(`   📊 Tamaño: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('   📥 Exportando límites de Supabase a archivos locales');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  await exportMaritimeBoundaries();
  console.log('');
  await exportTerrestrialBoundaries();

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('   ✅ ¡Exportación completada!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Archivos generados:');
  console.log('  - src/data/maritimeBoundaries.js');
  console.log('  - src/data/terrestrialBoundaries.js');
  console.log('');
}

main().catch(console.error);

