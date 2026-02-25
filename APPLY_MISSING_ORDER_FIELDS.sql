/*
  # Add Missing Order Fields - MANUAL MIGRATION

  INSTRUCTIONS:
  Copy this entire SQL script and run it in your Supabase Dashboard > SQL Editor

  ## Overview
  This migration adds all missing columns to the orders table that are used in the application
  but were never properly migrated. These include payment fields, shipping fields, and
  Servientrega guide fields.

  ## New Columns Added to orders table

  ### Payment Fields
  - `order_number` (text) - Unique order number in format NC-timestamp
  - `payment_method` (text) - Payment method: transfer, paguelo_facil, cash
  - `payment_code` (text) - Páguelo Fácil transaction code
  - `payment_id` (text) - Páguelo Fácil payment ID
  - `payment_url` (text) - Páguelo Fácil payment URL
  - `payment_status` (text) - Payment status: pending, completed, failed, cancelled

  ### Shipping Fields
  - `shipping_cost` (decimal) - Calculated shipping cost
  - `shipping_details` (jsonb) - Detailed shipping info from Servientrega
  - `shipping_description` (text) - Human-readable shipping description

  ### Servientrega Guide Fields
  - `guia_number` (text) - Servientrega guide/tracking number
  - `guia_pdf_url` (text) - URL to generated guide PDF
  - `guia_created_at` (timestamptz) - When guide was created
  - `guia_created_by` (uuid) - Admin user who created the guide

  ## New Tables

  ### servientrega_credentials
  Stores Servientrega API credentials and sender information (admin-only access)
*/

-- ============================================================================
-- ADD PAYMENT FIELDS TO ORDERS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_code TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT;
  END IF;
END $$;

-- ============================================================================
-- ADD SHIPPING FIELDS TO ORDERS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_details'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_details JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_description'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_description TEXT;
  END IF;
END $$;

-- ============================================================================
-- ADD SERVIENTREGA GUIDE FIELDS TO ORDERS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guia_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN guia_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guia_pdf_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN guia_pdf_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guia_created_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN guia_created_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'guia_created_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN guia_created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_guia_number ON orders(guia_number);

-- ============================================================================
-- ADD CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled') OR payment_status IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('transfer', 'paguelo_facil', 'cash') OR payment_method IS NULL);
  END IF;
END $$;

-- ============================================================================
-- CREATE SERVIENTREGA_CREDENTIALS TABLE
-- ============================================================================

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'servientrega_credentials' AND policyname = 'Admins can view servientrega credentials'
  ) THEN
    CREATE POLICY "Admins can view servientrega credentials"
      ON servientrega_credentials FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

-- Only admins can insert credentials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'servientrega_credentials' AND policyname = 'Admins can insert servientrega credentials'
  ) THEN
    CREATE POLICY "Admins can insert servientrega credentials"
      ON servientrega_credentials FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

-- Only admins can update credentials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'servientrega_credentials' AND policyname = 'Admins can update servientrega credentials'
  ) THEN
    CREATE POLICY "Admins can update servientrega credentials"
      ON servientrega_credentials FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMN COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN orders.order_number IS 'Unique order number in format NC-timestamp';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: transfer, paguelo_facil, cash';
COMMENT ON COLUMN orders.payment_code IS 'Páguelo Fácil transaction code';
COMMENT ON COLUMN orders.payment_id IS 'Páguelo Fácil payment ID';
COMMENT ON COLUMN orders.payment_url IS 'Páguelo Fácil checkout URL';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN orders.shipping_cost IS 'Calculated shipping cost from carrier';
COMMENT ON COLUMN orders.shipping_details IS 'Full shipping calculation details (JSON)';
COMMENT ON COLUMN orders.shipping_description IS 'Human-readable shipping description';
COMMENT ON COLUMN orders.guia_number IS 'Servientrega guide/tracking number';
COMMENT ON COLUMN orders.guia_pdf_url IS 'URL to generated Servientrega guide PDF';
COMMENT ON COLUMN orders.guia_created_at IS 'Timestamp when guide was created';
COMMENT ON COLUMN orders.guia_created_by IS 'Admin user who created the guide';
COMMENT ON TABLE servientrega_credentials IS 'Servientrega API credentials and sender information (admin-only)';

-- ============================================================================
-- RELOAD SCHEMA CACHE
-- ============================================================================

NOTIFY pgrst, 'reload schema';