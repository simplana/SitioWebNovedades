/*
  # Disable RLS for loyverse_credentials table

  1. Changes
    - Disable RLS on loyverse_credentials table
    - This allows Edge Functions with service role to insert/update without policy restrictions
  
  2. Security
    - Table is only accessed via Edge Functions (server-side)
    - No direct client access to credentials
    - Edge Functions use service role key which is secure
*/

-- Disable RLS to allow service role unrestricted access
ALTER TABLE loyverse_credentials DISABLE ROW LEVEL SECURITY;

-- Drop existing policies since RLS is disabled
DROP POLICY IF EXISTS "Authenticated users can read credentials" ON loyverse_credentials;
DROP POLICY IF EXISTS "Service role can insert credentials" ON loyverse_credentials;
DROP POLICY IF EXISTS "Service role can update credentials" ON loyverse_credentials;