export interface PagueloFacilPayment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  redirectUrls: {
    success: string;
    cancel: string;
    notify: string;
  };
}

export interface PagueloFacilResponse {
  success: boolean;
  paymentId: string;
  paymentUrl: string;
  paymentCode?: string;
  message?: string;
  error?: string;
}

export interface PagueloFacilStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  paidAt?: string;
}

class PagueloFacilService {
  private functionsBaseUrl: string;
  private demoMode: boolean;

  constructor() {
    this.functionsBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
    this.demoMode = import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL;

    if (this.demoMode && import.meta.env.DEV) {
      console.log('🎭 Paguelo Fácil running in demo mode');
    }
  }

  private getAuthHeaders(): HeadersInit {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!anonKey) {
      console.error('Missing VITE_SUPABASE_ANON_KEY');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey
    };
  }

  async createPayment(paymentData: PagueloFacilPayment): Promise<PagueloFacilResponse> {
    try {
      if (this.demoMode) {
        if (import.meta.env.DEV) {
          console.log('🎭 DEMO MODE - Simulando creación de pago');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const demoPaymentId = `DEMO-${Date.now()}`;
        const demoPaymentUrl = `${window.location.origin}/payment/success?demo=true&orderId=${paymentData.id}&paymentId=${demoPaymentId}`;

        return {
          success: true,
          paymentId: demoPaymentId,
          paymentUrl: demoPaymentUrl,
          message: 'Demo payment created successfully'
        };
      }

      if (import.meta.env.DEV) {
        console.log('🚀 Creating Paguelo Fácil payment via backend');
        console.log('Payment data:', paymentData);
      }

      const headers = this.getAuthHeaders();

      if (import.meta.env.DEV) {
        console.log('Request URL:', `${this.functionsBaseUrl}/paguelo-facil-create-payment`);
        console.log('Request headers:', headers);
      }

      const response = await fetch(`${this.functionsBaseUrl}/paguelo-facil-create-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Payment creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        return {
          success: false,
          paymentId: '',
          paymentUrl: '',
          error: errorData.error || errorText || `Payment service error: ${response.status}`
        };
      }

      const result = await response.json();

      console.log('📥 Raw edge function response:', result);
      console.log('🔗 Extracted URL:', result.url || result.paymentUrl);

      if (!result.success) {
        console.error('Payment creation returned error:', result);
      }

      const mappedResponse = {
        success: result.success,
        paymentId: result.paymentId || '',
        paymentUrl: result.url || result.paymentUrl || '',
        paymentCode: result.paymentCode || result.code,
        message: result.message,
        error: result.error
      };

      console.log('📤 Mapped response:', mappedResponse);
      console.log('✅ Payment URL exists?', !!mappedResponse.paymentUrl);

      return mappedResponse;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error creating payment:', error);
      }
      return {
        success: false,
        paymentId: '',
        paymentUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PagueloFacilStatus> {
    try {
      if (this.demoMode || paymentId.startsWith('DEMO-')) {
        if (import.meta.env.DEV) {
          console.log('🎭 DEMO MODE - Simulando verificación de pago');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
          paymentId: paymentId,
          status: 'completed',
          amount: 1.00,
          currency: 'USD',
          transactionId: `TXN-${Date.now()}`,
          paidAt: new Date().toISOString()
        };
      }

      if (import.meta.env.DEV) {
        console.log('🔍 Checking payment status via backend');
      }

      const headers = this.getAuthHeaders();
      const response = await fetch(`${this.functionsBaseUrl}/paguelo-facil-get-status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ paymentId })
      });

      if (!response.ok) {
        throw new Error(`Payment status check failed: ${response.status}`);
      }

      const status: PagueloFacilStatus = await response.json();
      return status;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error checking payment status:', error);
      }
      throw error;
    }
  }
}

export const pagueloFacilService = new PagueloFacilService();
export default pagueloFacilService;
