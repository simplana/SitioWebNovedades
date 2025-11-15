/*
  # Create Audit Logs Table for PCI DSS Compliance

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `event_type` (text) - Type of event being logged
      - `user_id` (uuid, nullable) - User who performed the action
      - `ip_address` (text, nullable) - IP address of the request
      - `user_agent` (text, nullable) - Browser/client user agent
      - `metadata` (jsonb) - Additional event details
      - `severity` (text) - Event severity level
      - `created_at` (timestamptz) - When the event occurred

  2. Security
    - Enable RLS on `audit_logs` table
    - Only admins can read audit logs
    - System can insert logs (via authenticated users)
    - No users can modify or delete logs (immutable)

  3. Indexes
    - Index on event_type for fast filtering
    - Index on user_id for user activity tracking
    - Index on created_at for time-based queries
    - Index on severity for filtering critical events

  4. Notes
    - Audit logs are immutable for compliance
    - Logs are retained for PCI DSS compliance (minimum 1 year)
    - Sensitive data is automatically sanitized before logging
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs (check by email in admin_users table)
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      JOIN auth.users ON auth.users.email = admin_users.email
      WHERE auth.users.id = auth.uid()
    )
  );

-- Policy: All authenticated users can insert logs (application logging)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No update or delete policies - logs are immutable

-- Add comments to table
COMMENT ON TABLE audit_logs IS 'PCI DSS compliant audit log table - immutable records of all security events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event: auth_login, payment_initiated, etc.';
COMMENT ON COLUMN audit_logs.severity IS 'Event severity: low, medium, high, critical';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional event details - sensitive data automatically sanitized';
