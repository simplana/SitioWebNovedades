# Paguelo Facil Integration Setup Guide

This guide will help you configure Paguelo Facil payment gateway using the Payment Link (Enlace de Pago) method.

## Overview

The integration uses Paguelo Facil's secure payment link method where:
1. Your server creates a payment link via Edge Function
2. Customer is redirected to Paguelo Facil's secure checkout
3. Paguelo Facil processes the payment
4. Webhook notifies your server of the payment result
5. Customer returns to your success/cancel page

## Prerequisites

- A Paguelo Facil merchant account
- Access to Supabase Dashboard
- Your CCLW (merchant code) from Paguelo Facil

## Step 1: Get Your Credentials

### Sandbox (Testing)
1. Register for a sandbox account at https://sandbox.paguelofacil.com
2. Log in to the merchant dashboard
3. Navigate to Settings > API Keys
4. Copy your **CCLW** (Código de Comercio Web)

### Production
1. Log in to https://secure.paguelofacil.com
2. Navigate to Settings > API Keys
3. Copy your **CCLW** (Código de Comercio Web)

## Step 2: Configure Environment Variables

Add these variables to your Supabase Edge Functions:

1. Go to Supabase Dashboard
2. Navigate to Edge Functions > Settings
3. Add the following environment variables:

```
PAGUELO_FACIL_CCLW=your-cclw-code-here
PAGUELO_FACIL_ENVIRONMENT=sandbox
```

**Important Notes:**
- Start with `sandbox` environment for testing
- Change to `production` when ready to go live
- NEVER use `VITE_` prefix for these variables (they are backend-only)
- NEVER commit these values to git

## Step 3: Configure Webhook URL

Configure Paguelo Facil to send payment notifications to your webhook:

1. Log in to Paguelo Facil dashboard
2. Go to Settings > Webhooks
3. Add your webhook URL:
   ```
   https://your-project.supabase.co/functions/v1/paguelo-facil-webhook
   ```
4. Save the configuration

## Step 4: Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add payment fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_metadata'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders ON DELETE CASCADE NOT NULL,
  payment_code text,
  payment_id text,
  status text NOT NULL DEFAULT 'pending',
  amount decimal(10,2) NOT NULL,
  payment_type text,
  customer_email text,
  customer_name text,
  transaction_date date,
  transaction_time time,
  approval_reason text,
  raw_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_code ON payment_transactions(payment_code);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_code ON orders(payment_code);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.user_id = auth.uid()
    )
  );
```

## Step 5: Deploy Edge Functions

Deploy the updated Edge Functions:

```bash
# Deploy create payment function
supabase functions deploy paguelo-facil-create-payment

# Deploy webhook function
supabase functions deploy paguelo-facil-webhook
```

## Step 6: Testing with Sandbox

Use these test cards for sandbox testing:

### VISA (Approved)
- Card: 4059310181757001
- CVV: Any 3 digits
- Expiry: Any future date

### MasterCard (Approved)
- Card: 5517747952039692
- CVV: Any 3 digits
- Expiry: Any future date

### CLAVE (Approved)
- Card: 6394240621480747
- CVV: 570
- PIN: 0482
- Expiry: 04/24

### Test Expired Card
- Card: 5038460000000035
- CVV: 490
- PIN: 1234
- Expiry: 04/21

## Payment Flow

1. **User initiates payment:**
   - Fills checkout form
   - Selects "Paguelo Fácil" payment method
   - Clicks "Complete Order"

2. **Payment link creation:**
   - Edge Function `paguelo-facil-create-payment` is called
   - Receives order details (amount, customer info, items)
   - Calls Paguelo Facil LinkDeamon.cfm endpoint
   - Returns payment URL (format: https://checkout.paguelofacil.com?code=LK-XXXXXX)

3. **User redirected to Paguelo Facil:**
   - User completes payment on Paguelo Facil's secure platform
   - Can pay with VISA, MasterCard, CLAVE, Cash, Nequi, Crypto

4. **Webhook notification:**
   - Paguelo Facil sends payment result to webhook
   - Webhook updates order status in database
   - Creates transaction record for auditing

5. **User returns:**
   - Redirected to success or cancel page
   - Order status shown with payment details

## Response Parameters

### Successful Payment (Approved)
```
TotalPagado: "10.50"
Fecha: "07/01/2026"
Hora: "14:30:25"
Tipo: "VISA"
Oper: "LK-ABCDEF123456"
Usuario: "John Doe"
Email: "customer@example.com"
Estado: "Aprobada"
PARM_1: "ORD-1234567890"
```

### Failed Payment (Denied)
```
TotalPagado: "0"
Estado: "Denegada"
Razon: "Fondos insuficientes"
```

## Security Notes

1. **CCLW Protection:**
   - Never expose CCLW in frontend code
   - Only use in Edge Functions
   - Rotate periodically for security

2. **Webhook Validation:**
   - Webhook validates payment data
   - Checks order exists before updating
   - Logs all transactions for audit trail

3. **Data Privacy:**
   - No credit card data stored in your database
   - Paguelo Facil handles all sensitive payment info
   - PCI DSS compliance handled by Paguelo Facil

## Troubleshooting

### Error: "Payment service not configured"
- Check PAGUELO_FACIL_CCLW is set in Supabase Dashboard
- Verify environment variable name is exact (no typos)

### Error: "Invalid response from Paguelo Fácil"
- Check PAGUELO_FACIL_ENVIRONMENT is set correctly
- Verify CCLW matches the environment (sandbox vs production)
- Check API endpoint is accessible

### Webhook not receiving notifications
- Verify webhook URL is configured in Paguelo Facil dashboard
- Check Edge Function logs for errors
- Ensure webhook URL is publicly accessible

### Payment link expires
- Default expiration is 3600 seconds (1 hour)
- User must complete payment within this time
- Generate new link for expired payments

## Going to Production

When ready for production:

1. Get production CCLW from Paguelo Facil
2. Update environment variable:
   ```
   PAGUELO_FACIL_CCLW=your-production-cclw
   PAGUELO_FACIL_ENVIRONMENT=production
   ```
3. Update webhook URL in Paguelo Facil dashboard
4. Test with small real transaction
5. Monitor logs and transactions

## Support

- Paguelo Facil Documentation: https://developers.paguelofacil.com
- Paguelo Facil Support: soporte@paguelofacil.com
- Technical Issues: Check Edge Function logs in Supabase Dashboard
