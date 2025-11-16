# Supabase Edge Functions - Payment Integration

This directory contains secure backend functions for payment processing with Paguelo Fácil.

## Architecture

The payment integration follows a **zero-trust security model** where NO payment credentials are exposed to the frontend:

```
Frontend → Supabase Edge Functions → Paguelo Fácil API
```

## Functions

### 1. paguelo-facil-create-payment

Creates a new payment with Paguelo Fácil.

**Endpoint:** `POST /functions/v1/paguelo-facil-create-payment`

**Request Body:**
```json
{
  "id": "ORDER-123",
  "amount": 29.99,
  "currency": "USD",
  "description": "Order description",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+507 6000-0000"
  },
  "items": [
    {
      "name": "Product Name",
      "quantity": 1,
      "price": 29.99,
      "sku": "SKU-001"
    }
  ],
  "redirectUrls": {
    "success": "https://yoursite.com/payment/success",
    "cancel": "https://yoursite.com/payment/cancel",
    "notify": "https://yourproject.supabase.co/functions/v1/paguelo-facil-webhook"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "pf_abc123",
  "paymentUrl": "https://checkout.paguelofacil.com/pay/abc123",
  "message": "Payment created successfully"
}
```

### 2. paguelo-facil-get-status

Retrieves the status of a payment.

**Endpoint:** `POST /functions/v1/paguelo-facil-get-status`

**Request Body:**
```json
{
  "paymentId": "pf_abc123"
}
```

**Response:**
```json
{
  "paymentId": "pf_abc123",
  "status": "completed",
  "amount": 29.99,
  "currency": "USD",
  "transactionId": "txn_xyz789",
  "paidAt": "2025-11-16T12:00:00Z"
}
```

### 3. paguelo-facil-webhook

Receives webhook notifications from Paguelo Fácil.

**Endpoint:** `POST /functions/v1/paguelo-facil-webhook`

**Usage:** Configure this URL in your Paguelo Fácil dashboard as the webhook endpoint.

**Security Note:**
- ⚠️ **TODO**: Webhook signature validation needs to be implemented when Paguelo Fácil provides official documentation
- Currently accepting webhooks in backend only (no frontend exposure)
- Future implementation will use `PAGUELO_FACIL_WEBHOOK_SECRET` environment variable for HMAC signature validation

## Environment Variables

These functions require the following environment variables to be configured in **Supabase Dashboard**:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PAGUELO_FACIL_ACCESS_TOKEN` | Your Paguelo Fácil API token (secret) | `your-secret-token` |
| `PAGUELO_FACIL_API_URL` | Paguelo Fácil API URL | `https://api.paguelofacil.com` |
| `PAGUELO_FACIL_WEBHOOK_SECRET` | Webhook signature secret (future use) | `your-webhook-secret` |
| `ALLOWED_ORIGIN` | Allowed CORS origin (production domain) | `https://novedadescatolicas.com` |

### Auto-Configured Variables

These are automatically available in all Supabase Edge Functions:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `SUPABASE_ANON_KEY` - Anonymous key

## Configuration Steps

### 1. Configure Environment Variables

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → **Settings**
4. Add the following environment variables:

```bash
PAGUELO_FACIL_ACCESS_TOKEN=your-secret-token-here
PAGUELO_FACIL_API_URL=https://api.paguelofacil.com
```

5. Click **Save**

### 2. Deploy Functions

Deploy all three functions using the Supabase CLI or the MCP tools:

```bash
# If using Supabase CLI (not available in this project)
# supabase functions deploy paguelo-facil-create-payment
# supabase functions deploy paguelo-facil-get-status
# supabase functions deploy paguelo-facil-webhook
```

Or use the Claude Code MCP tools to deploy them.

### 3. Configure Webhook in Paguelo Fácil

1. Log in to your Paguelo Fácil dashboard
2. Go to **Settings** → **Webhooks**
3. Add a new webhook URL:
   ```
   https://[your-project-ref].supabase.co/functions/v1/paguelo-facil-webhook
   ```
4. Select events to receive (e.g., `payment.completed`, `payment.failed`)
5. Save the configuration

## Security Features

### ✅ What We Do

- **Server-Side Secrets**: All payment credentials stored in backend only
- **Request Validation**: Validate all incoming requests
- **Data Sanitization**: Sanitize all sensitive data before logging
- **Audit Logging**: Log all payment events to `audit_logs` table
- **CORS Protection**: Proper CORS headers configured
- **Error Handling**: Comprehensive error handling and logging

### ❌ What We Don't Do

- **NO Secrets in Frontend**: Zero payment credentials in client code
- **NO Card Data**: Never handle or store card information
- **NO Logging Sensitive Data**: Tokens and credentials never logged
- **NO Direct API Access**: Frontend never calls payment API directly

## Testing

### Test in Development

```typescript
// Frontend code example
import { pagueloFacilService } from './services/pagueloFacilService';

const paymentData = {
  id: 'TEST-ORDER-123',
  amount: 1.00,
  currency: 'USD',
  description: 'Test payment',
  customer: {
    name: 'Test Customer',
    email: 'test@example.com'
  },
  items: [{
    name: 'Test Product',
    quantity: 1,
    price: 1.00
  }],
  redirectUrls: {
    success: window.location.origin + '/payment/success',
    cancel: window.location.origin + '/payment/cancel',
    notify: import.meta.env.VITE_SUPABASE_URL + '/functions/v1/paguelo-facil-webhook'
  }
};

const result = await pagueloFacilService.createPayment(paymentData);
console.log(result);
```

### Verify Deployment

Check that functions are deployed:

1. Go to Supabase Dashboard → Edge Functions
2. You should see:
   - ✅ paguelo-facil-create-payment
   - ✅ paguelo-facil-get-status
   - ✅ paguelo-facil-webhook
3. Check the logs for any errors

## Troubleshooting

### Common Issues

**1. "PAGUELO_FACIL_ACCESS_TOKEN not configured"**
- Solution: Add the environment variable in Supabase Dashboard → Edge Functions → Settings

**2. "Payment service not configured"**
- Solution: Verify environment variables are set correctly
- Check that you've deployed the functions after setting variables

**3. "CORS error"**
- Solution: Verify CORS headers are properly configured in functions
- Check that frontend is calling the correct function URL

**4. Webhook not receiving notifications**
- Solution: Verify webhook URL is configured correctly in Paguelo Fácil dashboard
- Check function logs for incoming requests
- Ensure webhook URL is publicly accessible

### View Logs

To view function logs:

1. Supabase Dashboard → Edge Functions
2. Click on function name
3. View **Logs** tab

Or use Supabase CLI:
```bash
supabase functions logs paguelo-facil-create-payment
```

## PCI DSS Compliance

This implementation follows PCI DSS requirements:

✅ **Requirement 3**: Protect stored cardholder data
- We don't store any cardholder data

✅ **Requirement 4**: Encrypt transmission of cardholder data
- All communication over HTTPS/TLS 1.2+

✅ **Requirement 6**: Develop secure systems
- Input validation, error handling, audit logging

✅ **Requirement 7**: Restrict access to cardholder data
- Backend-only access to payment credentials

✅ **Requirement 10**: Track and monitor access
- Comprehensive audit logging

For full compliance documentation, see `/PCI_DSS_COMPLIANCE.md` in the project root.

## Support

For issues or questions:
- Review documentation in `/SECURITY.md`
- Check Supabase function logs
- Contact: security@novedadescatolicas.com
