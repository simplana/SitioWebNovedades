# Servientrega Integration Setup

This guide explains how to configure and use the Servientrega shipping quote integration in your application.

## Overview

The Servientrega integration provides real-time shipping cost calculations based on:
- Origin and destination locations
- Package weight and dimensions
- Declared value
- Delivery zone (urbano, nacional, especial)

## Architecture

### Edge Function: `servientrega-cotizar`

The integration is implemented as a Supabase Edge Function that:
- Receives shipping parameters from the frontend
- Calls the Servientrega API
- Returns shipping cost and delivery time estimates
- Handles errors and validation

**Location:** `supabase/functions/servientrega-cotizar/index.ts`

### React Hook: `useServientrega`

A custom React hook that provides:
- `getCotizacion()` - Function to request shipping quote
- `loading` - Loading state
- `error` - Error state
- `cotizacion` - Quote result
- `resetCotizacion()` - Reset state

**Location:** `src/hooks/useServientrega.ts`

## Configuration

### 1. Environment Variables (Supabase Dashboard)

The edge function requires the following environment variables to be configured in your Supabase Dashboard:

Navigate to: **Supabase Dashboard → Edge Functions → Settings**

Add these variables:

```bash
SERVIENTREGA_USUARIO=your-servientrega-username
SERVIENTREGA_CONTRASENA=your-servientrega-password
```

**Important:**
- These are backend-only variables
- Never add these to your frontend `.env` file
- Never use the `VITE_` prefix for these variables

### 2. Deploy the Edge Function

The edge function should already be deployed, but if you need to redeploy:

```bash
supabase functions deploy servientrega-cotizar
```

## API Reference

### Request Parameters

```typescript
interface CotizacionParams {
  ciu_ori: string;              // Origin city (e.g., "24 DE DICIEMBRE")
  provincia_ori: string;        // Origin province (e.g., "PANAMA")
  ciu_des: string;              // Destination city/corregimiento
  provincia_des: string;        // Destination province
  valor_declarado: number;      // Declared value in USD
  peso: number;                 // Weight in kg
  alto: number;                 // Height in cm
  ancho: number;                // Width in cm
  largo: number;                // Length in cm
  recoleccion?: string;         // Optional: "SI" or "NO" (default: "NO")
  nombre_producto?: string;     // Optional: service type (default: "PREMIER-RESIDENCIAL")
}
```

### Response Format

```typescript
interface CotizacionResult {
  valor_declarado: string;      // Declared value
  tiempo: string;               // Estimated delivery time (days)
  trayecto: string;             // Route type (URBANO, NACIONAL, ESPECIAL)
  peso: string;                 // Package weight
  volumen: number;              // Calculated volume
  peso_cobrar: string;          // Billable weight
  descuento: number;            // Discount applied
  flete: number;                // Base freight cost
  prima: number;                // Insurance premium
  tiva: number;                 // Tax (ITBMS)
  gtotal: number;               // Grand total (final shipping cost)
}
```

## Usage in Checkout

The cotizador is automatically integrated into the checkout flow:

1. **User enters delivery address** with province and corregimiento
2. **Clicks "Continuar al Pago"** to proceed to payment step
3. **Quote is automatically calculated** when the payment step loads
4. **Shipping cost is displayed** in the order summary
5. **Total is updated** to include shipping

### Automatic Calculation

The shipping quote is automatically requested when:
- User reaches the payment step
- Delivery method is set to "delivery" (not "pickup")
- Province and corregimiento are filled

### Default Package Dimensions

Current default dimensions (configurable in code):
```typescript
{
  peso: 5,      // 5 kg
  alto: 20,     // 20 cm
  ancho: 25,    // 25 cm
  largo: 30     // 30 cm
}
```

## Database Tables

The integration uses the following tables (already created):

### `shipping_rates`
Stores base shipping rates for different zones:
- `urbano` - Urban deliveries within Panama province
- `nacional` - Inter-province deliveries
- `especial` - Remote areas

### `shipments`
Stores shipment records (for future tracking integration)

### `tracking_events`
Stores tracking events (for future tracking integration)

## Shipping Zones

### Urbano
- Same province delivery (within Panama)
- From 24 de Diciembre to Puente de las Américas
- Estimated: 24 hours

### Nacional
- Cross-province delivery
- Estimated: 48 hours

### Especial
- Remote areas:
  - Bocas del Toro
  - Darién
  - Samaría
  - Cherrillo
  - Curundú
  - Costa arriba/baja de Colón
- Estimated: 72-120 hours

## Error Handling

The integration handles several error scenarios:

### Missing Credentials
```json
{
  "error": "Servientrega credentials not configured. Please contact administrator."
}
```

**Solution:** Configure `SERVIENTREGA_USUARIO` and `SERVIENTREGA_CONTRASENA` in Supabase Dashboard

### Missing Required Fields
```json
{
  "error": "Missing required fields: ciu_ori, provincia_ori, ciu_des, provincia_des"
}
```

**Solution:** Ensure all required address fields are filled

### API Connection Error
```json
{
  "error": "Servientrega API error: 500 Internal Server Error"
}
```

**Solution:** Check Servientrega API status or credentials

## Testing

### Test Credentials (Sandbox)

If using test credentials:
```bash
SERVIENTREGA_USUARIO=PRUEBA
SERVIENTREGA_CONTRASENA=s12345ABCDe
```

### Example Request

```typescript
const { getCotizacion } = useServientrega();

const response = await getCotizacion({
  ciu_ori: '24 DE DICIEMBRE',
  provincia_ori: 'PANAMA',
  ciu_des: 'BAGALA',
  provincia_des: 'CHIRIQUI',
  valor_declarado: 200.5,
  peso: 5,
  alto: 20,
  ancho: 25,
  largo: 30,
});

if (response.success) {
  console.log('Shipping cost:', response.cotizacion.gtotal);
  console.log('Delivery time:', response.cotizacion.tiempo, 'days');
}
```

### Example Response

```json
{
  "success": true,
  "cotizacion": {
    "valor_declarado": "200.5",
    "tiempo": "3",
    "trayecto": "ESPECIAL",
    "peso": "5",
    "volumen": 1,
    "peso_cobrar": "5",
    "descuento": 0,
    "flete": 14,
    "prima": 2.01,
    "tiva": 1.12,
    "gtotal": 17.13
  }
}
```

## Troubleshooting

### Quote not calculating
1. Check browser console for errors
2. Verify province and corregimiento are filled
3. Ensure user is on the payment step
4. Check that delivery method is "delivery" not "pickup"

### Incorrect shipping cost
1. Verify package dimensions are correct
2. Check that origin/destination are properly formatted
3. Review Servientrega API response in logs

### Credentials error
1. Go to Supabase Dashboard → Edge Functions → Settings
2. Verify `SERVIENTREGA_USUARIO` and `SERVIENTREGA_CONTRASENA` are set
3. Redeploy the edge function if needed

## Future Enhancements

Potential improvements:
- Dynamic package weight calculation based on products
- Product metadata table for individual product weights
- Label generation integration
- Real-time tracking integration
- Admin interface for shipping management
- Support for multiple packages per order

## Support

For issues or questions:
1. Check the edge function logs in Supabase Dashboard
2. Review browser console for client-side errors
3. Verify environment variables are configured
4. Contact Servientrega support for API-related issues

## References

- Servientrega API: `http://ws-servientrega.appsiscore.com/cotizador/ws_cotizador.php`
- Service Type: `PREMIER-RESIDENCIAL`
- Default Origin: `24 DE DICIEMBRE, PANAMA`
