import { useState, useEffect } from 'react';
import { usePagueloFacil } from './usePagueloFacil';

export interface OrderStatusUpdate {
  orderId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_pending' | 'payment_confirmed' | 'payment_failed';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  timestamp: string;
}

export const useOrderStatus = () => {
  const [statusUpdates, setStatusUpdates] = useState<OrderStatusUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const { checkPaymentStatus } = usePagueloFacil();

  // Cargar actualizaciones de estado desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('order_status_updates');
    if (stored) {
      try {
        setStatusUpdates(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading status updates:', error);
      }
    }
  }, []);

  // Guardar actualizaciones en localStorage
  const saveStatusUpdates = (updates: OrderStatusUpdate[]) => {
    try {
      localStorage.setItem('order_status_updates', JSON.stringify(updates));
      setStatusUpdates(updates);
    } catch (error) {
      console.error('Error saving status updates:', error);
    }
  };

  // Verificar estado de pago con Paguelo Fácil
  const checkPagueloFacilPayment = async (orderId: string, paymentId: string) => {
    try {
      setLoading(true);
      const paymentStatus = await checkPaymentStatus(paymentId);
      
      const statusUpdate: OrderStatusUpdate = {
        orderId,
        status: paymentStatus.status === 'completed' ? 'payment_confirmed' : 'payment_pending',
        paymentStatus: paymentStatus.status,
        timestamp: new Date().toISOString(),
        notes: `Pago ${paymentStatus.status === 'completed' ? 'confirmado' : 'pendiente'} - Paguelo Fácil`
      };

      const updatedStatuses = [...statusUpdates, statusUpdate];
      saveStatusUpdates(updatedStatuses);
      
      return paymentStatus;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de orden manualmente
  const updateOrderStatus = (update: Omit<OrderStatusUpdate, 'timestamp'>) => {
    const statusUpdate: OrderStatusUpdate = {
      ...update,
      timestamp: new Date().toISOString()
    };

    const updatedStatuses = [...statusUpdates, statusUpdate];
    saveStatusUpdates(updatedStatuses);
  };

  // Obtener último estado de una orden
  const getLatestOrderStatus = (orderId: string): OrderStatusUpdate | null => {
    const orderUpdates = statusUpdates
      .filter(update => update.orderId === orderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return orderUpdates[0] || null;
  };

  // Obtener historial completo de una orden
  const getOrderHistory = (orderId: string): OrderStatusUpdate[] => {
    return statusUpdates
      .filter(update => update.orderId === orderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Obtener texto descriptivo del estado
  const getStatusText = (status: string): string => {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'payment_pending': 'Esperando Pago',
      'payment_confirmed': 'Pago Confirmado',
      'payment_failed': 'Pago Fallido',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusTexts[status] || status;
  };

  // Obtener color del estado
  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'payment_pending': 'bg-orange-100 text-orange-800',
      'payment_confirmed': 'bg-green-100 text-green-800',
      'payment_failed': 'bg-red-100 text-red-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return {
    statusUpdates,
    loading,
    checkPagueloFacilPayment,
    updateOrderStatus,
    getLatestOrderStatus,
    getOrderHistory,
    getStatusText,
    getStatusColor
  };
};