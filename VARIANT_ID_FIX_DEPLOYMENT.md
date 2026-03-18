# Fix: Loyverse Variant ID Implementation

## Problema Identificado
El `loyverse_variant_id` no se estaba guardando en los order_items porque:
1. **ProductCard.tsx** no incluía el campo `variantId` en su interface ni lo pasaba al carrito
2. La función **loyverse-token-refresh** no devolvía el `access_token` en su respuesta
3. La función **loyverse-restar-stock** llamaba a token-refresh pero no recibía el token

## Cambios Realizados

### 1. Frontend (src/components/ProductCard.tsx)
- ✅ Agregado `variantId?: string;` al interface Product
- ✅ Agregado `loyverse_variant_id: product.variantId` al objeto que se pasa a `addToCart()`
- ✅ Agregados logs de diagnóstico

### 2. Frontend (src/pages/ProductDetail.tsx)
- ✅ Agregados logs de diagnóstico para rastrear el variant_id

### 3. Frontend (src/hooks/useCart.ts)
- ✅ Agregados logs para rastrear el variant_id durante addToCart y processOrder

### 4. Frontend (src/hooks/useLoyverse.ts)
- ✅ Agregados logs para verificar el variant_id desde el API de Loyverse

### 5. Edge Function (loyverse-token-refresh)
**Archivo:** `supabase/functions/loyverse-token-refresh/index.ts`

**Cambios:**
- Línea 73: Agregado `access_token: credentials.access_token` en respuesta cuando token es válido
- Línea 223: Agregado `access_token: tokenData.access_token` en respuesta después de refresh

### 6. Edge Function (loyverse-restar-stock) - CRÍTICO
**Archivo:** `supabase/functions/loyverse-restar-stock/index.ts`

**Cambios:**
- Línea 2: Agregado `import { createClient } from "jsr:@supabase/supabase-js@2";`
- Líneas 58-78: Reemplazado el método de obtener el token
  - **ANTES:** Llamaba a `loyverse-token-refresh` y esperaba recibir el token
  - **AHORA:** Lee directamente de la tabla `loyverse_credentials` donde `is_active = true`

**Código nuevo:**
```typescript
// Get access token directly from database (active credentials)
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const { data: credentials, error: credError } = await supabase
  .from("loyverse_credentials")
  .select("access_token")
  .eq("is_active", true)
  .single();

if (credError || !credentials) {
  console.error("No active Loyverse credentials found:", credError);
  return new Response(
    JSON.stringify({ error: "No active Loyverse credentials configured" }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

const access_token = credentials.access_token;
console.log("Using access token from active credentials (length:", access_token?.length, ")");
```

## Deployment Necesario

⚠️ **IMPORTANTE:** Las siguientes funciones edge necesitan ser desplegadas:

1. **loyverse-token-refresh**
   ```bash
   supabase functions deploy loyverse-token-refresh
   ```

2. **loyverse-restar-stock** (CRÍTICO)
   ```bash
   supabase functions deploy loyverse-restar-stock
   ```

## Verificación Post-Deployment

Después de desplegar, verifica en la consola del navegador:

1. **Al cargar productos:**
   ```
   [useLoyverse] Processing item: AAA PRUEBA- Butler Web
   [useLoyverse] - Variant ID: 29d84a6a-4f08-480b-9d82-6fee9813c8a2
   ```

2. **Al agregar al carrito:**
   ```
   [ProductCard] Product variantId: 29d84a6a-4f08-480b-9d82-6fee9813c8a2
   [useCart] loyverse_variant_id: 29d84a6a-4f08-480b-9d82-6fee9813c8a2
   ```

3. **Al procesar orden:**
   ```
   [useCart] Creating order item for: AAA PRUEBA- Butler Web
   [useCart] - loyverse_variant_id: 29d84a6a-4f08-480b-9d82-6fee9813c8a2
   ```

4. **En los logs de la función edge:**
   - Ya NO debería aparecer: "Skipping item - no variant ID"
   - Debería aparecer: "Using access token from active credentials"
   - El inventario debería actualizarse correctamente en Loyverse

## Build Status
✅ Build exitoso - El proyecto compila sin errores
