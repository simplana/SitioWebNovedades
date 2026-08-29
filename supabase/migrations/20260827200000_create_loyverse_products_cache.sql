/*
  # Loyverse product catalog cache

  Mirrors the Loyverse item catalog into Postgres so the storefront can run real
  SQL queries against it. Loyverse's GET /v1.0/items has no name-search parameter
  and returns no total count -- only an opaque cursor -- so search and page counts
  are impossible without a local copy.

  1. New tables
     - `loyverse_products`   one row per Loyverse item, including the complete raw
                             item JSON so no field Loyverse sends is ever lost
     - `loyverse_sync_state` single-row bookkeeping for the lazy refresh + lock

  2. Security
     - RLS enabled on both tables
     - anon + authenticated may SELECT (the catalog is public)
     - no insert/update/delete policies: only the service role writes, via the
       loyverse-sync-products edge function
*/

CREATE TABLE IF NOT EXISTS loyverse_products (
  id                  text PRIMARY KEY,          -- Loyverse item id
  item_name           text NOT NULL,
  description         text,
  category_id         text,
  category_name       text,                      -- resolved via /v1.0/categories
  sku                 text,
  price               numeric,
  image_url           text,                      -- Loyverse CDN url, may be null
  track_stock         boolean DEFAULT false,
  available_for_sale  boolean DEFAULT true,
  variant_id          text,                      -- first variant, used by the cart
  option_value        text,                      -- first variant's option1_value
  search_text         text,                      -- lowercased, accent-stripped
  raw                 jsonb NOT NULL,            -- COMPLETE Loyverse item, verbatim
  loyverse_updated_at timestamptz,
  synced_at           timestamptz DEFAULT now()
);

-- The catalog is ~900 rows, so an ilike '%term%' sequential scan is sub-millisecond.
-- If it ever grows past ~50k rows, add: CREATE EXTENSION pg_trgm; and a
-- GIN (search_text gin_trgm_ops) index here.
CREATE INDEX IF NOT EXISTS loyverse_products_category_name_idx ON loyverse_products (category_name);
CREATE INDEX IF NOT EXISTS loyverse_products_item_name_idx     ON loyverse_products (item_name);
CREATE INDEX IF NOT EXISTS loyverse_products_price_idx         ON loyverse_products (price);

-- Distinct category names for the storefront filter. A plain SELECT DISTINCT from
-- the client would be capped by PostgREST's 1000-row limit once the catalog grows
-- past it, silently dropping categories; the view collapses the rows server side.
CREATE OR REPLACE VIEW loyverse_categories AS
SELECT DISTINCT category_name
FROM loyverse_products
WHERE category_name IS NOT NULL
ORDER BY category_name;

CREATE TABLE IF NOT EXISTS loyverse_sync_state (
  id             integer PRIMARY KEY DEFAULT 1,
  last_synced_at timestamptz,
  status         text DEFAULT 'idle',            -- idle | running | error
  started_at     timestamptz,
  item_count     integer,
  error          text,
  CONSTRAINT loyverse_sync_state_single_row CHECK (id = 1)
);

INSERT INTO loyverse_sync_state (id, status)
VALUES (1, 'idle')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE loyverse_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyverse_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read products" ON loyverse_products;
CREATE POLICY "Public can read products"
  ON loyverse_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can read sync state" ON loyverse_sync_state;
CREATE POLICY "Public can read sync state"
  ON loyverse_sync_state
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- The view runs with the privileges of its owner, so it must not become a way
-- around the table's RLS. security_invoker makes it honour the caller's policies.
ALTER VIEW loyverse_categories SET (security_invoker = true);
GRANT SELECT ON loyverse_categories TO anon, authenticated;
