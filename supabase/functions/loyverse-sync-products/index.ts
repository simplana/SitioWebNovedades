/**
 * Mirrors the Loyverse item catalog into the `loyverse_products` table.
 *
 * This is the only thing that pulls catalog data from Loyverse. The storefront
 * reads the table directly, which is what makes real search and real page counts
 * possible -- Loyverse's /v1.0/items offers neither.
 *
 * Refresh is lazy: callers hit this on page load, and it no-ops unless the cache
 * is older than STALE_AFTER_MS. Pass ?force=true to sync regardless.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  getLoyverseToken,
  json,
  LoyverseAuthError,
  loyverseGetAll,
  normalizeSearch,
  serviceClient,
} from "../_shared/loyverse.ts";

const STALE_AFTER_MS = 15 * 60 * 1000;  // refresh the catalog at most every 15 min
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;  // a 'running' sync older than this is dead
const UPSERT_CHUNK = 500;

/** Maps a raw Loyverse item to a `loyverse_products` row. */
function toRow(item: any, categories: Map<string, string>) {
  const firstVariant = item.variants?.[0];
  const categoryName = item.category_id
    ? categories.get(item.category_id) ?? null
    : null;

  const name = item.item_name || item.name || "Producto sin nombre";
  const sku = firstVariant?.sku || item.id;

  return {
    id: item.id,
    item_name: name,
    description: item.description ?? null,
    category_id: item.category_id ?? null,
    category_name: categoryName,
    sku,
    price: firstVariant?.default_price ?? firstVariant?.price ?? item.price ?? 0,
    image_url: item.image_url ?? null,
    track_stock: item.track_stock ?? false,
    available_for_sale: firstVariant?.stores?.[0]?.available_for_sale ?? true,
    variant_id: firstVariant?.variant_id ?? null,
    option_value: firstVariant?.option1_value ?? null,
    search_text: normalizeSearch([name, sku, categoryName].filter(Boolean).join(" ")),
    raw: item,
    loyverse_updated_at: item.updated_at ?? null,
    synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = serviceClient();
  const force = new URL(req.url).searchParams.get("force") === "true";

  try {
    const { data: state } = await supabase
      .from("loyverse_sync_state")
      .select("last_synced_at, status, started_at, item_count")
      .eq("id", 1)
      .maybeSingle();

    // Someone else is already syncing. Let them finish rather than duplicating
    // the crawl -- this is what keeps a burst of visitors to one sync.
    if (state?.status === "running" && state.started_at) {
      const runningFor = Date.now() - new Date(state.started_at).getTime();
      if (runningFor < LOCK_TIMEOUT_MS) {
        return json({ skipped: "already_running", item_count: state.item_count });
      }
      console.log("Previous sync looks stalled, taking over");
    }

    if (!force && state?.last_synced_at) {
      const age = Date.now() - new Date(state.last_synced_at).getTime();
      if (age < STALE_AFTER_MS) {
        return json({
          skipped: "fresh",
          age_seconds: Math.round(age / 1000),
          item_count: state.item_count,
        });
      }
    }

    await supabase
      .from("loyverse_sync_state")
      .update({ status: "running", started_at: new Date().toISOString(), error: null })
      .eq("id", 1);

    const token = await getLoyverseToken(supabase);

    // Categories first: /v1.0/items only carries category_id, so names have to be
    // resolved separately. Without this every product reads "Sin categoría".
    const categoryRows = await loyverseGetAll("categories", "categories", token);
    const categories = new Map<string, string>(
      categoryRows.filter((c: any) => !c.deleted_at).map((c: any) => [c.id, c.name]),
    );
    console.log(`Fetched ${categories.size} categories`);

    const items = await loyverseGetAll("items", "items", token);
    console.log(`Fetched ${items.length} items`);

    if (items.length === 0) {
      // Never blank the catalog on an empty response -- far more likely a
      // transient API problem than a store that genuinely sells nothing.
      throw new Error("Loyverse returned zero items; keeping existing catalog");
    }

    const rows = items.map((item: any) => toRow(item, categories));

    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK);
      const { error } = await supabase
        .from("loyverse_products")
        .upsert(chunk, { onConflict: "id" });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
    }

    // Drop anything that no longer exists in Loyverse.
    const seen = new Set(rows.map((r) => r.id));
    const { data: existing } = await supabase.from("loyverse_products").select("id");
    const stale = (existing ?? []).map((r) => r.id).filter((id) => !seen.has(id));

    if (stale.length > 0) {
      await supabase.from("loyverse_products").delete().in("id", stale);
      console.log(`Removed ${stale.length} products no longer in Loyverse`);
    }

    await supabase
      .from("loyverse_sync_state")
      .update({
        status: "idle",
        last_synced_at: new Date().toISOString(),
        item_count: rows.length,
        error: null,
      })
      .eq("id", 1);

    console.log(`Sync complete: ${rows.length} products`);

    return json({
      synced: true,
      item_count: rows.length,
      categories: categories.size,
      removed: stale.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync failed:", message);

    // Leave the existing rows alone: a stale catalog beats an empty storefront.
    await supabase
      .from("loyverse_sync_state")
      .update({ status: "error", error: message })
      .eq("id", 1);

    const status = error instanceof LoyverseAuthError ? 401 : 500;
    return json({ error: message }, status);
  }
});
