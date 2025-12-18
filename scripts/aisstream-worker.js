#!/usr/bin/env node
/**
 * 🚢 AISSTREAM WORKER - Recolector de datos AIS en tiempo real
 * 
 * Este script se conecta a AISStream.io via WebSocket y alimenta
 * la base de datos de Supabase con posiciones de buques.
 * 
 * Uso:
 *   node scripts/aisstream-worker.js
 * 
 * Variables de entorno requeridas:
 *   AISSTREAM_API_KEY - API key de AISStream.io
 *   SUPABASE_URL - URL de Supabase
 *   SUPABASE_SERVICE_KEY - Service role key de Supabase
 */

import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// Configuración
const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY || '39bcbdd4e9292810f67a75746d974638a2542f27';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oqhujdqbszbvozsuunkw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Bounding box del Caribe
const CARIBBEAN_BOUNDS = {
  minLat: 1.0, maxLat: 27.0,
  minLon: -85.0, maxLon: -55.0
};

// Tipos de buques AIS
const SHIP_TYPES = {
  35: 'Military',
  80: 'Tanker', 81: 'Tanker', 82: 'Tanker', 83: 'Tanker', 84: 'Tanker',
  85: 'Tanker', 86: 'Tanker', 87: 'Tanker', 88: 'Tanker', 89: 'Tanker',
  70: 'Cargo', 71: 'Cargo', 72: 'Cargo', 73: 'Cargo', 74: 'Cargo',
  75: 'Cargo', 76: 'Cargo', 77: 'Cargo', 78: 'Cargo', 79: 'Cargo',
  60: 'Passenger', 61: 'Passenger', 62: 'Passenger', 63: 'Passenger',
  64: 'Passenger', 65: 'Passenger', 66: 'Passenger', 67: 'Passenger',
  68: 'Passenger', 69: 'Passenger',
  50: 'Pilot', 51: 'SAR', 52: 'Tug', 53: 'Port Tender',
  30: 'Fishing', 31: 'Towing', 32: 'Towing',
};

// Países por MID (Maritime Identification Digits)
const MID_COUNTRIES = {
  '303': 'US', '338': 'US', '366': 'US', '367': 'US', '368': 'US', '369': 'US',
  '775': 'VE', '730': 'CO', '351': 'PA', '352': 'PA', '353': 'PA', '354': 'PA',
  '355': 'PA', '356': 'PA', '357': 'PA', '345': 'MX', '308': 'BS', '309': 'BS',
  '311': 'BS', '316': 'CA', '323': 'CU', '327': 'DO', '339': 'JM', '362': 'TT',
  '232': 'GB', '233': 'GB', '234': 'GB', '235': 'GB',
  '412': 'CN', '413': 'CN', '414': 'CN',
  '273': 'RU', '636': 'LR', '256': 'MT', '538': 'MH', '564': 'SG', '477': 'HK',
  '518': 'NZ', '503': 'AU', '240': 'GR', '241': 'GR', '239': 'GR',
  '224': 'ES', '225': 'ES', '226': 'FR', '227': 'FR', '228': 'FR',
  '244': 'NL', '245': 'NL', '246': 'NL', '247': 'IT', '248': 'MT',
  '211': 'DE', '218': 'DE', '257': 'NO', '258': 'NO', '259': 'NO',
};

function getShipTypeName(type) {
  return SHIP_TYPES[type] || `Type ${type}`;
}

function isTanker(type) {
  return type >= 80 && type <= 89;
}

function isMilitary(type, name) {
  if (type === 35) return true;
  const prefixes = ['USS', 'USNS', 'USCGC', 'HMS', 'HMCS', 'ARC', 'ARM', 'BAP', 'BRP', 'KRI'];
  return prefixes.some(p => (name || '').toUpperCase().startsWith(p));
}

function getCountryByMMSI(mmsi) {
  const mid = String(mmsi).substring(0, 3);
  return MID_COUNTRIES[mid] || 'XX';
}

// Cliente de Supabase
let supabase = null;

async function initSupabase() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY no configurada');
    process.exit(1);
  }
  
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase conectado');
}

// Buffer de buques para batch insert
const shipBuffer = new Map();
let lastFlush = Date.now();
const FLUSH_INTERVAL = 10000; // 10 segundos

