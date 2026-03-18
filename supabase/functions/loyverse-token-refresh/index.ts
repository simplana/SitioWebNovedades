import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
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
    const forceRefresh = url.searchParams.get("force") === "true";
    const manualTest = url.searchParams.get("test") === "true";

    console.log("Token refresh request:", {
      force: forceRefresh,
      manual_test: manualTest,
      timestamp: new Date().toISOString()
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: credentials, error: credError } = await supabase
      .from("loyverse_credentials")
      .select("*")
      .eq("is_active", true)
      .single();

    if (credError || !credentials) {
      console.log("No active Loyverse credentials found");
      return new Response(
        JSON.stringify({
          message: "No active credentials to refresh",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenExpiry = new Date(credentials.token_expiry);
    const now = new Date();
    const hoursUntilExpiry = (tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    const minutesUntilExpiry = (tokenExpiry.getTime() - now.getTime()) / (1000 * 60);

    console.log("Token Status:", {
      expires_in_hours: hoursUntilExpiry.toFixed(2),
      expires_in_minutes: minutesUntilExpiry.toFixed(2),
      expiry_date: tokenExpiry.toISOString(),
      current_date: now.toISOString(),
      is_expired: hoursUntilExpiry < 0
    });

    if (hoursUntilExpiry > 24 && !forceRefresh && !manualTest) {
      console.log("Token is still valid for more than 24 hours, no refresh needed");
      return new Response(
        JSON.stringify({
          message: "Token is still valid",
          expires_in_hours: hoursUntilExpiry.toFixed(2),
          expires_in_minutes: minutesUntilExpiry.toFixed(2),
          token_expiry: tokenExpiry.toISOString(),
          current_time: now.toISOString(),
          connection_id: credentials.connection_id,
          last_refreshed: credentials.last_refreshed_at
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const refreshReason = forceRefresh ? "Manual force refresh" : manualTest ? "Manual test" : "Auto-refresh (expires within 24h)";
    console.log("Refreshing token... Reason:", refreshReason);

    const clientId = Deno.env.get("LOYVERSE_CLIENT_ID");
    const clientSecret = Deno.env.get("LOYVERSE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Loyverse OAuth credentials not configured");
      return new Response(
        JSON.stringify({ error: "Loyverse OAuth is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("OAuth Config:", {
      client_id: clientId,
      has_client_secret: !!clientSecret,
      refresh_token_length: credentials.refresh_token?.length
    });

    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("client_id", clientId);
    formData.append("client_secret", clientSecret);
    formData.append("refresh_token", credentials.refresh_token);

    const refreshResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
    });

    console.log("Loyverse API Response:", {
      status: refreshResponse.status,
      statusText: refreshResponse.statusText,
      ok: refreshResponse.ok
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("Token refresh failed:", {
        status: refreshResponse.status,
        statusText: refreshResponse.statusText,
        error: errorText
      });

      return new Response(
        JSON.stringify({
          error: "Token refresh failed",
          status: refreshResponse.status,
          details: errorText,
          connection_id: credentials.connection_id,
          attempted_at: new Date().toISOString()
        }),
        {
          status: refreshResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await refreshResponse.json();
    const newTokenExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);

    console.log("New tokens received:", {
      has_access_token: !!tokenData.access_token,
      access_token_length: tokenData.access_token?.length,
      has_refresh_token: !!tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      new_expiry: newTokenExpiry.toISOString()
    });

    console.log("Updating credentials in database...");

    const { error: updateError } = await supabase
      .from("loyverse_credentials")
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || credentials.refresh_token,
        token_expiry: newTokenExpiry.toISOString(),
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentials.id);

    console.log("Recording refresh in history table...");
    const { error: historyError } = await supabase
      .from("loyverse_token_refresh_history")
      .insert({
        credential_id: credentials.id,
        refresh_status: updateError ? "FAILED" : "SUCCESS",
        old_token_expiry: credentials.token_expiry,
        new_token_expiry: updateError ? null : newTokenExpiry.toISOString(),
        refresh_reason: refreshReason,
        error_message: updateError ? updateError.message : null,
      });

    if (historyError) {
      console.warn("Failed to record history (non-critical):", historyError);
    } else {
      console.log("History recorded successfully");
    }

    if (updateError) {
      console.error("Database update error:", {
        error: updateError,
        message: updateError.message,
        code: updateError.code
      });
      return new Response(
        JSON.stringify({
          error: "Failed to update credentials",
          details: updateError.message,
          connection_id: credentials.connection_id,
          attempted_at: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Token refreshed successfully!");
    console.log("   Old expiry:", credentials.token_expiry);
    console.log("   New expiry:", newTokenExpiry.toISOString());
    console.log("   Refresh reason:", refreshReason);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Token refreshed successfully",
        refresh_reason: refreshReason,
        connection_id: credentials.connection_id,
        old_expiry: credentials.token_expiry,
        new_expiry: newTokenExpiry.toISOString(),
        expires_in_seconds: tokenData.expires_in,
        expires_in_hours: (tokenData.expires_in / 3600).toFixed(2),
        refreshed_at: new Date().toISOString(),
        previous_refresh: credentials.last_refreshed_at,
        access_token_preview: tokenData.access_token.substring(0, 20) + "...",
        refresh_token_changed: tokenData.refresh_token !== credentials.refresh_token
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Token refresh failed",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
