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

    if (url.searchParams.get("test")) {
      return new Response("✅ V4 DEPLOYED - " + new Date().toISOString(), {
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("🔄 OAuth callback V4:", { code: code?.substring(0,10), state, error });

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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("💾 Saving to DB...");
    console.log("📊 Token Data Received:", {
      has_access_token: !!tokenData.access_token,
      access_token_length: tokenData.access_token?.length,
      has_refresh_token: !!tokenData.refresh_token,
      refresh_token_length: tokenData.refresh_token?.length,
      expires_in: tokenData.expires_in,
      token_expiry: tokenExpiry.toISOString(),
      connection_id: connectionId
    });
    console.log("🔑 Supabase Config:", {
      url: supabaseUrl,
      has_service_key: !!supabaseKey,
      service_key_length: supabaseKey?.length
    });

    if (!supabaseKey) {
      const error = "SUPABASE_SERVICE_ROLE_KEY not found in environment";
      console.error("❌", error);
      return new Response(`<html><body><h2>Configuration Error</h2><p>${error}</p></body></html>`, {
        headers: { ...corsHeaders, "Content-Type": "text/html" }
      });
    }

    console.log("🔄 Step 1: Deleting all existing credentials...");
    const deleteRes = await fetch(`${supabaseUrl}/rest/v1/loyverse_credentials`, {
      method: "DELETE",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal"
      }
    });
    console.log("✅ Delete response:", deleteRes.status, deleteRes.statusText);
    if (!deleteRes.ok) {
      const deleteError = await deleteRes.text();
      console.warn("⚠️ Delete warning (non-critical):", deleteError);
    }

    console.log("🔄 Step 2: Inserting new credentials...");
    const payload = {
      connection_id: connectionId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expiry: tokenExpiry.toISOString(),
      is_active: true,
      last_refreshed_at: new Date().toISOString(),
    };
    console.log("📦 Insert Payload:", {
      connection_id: payload.connection_id,
      access_token: payload.access_token.substring(0, 20) + "...",
      refresh_token: payload.refresh_token.substring(0, 20) + "...",
      token_expiry: payload.token_expiry,
      is_active: payload.is_active,
      last_refreshed_at: payload.last_refreshed_at
    });

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/loyverse_credentials`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });

    console.log("📊 Insert Response Status:", insertRes.status, insertRes.statusText);

    let insertData = null;
    let insertError = null;

    if (!insertRes.ok) {
      insertError = await insertRes.text();
      console.error("❌ DB Insert failed:", {
        status: insertRes.status,
        statusText: insertRes.statusText,
        error: insertError
      });
    } else {
      insertData = await insertRes.json();
      console.log("✅ Saved successfully!", {
        id: insertData[0]?.id,
        connection_id: insertData[0]?.connection_id,
        token_expiry: insertData[0]?.token_expiry,
        is_active: insertData[0]?.is_active
      });
    }

    const credentials = {
      connectionId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenExpiry: tokenExpiry.toISOString(),
      dbInsertStatus: insertRes.ok ? 'SUCCESS' : 'FAILED',
      dbInsertError: insertError,
      dbRecordId: insertData?.[0]?.id || null,
      timestamp: new Date().toISOString()
    };

    const statusColor = insertRes.ok ? '#059669' : '#DC2626';
    const statusIcon = insertRes.ok ? '✅' : '❌';
    const statusText = insertRes.ok ? 'ÉXITO' : 'ERROR';

    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>OAuth ${statusText}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .status { font-size: 48px; margin-bottom: 10px; }
    .title { font-size: 24px; font-weight: bold; color: ${statusColor}; margin: 0; }
    .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${statusColor}; }
    .label { font-weight: 600; color: #374151; margin-bottom: 8px; }
    .value { font-family: 'Courier New', monospace; font-size: 13px; color: #1f2937; word-break: break-all; background: white; padding: 8px; border-radius: 4px; }
    .error { background: #FEE2E2; border-left-color: #DC2626; }
    .error .value { color: #991B1B; }
    .success-msg { background: #D1FAE5; color: #065F46; padding: 12px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .timestamp { text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="status">${statusIcon}</div>
    <h1 class="title">OAuth ${statusText}</h1>
  </div>

  ${insertRes.ok ? '<div class="success-msg"><strong>¡Credenciales guardadas exitosamente en la base de datos!</strong></div>' : ''}

  <div class="section">
    <div class="label">Estado de Base de Datos:</div>
    <div class="value">${credentials.dbInsertStatus}${credentials.dbRecordId ? ' (ID: ' + credentials.dbRecordId + ')' : ''}</div>
  </div>

  ${insertError ? `<div class="section error">
    <div class="label">Error de Base de Datos:</div>
    <div class="value">${insertError}</div>
  </div>` : ''}

  <div class="section">
    <div class="label">Connection ID:</div>
    <div class="value">${credentials.connectionId}</div>
  </div>

  <div class="section">
    <div class="label">Access Token (primeros 30 caracteres):</div>
    <div class="value">${credentials.accessToken.substring(0, 30)}...</div>
  </div>

  <div class="section">
    <div class="label">Refresh Token (primeros 30 caracteres):</div>
    <div class="value">${credentials.refreshToken.substring(0, 30)}...</div>
  </div>

  <div class="section">
    <div class="label">Fecha de Expiración:</div>
    <div class="value">${new Date(credentials.tokenExpiry).toLocaleString('es-ES')}</div>
  </div>

  <div class="section">
    <div class="label">Expira en:</div>
    <div class="value">${credentials.expiresIn} segundos (${Math.floor(credentials.expiresIn / 3600)} horas)</div>
  </div>

  <div class="timestamp">Timestamp: ${credentials.timestamp}</div>
  <div style="text-align: center; margin-top: 20px; color: #6B7280;">
    Esta ventana se cerrará automáticamente...
  </div>
</div>

<script>
  const credentials = ${JSON.stringify(credentials)};
  console.log('🎉 OAUTH COMPLETE - Full Credentials:', credentials);

  if (window.opener) {
    console.log('📤 Sending credentials to parent window...');
    window.opener.postMessage({
      type: 'LOYVERSE_OAUTH_SUCCESS_WITH_CREDENTIALS',
      credentials: credentials
    }, '*');
    console.log('✅ Message sent successfully');
  } else {
    console.warn('⚠️ No window.opener found');
  }

  setTimeout(() => {
    console.log('🔒 Closing popup window...');
    try { window.close(); } catch(e) {
      console.log('Note: Auto-close blocked:', e);
    }
  }, 5000);
</script>
</body>
</html>`,
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
