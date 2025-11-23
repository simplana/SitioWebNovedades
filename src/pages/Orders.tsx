import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useOrderStatus } from '../hooks/useOrderStatus';
import { Package, Calendar, MapPin, RefreshCw, ShoppingCart, ArrowRight, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import OrderStatusTracker from '../components/OrderStatusTracker';
import OrderTrackingDetail from '../components/OrderTrackingDetail';

const Orders = () => {
  const { orders, reorderItems, isAuthenticated } = useCart();
  const { user } = useAuth();
  const { getLatestOrderStatus, checkPagueloFacilPayment } = useOrderStatus();
  const navigate = useNavigate();
  const [expandedTracking, setExpandedTracking] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleCheckPaymentStatus = async (orderId: string, paymentId?: string) => {
    if (paymentId) {
      try {
        await checkPagueloFacilPayment(orderId, paymentId);
        // Refresh the page to show updated status
        window.location.reload();
      } catch (error) {
        console.error('Error checking payment:', error);
        alert('Error verificando el estado del pago');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending': return 'bg-orange-100 text-orange-800';
      case 'payment_confirmed': return 'bg-green-100 text-green-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'payment_pending': return 'Esperando Pago';
      case 'payment_confirmed': return 'Pago Confirmado';
      case 'payment_failed': return 'Pago Fallido';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="pt-16 min-h-screen bg-divine-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-navy-devotion">
              Mis Órdenes
            </h1>
            <p className="text-stone-prayer mt-2">
              Historial de compras y estado de envíos
            </p>
          </div>
          <Link
            to="/productos"
            className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
          >
            Seguir Comprando
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-sacred-white rounded-2xl shadow-sacred p-12 text-center">
            <div className="bg-whisper-gray p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-dove-gray" />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-navy-devotion mb-4">
              No tienes órdenes aún
            </h2>
            <p className="text-stone-prayer mb-8">
              Cuando realices tu primera compra, aparecerá aquí tu historial de órdenes.
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105 space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Explorar Productos</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-sacred-white rounded-2xl shadow-sacred overflow-hidden">
                {/* Order Header */}
                <div className="bg-celestial-gradient p-6 border-b border-divine-gold border-opacity-20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-playfair text-xl font-bold text-navy-devotion">
                        Orden {order.id}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-stone-prayer">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>
                        {order.shippingAddress && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate max-w-xs">{order.shippingAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {order.paymentMethod === 'paguelo_facil' ? 'Paguelo Fácil' : 'Transferencia'}
                        </span>
                      )}
                      <span className="font-playfair text-xl font-bold text-divine-gold">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Status Tracker */}
                <div className="p-6 border-b border-divine-gold border-opacity-20">
                  <OrderStatusTracker 
                    orderId={order.id}
                    currentStatus={getLatestOrderStatus(order.id)?.status || order.status}
                    paymentMethod={order.paymentMethod}
                  />
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex space-x-3 bg-holy-glow rounded-xl p-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-sacred"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-navy-devotion text-sm leading-tight mb-1">
                            {item.name}
                          </h4>
                          {item.options && (
                            <p className="text-xs text-stone-prayer mb-1">{item.options}</p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-dove-gray">Qty: {item.quantity}</span>
                            <span className="font-semibold text-divine-gold text-sm">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-divine-gold border-opacity-20">
                    {order.trackingNumber && (
                      <button
                        onClick={() => setExpandedTracking(expandedTracking === order.id ? null : order.id)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                      >
                        <Truck className="h-4 w-4" />
                        <span>{expandedTracking === order.id ? 'Ocultar Tracking' : 'Ver Tracking'}</span>
                      </button>
                    )}

                    {order.paymentId && order.paymentMethod === 'paguelo_facil' && (
                      <button
                        onClick={() => handleCheckPaymentStatus(order.id, order.paymentId)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Verificar Pago</span>
                      </button>
                    )}

                    <button
                      onClick={() => reorderItems(order.id)}
                      className="flex-1 bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-marian hover:shadow-divine transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Repetir Compra</span>
                    </button>

                    <button className="flex-1 bg-whisper-gray hover:bg-dove-gray text-stone-prayer font-semibold py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center space-x-2">
                      <Package className="h-4 w-4" />
                      <span>Ver Detalles</span>
                    </button>
                  </div>
                </div>

                {/* Tracking Detail */}
                {expandedTracking === order.id && order.trackingNumber && (
                  <div className="p-6 bg-holy-glow border-t border-divine-gold border-opacity-20">
                    <OrderTrackingDetail trackingNumber={order.trackingNumber} orderId={order.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;