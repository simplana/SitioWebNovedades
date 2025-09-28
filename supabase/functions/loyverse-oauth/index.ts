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

    if (path.endsWith('/callback') && req.method === 'GET') {
      return await handleOAuthCallback(req)
    } else if (path.endsWith('/exchange-token') && req.method === 'POST') {
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

async function handleOAuthCallback(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    console.log('🔄 OAuth callback received:', { code: code ? 'PRESENT' : 'MISSING', state, error })
    
    if (error) {
      console.error('❌ OAuth error from Loyverse:', error)
      return new Response(
        `<html><body><script>
          window.opener?.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: '${error}',
            connectionId: '${state}'
          }, '*');
          window.close();
        </script></body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    if (!code) {
      console.error('❌ No authorization code received')
      return new Response(
        `<html><body><script>
          window.opener?.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: 'No authorization code received',
            connectionId: '${state}'
          }, '*');
          window.close();
        </script></body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    // Exchange code for tokens
    const tokenResult = await exchangeCodeForTokens(code)
    
    if (!tokenResult.success) {
      return new Response(
        `<html><body><script>
          window.opener?.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: '${tokenResult.error}',
            connectionId: '${state}'
          }, '*');
          window.close();
        </script></body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    // Success - send tokens to parent window
    const tokenExpiry = Date.now() + (tokenResult.data.expires_in - 30) * 1000
    
    return new Response(
      `<html><body><script>
        window.opener?.postMessage({
          type: 'LOYVERSE_OAUTH_SUCCESS',
          accessToken: '${tokenResult.data.access_token}',
          refreshToken: '${tokenResult.data.refresh_token}',
          tokenExpiry: ${tokenExpiry},
          connectionId: '${state}'
        }, '*');
        setTimeout(() => window.close(), 1000);
      </script></body></html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error)
    return new Response(
      `<html><body><script>
        window.opener?.postMessage({
          type: 'LOYVERSE_OAUTH_ERROR',
          error: 'Callback processing failed: ${error instanceof Error ? error.message : 'Unknown error'}',
          connectionId: 'unknown'
        }, '*');
        window.close();
      </script></body></html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )
  }
}

async function exchangeCodeForTokens(code: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const clientId = 'na0tlm2Whq22j3jTPV_l'
    const clientSecret = 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw===='
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/loyverse-oauth/callback`
    
    const tokenRequestBody = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }

    console.log('🚀 EXACT TOKEN REQUEST TO LOYVERSE:')
    console.log('📋 grant_type:', tokenRequestBody.grant_type)
    console.log('📋 client_id:', tokenRequestBody.client_id)
    console.log('📋 client_secret length:', clientSecret.length)
    console.log('📋 client_secret preview:', `${clientSecret.substring(0, 20)}...`)
    console.log('📋 redirect_uri:', tokenRequestBody.redirect_uri)
    console.log('📋 code length:', code.length)
    console.log('📋 code preview:', `${code.substring(0, 30)}...`)

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(tokenRequestBody)
    })

    console.log('📡 LOYVERSE RESPONSE:')
    console.log('📡 Status:', loyverseResponse.status)
    console.log('📡 Status Text:', loyverseResponse.statusText)
    console.log('📡 Headers:', Object.fromEntries(loyverseResponse.headers.entries()))

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text()
      console.error('❌ LOYVERSE ERROR DETAILS:')
      console.error('❌ Raw response:', errorText)
      
      let parsedError = null
      try {
        parsedError = JSON.parse(errorText)
        console.error('❌ Parsed error:', parsedError)
      } catch {
        console.error('❌ Error is not JSON')
      }
      
      return {
        success: false,
        error: `Loyverse API error: ${loyverseResponse.status} - ${errorText}`
      }
    }

    const tokenData = await loyverseResponse.json()
    console.log('✅ Token exchange successful!')
    console.log('📋 Token data keys:', Object.keys(tokenData))

    return {
      success: true,
      data: tokenData
    }

  } catch (error) {
    console.error('❌ Token exchange error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
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
    const defaultRedirectUri = redirect_uri || 'https://citizen-archive-prescription-valves.trycloudflare.com/auth/loyverse/callback'
    
    console.log('🔑 Environment check:')
    console.log('  - Client ID:', clientId ? `${clientId.substring(0, 10)}...` : 'MISSING')
    console.log('  - Client Secret:', clientSecret ? 'PRESENT' : 'MISSING')
    console.log('  - Redirect URI from request:', redirect_uri)
    console.log('  - Final Redirect URI:', defaultRedirectUri)

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
      redirect_uri: defaultRedirectUri, // Usar siempre la URI por defecto para consistencia
      client_id: clientId,
      client_secret: clientSecret
    }

    console.log('🚀 Making token exchange request to Loyverse API...')
    console.log('📋 EXACT request body being sent:', {
      ...tokenRequestBody,
      client_secret: clientSecret ? `${clientSecret.substring(0, 10)}...[${clientSecret.length} chars]` : 'MISSING',
      code: code ? `${code.substring(0, 15)}...[${code.length} chars]` : 'MISSING',
      redirect_uri_length: defaultRedirectUri.length
    })
    console.log('🔗 Full redirect URI being sent:', defaultRedirectUri)

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
      console.error('❌ LOYVERSE API ERROR - FULL DETAILS:')
      console.error('   🔴 HTTP Status:', loyverseResponse.status)
      console.error('   🔴 HTTP Status Text:', loyverseResponse.statusText)
      console.error('   🔴 Response Headers:', Object.fromEntries(loyverseResponse.headers.entries()))
      console.error('   🔴 Raw Response Body:', errorText)
      
      // Intentar parsear la respuesta de error
      let parsedError = null
      try {
        parsedError = JSON.parse(errorText)
        console.error('   🔴 Parsed Error Object:', parsedError)
        console.error('   🔴 Error Message:', parsedError.error || parsedError.message)
        console.error('   🔴 Error Description:', parsedError.error_description)
      } catch {
        console.error('   🔴 Error is not valid JSON, raw text:', errorText)
      }
      
      console.error('   📋 WHAT WE SENT TO LOYVERSE:')
      console.error('     - grant_type:', tokenRequestBody.grant_type)
      console.error('     - client_id:', tokenRequestBody.client_id)
      console.error('     - client_secret length:', clientSecret ? clientSecret.length : 0)
      console.error('     - redirect_uri:', tokenRequestBody.redirect_uri)
      console.error('     - code length:', code ? code.length : 0)
      console.error('     - code preview:', code ? `${code.substring(0, 30)}...` : 'MISSING')
      
      console.error('   🔍 POSSIBLE CAUSES OF 401:')
      console.error('     1. Client Secret incorrect')
      console.error('     2. Client ID incorrect') 
      console.error('     3. Redirect URI mismatch')
      console.error('     4. Authorization code expired/invalid')
      console.error('     5. Authorization code already used')
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }

      return new Response(
        JSON.stringify({ 
          error: `Loyverse API error: ${loyverseResponse.status}`,
          details: {
            status: loyverseResponse.status,
            statusText: loyverseResponse.statusText,
            loyverseError: errorData,
            rawResponse: errorText,
            requestSent: {
              grant_type: tokenRequestBody.grant_type,
              client_id: tokenRequestBody.client_id,
              redirect_uri: tokenRequestBody.redirect_uri,
              code_present: !!code,
              code_length: code ? code.length : 0,
              client_secret_present: !!clientSecret,
              client_secret_length: clientSecret ? clientSecret.length : 0
            }
          },
          loyverseStatus: loyverseResponse.status,
          loyverseResponse: errorText
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