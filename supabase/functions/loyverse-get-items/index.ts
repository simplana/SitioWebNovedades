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
    const itemsIds = url.searchParams.get("items_ids");
    const createdAtMin = url.searchParams.get("created_at_min");
    const createdAtMax = url.searchParams.get("created_at_max");
    const updatedAtMin = url.searchParams.get("updated_at_min");
    const updatedAtMax = url.searchParams.get("updated_at_max");
    const limit = url.searchParams.get("limit") || "50";
    const cursor = url.searchParams.get("cursor");
    const showDeleted = url.searchParams.get("show_deleted") || "false";

    console.log("📦 Fetching items from Loyverse API...", {
      limit,
      cursor: cursor ? `${cursor.substring(0, 10)}...` : "none",
      itemsIds: itemsIds || "none",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: credentials, error: credError } = await supabase
      .from("loyverse_credentials")
      .select("access_token, refresh_token, token_expiry, id")
      .eq("is_active", true)
      .single();

    if (credError || !credentials) {
      console.error("❌ No active Loyverse credentials found:", credError);
      return new Response(
        JSON.stringify({
          error: "No Loyverse connection found. Please connect in Admin panel.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenExpiry = new Date(credentials.token_expiry);
    const now = new Date();
    const hoursUntilExpiry = (tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 24) {
      console.log("⚠️ Token expires in less than 24 hours, refreshing...");

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

      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokenExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);

        await supabase
          .from("loyverse_credentials")
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || credentials.refresh_token,
            token_expiry: newTokenExpiry.toISOString(),
            last_refreshed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", credentials.id);

        credentials.access_token = tokenData.access_token;
        console.log("✅ Token refreshed successfully");
      } else {
        console.error("❌ Token refresh failed:", await refreshResponse.text());
      }
    }

    let loyverseUrl = `https://api.loyverse.com/v1/items?limit=${limit}`;

    if (cursor) loyverseUrl += `&cursor=${cursor}`;
    if (itemsIds) loyverseUrl += `&items_ids=${itemsIds}`;
    if (createdAtMin) loyverseUrl += `&created_at_min=${createdAtMin}`;
    if (createdAtMax) loyverseUrl += `&created_at_max=${createdAtMax}`;
    if (updatedAtMin) loyverseUrl += `&updated_at_min=${updatedAtMin}`;
    if (updatedAtMax) loyverseUrl += `&updated_at_max=${updatedAtMax}`;
    if (showDeleted === "true") loyverseUrl += `&show_deleted=true`;

    console.log("🚀 Calling Loyverse API:", loyverseUrl);

    const loyverseResponse = await fetch(loyverseUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("📡 Loyverse response status:", loyverseResponse.status);

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text();
      console.error("❌ Loyverse API error:", errorText);

      if (loyverseResponse.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Authentication failed. Please reconnect in Admin panel.",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: `Loyverse API error: ${loyverseResponse.status}`,
          details: errorText,
        }),
        {
          status: loyverseResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await loyverseResponse.json();
    console.log("✅ Items fetched successfully:", data.items?.length || 0);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Edge Function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Failed to fetch items",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});