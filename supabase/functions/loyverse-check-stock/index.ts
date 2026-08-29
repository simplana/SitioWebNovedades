/**
 * Live stock lookup for one or more variants.
 *
 * The `loyverse_products` cache can be up to 15 minutes stale, and its
 * `available_for_sale` flag is a Loyverse *setting* rather than a quantity.
 * Real quantities only ever come from /v1.0/inventory, so the product page and
 * checkout call this before letting anyone buy.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  getLoyverseToken,
  json,
  LoyverseAuthError,
  loyverseGet,
  serviceClient,
} from "../_shared/loyverse.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { variant_ids } = await req.json();

    if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
      return json({ error: "variant_ids must be a non-empty array" }, 400);
    }

    const storeId = Deno.env.get("LOYVERSE_DEFAULT_STORE_ID");
    if (!storeId) {
      return json({ error: "LOYVERSE_DEFAULT_STORE_ID is not configured" }, 500);
    }

    const ids = variant_ids.filter((id: unknown): id is string => typeof id === "string" && !!id);
    if (ids.length === 0) {
      return json({ error: "variant_ids contained no usable ids" }, 400);
    }

    const token = await getLoyverseToken(serviceClient());

    // One request for every variant, rather than the per-item loop in
    // loyverse-restar-stock.
    const data = await loyverseGet(
      "inventory",
      { store_ids: storeId, variant_ids: ids.join(","), limit: "250" },
      token,
    );

    const stock: Record<string, number> = {};
    for (const level of data.inventory_levels ?? []) {
      stock[level.variant_id] = Number(level.in_stock);
    }

    return json({ stock });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stock check failed:", message);
    const status = error instanceof LoyverseAuthError ? 401 : 500;
    return json({ error: message }, status);
  }
});
