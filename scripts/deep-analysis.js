const API_KEY = '019ac6a2-81ee-733f-a596-2ad19717ac52|MVjmmj4UIWA7XTMBrjhZtNfPh3XzjtaUKSadXEuw3d03a1ef';

async function deepAnalysis() {
  const url = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=27,8,-85,-58&token=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('🔍 ANÁLISIS PROFUNDO - ESTRUCTURA COMPLETA\n');
  
  // Tomar los primeros 5 vuelos y mostrar TODOS los campos
  const samples = Object.entries(data)
    .filter(([key]) => key !== 'full_count' && key !== 'version')
    .slice(0, 10);
  
  samples.forEach(([id, arr], i) => {
    console.log(`\n═══ VUELO ${i + 1}: ${id} ═══`);
    console.log(`[0]  icao24:         ${arr[0]}`);
    console.log(`[1]  latitude:       ${arr[1]}`);
    console.log(`[2]  longitude:      ${arr[2]}`);
    console.log(`[3]  heading:        ${arr[3]}°`);
    console.log(`[4]  altitude:       ${arr[4]} ft`);
    console.log(`[5]  speed:          ${arr[5]} kts`);
    console.log(`[6]  squawk:         ${arr[6] || 'N/A'}`);
    console.log(`[7]  registration:   ${arr[7]}`);
    console.log(`[8]  aircraftType:   ${arr[8]}`);
    console.log(`[9]  callsign:       ${arr[9]}`);
    console.log(`[10] timestamp:      ${arr[10]}`);
    console.log(`[11] origin:         ${arr[11] || 'N/A'}`);
    console.log(`[12] destination:    ${arr[12] || 'N/A'}`);
    console.log(`[13] flightNumber:   ${arr[13] || 'N/A'}`);
    console.log(`[14] onGround:       ${arr[14]}`);
    console.log(`[15] verticalSpeed:  ${arr[15]} ft/min`);
    console.log(`[16] icaoType:       ${arr[16]}`);
    console.log(`[17] field17:        ${arr[17]}`);
    console.log(`[18] field18:        ${arr[18] || 'N/A'}`);
    if (arr.length > 19) {
      for (let j = 19; j < arr.length; j++) {
        console.log(`[${j}] field${j}:        ${arr[j]}`);
      }
    }
  });
  
  // Buscar vuelo C17 específicamente
  const c17Flight = Object.entries(data)
    .filter(([key]) => key !== 'full_count' && key !== 'version')
    .find(([id, arr]) => arr[8] === 'C17' || arr[9] === '97-0042');
  
  if (c17Flight) {
    console.log(`\n\n🎯 ═══ VUELO C17 MILITAR (COMPLETO) ═══`);
    const [id, arr] = c17Flight;
    console.log(`ID: ${id}`);
    arr.forEach((val, idx) => {
      console.log(`[${idx}] = ${val}`);
    });
  }
}

deepAnalysis().catch(console.error);
