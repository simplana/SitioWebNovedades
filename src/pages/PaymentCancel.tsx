import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get('orderId');

  return (
    <div className="pt-16 min-h-screen bg-divine-gradient">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-sacred-white rounded-2xl shadow-divine p-8 text-center">
          <div className="bg-yellow-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <XCircle className="h-10 w-10 text-yellow-600" />
          </div>
          
          <h1 className="font-playfair text-3xl font-bold text-navy-devotion mb-4">
            Pago Cancelado
          </h1>
          
          <p className="text-stone-prayer text-lg mb-6">
            Has cancelado el proceso de pago. Tu orden no ha sido procesada.
          </p>
          
          {orderId && (
            <div className="bg-rose-prayer rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-navy-devotion mb-2">Orden cancelada:</h3>
              <p className="text-stone-prayer">
                Orden: <span className="font-semibold text-divine-gold">{orderId}</span>
              </p>
              <p className="text-stone-prayer mt-2">
                Estado: <span className="font-semibold text-yellow-600">Cancelada</span>
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-stone-prayer">
              Puedes intentar realizar el pago nuevamente o contactarnos si necesitas ayuda.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/checkout')}
                className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Intentar de Nuevo</span>
              </button>
              
              <button
                onClick={() => navigate('/productos')}
                className="bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-marian hover:shadow-divine transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Seguir Comprando</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;