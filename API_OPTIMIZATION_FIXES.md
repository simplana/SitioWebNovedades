# Optimizaciones para Reducir Llamadas Excesivas a Supabase

## Problemas Identificados y Solucionados

### 1. PaymentSuccess.tsx - Loop Infinito de Actualización de Stock ✅

**Problema:**
- El `useEffect` se ejecutaba MÚLTIPLES VECES por:
  1. React Strict Mode en desarrollo (ejecuta useEffect 2 veces)
  2. Dependencias `[paymentCode, orderId, stockUpdated]` causaban re-ejecuciones
  3. Cualquier refresh o cambio en URL params volvía a ejecutar
- Resultado: 4+ llamadas a `loyverse-restar-stock` reduciendo stock incorrectamente

**Solución DEFINITIVA:**
- Usar `useRef` en lugar de `useState` para el flag de verificación
- `useRef` persiste entre renders pero NO causa re-renders
- Array de dependencias VACÍO `[]` para ejecutar SOLO una vez
- Verificación inmediata con `hasVerifiedPayment.current`

**Código:**
```typescript
// Use ref instead of state - refs don't trigger re-renders
const hasVerifiedPayment = useRef(false);

useEffect(() => {
  // CRITICAL: Only run once, prevent double execution in React Strict Mode
  if (hasVerifiedPayment.current) {
    console.log('⚠️ Payment already verified, skipping duplicate call');
    return;
  }
  hasVerifiedPayment.current = true;

  const verifyPayment = async () => {
    // ... código de verificación de pago
    // llamada a loyverse-restar-stock (sin if, se ejecuta UNA vez)
  };

  verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Empty deps - only run ONCE on mount
```

**Por qué funciona:**
- `useRef` NO está en las dependencias
- Array vacío `[]` = solo ejecuta en mount
- `hasVerifiedPayment.current` se verifica antes de CUALQUIER código
- React Strict Mode ejecutará el useEffect 2 veces PERO el ref evita la segunda ejecución

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
