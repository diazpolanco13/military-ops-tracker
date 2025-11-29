import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ✅ Endpoint correcto verificado
const FR24_API_BASE = 'https://data-cloud.flightradar24.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bounds = url.searchParams.get('bounds');

    if (!bounds) {
      return new Response(
        JSON.stringify({ error: 'Missing bounds parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construir URL para FlightRadar24 (endpoint correcto, NO requiere token)
    const fr24Url = `${FR24_API_BASE}/zones/fcgi/feed.js?bounds=${bounds}&faa=1&satellite=1&mlat=1&adsb=1&gnd=0&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=0`;

    console.log('🛩️ Proxying request to FlightRadar24');
    console.log('📍 Bounds:', bounds);
    console.log('🌐 URL:', fr24Url);

    // Hacer la petición a FlightRadar24
    const response = await fetch(fr24Url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MilitaryOpsTracker/1.0)',
      },
    });

    console.log('📡 FlightRadar24 response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FlightRadar24 API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `FlightRadar24 API error: ${response.status}`,
          details: errorText.substring(0, 500)
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const totalKeys = Object.keys(data).length;
    const flightKeys = Object.keys(data).filter(k => k !== 'full_count' && k !== 'version').length;
    
    console.log('✅ Successfully fetched flights');
    console.log('📦 Total items:', totalKeys);
    console.log('✈️ Flight items:', flightKeys);

    // Retornar los datos con CORS habilitado
    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30' // Cache por 30 segundos
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in FlightRadar proxy:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
