/*
  # Create quote requests system for restauraciones

  1. New Tables
    - `quote_requests`
      - `id` (uuid, primary key)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `customer_email` (text, optional)
      - `description` (text)
      - `photos` (text array, optional)
      - `status` (text)
      - `estimated_price` (decimal, optional)
      - `estimated_days` (integer, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Allow public to create quote requests
    - Only authenticated users can view all requests (for admin)
*/

-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  description text NOT NULL,
  photos text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'approved', 'completed', 'cancelled')),
  estimated_price decimal(10,2),
  estimated_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create quote requests (for public form)
CREATE POLICY "Anyone can create quote requests"
  ON quote_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view all quote requests (for admin panel)
CREATE POLICY "Authenticated users can view all quote requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update quote requests (for admin panel)
CREATE POLICY "Authenticated users can update quote requests"
  ON quote_requests
  FOR UPDATE
  TO authenticated
  USING (true);