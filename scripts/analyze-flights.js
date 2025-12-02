/**
 * 🔍 ANÁLISIS DE DATOS DE VUELOS
 * Examinar TODOS los vuelos para entender cómo FlightRadar identifica militares
 */

const API_KEY = '019ac6a2-81ee-733f-a596-2ad19717ac52|MVjmmj4UIWA7XTMBrjhZtNfPh3XzjtaUKSadXEuw3d03a1ef';

const CARIBBEAN_BOUNDS = {
  north: 27.0,
  south: 8.0,
  west: -85.0,
  east: -58.0
};

const boundsString = `${CARIBBEAN_BOUNDS.north},${CARIBBEAN_BOUNDS.south},${CARIBBEAN_BOUNDS.west},${CARIBBEAN_BOUNDS.east}`;

async function analyzeFlights() {
  console.log('🔍 ANALIZANDO DATOS DE FLIGHTRADAR24\n');
  
  const url = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=${boundsString}&token=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const flights = Object.entries(data)
    .filter(([key]) => key !== 'full_count' && key !== 'version')
    .map(([id, arr]) => ({
      id,
      icao24: arr[0],
      lat: arr[1],
      lon: arr[2],
      heading: arr[3],
      altitude: arr[4],
      speed: arr[5],
      squawk: arr[6],
      registration: arr[7],
      aircraftType: arr[8],
      callsign: arr[9],
      timestamp: arr[10],
      origin: arr[11],
      destination: arr[12],
      flightNumber: arr[13],
      onGround: arr[14],
      verticalSpeed: arr[15],
      icaoType: arr[16],
    }));
  
  console.log(`📊 TOTAL DE VUELOS: ${flights.length}\n`);
  
  // Analizar callsigns únicos
  const callsigns = [...new Set(flights.map(f => f.callsign).filter(Boolean))];
  console.log(`📝 CALLSIGNS ÚNICOS: ${callsigns.length}`);
  
  // Buscar patrones militares conocidos
  const militaryKeywords = ['RCH', 'CNV', 'SPAR', 'NAVY', 'USAF', 'MC', 'PAT', 'AE', 'ARMY', 'GUARD', 'SAM', 'AF'];
  const possibleMilitary = flights.filter(f => 
    militaryKeywords.some(kw => (f.callsign || '').toUpperCase().includes(kw))
  );
  
  console.log(`\n🎯 VUELOS CON CALLSIGNS MILITARES CONOCIDOS: ${possibleMilitary.length}`);
  if (possibleMilitary.length > 0) {
    console.log('\n📋 LISTA:');
    possibleMilitary.forEach(f => {
      console.log(`   ${f.callsign.padEnd(12)} | ${f.aircraftType.padEnd(10)} | ${f.registration.padEnd(10)} | Squawk: ${f.squawk || 'N/A'}`);
    });
  }
  
  // Analizar tipos de aeronave
  const aircraftTypes = [...new Set(flights.map(f => f.aircraftType).filter(Boolean))];
  console.log(`\n✈️ TIPOS DE AERONAVE ÚNICOS: ${aircraftTypes.length}`);
  
  // Buscar tipos militares conocidos
  const militaryTypes = ['C130', 'C17', 'KC135', 'KC10', 'P8', 'E3', 'F15', 'F16', 'F22', 'F35', 'B52'];
  const militaryByType = flights.filter(f => 
    militaryTypes.some(mt => (f.aircraftType || '').toUpperCase().includes(mt))
  );
  
  console.log(`\n🛩️ VUELOS CON TIPOS MILITARES: ${militaryByType.length}`);
  if (militaryByType.length > 0) {
    militaryByType.forEach(f => {
      console.log(`   ${f.callsign.padEnd(12)} | ${f.aircraftType.padEnd(10)} | ${f.registration}`);
    });
  }
  
  // Analizar squawk codes
  const squawks = [...new Set(flights.map(f => f.squawk).filter(Boolean))];
  console.log(`\n📡 SQUAWK CODES ÚNICOS: ${squawks.length}`);
  const militarySquawks = ['1277', '4000', '4001', '1300'];
  const militaryBySquawk = flights.filter(f => militarySquawks.includes(f.squawk));
  
  if (militaryBySquawk.length > 0) {
    console.log(`\n🔐 VUELOS CON SQUAWK MILITAR: ${militaryBySquawk.length}`);
    militaryBySquawk.forEach(f => {
      console.log(`   ${f.callsign.padEnd(12)} | Squawk: ${f.squawk} | ${f.aircraftType}`);
    });
  }
  
  // Analizar registros
  const registrations = [...new Set(flights.map(f => f.registration).filter(Boolean))];
  console.log(`\n📝 REGISTROS ÚNICOS: ${registrations.length}`);
  
  // Buscar patrones de registro militar
  const militaryByReg = flights.filter(f => {
    const reg = (f.registration || '').toUpperCase();
    return reg.startsWith('N16') || reg.startsWith('N17') || reg.startsWith('N2') || 
           reg.startsWith('N8') || reg.startsWith('N9') || reg.includes('USAF') ||
           reg.match(/^\d{2}-\d{4}$/);
  });
  
  console.log(`\n🎖️ VUELOS CON REGISTRO MILITAR: ${militaryByReg.length}`);
  if (militaryByReg.length > 0) {
    militaryByReg.forEach(f => {
      console.log(`   ${f.callsign.padEnd(12)} | ${f.registration.padEnd(10)} | ${f.aircraftType}`);
    });
  }
  
  // TOTAL ÚNICOS (combinar todos los criterios)
  const allMilitary = [...new Set([
    ...possibleMilitary.map(f => f.id),
    ...militaryByType.map(f => f.id),
    ...militaryBySquawk.map(f => f.id),
    ...militaryByReg.map(f => f.id)
  ])];
  
  console.log(`\n═══════════════════════════════════════`);
  console.log(`🎯 TOTAL VUELOS MILITARES DETECTADOS: ${allMilitary.length} de ${flights.length}`);
  console.log(`═══════════════════════════════════════\n`);
  
  // Mostrar muestra de callsigns NO militares para comparar
  const nonMilitary = flights.filter(f => !allMilitary.includes(f.id)).slice(0, 20);
  console.log(`📋 MUESTRA DE CALLSIGNS NO MILITARES (para referencia):`);
  nonMilitary.forEach(f => {
    console.log(`   ${(f.callsign || 'N/A').padEnd(12)} | ${f.aircraftType.padEnd(10)} | ${f.registration}`);
  });
}

analyzeFlights().catch(console.error);
