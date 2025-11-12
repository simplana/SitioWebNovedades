import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("OAUTH CALLBACK V2 ENV_URL:", { code: code?.substring(0,10), state, error });

    if (error || !code) {
      const msg = error || "No code received";
      return new Response(`<html><body><h2>Error: ${msg}</h2></body></html>`, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const clientId = "na0tlm2Whq22j3jTPV_l";
    const clientSecret = "G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw==";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const redirectUri = `${supabaseUrl}/functions/v1/loyverse-oauth-v2/callback`;

    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("redirect_uri", redirectUri);
    formData.append("code", code);

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: formData.toString(),
    });

    if (!loyverseResponse.ok) {
      const err = await loyverseResponse.text();
      return new Response(`<html><body><h2>Token exchange error</h2><p>${err}</p></body></html>`, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const tokenData = await loyverseResponse.json();
    const tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/loyverse_credentials?on_conflict=connection_id`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates"
      },
      body: JSON.stringify({
        connection_id: 'primary',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
        is_active: true,
        last_refreshed_at: new Date().toISOString(),
      })
    });

    const insertStatus = insertRes.ok ? "SUCCESS" : "FAILED";
    const insertError = insertRes.ok ? "" : await insertRes.text();

    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Loyverse OAuth - Copy Credentials</title>
  <meta charset="UTF-8">
  <style>
    body { font-family: monospace; padding: 20px; max-width: 900px; margin: 0 auto; }
    h1 { color: #059669; }
    .box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .token { word-break: break-all; font-size: 10px; }
    .copy-btn { background: #059669; color: white; padding: 8px 16px; border: none; cursor: pointer; margin: 5px 0; }
    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .success { background: #d1fae5; color: #065f46; }
    .error { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>OAUTH SUCCESSFUL - V2</h1>

  <div class="status ${insertStatus === 'SUCCESS' ? 'success' : 'error'}">
    <strong>Database Insert: ${insertStatus}</strong>
    ${insertError ? `<br>Error: ${insertError}` : ''}
  </div>

  <h2>COPY THESE CREDENTIALS:</h2>

  <div class="box">
    <strong>Connection ID:</strong>
    <div class="token" id="connId">primary</div>
    <button class="copy-btn" onclick="copyText('connId')">Copy</button>
  </div>

  <div class="box">
    <strong>Access Token:</strong>
    <div class="token" id="accessToken">${tokenData.access_token}</div>
    <button class="copy-btn" onclick="copyText('accessToken')">Copy</button>
  </div>

  <div class="box">
    <strong>Refresh Token:</strong>
    <div class="token" id="refreshToken">${tokenData.refresh_token}</div>
    <button class="copy-btn" onclick="copyText('refreshToken')">Copy</button>
  </div>

  <div class="box">
    <strong>Expires In:</strong> ${tokenData.expires_in} seconds
  </div>

  <div class="box">
    <strong>Token Expiry:</strong>
    <div id="expiry">${tokenExpiry.toISOString()}</div>
    <button class="copy-btn" onclick="copyText('expiry')">Copy</button>
  </div>

  <script>
    function copyText(id) {
      const text = document.getElementById(id).textContent;
      navigator.clipboard.writeText(text);
      alert('Copied: ' + text.substring(0, 30) + '...');
    }

    if (window.opener) {
      window.opener.postMessage({ type: 'LOYVERSE_OAUTH_SUCCESS', connectionId: 'primary' }, '*');
    }
  </script>
</body>
</html>`,
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`<html><body><h1>ERROR V2</h1><p>${msg}</p></body></html>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html" }
    });
  }
});
