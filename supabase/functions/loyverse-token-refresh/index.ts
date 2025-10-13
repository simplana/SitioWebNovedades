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
    console.log("🔄 Starting scheduled token refresh check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: credentials, error: credError } = await supabase
      .from("loyverse_credentials")
      .select("*")
      .eq("is_active", true)
      .single();

    if (credError || !credentials) {
      console.log("ℹ️ No active Loyverse credentials found");
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

    console.log(`⏰ Token expires in ${hoursUntilExpiry.toFixed(2)} hours`);

    if (hoursUntilExpiry > 24) {
      console.log("✅ Token is still valid for more than 24 hours, no refresh needed");
      return new Response(
        JSON.stringify({
          message: "Token is still valid",
          expires_in_hours: hoursUntilExpiry.toFixed(2),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔄 Token expires within 24 hours, refreshing...");

    const clientId = Deno.env.get("LOYVERSE_CLIENT_ID") || "na0tlm2Whq22j3jTPV_l";
    const clientSecret = Deno.env.get("LOYVERSE_CLIENT_SECRET") || "G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw==";

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

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("❌ Token refresh failed:", errorText);

      return new Response(
        JSON.stringify({
          error: "Token refresh failed",
          details: errorText,
        }),
        {
          status: refreshResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await refreshResponse.json();
    const newTokenExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);

    console.log("💾 Updating credentials in database...");

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

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update credentials",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Token refreshed successfully!");
    console.log(`   New expiry: ${newTokenExpiry.toISOString()}`);

    return new Response(
      JSON.stringify({
        message: "Token refreshed successfully",
        new_expiry: newTokenExpiry.toISOString(),
        expires_in_seconds: tokenData.expires_in,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Edge Function error:", error);
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