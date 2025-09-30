const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

Deno.serve(async (req: Request) => {
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
    
    if (error || !code) {
      return new Response(
        `<script>
          console.log('❌ OAuth error or no code');
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: '${error || 'No code received'}',
              connectionId: '${state}'
            }, '*');
          }
          window.close();
        </script>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }
    
    // Exchange code for tokens
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
      return new Response(
        `<script>
          console.log('❌ Token exchange failed');
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'Token exchange failed: ${errorText}',
              connectionId: '${state}'
            }, '*');
          }
          window.close();
        </script>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      )
    }

    const tokenData = await loyverseResponse.json()
    const tokenExpiry = Date.now() + (tokenData.expires_in - 30) * 1000
    
    // MINIMAL RESPONSE - Just send tokens and close
    return new Response(
      `<script>
        console.log('✅ Sending tokens to parent...');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            accessToken: '${tokenData.access_token}',
            refreshToken: '${tokenData.refresh_token}',
            tokenExpiry: ${tokenExpiry},
            connectionId: '${state}'
          }, '*');
          console.log('✅ Message sent');
        }
        
        // Force close immediately
        setTimeout(() => {
          window.close();
        }, 100);
      </script>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )

  } catch (error) {
    return new Response(
      `<script>
        console.log('❌ Processing error');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: 'Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}',
            connectionId: 'unknown'
          }, '*');
        }
        window.close();
      </script>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    )
  }
})