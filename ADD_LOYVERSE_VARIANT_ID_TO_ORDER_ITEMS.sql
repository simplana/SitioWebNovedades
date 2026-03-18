/*
  # Add Loyverse Variant ID to Order Items

  1. Changes
    - Add `loyverse_variant_id` column to `order_items` table
    - This column stores the Loyverse variant ID for inventory tracking
    - Allows the system to reduce stock in Loyverse after successful orders

  2. Notes
    - Column is optional (nullable) to support items that may not have Loyverse variants
    - No default value to avoid masking missing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'loyverse_variant_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN loyverse_variant_id text;
  END IF;
END $$;
