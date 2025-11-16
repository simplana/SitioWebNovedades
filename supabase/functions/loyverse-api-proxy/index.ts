import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'items';
    const cursor = url.searchParams.get('cursor');
    const limit = url.searchParams.get('limit') || '50';
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let loyverseUrl = `https://api.loyverse.com/v1/${endpoint}?limit=${limit}`;
    if (cursor) {
      loyverseUrl += `&cursor=${cursor}`;
    }

    console.log('Proxying request to Loyverse:', loyverseUrl);

    const loyverseResponse = await fetch(loyverseUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Loyverse response status:', loyverseResponse.status);

    const data = await loyverseResponse.text();
    
    return new Response(data, {
      status: loyverseResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});