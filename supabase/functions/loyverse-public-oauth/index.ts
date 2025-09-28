const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

Deno.serve(async (req: Request) => {
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

    console.log('🔄 PUBLIC Loyverse OAuth Edge Function called:', path)
    console.log('🔄 Request method:', req.method)
    console.log('🔄 Full URL:', req.url)

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
    
    console.log('🔄 PUBLIC OAuth callback received:', { 
      code: code ? `${code.substring(0, 20)}...` : 'MISSING', 
      state, 
      error 
    })
    
    if (error) {
      console.error('❌ OAuth error from Loyverse:', error)
      return new Response(
        `<html><body><script>
          console.log('❌ OAuth error from Loyverse: ${error}');
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: '${error}',
              connectionId: '${state}'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
        <div style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Error de OAuth</h2>
          <p>Error: ${error}</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        </body></html>`,
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
          console.log('❌ No authorization code received');
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'No authorization code received',
              connectionId: '${state}'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
        <div style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Error</h2>
          <p>No se recibió código de autorización</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        </body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    // Exchange code for tokens
    console.log('🔄 Starting token exchange...')
    const tokenResult = await exchangeCodeForTokens(code)
    
    if (!tokenResult.success) {
      console.error('❌ Token exchange failed:', tokenResult.error)
      return new Response(
        `<html><body><script>
          console.log('❌ Token exchange failed: ${tokenResult.error}');
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: '${tokenResult.error}',
              connectionId: '${state}'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
        <div style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Error en intercambio de tokens</h2>
          <p>${tokenResult.error}</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        </body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    // Success - send tokens to parent window
    const tokenExpiry = Date.now() + (tokenResult.data.expires_in - 30) * 1000
    
    console.log('✅ Token exchange successful, sending to parent window')
    
    return new Response(
      `<html><body><script>
        console.log('✅ OAuth2 success, sending tokens to parent');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            accessToken: '${tokenResult.data.access_token}',
            refreshToken: '${tokenResult.data.refresh_token}',
            tokenExpiry: ${tokenExpiry},
            connectionId: '${state}'
          }, '*');
        }
        setTimeout(() => window.close(), 1000);
      </script>
      <div style="text-align: center; padding: 50px; font-family: Arial;">
        <h2>✅ ¡Autorización Exitosa!</h2>
        <p>Conectado con Loyverse correctamente</p>
        <p>Esta ventana se cerrará automáticamente...</p>
      </div>
      </body></html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      `<html><body><script>
        console.log('❌ Callback processing error: ${errorMessage}');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: 'Callback processing failed: ${errorMessage}',
            connectionId: 'unknown'
          }, '*');
        }
        setTimeout(() => window.close(), 2000);
      </script>
      <div style="text-align: center; padding: 50px; font-family: Arial;">
        <h2>❌ Error de procesamiento</h2>
        <p>${errorMessage}</p>
        <p>Esta ventana se cerrará automáticamente...</p>
      </div>
      </body></html>`,
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
    // Usar las credenciales exactas proporcionadas
    const clientId = 'na0tlm2Whq22j3jTPV_l'
    const clientSecret = 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw===='
    const redirectUri = 'https://citizen-archive-prescription-valves.trycloudflare.com/auth/loyverse/callback'
    
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
  // Esta función ya no se usa en el nuevo flujo
  return new Response(
    JSON.stringify({ error: 'Use callback endpoint instead' }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
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

    const clientId = 'na0tlm2Whq22j3jTPV_l'
    const clientSecret = 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw===='

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