import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItem {
  loyverse_variant_id: string;
  quantity: number;
  product_name: string;
}

interface RequestBody {
  order_items: OrderItem[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { order_items }: RequestBody = await req.json();

    if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
      return new Response(
        JSON.stringify({ error: "order_items array is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const storeId = Deno.env.get("LOYVERSE_DEFAULT_STORE_ID");
    if (!storeId) {
      console.error("LOYVERSE_DEFAULT_STORE_ID not configured");
      return new Response(
        JSON.stringify({ error: "Store configuration missing" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get access token from loyverse-token-refresh function
    const tokenRefreshUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/loyverse-token-refresh`;
    const tokenResponse = await fetch(tokenRefreshUrl, {
      method: "POST",
      headers: {
        Authorization: req.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get access token:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get access token" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Process each item and reduce stock
    const results = [];
    for (const item of order_items) {
      if (!item.loyverse_variant_id) {
        console.warn(`Skipping item ${item.product_name} - no variant ID`);
        results.push({
          product_name: item.product_name,
          status: "skipped",
          reason: "no_variant_id",
        });
        continue;
      }

      try {
        // Call Loyverse API to update inventory
        const inventoryUrl = `https://api.loyverse.com/v1.0/inventory`;
        const inventoryResponse = await fetch(inventoryUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variant_id: item.loyverse_variant_id,
            store_id: storeId,
            change: -item.quantity, // Negative to reduce stock
            reason: "SOLD",
          }),
        });

        if (!inventoryResponse.ok) {
          const errorText = await inventoryResponse.text();
          console.error(
            `Failed to update inventory for ${item.product_name}:`,
            errorText
          );
          results.push({
            product_name: item.product_name,
            variant_id: item.loyverse_variant_id,
            status: "failed",
            error: errorText,
          });
        } else {
          const inventoryData = await inventoryResponse.json();
          results.push({
            product_name: item.product_name,
            variant_id: item.loyverse_variant_id,
            status: "success",
            quantity_reduced: item.quantity,
            data: inventoryData,
          });
        }
      } catch (error) {
        console.error(
          `Error processing ${item.product_name}:`,
          error
        );
        results.push({
          product_name: item.product_name,
          variant_id: item.loyverse_variant_id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Stock update completed",
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in loyverse-restar-stock:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