async function flushBuffer() {
  if (shipBuffer.size === 0) return;
  
  const ships = Array.from(shipBuffer.values());
  shipBuffer.clear();
  
  console.log(`💾 Guardando ${ships.length} buques...`);
  
  const { error } = await supabase
    .from('ship_positions')
    .upsert(ships, { onConflict: 'mmsi' });
  
  if (error) {
    console.error('❌ Error guardando:', error.message);
  } else {
    console.log(`✅ Guardados ${ships.length} buques`);
  }
  
  lastFlush = Date.now();
}

function processMessage(data) {
  if (data.MessageType !== 'PositionReport') return;
  
  const meta = data.MetaData;
  const pos = data.Message?.PositionReport;
  
  if (!meta || !meta.MMSI || !meta.latitude || !meta.longitude) return;
  
  const mmsi = String(meta.MMSI);
  const shipType = pos?.Type || null;
  const shipName = (meta.ShipName || '').trim();
  
  const ship = {
    mmsi,
    ship_name: shipName || null,
    latitude: meta.latitude,
    longitude: meta.longitude,
    speed: pos?.Sog ?? null,
    course: pos?.Cog ?? null,
    heading: pos?.TrueHeading ?? null,
    ship_type: shipType,
    ship_type_name: shipType ? getShipTypeName(shipType) : null,
    flag_country: getCountryByMMSI(mmsi),
    is_tanker: shipType ? isTanker(shipType) : false,
    is_military: isMilitary(shipType || 0, shipName),
    last_update: new Date().toISOString(),
  };
  
  shipBuffer.set(mmsi, ship);
  
  // Log para buques importantes
  if (ship.is_military || ship.is_tanker) {
    const icon = ship.is_military ? '⚔️' : '🛢️';
    console.log(`${icon} ${shipName} (${mmsi}) - ${ship.flag_country} - ${meta.latitude.toFixed(4)}, ${meta.longitude.toFixed(4)}`);
  }
}

async function connectAISStream() {
  console.log('🔌 Conectando a AISStream...');
  
  const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
  
  ws.on('open', () => {
    console.log('✅ Conectado a AISStream');
    
    const subscription = {
      APIKey: AISSTREAM_API_KEY,
      BoundingBoxes: [[
        [CARIBBEAN_BOUNDS.minLat, CARIBBEAN_BOUNDS.minLon],
        [CARIBBEAN_BOUNDS.maxLat, CARIBBEAN_BOUNDS.maxLon]
      ]],
      FilterMessageTypes: ['PositionReport']
    };
    
    ws.send(JSON.stringify(subscription));
    console.log('📡 Suscrito al Caribe:', CARIBBEAN_BOUNDS);
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      processMessage(msg);
      
      // Flush periodicamente
      if (Date.now() - lastFlush > FLUSH_INTERVAL) {
        flushBuffer();
      }
    } catch (e) {
      // Ignorar mensajes malformados
    }
  });
  
  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket cerrado: ${code} - ${reason}`);
    // Reconectar después de 5 segundos
    setTimeout(connectAISStream, 5000);
  });
  
  // Flush al cerrar
  process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando...');
    await flushBuffer();
    ws.close();
    process.exit(0);
  });
  
  // Flush periódico
  setInterval(() => {
    if (shipBuffer.size > 0) {
      flushBuffer();
    }
  }, FLUSH_INTERVAL);
}

async function printStats() {
  const { count: total } = await supabase
    .from('ship_positions')
    .select('*', { count: 'exact', head: true });
  
  const { count: military } = await supabase
    .from('ship_positions')
    .select('*', { count: 'exact', head: true })
    .eq('is_military', true);
  
  const { count: tankers } = await supabase
    .from('ship_positions')
    .select('*', { count: 'exact', head: true })
    .eq('is_tanker', true);
  
  console.log(`\n📊 Estadísticas: ${total} buques | ⚔️ ${military} militares | 🛢️ ${tankers} petroleros\n`);
}

async function main() {
  console.log('🚢 AISSTREAM WORKER - Iniciando...');
  console.log('='.repeat(50));
  
  await initSupabase();
  await printStats();
  await connectAISStream();
  
  // Imprimir stats cada minuto
  setInterval(printStats, 60000);
}

main().catch(console.error);
