# Deployment Instructions: Loyverse Inventory Sync

This document explains how to deploy the automatic inventory synchronization system with Loyverse.

## Overview

The system automatically reduces inventory in Loyverse when a payment is confirmed. It consists of:

1. **Database Table**: `inventory_adjustments` - Audit log for all inventory changes
2. **Edge Function**: `loyverse-update-inventory` - Processes inventory reductions
3. **Modified Function**: `paguelo-facil-validate-payment` - Triggers inventory sync on payment approval

## Step 1: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the inventory_adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity_adjusted integer NOT NULL CHECK (quantity_adjusted > 0),
  loyverse_response jsonb,
  adjustment_status text NOT NULL DEFAULT 'pending' CHECK (adjustment_status IN ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Policy for service role (unrestricted access for Edge Functions)
CREATE POLICY "Service role has full access to inventory adjustments"
  ON inventory_adjustments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to view adjustments (read-only for admins)
CREATE POLICY "Authenticated users can view inventory adjustments"
  ON inventory_adjustments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_order_id
  ON inventory_adjustments(order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_order_number
  ON inventory_adjustments(order_number);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_status
  ON inventory_adjustments(adjustment_status);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at
  ON inventory_adjustments(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_inventory_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_adjustments_updated_at ON inventory_adjustments;

CREATE TRIGGER trigger_update_inventory_adjustments_updated_at
  BEFORE UPDATE ON inventory_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_adjustments_updated_at();
```

## Step 2: Deploy Edge Functions

### Option A: Using Supabase CLI

If you have Supabase CLI installed and logged in:

```bash
# Deploy the new inventory update function
supabase functions deploy loyverse-update-inventory --no-verify-jwt

# Redeploy the updated payment validation function
supabase functions deploy paguelo-facil-validate-payment --no-verify-jwt
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Create a new function named `loyverse-update-inventory`
4. Copy the contents from `supabase/functions/loyverse-update-inventory/index.ts`
5. Set verify JWT to `false`
6. Deploy the function
7. Update the existing `paguelo-facil-validate-payment` function with the new code
8. Redeploy `paguelo-facil-validate-payment`

## How It Works

### Flow Diagram

```
Payment Completed in Páguelo Fácil
         ↓
User redirected to /payment-success
         ↓
Frontend calls paguelo-facil-validate-payment
         ↓
Validate payment with Páguelo Fácil API
         ↓
Payment approved? → Update order status to "processing"
         ↓
Automatically call loyverse-update-inventory
         ↓
For each product in order:
  - Reduce quantity in Loyverse
  - Log adjustment in inventory_adjustments table
         ↓
Return success to frontend
         ↓
Show confirmation to customer
```

### Key Features

1. **Non-Blocking**: If inventory update fails, payment confirmation still succeeds
2. **Retry Logic**: Automatically retries on rate limits (HTTP 429)
3. **Complete Audit Trail**: Every adjustment logged in database
4. **Error Handling**: Individual product failures don't stop other products
5. **Timeout Protection**: 10-second timeout per API call

### Verification

After deployment, you can verify the system by:

1. **Check the table exists**:
   ```sql
   SELECT * FROM inventory_adjustments LIMIT 1;
   ```

2. **Test a payment flow** (in sandbox mode)
3. **Check the logs**:
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for messages from `loyverse-update-inventory`

4. **Verify inventory adjustments**:
   ```sql
   SELECT
     order_number,
     product_name,
     quantity_adjusted,
     adjustment_status,
     error_message,
     created_at
   FROM inventory_adjustments
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## Troubleshooting

### No Loyverse credentials found
- Ensure you have connected your Loyverse account in the Admin panel
- Check that `is_active = true` in the `loyverse_credentials` table

### Token expired errors
- The system should auto-refresh tokens, but if you see persistent 401 errors, reconnect Loyverse

### Product variant not found (404)
- The `product_id` in `order_items` must match the `variant_id` in Loyverse
- Verify your products are properly synced

### Adjustments showing as "failed"
- Check the `error_message` column in `inventory_adjustments`
- Review Edge Function logs for detailed error information

## Monitoring

To monitor inventory sync health:

```sql
-- Recent adjustments summary
SELECT
  adjustment_status,
  COUNT(*) as count,
  COUNT(DISTINCT order_number) as orders
FROM inventory_adjustments
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY adjustment_status;

-- Failed adjustments needing attention
SELECT
  order_number,
  product_name,
  error_message,
  created_at
FROM inventory_adjustments
WHERE adjustment_status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Security Notes

- The `loyverse-update-inventory` function uses service role key (full access)
- Only callable from other Edge Functions (not directly from frontend)
- All adjustments are logged for compliance and auditing
- RLS policies restrict viewing to authenticated admins only
