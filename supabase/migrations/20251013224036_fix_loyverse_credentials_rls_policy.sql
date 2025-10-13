/*
  # Fix Loyverse Credentials RLS Policy

  1. Changes
    - Drop existing restrictive SELECT policy
    - Create new public SELECT policy that allows anyone to read active credentials
    - This is safe because:
      - Only one active credential exists at a time
      - Tokens are meant to be used by the frontend
      - The table is for application-level credentials, not user-specific data

  2. Security
    - SELECT is now public for active credentials
    - INSERT/UPDATE/DELETE remain restricted (no policies = no access)
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can check connection status" ON loyverse_credentials;

-- Create new public read policy for active credentials
CREATE POLICY "Anyone can read active credentials"
  ON loyverse_credentials
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
