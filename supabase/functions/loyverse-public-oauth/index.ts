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
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    console.log('🔄 Loyverse OAuth callback received:', { 
      code: code ? `${code.substring(0, 10)}...` : 'MISSING', 
      state, 
      error,
      method: req.method,
      url: req.url
    })
    
    // Si hay error de OAuth
    if (error) {
      console.error('❌ OAuth error from Loyverse:', error)
      return new Response(
        `<html><body><script>
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
    
    // Si no hay código
    if (!code) {
      console.error('❌ No authorization code received')
      return new Response(
        `<html><body><script>
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
    
    // Intercambiar código por tokens
    console.log('🔄 Starting token exchange with Loyverse...')
    
    // En Edge Functions, las variables de entorno se acceden con Deno.env.get()
    const clientId = Deno.env.get('LOYVERSE_CLIENT_ID') || 'na0tlm2Whq22j3jTPV_l'
    const clientSecret = Deno.env.get('LOYVERSE_CLIENT_SECRET') || 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw=='
    const redirectUri = Deno.env.get('LOYVERSE_REDIRECT_URL') || 'https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback'
    
    console.log('🔑 Using credentials:')
    console.log('  - Client ID:', clientId)
    console.log('  - Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : 'MISSING')
    console.log('  - Redirect URI:', redirectUri)

    // Usar application/x-www-form-urlencoded según documentación
    const formData = new URLSearchParams()
    formData.append('grant_type', 'authorization_code')
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('redirect_uri', redirectUri)
    formData.append('code', code)

    console.log('🚀 Making token request to Loyverse:')
    console.log('📋 Form data:', formData.toString())

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: formData.toString()
    })

    console.log('📡 Loyverse response status:', loyverseResponse.status)

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text()
      console.error('❌ Loyverse token exchange failed:', errorText)
      
      return new Response(
        `<html><body><script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'Token exchange failed: ${errorText}',
              connectionId: '${state}'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
        <div style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Error en intercambio de tokens</h2>
          <p>${errorText}</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        </body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }

    const tokenData = await loyverseResponse.json()
    console.log('✅ Token exchange successful!')
    
    const tokenExpiry = Date.now() + (tokenData.expires_in - 30) * 1000
    
    // Enviar tokens al parent window
    return new Response(
      `<html><body><script>
        console.log('OAuth2 success, sending tokens to parent');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            accessToken: '${tokenData.access_token}',
            refreshToken: '${tokenData.refresh_token}',
            tokenExpiry: ${tokenExpiry},
            connectionId: '${state}'
          }, '*');
          console.log('Message sent to parent');
        }
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.log('Could not close popup:', e);
          }
        }, 1000);
      </script>
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; background: #f0f9ff; color: #1e40af;">
        <h2 style="color: #059669; margin-bottom: 20px;">✅ ¡Autorización Exitosa!</h2>
        <p>Conectado con Loyverse correctamente</p>
        <p style="color: #6b7280; font-size: 14px;">Esta ventana se cerrará automáticamente en 1 segundo...</p>
        <div style="margin-top: 20px; padding: 10px; background: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 12px; color: #065f46;">
            <strong>Token recibido:</strong> ${tokenData.access_token.substring(0, 20)}...<br>
            <strong>Expira:</strong> ${new Date(tokenExpiry).toLocaleString()}
          </p>
        </div>
      </div>
      </body></html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      `<html><body><script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: 'Processing failed: ${errorMessage}',
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )
  }
})