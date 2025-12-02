/**
 * 🔍 TEST - Endpoint de DETALLES de vuelo
 * 
 * FlightRadar24 tiene un endpoint separado para detalles completos
 * Probamos diferentes URLs para encontrar la que da más información
 */

const API_KEY = '019ac6a2-81ee-733f-a596-2ad19717ac52|MVjmmj4UIWA7XTMBrjhZtNfPh3XzjtaUKSadXEuw3d03a1ef';

async function testFlightDetails() {
  // Primero obtener un vuelo activo
  const boundsUrl = `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=27,8,-85,-58`;
  const feedResponse = await fetch(boundsUrl);
  const feedData = await feedResponse.json();
  
  // Encontrar primer vuelo válido
  const flightEntry = Object.entries(feedData).find(([key, val]) => 
    key !== 'full_count' && key !== 'version' && Array.isArray(val)
  );
  
  if (!flightEntry) {
    console.log('❌ No se encontraron vuelos');
    return;
  }
  
  const [flightId, flightData] = flightEntry;
  const callsign = flightData[9] || flightData[16] || 'UNKNOWN';
  const registration = flightData[7] || '';
  
  console.log('═══════════════════════════════════════════');
  console.log('🛩️ PROBANDO ENDPOINTS DE DETALLES DE VUELO');
  console.log('═══════════════════════════════════════════');
  console.log(`Vuelo ID: ${flightId}`);
  console.log(`Callsign: ${callsign}`);
  console.log(`Registration: ${flightData[7]}`);
  console.log(`ICAO24: ${flightData[0]}`);
  console.log('');
  
  // Lista de endpoints potenciales para detalles
  const detailsEndpoints = [
    {
      name: 'data-live.flightradar24.com/clickhandler',
      url: `https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=${flightId}`
    },
    {
      name: 'data-cloud.flightradar24.com/clickhandler',
      url: `https://data-cloud.flightradar24.com/clickhandler/?version=1.5&flight=${flightId}`
    },
    {
      name: 'api.flightradar24.com/common/v1/flight',
      url: `https://api.flightradar24.com/common/v1/flight/list.json?query=${callsign}&fetchBy=flight`
    },
    {
      name: 'data-live aircraft-details by reg',
      url: `https://data-live.flightradar24.com/aircraftlist.php?r=${registration}&page=1&limit=1`
    },
  ];
  
  for (const endpoint of detailsEndpoints) {
    console.log('────────────────────────────────────────────');
    console.log(`🧪 Probando: ${endpoint.name}`);
    console.log(`📍 URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      console.log(`📡 Status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ ÉXITO! JSON recibido');
          console.log('📦 Keys:', Object.keys(data).slice(0, 15));
          
          // Mostrar datos interesantes
          if (data.aircraft) {
            console.log('\n🛩️ DATOS DE AERONAVE:');
            console.log(JSON.stringify(data.aircraft, null, 2).slice(0, 1000));
          }
          if (data.registration) {
            console.log('\n📋 REGISTRO:', data.registration);
          }
          if (data.model) {
            console.log('📋 MODELO:', data.model);
          }
          if (data.owner) {
            console.log('📋 PROPIETARIO:', data.owner);
          }
          if (data.airline) {
            console.log('📋 AEROLÍNEA:', data.airline);
          }
          
          // Mostrar muestra del JSON
          console.log('\n📄 MUESTRA JSON:', JSON.stringify(data, null, 2).slice(0, 800));
          
        } else {
          const text = await response.text();
          console.log('📄 No es JSON:', text.slice(0, 300));
        }
      } else {
        const error = await response.text();
        console.log('❌ Error:', error.slice(0, 200));
      }
    } catch (error) {
      console.log('❌ Error de red:', error.message);
    }
    console.log('');
  }
}

testFlightDetails().catch(console.error);
