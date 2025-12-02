const API_KEY = '019ac6a2-81ee-733f-a596-2ad19717ac52|MVjmmj4UIWA7XTMBrjhZtNfPh3XzjtaUKSadXEuw3d03a1ef';

async function checkCoordinates() {
  const url = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=27,8,-85,-58&token=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  
  const flights = Object.entries(data)
    .filter(([key]) => key !== 'full_count' && key !== 'version')
    .slice(0, 10);
  
  console.log('🔍 VERIFICANDO COORDENADAS DE VUELOS\n');
  
  flights.forEach(([id, arr]) => {
    console.log(`═══ ${id} ═══`);
    console.log(`[0] icao24:    ${arr[0]}`);
    console.log(`[1] latitude:  ${arr[1]} ← LAT`);
    console.log(`[2] longitude: ${arr[2]} ← LON`);
    console.log(`[3] heading:   ${arr[3]}°`);
    console.log(`[9] callsign:  ${arr[9]}`);
    console.log(`[16] icaoType: ${arr[16]}`);
    console.log(`[18] airline:  ${arr[18]}`);
    console.log('');
  });
}

checkCoordinates().catch(console.error);
