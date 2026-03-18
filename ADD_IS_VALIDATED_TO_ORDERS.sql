/*
  # Add is_validated column to orders table

  1. Changes
    - Add `is_validated` boolean column to `orders` table
      - Defaults to `false`
      - Prevents duplicate payment validations on page refresh
      - Once set to `true`, payment is considered already validated

  2. Purpose
    - Avoid re-running payment validation logic on page refresh
    - Prevent duplicate stock reductions
    - Ensure idempotent payment processing
*/

-- Add is_validated column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_validated'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_validated boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_is_validated ON orders(is_validated);

-- Set existing completed orders as validated
UPDATE orders
SET is_validated = true
WHERE payment_status = 'completed'
  AND is_validated = false;
