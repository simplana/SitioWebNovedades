/*
  # Stop the Loyverse access token being readable from the public site

  20251109061449_disable_rls_for_loyverse_credentials.sql turned RLS off on this
  table, reasoning that "no direct client access to credentials" occurs. That is
  not the case: src/hooks/useOAuth2.ts queries the table straight from the
  browser, so with RLS off the anon key -- which ships inside the public
  JavaScript bundle -- can SELECT access_token and refresh_token. Anyone loading
  the storefront can read them and call the Loyverse API as this store.
  (Verified against production before writing this migration.)

  Fix: RLS back on, and column-level grants so the browser reaches only the three
  non-secret columns it actually uses.

  1. Who needs what
     - Edge functions   service_role, bypasses RLS entirely -- unaffected.
                        The OAuth upsert in loyverse-public-oauth already uses
                        SUPABASE_SERVICE_ROLE_KEY, so connecting still works.
     - Admin panel      reads (id, is_active, token_expiry) and sets
                        is_active = false to disconnect. Never reads a token.
     - anon             nothing at all.

  2. Security
     - access_token and refresh_token become unreachable over PostgREST for
       every non-service role, regardless of any policy.
     - Column privileges, not the RLS policy, are what protect the tokens here:
       RLS filters rows, GRANT filters columns, and it is the columns that matter.
*/

ALTER TABLE loyverse_credentials ENABLE ROW LEVEL SECURITY;

-- Clear whatever the table is carrying, including the implicit grants that made
-- every column readable while RLS was off.
REVOKE ALL ON loyverse_credentials FROM anon, authenticated;

-- The only three columns the admin panel reads, and the only one it writes.
GRANT SELECT (id, is_active, token_expiry) ON loyverse_credentials TO authenticated;
GRANT UPDATE (is_active)                   ON loyverse_credentials TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can read credentials" ON loyverse_credentials;
DROP POLICY IF EXISTS "Service role can insert credentials"      ON loyverse_credentials;
DROP POLICY IF EXISTS "Service role can update credentials"      ON loyverse_credentials;
DROP POLICY IF EXISTS "Signed-in users can read connection status" ON loyverse_credentials;
DROP POLICY IF EXISTS "Signed-in users can disconnect"             ON loyverse_credentials;

-- Row access is deliberately plain `authenticated` rather than an admin_users
-- lookup: the tokens are already unreachable via the column grants above, and
-- what remains ("is the store connected, when does the token expire") is not
-- worth risking a lockout of the admin panel over. Tighten to an admin_users
-- check later if wanted.
CREATE POLICY "Signed-in users can read connection status"
  ON loyverse_credentials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Signed-in users can disconnect"
  ON loyverse_credentials
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
