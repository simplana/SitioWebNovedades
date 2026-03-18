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

    // Get active access token from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Query loyverse_credentials for the active token
    const credentialsResponse = await fetch(
      `${supabaseUrl}/rest/v1/loyverse_credentials?is_active=eq.true&select=access_token`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!credentialsResponse.ok) {
      const errorText = await credentialsResponse.text();
      console.error("Failed to fetch active token:", errorText);
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

    const credentials = await credentialsResponse.json();

    if (!credentials || credentials.length === 0) {
      console.error("No active Loyverse token found");
      return new Response(
        JSON.stringify({ error: "No active Loyverse token found" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const access_token = credentials[0].access_token;

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
        // First, GET current inventory level
        const getInventoryUrl = `https://api.loyverse.com/v1.0/inventory?store_ids=${storeId}&variant_ids=${item.loyverse_variant_id}`;
        const getInventoryResponse = await fetch(getInventoryUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!getInventoryResponse.ok) {
          const errorText = await getInventoryResponse.text();
          console.error(
            `Failed to get inventory for ${item.product_name}:`,
            errorText
          );
          results.push({
            product_name: item.product_name,
            variant_id: item.loyverse_variant_id,
            status: "failed",
            error: `Failed to get current stock: ${errorText}`,
          });
          continue;
        }

        const inventoryData = await getInventoryResponse.json();

        if (!inventoryData.inventory_levels || inventoryData.inventory_levels.length === 0) {
          console.error(`No inventory data found for ${item.product_name}`);
          results.push({
            product_name: item.product_name,
            variant_id: item.loyverse_variant_id,
            status: "failed",
            error: "No inventory data found",
          });
          continue;
        }

        const currentStock = inventoryData.inventory_levels[0].in_stock;
        const newStock = currentStock - item.quantity;

        // Now POST to update inventory with new stock level
        const updateInventoryUrl = `https://api.loyverse.com/v1.0/inventory`;
        const updateInventoryResponse = await fetch(updateInventoryUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventory_levels: [
              {
                variant_id: item.loyverse_variant_id,
                store_id: storeId,
                stock_after: newStock,
              },
            ],
          }),
        });

        if (!updateInventoryResponse.ok) {
          const errorText = await updateInventoryResponse.text();
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
          const updateData = await updateInventoryResponse.json();
          results.push({
            product_name: item.product_name,
            variant_id: item.loyverse_variant_id,
            status: "success",
            previous_stock: currentStock,
            quantity_reduced: item.quantity,
            new_stock: newStock,
            data: updateData,
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
