/*
  # Create Servientrega Integration Tables

  1. New Tables
    - `shipping_rates`
      - `id` (uuid, primary key)
      - `zone` (text) - 'urbano', 'nacional', 'especial'
      - `base_cost` (decimal) - Base cost up to 5kg
      - `additional_cost_per_kg` (decimal) - Cost per additional kg
      - `estimated_delivery_hours_min` (integer) - Minimum delivery hours
      - `estimated_delivery_hours_max` (integer) - Maximum delivery hours
      - `delivery_description` (text) - Description of delivery route
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `shipments`
      - `id` (uuid, primary key)
      - `order_id` (text) - Reference to order
      - `user_id` (uuid) - Reference to auth.users
      - `package_number` (integer) - Package number if multiple packages
      - `tracking_number` (text) - Servientrega tracking number
      - `guia_number` (text) - Servientrega guide number
      - `status` (text) - Current status
      - `origin_address` (text)
      - `destination_address` (text)
      - `destination_province` (text)
      - `destination_distrito` (text)
      - `destination_corregimiento` (text)
      - `recipient_name` (text)
      - `recipient_phone` (text)
      - `recipient_email` (text)
      - `weight_kg` (decimal)
      - `declared_value` (decimal)
      - `shipping_cost` (decimal)
      - `shipping_zone` (text)
      - `estimated_delivery_date` (date)
      - `actual_delivery_date` (date)
      - `servientrega_response` (jsonb) - Full API response
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `tracking_events`
      - `id` (uuid, primary key)
      - `shipment_id` (uuid) - Reference to shipments
      - `tracking_number` (text)
      - `event_date` (timestamptz)
      - `event_code` (text)
      - `event_description` (text)
      - `location` (text)
      - `responsible` (text)
      - `observations` (text)
      - `created_at` (timestamptz)

    - `products_metadata`
      - `id` (uuid, primary key)
      - `product_id` (text) - Loyverse product ID
      - `variant_id` (text) - Loyverse variant ID
      - `weight_kg` (decimal)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid) - Admin user who updated

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for admin users

  3. Initial Data
    - Insert shipping rates for three zones
*/

-- Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone text NOT NULL UNIQUE CHECK (zone IN ('urbano', 'nacional', 'especial')),
  base_cost decimal(10,2) NOT NULL DEFAULT 0,
  additional_cost_per_kg decimal(10,2) NOT NULL DEFAULT 0,
  estimated_delivery_hours_min integer NOT NULL DEFAULT 24,
  estimated_delivery_hours_max integer NOT NULL DEFAULT 24,
  delivery_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  package_number integer NOT NULL DEFAULT 1,
  tracking_number text UNIQUE,
  guia_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
  origin_address text NOT NULL,
  destination_address text NOT NULL,
  destination_province text NOT NULL,
  destination_distrito text,
  destination_corregimiento text,
  recipient_name text,
  recipient_phone text,
  recipient_email text,
  weight_kg decimal(10,2) NOT NULL,
  declared_value decimal(10,2) NOT NULL,
  shipping_cost decimal(10,2) NOT NULL,
  shipping_zone text NOT NULL,
  estimated_delivery_date date,
  actual_delivery_date date,
  servientrega_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  event_date timestamptz NOT NULL,
  event_code text NOT NULL,
  event_description text NOT NULL,
  location text,
  responsible text,
  observations text,
  created_at timestamptz DEFAULT now()
);

-- Create products_metadata table
CREATE TABLE IF NOT EXISTS products_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  variant_id text,
  weight_kg decimal(10,2) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(product_id, variant_id)
);

-- Insert initial shipping rates
INSERT INTO shipping_rates (zone, base_cost, additional_cost_per_kg, estimated_delivery_hours_min, estimated_delivery_hours_max, delivery_description)
VALUES 
  ('urbano', 3.90, 0.40, 24, 24, 'Recolección en Panamá sin que el envío cruce a otra provincia, para recolecciones en Panamá comprende desde las 24 de diciembre hasta el puente de las Américas'),
  ('nacional', 4.90, 0.55, 48, 48, 'Cuando el envío cruza a otra provincia'),
  ('especial', 7.97, 0.90, 72, 120, 'Zonas Rojas en Panamá y trayectos lejanos (Bocas del Toro, Darién, Samaría, Cherrillo, Curundú, Costa arriba, costa baja de Colón). Según matriz de destino')
ON CONFLICT (zone) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_metadata ENABLE ROW LEVEL SECURITY;

-- Policies for shipping_rates (public read, admin write)
CREATE POLICY "Anyone can view shipping rates"
  ON shipping_rates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify shipping rates"
  ON shipping_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policies for shipments
CREATE POLICY "Users can view own shipments"
  ON shipments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all shipments"
  ON shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can insert shipments"
  ON shipments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can update shipments"
  ON shipments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policies for tracking_events
CREATE POLICY "Users can view tracking for own shipments"
  ON tracking_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = tracking_events.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all tracking events"
  ON tracking_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert tracking events"
  ON tracking_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for products_metadata
CREATE POLICY "Anyone can view product metadata"
  ON products_metadata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage product metadata"
  ON products_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_number ON tracking_events(tracking_number);
CREATE INDEX IF NOT EXISTS idx_products_metadata_product_id ON products_metadata(product_id);
CREATE INDEX IF NOT EXISTS idx_products_metadata_variant_id ON products_metadata(variant_id);