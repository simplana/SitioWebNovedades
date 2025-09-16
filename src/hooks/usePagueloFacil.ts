import { useState } from 'react';
import { pagueloFacilService, PagueloFacilPayment, PagueloFacilResponse } from '../services/pagueloFacilService';
import { CartItem } from './useCart';

export interface PaymentData {
  orderId: string;
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  total: number;
}

export const usePagueloFacil = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (paymentData: PaymentData): Promise<PagueloFacilResponse> => {
    setLoading(true);
    setError(null);

    try {
      const pagueloPayment: PagueloFacilPayment = {
        id: paymentData.orderId,
        amount: paymentData.total,
        currency: 'USD',
        description: `Compra en Novedades Católicas - Orden ${paymentData.orderId}`,
        customer: paymentData.customer,
        items: paymentData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        redirectUrls: {
          success: `${window.location.origin}/payment/success?orderId=${paymentData.orderId}`,
          cancel: `${window.location.origin}/payment/cancel?orderId=${paymentData.orderId}`,
          notify: `${window.location.origin}/api/webhooks/paguelo-facil`
        }
      };

      const response = await pagueloFacilService.createPayment(pagueloPayment);
      
      if (!response.success) {
        throw new Error(response.error || 'Error creating payment');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error processing payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const status = await pagueloFacilService.getPaymentStatus(paymentId);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error checking payment status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateDirectPaymentUrl = (amount: number, description: string, reference: string): string => {
    return pagueloFacilService.generatePaymentUrl(amount, description, reference);
  };

  return {
    createPayment,
    checkPaymentStatus,
    generateDirectPaymentUrl,
    loading,
    error
  };
};