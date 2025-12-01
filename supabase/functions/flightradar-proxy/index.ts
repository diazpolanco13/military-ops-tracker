import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ✅ Endpoints de FlightRadar24
const FR24_FEED_BASE = 'https://data-cloud.flightradar24.com';
const FR24_DETAILS_BASE = 'https://data-live.flightradar24.com';

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
    const flightId = url.searchParams.get('flight'); // Para detalles de vuelo específico

    // ═══════════════════════════════════════════════════════════════════
    // ENDPOINT 1: Detalles de vuelo específico
    // ═══════════════════════════════════════════════════════════════════
    if (flightId) {
      console.log('🔍 Fetching flight details for:', flightId);
      
      const detailsUrl = `${FR24_DETAILS_BASE}/clickhandler/?version=1.5&flight=${flightId}`;
      
      const response = await fetch(detailsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MilitaryOpsTracker/1.0)',
        },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Flight details error: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('✅ Flight details fetched for:', flightId);
      
      return new Response(
        JSON.stringify(data),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // ENDPOINT 2: Feed de vuelos por zona
    // ═══════════════════════════════════════════════════════════════════
    if (!bounds) {
      return new Response(
        JSON.stringify({ error: 'Missing bounds or flight parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construir URL para FlightRadar24 (endpoint correcto, NO requiere token)
    const fr24Url = `${FR24_FEED_BASE}/zones/fcgi/feed.js?bounds=${bounds}&faa=1&satellite=1&mlat=1&adsb=1&gnd=0&air=1&vehicles=0&estimated=1&maxage=14400&gliders=0&stats=0`;

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
