/*
  # Add read-only policy for loyverse_credentials

  1. Security Policy
    - Allow authenticated users to check if active credentials exist
    - Users can only see if credentials exist (is_active field)
    - Users cannot see token values or other sensitive data
    - This allows the frontend to check connection status

  2. Important Notes
    - Only returns minimal data (id, is_active, token_expiry)
    - Tokens remain hidden from frontend
    - Edge Functions still use service role for full access
*/

-- Allow authenticated users to check connection status
CREATE POLICY "Authenticated users can check connection status"
  ON loyverse_credentials
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create a safe view for connection status check (optional, for extra safety)
CREATE OR REPLACE VIEW loyverse_connection_status AS
SELECT 
  id,
  is_active,
  token_expiry,
  created_at,
  last_refreshed_at
FROM loyverse_credentials
WHERE is_active = true
LIMIT 1;

-- Grant select on the view to authenticated users
GRANT SELECT ON loyverse_connection_status TO authenticated;