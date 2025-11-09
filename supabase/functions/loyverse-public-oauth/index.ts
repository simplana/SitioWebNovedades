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

    console.log("🔄 OAuth callback:", { code: code?.substring(0,10), state, error });

    if (error || !code) {
      const msg = error || "No code received";
      return new Response(`<html><body><h2>Error: ${msg}</h2></body></html>`, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const clientId = "na0tlm2Whq22j3jTPV_l";
    const clientSecret = "G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw==";
    const redirectUri = "https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback";

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
      console.error("❌ Token exchange failed:", err);
      return new Response(`<html><body><h2>Token exchange error</h2><p>${err}</p></body></html>`, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const tokenData = await loyverseResponse.json();
    const tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);
    const connectionId = state || `loyverse_${Date.now()}`;

    const supabaseUrl = "https://iabrhkvwhmliemgioxce.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("💾 Saving to DB...");

    await fetch(`${supabaseUrl}/rest/v1/loyverse_credentials?is_active=eq.true`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ is_active: false })
    });

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/loyverse_credentials`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        connection_id: connectionId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
        is_active: true,
        last_refreshed_at: new Date().toISOString(),
      })
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error("❌ DB Insert failed:", err);
      return new Response(`<html><body><h2>DB Error</h2><p>${err}</p></body></html>`, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    const insertData = await insertRes.json();
    console.log("✅ Saved successfully!", insertData);

    return new Response(
      `<html><head><title>Success</title></head><body>
      <script>
        console.log('SAVED!');
        if (window.opener) {
          window.opener.postMessage({ type: 'LOYVERSE_OAUTH_SUCCESS', connectionId: '${state}' }, '*');
        }
      </script>
      <div style="padding:20px;font-family:monospace;max-width:800px;margin:0 auto;">
        <h2 style="color:green">✅ OAuth Successful!</h2>
        <h3>📋 Credentials (copy these if needed):</h3>
        <div style="background:#f5f5f5;padding:15px;border-radius:5px;font-size:11px;overflow-wrap:break-word;">
          <p><strong>Connection ID:</strong><br>${connectionId}</p>
          <p><strong>Access Token:</strong><br>${tokenData.access_token}</p>
          <p><strong>Refresh Token:</strong><br>${tokenData.refresh_token}</p>
          <p><strong>Expires In:</strong> ${tokenData.expires_in} seconds</p>
          <p><strong>Token Expiry:</strong><br>${tokenExpiry.toISOString()}</p>
        </div>
        <p style="margin-top:20px;color:#666;">Database insert status: ${insertRes.status} ${insertRes.ok ? '✅' : '❌'}</p>
      </div>
      </body></html>`,
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`<html><body><h2>Error</h2><p>${msg}</p></body></html>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html" }
    });
  }
});
