/*
  # Add Shipping Fields to Orders Table

  ## Changes Made
  1. New Columns
    - `shipping_cost` (decimal) - Stores the calculated shipping cost for the order
    - `shipping_details` (jsonb) - Stores detailed shipping information from Servientrega (weight, dimensions, carrier info)

  ## Purpose
  These columns separate the shipping cost from the product total, providing:
  - Clear breakdown of order costs (products vs shipping)
  - Ability to track and audit shipping charges
  - Storage of complete shipping metadata for reference and troubleshooting

  ## Notes
  - shipping_cost defaults to 0 for backward compatibility
  - shipping_details is nullable to support orders without shipping calculation
  - These fields work with the existing orders table structure
  - The `total` column will now represent: product_total + shipping_cost
*/

-- Add shipping_cost column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

-- Add shipping_details column to store Servientrega response data
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_details JSONB;

-- Add comments for documentation
COMMENT ON COLUMN orders.shipping_cost IS 'Calculated shipping cost from Servientrega or other carrier';
COMMENT ON COLUMN orders.shipping_details IS 'Full shipping calculation details including weight, dimensions, and carrier information';
