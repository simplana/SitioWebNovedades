/*
  # Add Servientrega Guide Fields to Orders and Create Credentials Table

  1. Changes to orders table
    - Add `guia_number` - Servientrega guide/tracking number
    - Add `guia_pdf_url` - URL to the generated guide PDF
    - Add `guia_created_at` - Timestamp when guide was created
    - Add `guia_created_by` - Admin user who created the guide

  2. New Tables
    - `servientrega_credentials`
      - `id` (uuid, primary key)
      - `username` (text) - Servientrega API username
      - `password` (text) - Servientrega API password (encrypted)
      - `nombre_remite` (text) - Sender name
      - `direccion_remite` (text) - Sender address
      - `distrito_remite` (text) - Sender district
      - `provincia_remite` (text) - Sender province
      - `telefono_remite` (text) - Sender phone
      - `is_active` (boolean) - Whether these credentials are active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on servientrega_credentials
    - Only admins can read/write credentials
*/

-- Add guide fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guia_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guia_pdf_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guia_created_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guia_created_by UUID REFERENCES auth.users(id);

-- Add index for quick guide lookups
CREATE INDEX IF NOT EXISTS idx_orders_guia_number ON orders(guia_number);

-- Create servientrega_credentials table
CREATE TABLE IF NOT EXISTS servientrega_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  nombre_remite TEXT NOT NULL,
  direccion_remite TEXT NOT NULL,
  distrito_remite TEXT NOT NULL,
  provincia_remite TEXT NOT NULL,
  telefono_remite TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create partial unique index to ensure only one active credential set
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_credentials
  ON servientrega_credentials (is_active)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE servientrega_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view credentials
CREATE POLICY "Admins can view servientrega credentials"
  ON servientrega_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only admins can insert credentials
CREATE POLICY "Admins can insert servientrega credentials"
  ON servientrega_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only admins can update credentials
CREATE POLICY "Admins can update servientrega credentials"
  ON servientrega_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Comments for documentation
COMMENT ON COLUMN orders.guia_number IS 'Servientrega guide/tracking number';
COMMENT ON COLUMN orders.guia_pdf_url IS 'URL to the generated Servientrega guide PDF';
COMMENT ON COLUMN orders.guia_created_at IS 'Timestamp when the guide was created';
COMMENT ON COLUMN orders.guia_created_by IS 'Admin user who created the guide';
COMMENT ON TABLE servientrega_credentials IS 'Servientrega API credentials and sender information';
