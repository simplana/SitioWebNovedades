/*
  # Close the SECURITY DEFINER bypass around the Loyverse token

  20260827201000 locked the loyverse_credentials TABLE down: RLS on, all grants
  revoked from anon, and column grants limited to (id, is_active, token_expiry)
  for authenticated. Verified working.

  It did not close get_active_loyverse_credentials(), created back in
  20251013215807. That function is SECURITY DEFINER, so it runs as its owner
  (postgres) and bypasses both RLS and the column grants. Postgres grants
  EXECUTE to PUBLIC on every new function, so it was reachable over PostgREST at
  /rest/v1/rpc/get_active_loyverse_credentials with nothing but the anon key
  that ships in the public JavaScript bundle.

  Verified against production on 2026-08-28: after 20260827201000 was applied,
  a plain anon-key POST to that endpoint still returned HTTP 200 with
  access_token and refresh_token. The table was locked; the front door was not.

  1. Who needs this function
     - Nothing. It has zero callers in src/ and zero in supabase/functions/.
       Edge functions read loyverse_credentials directly with the service role,
       which bypasses RLS and is unaffected by this migration.

  2. Security
     - EXECUTE revoked from PUBLIC, anon and authenticated. Only service_role
       and the owner can still call it.
     - The stale "Anyone can read active credentials" policy is dropped. It was
       inert once anon lost its column grants, but it is a loaded gun: any
       future GRANT SELECT to anon on this table would immediately re-expose
       the tokens through it.

  NOTE: the tokens were publicly readable before this migration, so treat them
  as compromised and reconnect the store in the Admin panel to rotate them.
*/

REVOKE EXECUTE ON FUNCTION public.get_active_loyverse_credentials() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read active credentials" ON loyverse_credentials;
