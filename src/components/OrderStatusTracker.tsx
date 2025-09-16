import React from 'react';
import { CheckCircle, Clock, Truck, Package, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { useOrderStatus, OrderStatusUpdate } from '../hooks/useOrderStatus';

interface OrderStatusTrackerProps {
  orderId: string;
  currentStatus: string;
  paymentMethod?: 'transfer' | 'paguelo_facil';
  className?: string;
}

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  orderId,
  currentStatus,
  paymentMethod,
  className = ''
}) => {
  const { getOrderHistory, getStatusText, getStatusColor } = useOrderStatus();
  const orderHistory = getOrderHistory(orderId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'payment_pending':
        return <CreditCard className="h-5 w-5" />;
      case 'payment_confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'payment_failed':
        return <XCircle className="h-5 w-5" />;
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Orden Creada' },
    { key: paymentMethod === 'paguelo_facil' ? 'payment_confirmed' : 'payment_pending', label: paymentMethod === 'paguelo_facil' ? 'Pago Confirmado' : 'Esperando Pago' },
    { key: 'processing', label: 'Procesando' },
    { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregado' }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="font-playfair text-xl font-bold text-navy mb-6">
        Estado de la Orden
      </h3>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                index <= currentStepIndex 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {getStatusIcon(step.key)}
              </div>
              <span className={`text-xs text-center ${
                index <= currentStepIndex ? 'text-green-600 font-semibold' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {index < statusSteps.length - 1 && (
                <div className={`h-1 w-full mt-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded-full ${getStatusColor(currentStatus)}`}>
            {getStatusIcon(currentStatus)}
          </div>
          <div>
            <h4 className="font-semibold text-navy">
              Estado Actual: {getStatusText(currentStatus)}
            </h4>
            <p className="text-sm text-gray-600">
              {currentStatus === 'payment_pending' && paymentMethod === 'transfer' && 
                'Esperando confirmación de transferencia bancaria'}
              {currentStatus === 'payment_confirmed' && 
                'Pago confirmado, procesaremos tu orden pronto'}
              {currentStatus === 'processing' && 
                'Tu orden está siendo preparada'}
              {currentStatus === 'shipped' && 
                'Tu orden está en camino'}
              {currentStatus === 'delivered' && 
                '¡Tu orden ha sido entregada!'}
            </p>
          </div>
        </div>
      </div>

      {/* Order History */}
      {orderHistory.length > 0 && (
        <div>
          <h4 className="font-semibold text-navy mb-4">Historial de la Orden</h4>
          <div className="space-y-3">
            {orderHistory.map((update, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-1 rounded-full ${getStatusColor(update.status)}`}>
                  {getStatusIcon(update.status)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-navy">
                        {getStatusText(update.status)}
                      </p>
                      {update.notes && (
                        <p className="text-sm text-gray-600">{update.notes}</p>
                      )}
                      {update.trackingNumber && (
                        <p className="text-sm text-blue-600">
                          Tracking: {update.trackingNumber}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTracker;