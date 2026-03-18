# Optimizaciones para Reducir Llamadas Excesivas a Supabase

## Problemas Identificados y Solucionados

### 1. PaymentSuccess.tsx - Loop Infinito de Actualización de Stock ✅

**Problema:**
- El `useEffect` se ejecutaba infinitamente porque tenía `updateOrderStatus` en sus dependencias
- Cada vez que se actualizaba el estado, el useEffect se volvía a ejecutar
- Causaba miles de llamadas a `loyverse-restar-stock`

**Solución:**
- Agregado flag `stockUpdated` para rastrear si ya se actualizó el stock
- Verificación temprana `if (stockUpdated) return;` en el useEffect
- Envolver las llamadas de stock en `if (!stockUpdated)`
- Establecer `setStockUpdated(true)` después de cada actualización exitosa
- Cambiar dependencias de `updateOrderStatus` a `stockUpdated`

**Código:**
```typescript
const [stockUpdated, setStockUpdated] = useState(false);

useEffect(() => {
  if (stockUpdated) return;

  // ... código de verificación de pago

  if (!stockUpdated) {
    // llamada a loyverse-restar-stock
    setStockUpdated(true);
  }
}, [paymentCode, orderId, stockUpdated]);
```

### 2. Checkout.tsx - Llamadas Excesivas a calculate-shipping ✅

**Problema:**
- El `useEffect` se ejecutaba cada vez que `subtotal` cambiaba
- No había debounce ni protección contra llamadas repetidas
- Causaba cientos de llamadas a `calculate-shipping` y `servientrega-cotizar`

**Solución:**
- Agregado debounce de 500ms usando `setTimeout`
- Agregado flag `isCalculatingShipping` para prevenir llamadas concurrentes
- Limpieza del timeout en el cleanup del useEffect
- Usar try/finally para asegurar que el flag se resetee

**Código:**
```typescript
const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
const shippingCalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (shippingCalculationTimeoutRef.current) {
    clearTimeout(shippingCalculationTimeoutRef.current);
  }

  shippingCalculationTimeoutRef.current = setTimeout(() => {
    const calculateShipping = async () => {
      if (isCalculatingShipping) return;

      setIsCalculatingShipping(true);
      try {
        // llamada a getCotizacion
      } finally {
        setIsCalculatingShipping(false);
      }
    };
    calculateShipping();
  }, 500);

  return () => {
    if (shippingCalculationTimeoutRef.current) {
      clearTimeout(shippingCalculationTimeoutRef.current);
    }
  };
}, [customerInfo.province, customerInfo.corregimiento, customerInfo.deliveryMethod, subtotal]);
```

## Beneficios

1. **Reducción drástica de llamadas a edge functions** - De miles a solo las necesarias
2. **Menor costo de Supabase** - Menos invocaciones de edge functions
3. **Mejor experiencia de usuario** - Menos lag y mejor rendimiento
4. **Prevención de rate limiting** - Evita bloqueos por exceso de requests

## Recomendaciones Adicionales

### Para el futuro:

1. **Siempre usar debounce** en useEffect que hacen llamadas a APIs cuando las dependencias pueden cambiar frecuentemente
2. **Usar flags de estado** para prevenir llamadas concurrentes o repetidas
3. **Revisar dependencias de useEffect** - Evitar funciones o estados que cambien constantemente
4. **Implementar cleanup** en useEffect que usan timers o subscripciones
5. **Considerar React Query o SWR** para manejo de cache y deduplicación automática de requests

### Patrón recomendado para llamadas API en useEffect:

```typescript
const [isLoading, setIsLoading] = useState(false);
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  // Limpiar timeout anterior
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  // Debounce
  timeoutRef.current = setTimeout(() => {
    const fetchData = async () => {
      // Guard contra llamadas concurrentes
      if (isLoading) return;

      setIsLoading(true);
      try {
        // API call aquí
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, 500);

  // Cleanup
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, [dependencies]);
```
