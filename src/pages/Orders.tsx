import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useOrderStatus } from '../hooks/useOrderStatus';
import { Package, Calendar, MapPin, RefreshCw, ShoppingCart, CreditCard, CheckCircle, Clock, XCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import OrderStatusTracker from '../components/OrderStatusTracker';

const Orders = () => {
  const { orders, reorderItems, isAuthenticated } = useCart();
  const { user } = useAuth();
  const { getLatestOrderStatus, checkPagueloFacilPayment, getOrderHistory } = useOrderStatus();
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrderDetails = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

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

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'paid') return order.status === 'payment_confirmed' || order.paymentStatus === 'completed';
    if (filterStatus === 'pending') return order.status === 'payment_pending' || order.paymentStatus === 'pending';
    if (filterStatus === 'failed') return order.status === 'payment_failed' || order.paymentStatus === 'failed';
    return true;
  });

  const getPaymentStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Pago Completado';
      case 'pending':
        return 'Pago Pendiente';
      case 'failed':
        return 'Pago Fallido';
      case 'cancelled':
        return 'Pago Cancelado';
      default:
        return 'Sin Estado';
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

  return (
    <div className="pt-16 min-h-screen bg-divine-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
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
            className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105 text-center"
          >
            Seguir Comprando
          </Link>
        </div>

        {/* Filtros */}
        {orders.length > 0 && (
          <div className="bg-sacred-white rounded-xl shadow-sacred p-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-stone-prayer" />
              <span className="text-sm font-medium text-navy-devotion">Filtrar por:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === 'all'
                      ? 'bg-gradient-to-r from-divine-gold to-aureola-gold text-navy-devotion shadow-golden'
                      : 'bg-whisper-gray text-stone-prayer hover:bg-dove-gray'
                  }`}
                >
                  Todas ({orders.length})
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === 'paid'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-whisper-gray text-stone-prayer hover:bg-dove-gray'
                  }`}
                >
                  Pagadas ({orders.filter(o => o.status === 'payment_confirmed' || o.paymentStatus === 'completed').length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'bg-whisper-gray text-stone-prayer hover:bg-dove-gray'
                  }`}
                >
                  Pendientes ({orders.filter(o => o.status === 'payment_pending' || o.paymentStatus === 'pending').length})
                </button>
                <button
                  onClick={() => setFilterStatus('failed')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === 'failed'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-whisper-gray text-stone-prayer hover:bg-dove-gray'
                  }`}
                >
                  Fallidas ({orders.filter(o => o.status === 'payment_failed' || o.paymentStatus === 'failed').length})
                </button>
              </div>
            </div>
          </div>
        )}

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
        ) : filteredOrders.length === 0 ? (
          <div className="bg-sacred-white rounded-2xl shadow-sacred p-12 text-center">
            <div className="bg-whisper-gray p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-dove-gray" />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-navy-devotion mb-4">
              No hay órdenes con este filtro
            </h2>
            <p className="text-stone-prayer mb-8">
              Prueba cambiando el filtro para ver otras órdenes.
            </p>
            <button
              onClick={() => setFilterStatus('all')}
              className="inline-flex items-center bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105 space-x-2"
            >
              <Filter className="h-5 w-5" />
              <span>Ver Todas las Órdenes</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const orderHistory = getOrderHistory(order.id);
              return (
              <div key={order.id} className="bg-sacred-white rounded-2xl shadow-sacred overflow-hidden">
                {/* Order Header */}
                <div className="bg-celestial-gradient p-6 border-b border-divine-gold border-opacity-20">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-playfair text-xl font-bold text-navy-devotion">
                        Orden {order.orderNumber}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-stone-prayer">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {order.shippingAddress && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate max-w-xs">{order.shippingAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.paymentMethod && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {order.paymentMethod === 'paguelo_facil' ? 'Paguelo Fácil' : 'Transferencia'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-playfair text-2xl font-bold text-divine-gold">
                          ${((order.total || 0) + (order.shippingCost || 0)).toFixed(2)}
                        </span>
                        {order.shippingDescription && (
                          <p className="text-xs text-stone-prayer mt-1 max-w-xs">
                            Envío: {order.shippingDescription}
                          </p>
                        )}
                      </div>
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
                    {order.paymentId && order.paymentMethod === 'paguelo_facil' && order.paymentStatus !== 'completed' && (
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
                      <ShoppingCart className="h-4 w-4" />
                      <span>Repetir Compra</span>
                    </button>

                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="flex-1 bg-whisper-gray hover:bg-dove-gray text-stone-prayer font-semibold py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span>{isExpanded ? 'Ocultar Detalles' : 'Ver Detalles'}</span>
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-divine-gold border-opacity-20 space-y-4">
                      {/* Order Summary */}
                      <div className="bg-holy-glow rounded-xl p-4">
                        <h4 className="font-semibold text-navy-devotion mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Resumen del Pedido
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-stone-prayer">Subtotal (Productos):</span>
                            <span className="font-medium text-navy-devotion">${(order.total || 0).toFixed(2)}</span>
                          </div>
                          {order.shippingCost && order.shippingCost > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-stone-prayer">
                                Costo de Envío:
                                {order.shippingDescription && (
                                  <span className="text-xs block text-dove-gray">{order.shippingDescription}</span>
                                )}
                              </span>
                              <span className="font-medium text-navy-devotion">${order.shippingCost.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-divine-gold border-opacity-20">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-navy-devotion">Total:</span>
                              <span className="font-playfair text-xl font-bold text-divine-gold">
                                ${((order.total || 0) + (order.shippingCost || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-holy-glow rounded-xl p-4">
                        <h4 className="font-semibold text-navy-devotion mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Información del Cliente
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-stone-prayer">Nombre:</span>
                            <p className="font-medium text-navy-devotion">{order.customerInfo.name}</p>
                          </div>
                          <div>
                            <span className="text-stone-prayer">Email:</span>
                            <p className="font-medium text-navy-devotion">{order.customerInfo.email}</p>
                          </div>
                          <div>
                            <span className="text-stone-prayer">Teléfono:</span>
                            <p className="font-medium text-navy-devotion">{order.customerInfo.phone}</p>
                          </div>
                          {order.shippingAddress && (
                            <div className="sm:col-span-2">
                              <span className="text-stone-prayer">Dirección de Envío:</span>
                              <p className="font-medium text-navy-devotion">{order.shippingAddress}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Details */}
                      {order.paymentMethod === 'paguelo_facil' && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="font-semibold text-navy-devotion mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Detalles del Pago - Paguelo Fácil
                          </h4>
                          <div className="space-y-2 text-sm">
                            {order.paymentId && (
                              <div>
                                <span className="text-stone-prayer">ID de Transacción:</span>
                                <p className="font-mono font-medium text-navy-devotion bg-white px-3 py-1 rounded mt-1">
                                  {order.paymentId}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-stone-prayer">Estado del Pago:</span>
                              <div className="flex items-center gap-2 mt-1">
                                {getPaymentStatusIcon(order.paymentStatus)}
                                <span className="font-medium text-navy-devotion">
                                  {getPaymentStatusText(order.paymentStatus)}
                                </span>
                              </div>
                            </div>
                            {order.paymentStatus === 'completed' && (
                              <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                                <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Pago verificado y confirmado exitosamente
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order History */}
                      {orderHistory.length > 0 && (
                        <div className="bg-holy-glow rounded-xl p-4">
                          <h4 className="font-semibold text-navy-devotion mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Historial de la Orden
                          </h4>
                          <div className="space-y-2">
                            {orderHistory.map((update, idx) => (
                              <div key={idx} className="flex items-start gap-3 text-sm pb-2 border-b border-divine-gold border-opacity-10 last:border-0">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                  update.status === 'payment_confirmed' ? 'bg-green-500' :
                                  update.status === 'payment_pending' ? 'bg-orange-500' :
                                  update.status === 'payment_failed' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="font-medium text-navy-devotion">{getStatusText(update.status)}</p>
                                  {update.notes && (
                                    <p className="text-stone-prayer text-xs mt-1">{update.notes}</p>
                                  )}
                                  <p className="text-dove-gray text-xs mt-1">
                                    {new Date(update.timestamp).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;