/*
  # Fix RLS policies for loyverse_credentials

  1. Changes
    - Add policy to allow service role to insert credentials
    - Add policy to allow service role to update credentials
    - Service role bypasses RLS by default, but explicit policies ensure proper access
  
  2. Security
    - Only service role (used by Edge Functions) can insert/update
    - Authenticated users can only read
    - No client-side write access
*/

-- Allow service role to insert credentials (used during OAuth flow)
CREATE POLICY "Service role can insert credentials"
  ON loyverse_credentials
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update credentials (used during token refresh)
CREATE POLICY "Service role can update credentials"
  ON loyverse_credentials
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);