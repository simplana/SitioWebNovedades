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
  const MOCK_MODE = true; // Cambiar a false cuando Paguelo Facil esté activo

  const createPayment = async (paymentData: PaymentData): Promise<PagueloFacilResponse> => {
    setLoading(true);
    setError(null);

    try {
      // MOCK MODE - Simula respuesta exitosa
      if (MOCK_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay de red

        const mockPaymentId = `MOCK_${Date.now()}`;
        const mockResponse: PagueloFacilResponse = {
          success: true,
          paymentId: mockPaymentId,
          paymentUrl: `${window.location.origin}/payment/success?orderId=${paymentData.orderId}&mock=true`,
          message: 'Mock payment created successfully'
        };

        return mockResponse;
      }

      // REAL MODE - Usa el servicio real
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
          notify: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paguelo-facil-webhook`
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
      // MOCK MODE - Simula estado aprobado
      if (MOCK_MODE) {
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
          success: true,
          status: 'approved',
          paymentId: paymentId,
          message: 'Mock payment approved'
        };
      }

      // REAL MODE
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

  return {
    createPayment,
    checkPaymentStatus,
    loading,
    error
  };
};