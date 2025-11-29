/**
 * 🧪 SCRIPT DE PRUEBA - FlightRadar24 API
 * 
 * Probando MÚLTIPLES endpoints y formatos
 */

const API_KEY = '019ac6a2-81ee-733f-a596-2ad19717ac52|MVjmmj4UIWA7XTMBrjhZtNfPh3XzjtaUKSadXEuw3d03a1ef';

// Zona del Caribe
const CARIBBEAN_BOUNDS = {
  north: 25.5,
  south: 5.5,
  west: -85,
  east: -55
};

const boundsString = `${CARIBBEAN_BOUNDS.north},${CARIBBEAN_BOUNDS.south},${CARIBBEAN_BOUNDS.west},${CARIBBEAN_BOUNDS.east}`;

console.log('🧪 INICIANDO PRUEBAS DE API FLIGHTRADAR24\n');
console.log('📍 Zona:', boundsString);
console.log('🔑 API Key:', API_KEY.substring(0, 30) + '...\n');

// LISTA DE ENDPOINTS POSIBLES
const ENDPOINTS = [
  {
    name: 'data-live.flightradar24.com (endpoint público conocido)',
    url: `https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=${boundsString}&faa=1&satellite=1&mlat=1&adsb=1&gnd=0&air=1`
  },
  {
    name: 'api.flightradar24.com/common/v1',
    url: `https://api.flightradar24.com/common/v1/flight/list.json?bounds=${boundsString}&token=${API_KEY}`
  },
  {
    name: 'fr24api.flightradar24.com/zones (con token)',
    url: `https://fr24api.flightradar24.com/zones/fcgi/feed.js?bounds=${boundsString}&token=${API_KEY}`
  },
  {
    name: 'data-cloud.flightradar24.com',
    url: `https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=${boundsString}&token=${API_KEY}`
  },
];

async function testEndpoint(endpoint) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Probando:', endpoint.name);
  console.log('📍 URL:', endpoint.url.substring(0, 100) + '...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('📡 Status:', response.status, response.statusText);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const keys = Object.keys(data);
        console.log('✅ ÉXITO! JSON recibido');
        console.log('📦 Keys:', keys.length, '-', keys.slice(0, 10));
        
        // Mostrar muestra
        const sampleKey = keys.find(k => k !== 'full_count' && k !== 'version' && k !== 'stats');
        if (sampleKey) {
          console.log('📄 Muestra:', sampleKey, '=', data[sampleKey]);
        }
        
        return { success: true, endpoint: endpoint.name, data };
      } else {
        const text = await response.text();
        console.log('✅ ÉXITO! Pero no es JSON');
        console.log('📄 Tipo:', contentType);
        console.log('📄 Muestra:', text.substring(0, 200));
        return { success: true, endpoint: endpoint.name, text: text.substring(0, 500) };
      }
    } else {
      const error = await response.text();
      console.log('❌ FALLÓ:', response.status);
      console.log('📄 Error:', error.substring(0, 300));
      return { success: false, endpoint: endpoint.name, error };
    }
  } catch (error) {
    console.log('❌ ERROR DE RED:', error.message);
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
}

async function runAllTests() {
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    results.push(await testEndpoint(endpoint));
    console.log('\n');
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN FINAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ FUNCIONA' : '❌ FALLÓ';
    console.log(`${index + 1}. ${result.endpoint}: ${status}`);
  });
  
  const working = results.filter(r => r.success);
  
  if (working.length > 0) {
    console.log('\n🎉 ENDPOINTS QUE FUNCIONAN:');
    working.forEach(w => {
      console.log(`   ✅ ${w.endpoint}`);
    });
  } else {
    console.log('\n❌ NINGÚN ENDPOINT FUNCIONÓ');
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('   - Verificar que el API key sea válido');
    console.log('   - Contactar soporte de FlightRadar24');
    console.log('   - Revisar documentación oficial');
  }
}

runAllTests();
