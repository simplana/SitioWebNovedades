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
      error
    })
    
    // Si hay error de OAuth
    if (error) {
      console.error('❌ OAuth error from Loyverse:', error)
      return new Response(
        `<script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: '${error}',
              connectionId: '${state}'
            }, '*');
          }
          window.close();
        </script>
        <div>Error: ${error}</div>`,
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
        `<script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'No authorization code received',
              connectionId: '${state}'
            }, '*');
          }
          window.close();
        </script>
        <div>Error: No code received</div>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    // Intercambiar código por tokens
    console.log('🔄 Starting token exchange with Loyverse...')
    
    const clientId = 'na0tlm2Whq22j3jTPV_l'
    const clientSecret = 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw=='
    const redirectUri = 'https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback'

    const formData = new URLSearchParams()
    formData.append('grant_type', 'authorization_code')
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)
    formData.append('redirect_uri', redirectUri)
    formData.append('code', code)

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: formData.toString()
    })

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text()
      console.error('❌ Loyverse token exchange failed:', errorText)
      
      return new Response(
        `<script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'Token exchange failed: ${errorText}',
              connectionId: '${state}'
            }, '*');
          }
          window.close();
        </script>
        <div>Error: ${errorText}</div>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }

    const tokenData = await loyverseResponse.json()
    console.log('✅ Token exchange successful!')
    
    const tokenExpiry = Date.now() + (tokenData.expires_in - 30) * 1000
    
    return new Response(
      `<script>
        console.log('✅ OAuth2 success, sending tokens to parent');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            accessToken: '${tokenData.access_token}',
            refreshToken: '${tokenData.refresh_token}',
            tokenExpiry: ${tokenExpiry},
            connectionId: '${state}'
          }, '*');
          console.log('✅ Message sent to parent');
        }
        
        // Cerrar inmediatamente con múltiples métodos
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.log('Method 1 failed, trying method 2...');
            try {
              window.open('', '_self').close();
            } catch (e2) {
              console.log('Method 2 failed, trying method 3...');
              window.location.href = 'about:blank';
            }
          }
        }, 100);
      </script>
      <div style="text-align: center; padding: 20px;">
        <h2>✅ ¡Conectado!</h2>
        <p>Cerrando...</p>
      </div>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      `<script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: 'Processing failed: ${errorMessage}',
            connectionId: 'unknown'
          }, '*');
        }
        window.close();
      </script>
      <div>Error: ${errorMessage}</div>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )
  }
})