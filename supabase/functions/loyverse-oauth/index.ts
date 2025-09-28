import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname

    console.log('🔄 Loyverse OAuth Edge Function called:', path)

    if (path.endsWith('/exchange-token') && req.method === 'POST') {
      return await handleTokenExchange(req)
    } else if (path.endsWith('/refresh-token') && req.method === 'POST') {
      return await handleTokenRefresh(req)
    } else {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleTokenExchange(req: Request) {
  try {
    const { code, redirect_uri } = await req.json()
    
    console.log('🔄 Token exchange request received')
    console.log('📋 Code:', code ? `${code.substring(0, 10)}...` : 'MISSING')
    console.log('📋 Redirect URI:', redirect_uri)

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const clientId = Deno.env.get('LOYVERSE_CLIENT_ID') || 'na0tlm2Whq22j3jTPV_l'
    const clientSecret = Deno.env.get('LOYVERSE_CLIENT_SECRET') || 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw===='
    const defaultRedirectUri = 'https://citizen-archive-prescription-valves.trycloudflare.com/auth/loyverse/callback'
    
    console.log('🔑 Environment check:')
    console.log('  - Client ID:', clientId ? `${clientId.substring(0, 10)}...` : 'MISSING')
    console.log('  - Client Secret:', clientSecret ? 'PRESENT' : 'MISSING')
    console.log('  - Redirect URI:', redirect_uri)

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Loyverse credentials in environment variables', 
          details: {
            clientId: !!clientId,
            clientSecret: !!clientSecret,
            fallbackUsed: true
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare token exchange request
    const tokenRequestBody = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect_uri || defaultRedirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }

    console.log('🚀 Making token exchange request to Loyverse...')
    console.log('📋 Request body:', {
      ...tokenRequestBody,
      client_secret: '[HIDDEN]',
      code: code ? `${code.substring(0, 10)}...` : 'MISSING'
    })

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(tokenRequestBody)
    })

    console.log('📡 Loyverse response status:', loyverseResponse.status)
    console.log('📡 Loyverse response headers:', Object.fromEntries(loyverseResponse.headers.entries()))

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text()
      console.error('❌ Loyverse token exchange failed:')
      console.error('   Status:', loyverseResponse.status)
      console.error('   Status Text:', loyverseResponse.statusText)
      console.error('   Response:', errorText)
      console.error('   Request was:', {
        grant_type: tokenRequestBody.grant_type,
        client_id: tokenRequestBody.client_id,
        redirect_uri: tokenRequestBody.redirect_uri,
        code_length: code ? code.length : 0
      })
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }

      return new Response(
        JSON.stringify({ 
          error: `Loyverse API error: ${loyverseResponse.status} - ${loyverseResponse.statusText}`,
          details: errorData,
          loyverseStatus: loyverseResponse.status,
          loyverseResponse: errorText,
          requestDetails: {
            client_id: clientId,
            redirect_uri: redirect_uri,
            code_present: !!code,
            code_length: code ? code.length : 0
          }
        }),
        {
          status: loyverseResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await loyverseResponse.json()
    console.log('✅ Token exchange successful!')
    console.log('📋 Token data keys:', Object.keys(tokenData))

    return new Response(
      JSON.stringify(tokenData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Token exchange error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleTokenRefresh(req: Request) {
  try {
    const { refresh_token } = await req.json()
    
    console.log('🔄 Token refresh request received')

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'Missing refresh token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const clientId = Deno.env.get('VITE_LOYVERSE_CLIENT_ID')
    const clientSecret = Deno.env.get('VITE_LOYVERSE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Loyverse credentials',
          details: {
            clientId: !!clientId,
            clientSecret: !!clientSecret
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const refreshRequestBody = {
      grant_type: "refresh_token",
      refresh_token,
      client_id: clientId,
      client_secret: clientSecret
    }

    console.log('🚀 Making token refresh request to Loyverse...')

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(refreshRequestBody)
    })

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text()
      console.error('❌ Loyverse token refresh failed:', errorText)
      
      return new Response(
        JSON.stringify({ error: errorText }),
        {
          status: loyverseResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await loyverseResponse.json()
    console.log('✅ Token refresh successful!')

    return new Response(
      JSON.stringify(tokenData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}