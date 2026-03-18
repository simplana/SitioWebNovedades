import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOYVERSE_API_BASE = "https://api.loyverse.com/v1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

interface AdjustmentResult {
  product_id: string;
  product_name: string;
  quantity: number;
  status: "completed" | "failed";
  error?: string;
  loyverse_response?: any;
}

Deno.serve(async (req: Request) => {
  console.log("📦 Inventory update request:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { order_number } = body;

    if (!order_number || typeof order_number !== "string" || order_number.trim() === "") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid order_number"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 Processing inventory update for order:", order_number);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", order_number)
      .maybeSingle();

    if (orderError || !order) {
      console.error("❌ Order not found:", order_number);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found",
          order_number
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderId = order.id;
    console.log("✅ Found order ID:", orderId);

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("❌ Error fetching order items:", itemsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch order items",
          details: itemsError
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!orderItems || orderItems.length === 0) {
      console.log("ℹ️ No items found for order:", order_number);
      return new Response(
        JSON.stringify({
          success: true,
          total_items: 0,
          successful: 0,
          failed: 0,
          details: [],
          message: "No items to process"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📋 Found ${orderItems.length} items to process`);

    const { data: credentials, error: credError } = await supabase
      .from("loyverse_credentials")
      .select("access_token")
      .eq("is_active", true)
      .maybeSingle();

    if (credError || !credentials) {
      console.error("❌ No active Loyverse credentials found");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No active Loyverse credentials configured",
          message: "Please connect your Loyverse account first"
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔑 Using Loyverse credentials");

    const results: AdjustmentResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const item of orderItems as OrderItem[]) {
      console.log(`🔄 Processing item: ${item.product_name} (${item.product_id})`);

      const adjustmentData = {
        variant_id: item.product_id,
        quantity_change: -Math.abs(item.quantity),
        reason: "SOLD"
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const loyverseResponse = await fetch(`${LOYVERSE_API_BASE}/inventory`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${credentials.access_token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(adjustmentData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await loyverseResponse.json().catch(() => ({}));

        if (loyverseResponse.ok) {
          console.log(`✅ Successfully adjusted inventory for ${item.product_name}`);

          await supabase.from("inventory_adjustments").insert({
            order_id: orderId,
            order_number: order_number,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_adjusted: Math.abs(item.quantity),
            loyverse_response: responseData,
            adjustment_status: "completed",
          });

          results.push({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            status: "completed",
            loyverse_response: responseData,
          });
          successful++;
        } else {
          let errorMessage = `HTTP ${loyverseResponse.status}`;

          if (loyverseResponse.status === 401) {
            errorMessage = "Unauthorized - Token may need refresh";
          } else if (loyverseResponse.status === 404) {
            errorMessage = "Product variant not found in Loyverse";
          } else if (loyverseResponse.status === 400) {
            errorMessage = "Invalid variant_id";
          } else if (loyverseResponse.status === 429) {
            console.log("⏳ Rate limit hit, waiting 2 seconds...");
            await new Promise(resolve => setTimeout(resolve, 2000));

            const retryResponse = await fetch(`${LOYVERSE_API_BASE}/inventory`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${credentials.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(adjustmentData),
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json().catch(() => ({}));
              console.log(`✅ Retry successful for ${item.product_name}`);

              await supabase.from("inventory_adjustments").insert({
                order_id: orderId,
                order_number: order_number,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity_adjusted: Math.abs(item.quantity),
                loyverse_response: retryData,
                adjustment_status: "completed",
              });

              results.push({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                status: "completed",
                loyverse_response: retryData,
              });
              successful++;
              continue;
            } else {
              errorMessage = `Rate limit - Retry also failed (${retryResponse.status})`;
            }
          }

          console.error(`❌ Failed to adjust inventory for ${item.product_name}: ${errorMessage}`);

          await supabase.from("inventory_adjustments").insert({
            order_id: orderId,
            order_number: order_number,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_adjusted: Math.abs(item.quantity),
            loyverse_response: responseData,
            adjustment_status: "failed",
            error_message: errorMessage,
          });

          results.push({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            status: "failed",
            error: errorMessage,
            loyverse_response: responseData,
          });
          failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`❌ Exception processing ${item.product_name}:`, errorMessage);

        await supabase.from("inventory_adjustments").insert({
          order_id: orderId,
          order_number: order_number,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity_adjusted: Math.abs(item.quantity),
          adjustment_status: "failed",
          error_message: errorMessage,
        });

        results.push({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          status: "failed",
          error: errorMessage,
        });
        failed++;
      }
    }

    console.log(`📊 Inventory update complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_items: orderItems.length,
        successful,
        failed,
        details: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
