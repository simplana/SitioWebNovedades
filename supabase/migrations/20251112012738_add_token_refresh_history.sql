/*
  # Add Token Refresh History Tracking

  1. New Tables
    - `loyverse_token_refresh_history`
      - `id` (uuid, primary key)
      - `credential_id` (uuid, foreign key) - Reference to loyverse_credentials
      - `refresh_status` (text) - 'SUCCESS' or 'FAILED'
      - `old_token_expiry` (timestamptz) - Previous expiration time
      - `new_token_expiry` (timestamptz, nullable) - New expiration time (null if failed)
      - `refresh_reason` (text) - Why the refresh occurred
      - `error_message` (text, nullable) - Error details if failed
      - `created_at` (timestamptz) - When the refresh attempt occurred
  
  2. Security
    - Enable RLS on refresh history table
    - No direct client access (only via Edge Functions with service role)
  
  3. Important Notes
    - Tracks all token refresh attempts (both successful and failed)
    - Helps diagnose OAuth issues
    - Limited to last 100 entries per credential (via trigger)
*/

-- Create token refresh history table
CREATE TABLE IF NOT EXISTS loyverse_token_refresh_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid REFERENCES loyverse_credentials(id) ON DELETE CASCADE,
  refresh_status text NOT NULL CHECK (refresh_status IN ('SUCCESS', 'FAILED')),
  old_token_expiry timestamptz NOT NULL,
  new_token_expiry timestamptz,
  refresh_reason text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (restrict to service role only)
ALTER TABLE loyverse_token_refresh_history ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_token_refresh_history_credential 
  ON loyverse_token_refresh_history(credential_id, created_at DESC);

-- Function to limit history entries to last 100 per credential
CREATE OR REPLACE FUNCTION limit_refresh_history()
RETURNS trigger AS $$
BEGIN
  DELETE FROM loyverse_token_refresh_history
  WHERE credential_id = NEW.credential_id
  AND id NOT IN (
    SELECT id FROM loyverse_token_refresh_history
    WHERE credential_id = NEW.credential_id
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce history limit
DROP TRIGGER IF EXISTS limit_refresh_history_trigger ON loyverse_token_refresh_history;
CREATE TRIGGER limit_refresh_history_trigger
  AFTER INSERT ON loyverse_token_refresh_history
  FOR EACH ROW
  EXECUTE FUNCTION limit_refresh_history();