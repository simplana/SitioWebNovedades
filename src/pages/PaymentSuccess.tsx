import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Package } from 'lucide-react';
import { usePagueloFacil } from '../hooks/usePagueloFacil';
import { useOrderStatus } from '../hooks/useOrderStatus';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkPaymentStatus } = usePagueloFacil();
  const { updateOrderStatus } = useOrderStatus();
  
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const isDemo = searchParams.get('demo') === 'true';

  useEffect(() => {
    const verifyPayment = async () => {
      if (isDemo) {
        console.log('🎭 DEMO MODE - Simulando verificación exitosa');
        setPaymentVerified(true);
        
        if (orderId) {
          updateOrderStatus({
            orderId,
            status: 'payment_confirmed',
            paymentStatus: 'completed',
            notes: `Pago DEMO confirmado exitosamente - Modo demostración`
          });
        }
        
        setLoading(false);
        return;
      }

      if (!paymentId) {
        setError('ID de pago no encontrado');
        setLoading(false);
        return;
      }

      try {
        const status = await checkPaymentStatus(paymentId);
        
        if (status.status === 'completed') {
          setPaymentVerified(true);
          
          // Actualizar estado de la orden
          if (orderId) {
            updateOrderStatus({
              orderId,
              status: 'payment_confirmed',
              paymentStatus: 'completed',
              notes: `Pago confirmado exitosamente - Paguelo Fácil (${paymentId})`
            });
          }
        } else {
          setError(`Pago no completado. Estado: ${status.status}`);
          
          // Actualizar estado como pago fallido
          if (orderId) {
            updateOrderStatus({
              orderId,
              status: 'payment_failed',
              paymentStatus: status.status,
              notes: `Pago no completado - Estado: ${status.status}`
            });
          }
        }
      } catch (err) {
        setError('Error verificando el pago');
        console.error('Payment verification error:', err);
        
        // Actualizar estado como error de pago
        if (orderId) {
          updateOrderStatus({
            orderId,
            status: 'payment_failed',
            paymentStatus: 'failed',
            notes: 'Error verificando el estado del pago'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, orderId, checkPaymentStatus, updateOrderStatus]);

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
              <h3 className="font-semibold text-navy-devotion mb-2">Detalles de tu orden:</h3>
              <p className="text-stone-prayer">
                Orden: <span className="font-semibold text-divine-gold">{orderId}</span>
              </p>
              <p className="text-stone-prayer mt-2">
                Estado: <span className="font-semibold text-green-600">Pagado</span>
              </p>
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