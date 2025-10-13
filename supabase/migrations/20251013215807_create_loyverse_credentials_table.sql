/*
  # Create Loyverse Credentials Storage Table

  1. New Tables
    - `loyverse_credentials`
      - `id` (uuid, primary key) - Unique identifier for each credential record
      - `access_token` (text, not null) - Loyverse OAuth access token
      - `refresh_token` (text, not null) - Loyverse OAuth refresh token
      - `token_expiry` (timestamptz, not null) - When the access token expires
      - `is_active` (boolean, default true) - Whether this credential set is currently active
      - `created_at` (timestamptz) - When the credential was created
      - `updated_at` (timestamptz) - When the credential was last updated
      - `last_refreshed_at` (timestamptz) - When the token was last refreshed
      
  2. Security
    - Enable RLS on `loyverse_credentials` table
    - Restrict all operations to service role only (no user access)
    - Add constraint to ensure only one active credential exists
    
  3. Important Notes
    - Only Edge Functions with service role access can read/write credentials
    - Frontend users cannot access this table directly
    - Tokens are stored in plaintext but protected by RLS and service role auth
    - Single active credential model (one Loyverse store connection)
*/

-- Create loyverse_credentials table
CREATE TABLE IF NOT EXISTS loyverse_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_refreshed_at timestamptz
);

-- Enable RLS (restrict to service role only)
ALTER TABLE loyverse_credentials ENABLE ROW LEVEL SECURITY;

-- No policies are created intentionally - only service role can access
-- This ensures tokens are never accessible to frontend users

-- Create index for performance on active credential lookup
CREATE INDEX IF NOT EXISTS idx_loyverse_credentials_active 
  ON loyverse_credentials(is_active) 
  WHERE is_active = true;

-- Create function to ensure only one active credential
CREATE OR REPLACE FUNCTION ensure_single_active_credential()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other credentials
    UPDATE loyverse_credentials 
    SET is_active = false, updated_at = now()
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce single active credential
DROP TRIGGER IF EXISTS ensure_single_active_credential_trigger ON loyverse_credentials;
CREATE TRIGGER ensure_single_active_credential_trigger
  BEFORE INSERT OR UPDATE ON loyverse_credentials
  FOR EACH ROW 
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_credential();

-- Create function to get active credentials (for Edge Functions)
CREATE OR REPLACE FUNCTION get_active_loyverse_credentials()
RETURNS TABLE (
  id uuid,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  last_refreshed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lc.id,
    lc.access_token,
    lc.refresh_token,
    lc.token_expiry,
    lc.last_refreshed_at
  FROM loyverse_credentials lc
  WHERE lc.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;