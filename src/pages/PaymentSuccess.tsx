import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Package } from 'lucide-react';
import { useOrderStatus } from '../hooks/useOrderStatus';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateOrderStatus } = useOrderStatus();
  const { clearCart } = useCart();
  const { user } = useAuth();

  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Use ref to ensure payment verification only runs ONCE, ever
  const hasVerifiedPayment = useRef(false);
  const hasCartBeenCleared = useRef(false);

  const orderId = searchParams.get('orderId');
  const paymentCode = searchParams.get('Oper');
  const estado = searchParams.get('Estado');
  const isDemo = searchParams.get('demo') === 'true';

  // Helper function to clear cart reliably
  const clearCartReliably = () => {
    if (hasCartBeenCleared.current) {
      console.log('⚠️ Cart already cleared, skipping');
      return;
    }

    console.log('🧹 Clearing cart reliably...');
    hasCartBeenCleared.current = true;

    // First attempt: Clear using the hook
    try {
      clearCart();
      console.log('✅ clearCart() hook called');
    } catch (error) {
      console.error('Error calling clearCart():', error);
    }

    // Second attempt: Aggressively clear ALL possible cart keys from localStorage
    // This runs immediately (not in setTimeout) to ensure it happens before any navigation
    try {
      // Clear the generic cart key
      localStorage.removeItem('novedades-catolicas-cart');
      console.log('🧹 Removed: novedades-catolicas-cart');

      // Clear user-specific cart key if user exists
      if (user?.id) {
        const userCartKey = `cart_user_${user.id}`;
        localStorage.removeItem(userCartKey);
        console.log(`🧹 Removed: ${userCartKey}`);
      }

      // Aggressively clear ALL cart-related keys (nuclear option)
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('cart') || key.includes('novedades-catolicas')) {
          localStorage.removeItem(key);
          console.log(`🧹 Removed (aggressive): ${key}`);
        }
      });

      console.log('✅ Cart cleared successfully via direct localStorage removal');
    } catch (error) {
      console.error('Error clearing cart directly:', error);
    }

    // Third attempt: Double-check after a short delay
    setTimeout(() => {
      try {
        localStorage.removeItem('novedades-catolicas-cart');
        if (user?.id) {
          localStorage.removeItem(`cart_user_${user.id}`);
        }
        console.log('✅ Cart cleared again (delayed verification)');
      } catch (error) {
        console.error('Error in delayed cart clear:', error);
      }
    }, 500);
  };

  useEffect(() => {
    // CRITICAL: Only run once, prevent double execution in React Strict Mode
    if (hasVerifiedPayment.current) {
      console.log('⚠️ Payment already verified, skipping duplicate call');
      return;
    }
    hasVerifiedPayment.current = true;
    const loadOrderDetails = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderId)
          .maybeSingle();

        if (!error && data) {
          setOrderDetails(data);
        }
      } catch (err) {
        console.error('Error loading order details:', err);
      }
    };

    const verifyPayment = async () => {
      // First, check if order has already been validated
      if (!orderId) {
        setError('Código de pago u orden no encontrado');
        setLoading(false);
        return;
      }

      try {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('is_validated, payment_status, order_number')
          .eq('order_number', orderId)
          .maybeSingle();

        if (existingOrder?.is_validated) {
          console.log('✅ Order already validated, skipping payment verification');
          setPaymentVerified(true);
          setOrderDetails(existingOrder);
          clearCartReliably();
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking order validation status:', err);
      }

      await loadOrderDetails();

      if (isDemo) {
        console.log('🎭 DEMO MODE - Simulando verificación exitosa');
        setPaymentVerified(true);
        clearCartReliably();

        if (orderId) {
          updateOrderStatus({
            orderId,
            status: 'payment_confirmed',
            paymentStatus: 'completed',
            notes: `Pago DEMO confirmado exitosamente - Modo demostración`
          });

          // Mark order as validated in database
          await supabase
            .from('orders')
            .update({ is_validated: true })
            .eq('order_number', orderId);

          // Reduce stock in Loyverse after successful payment (DEMO mode)
          try {
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const orderResponse = await supabase
              .from('orders')
              .select(`
                *,
                order_items (*)
              `)
              .eq('order_number', orderId)
              .maybeSingle();

            if (orderResponse.data && orderResponse.data.order_items) {
              const orderItems = orderResponse.data.order_items.map((item: any) => ({
                loyverse_variant_id: item.loyverse_variant_id,
                quantity: item.quantity,
                product_name: item.product_name
              }));

              console.log('🔥 CALLING loyverse-restar-stock (DEMO) - THIS SHOULD ONLY HAPPEN ONCE');
              const stockResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loyverse-restar-stock`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`,
                  },
                  body: JSON.stringify({ order_items: orderItems }),
                }
              );

              const stockResult = await stockResponse.json();
              console.log('✅ Stock update result (DEMO):', stockResult);
            }
          } catch (stockError) {
            console.error('Error updating Loyverse stock (DEMO):', stockError);
          }
        }

        setLoading(false);
        return;
      }

      if (!paymentCode || !orderId) {
        setError('Código de pago u orden no encontrado');
        setLoading(false);
        return;
      }

      console.log('🔍 Validating payment:', { paymentCode, orderId, estado });

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/paguelo-facil-validate-payment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
              'apikey': anonKey,
            },
            body: JSON.stringify({
              paymentCode,
              orderId,
            }),
          }
        );

        const result = await response.json();
        console.log('✅ Validation result:', result);

        if (result.success && result.paymentStatus === 'approved') {
          setPaymentVerified(true);
          setTransactionDetails(result.transaction);
          clearCartReliably();

          updateOrderStatus({
            orderId,
            status: 'payment_confirmed',
            paymentStatus: 'completed',
            notes: `Pago confirmado - ${result.transaction.tipo} (${paymentCode})`
          });

          // Mark order as validated in database
          await supabase
            .from('orders')
            .update({ is_validated: true })
            .eq('order_number', orderId);

          // Reduce stock in Loyverse after successful payment
          try {
            const orderResponse = await supabase
              .from('orders')
              .select(`
                *,
                order_items (*)
              `)
              .eq('order_number', orderId)
              .maybeSingle();

            if (orderResponse.data && orderResponse.data.order_items) {
              const orderItems = orderResponse.data.order_items.map((item: any) => ({
                loyverse_variant_id: item.loyverse_variant_id,
                quantity: item.quantity,
                product_name: item.product_name
              }));

              console.log('🔥 CALLING loyverse-restar-stock - THIS SHOULD ONLY HAPPEN ONCE');
              const stockResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loyverse-restar-stock`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`,
                  },
                  body: JSON.stringify({ order_items: orderItems }),
                }
              );

              const stockResult = await stockResponse.json();
              console.log('✅ Stock update result:', stockResult);
            }
          } catch (stockError) {
            console.error('Error updating Loyverse stock:', stockError);
          }
        } else if (result.orderDeleted) {
          setError('Tu pago fue rechazado y la orden ha sido cancelada. Por favor intenta nuevamente.');
        } else {
          setError(`Pago no aprobado. Estado: ${result.transaction?.estado || 'desconocido'}`);

          updateOrderStatus({
            orderId,
            status: 'payment_failed',
            paymentStatus: 'failed',
            notes: `Pago rechazado: ${result.transaction?.razon || 'Sin razón especificada'}`
          });
        }
      } catch (err) {
        setError('Error verificando el pago');
        console.error('Payment verification error:', err);

        updateOrderStatus({
          orderId,
          status: 'payment_failed',
          paymentStatus: 'failed',
          notes: 'Error verificando el estado del pago'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run ONCE on mount

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-divine-gradient flex items-center justify-center">
        <div className="bg-sacred-white rounded-2xl shadow-divine p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-divine-gold mx-auto mb-4"></div>
          <h2 className="font-playfair text-xl font-bold text-navy-devotion mb-2">
            Verificando tu pago...
          </h2>
          <p className="text-stone-prayer">
            Por favor espera mientras confirmamos tu transacción.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 min-h-screen bg-divine-gradient flex items-center justify-center">
        <div className="bg-sacred-white rounded-2xl shadow-divine p-8 text-center max-w-md">
          <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="font-playfair text-xl font-bold text-navy-devotion mb-4">
            Error en el Pago
          </h2>
          <p className="text-stone-prayer mb-6">{error}</p>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-divine-gradient">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-sacred-white rounded-2xl shadow-divine p-8 text-center">
          <div className="bg-green-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="font-playfair text-3xl font-bold text-navy-devotion mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-stone-prayer text-lg mb-6">
            Tu pago ha sido procesado exitosamente con Paguelo Fácil.
            {isDemo && (
              <span className="block mt-2 text-sm text-blue-600 font-semibold">
                🎭 Modo Demostración - Pago simulado
              </span>
            )}
          </p>
          
          {orderId && (
            <div className="bg-celestial-gradient rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-navy-devotion mb-3">Detalles de tu orden:</h3>
              <div className="space-y-2 text-left">
                <p className="text-stone-prayer">
                  <span className="font-medium">Orden:</span>{' '}
                  <span className="font-semibold text-divine-gold">{orderId}</span>
                </p>
                <p className="text-stone-prayer">
                  <span className="font-medium">Estado:</span>{' '}
                  <span className="font-semibold text-green-600">Pagado</span>
                </p>
                <p className="text-stone-prayer">
                  <span className="font-medium">Método:</span>{' '}
                  <span className="font-semibold">
                    {transactionDetails?.tipo ||
                     (orderDetails?.payment_method === 'paguelo_facil' ? 'Paguelo Fácil' :
                      orderDetails?.payment_method === 'transfer' ? 'Transferencia Bancaria' :
                      orderDetails?.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta de Crédito/Débito')}
                  </span>
                </p>
                <p className="text-stone-prayer">
                  <span className="font-medium">Fecha:</span>{' '}
                  <span className="font-semibold">
                    {transactionDetails?.fecha && transactionDetails?.hora
                      ? `${transactionDetails.fecha} ${transactionDetails.hora}`
                      : orderDetails?.created_at
                        ? new Date(orderDetails.created_at).toLocaleDateString('es-PA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                  </span>
                </p>
                <p className="text-stone-prayer">
                  <span className="font-medium">Total:</span>{' '}
                  <span className="font-semibold">
                    ${transactionDetails?.totalPagado ||
                      (orderDetails ? ((parseFloat(orderDetails.total) || 0) + (orderDetails.shipping_cost || 0)).toFixed(2) : '0.00')}
                  </span>
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-stone-prayer">
              Recibirás un email de confirmación y te contactaremos pronto para coordinar la entrega.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/productos')}
                className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
              >
                Seguir Comprando
              </button>
              
              <button
                onClick={() => navigate('/orders')}
                className="bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-marian hover:shadow-divine transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Ver Mis Órdenes</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;