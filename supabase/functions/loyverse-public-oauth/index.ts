import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("🔄 Loyverse OAuth callback received:", {
      code: code ? `${code.substring(0, 10)}...` : "MISSING",
      state,
      error,
      method: req.method,
      url: req.url,
    });

    if (error) {
      console.error("❌ OAuth error from Loyverse:", error);
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
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        }
      );
    }

    if (!code) {
      console.error("❌ No authorization code received");
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
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        }
      );
    }

    console.log("🔄 Starting token exchange with Loyverse...");

    const clientId = Deno.env.get("LOYVERSE_CLIENT_ID") || "na0tlm2Whq22j3jTPV_l";
    const clientSecret = Deno.env.get("LOYVERSE_CLIENT_SECRET") || "G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw==";
    const redirectUri = Deno.env.get("LOYVERSE_REDIRECT_URL") || "https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback";

    console.log("🔑 Using credentials:");
    console.log("  - Client ID:", clientId);
    console.log("  - Client Secret:", clientSecret ? `${clientSecret.substring(0, 10)}...` : "MISSING");
    console.log("  - Redirect URI:", redirectUri);

    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("redirect_uri", redirectUri);
    formData.append("code", code);

    console.log("🚀 Making token request to Loyverse");

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    console.log("📡 Loyverse response status:", loyverseResponse.status);

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text();
      console.error("❌ Loyverse token exchange failed:", errorText);

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
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        }
      );
    }

    const tokenData = await loyverseResponse.json();
    console.log("✅ Token exchange successful!");

    const tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("💾 Saving tokens to database...");

    const { error: dbError } = await supabase.from("loyverse_credentials").insert({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expiry: tokenExpiry.toISOString(),
      is_active: true,
      last_refreshed_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("❌ Database error:", dbError);
      return new Response(
        `<html><body><script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'Failed to save credentials: ${dbError.message}',
              connectionId: '${state}'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
        <div style="text-align: center; padding: 50px; font-family: Arial;">
          <h2>❌ Error al guardar credenciales</h2>
          <p>${dbError.message}</p>
          <p>Esta ventana se cerrará automáticamente...</p>
        </div>
        </body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        }
      );
    }

    console.log("✅ Tokens saved successfully to database!");

    return new Response(
      `<html>
      <head><title>OAuth Success</title></head>
      <body>
      <script>
        console.log('✅ OAuth2 success, credentials saved to database');
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            connectionId: '${state}'
          }, '*');
          console.log('✅ Message sent to parent window');
        } else {
          console.warn('⚠️ No window.opener found');
        }

        setTimeout(() => {
          console.log('Closing popup window...');
          try {
            window.close();
          } catch (e) {
            console.log('Forcing close via about:blank');
            window.location.href = 'about:blank';
          }
        }, 2000);
      </script>
      <div style="text-align: center; padding: 40px; font-family: Arial;">
        <h2 style="color: #059669;">✅ ¡Conectado!</h2>
        <p>Credenciales guardadas de forma segura.</p>
        <p>Esta ventana se cerrará automáticamente en 2 segundos...</p>
      </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("❌ Edge Function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      }
    );
  }
});