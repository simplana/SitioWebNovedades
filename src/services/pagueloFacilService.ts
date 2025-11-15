// Paguelo Fácil API Service
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
  private accessToken: string;
  private apiUrl: string;
  private testMode: boolean;
  private demoMode: boolean;

  constructor() {
    this.accessToken = import.meta.env.VITE_PAGUELO_FACIL_ACCESS_TOKEN;
    this.apiUrl = import.meta.env.VITE_PAGUELO_FACIL_API_URL || 'https://sandbox.paguelofacil.com';
    this.testMode = import.meta.env.DEV || false;
    this.demoMode = !this.accessToken || this.accessToken === 'your-paguelo-facil-token-here';
    
    if (!this.accessToken) {
      console.warn('Paguelo Fácil access token not found. Please check your environment variables.');
    }
  }

  // Método de prueba para verificar la integración
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (this.demoMode) {
        if (import.meta.env.DEV) {
          console.log('🎭 DEMO MODE - Simulando conexión exitosa con Paguelo Fácil');
        }
        return {
          success: true,
          message: 'Modo demostración - Conexión simulada exitosa',
          details: {
            paymentId: `DEMO-${Date.now()}`,
            paymentUrl: `${window.location.origin}/payment/success?demo=true&orderId=DEMO-${Date.now()}`,
            testAmount: '$1.00 USD',
            mode: 'DEMO'
          }
        };
      }

      if (import.meta.env.DEV) {
        console.log('🧪 TESTING PAGUELO FÁCIL CONNECTION');
        console.log('📋 Configuration:');
        console.log('  - API URL:', this.apiUrl);
        console.log('  - Test Mode:', this.testMode);
      }
      
      // Primero probar un endpoint simple para validar el token
      if (import.meta.env.DEV) {
        console.log('🔍 Testing token validity...');
      }
      const tokenTest = await this.testTokenValidity();
      
      if (!tokenTest.valid) {
        return {
          success: false,
          message: `Token inválido: ${tokenTest.error}`,
          details: tokenTest
        };
      }
      
      // Crear un pago de prueba
      const testPayment: PagueloFacilPayment = {
        id: `TEST-${Date.now()}`,
        amount: 1.00, // $1.00 para prueba
        currency: 'USD',
        description: 'Prueba de integración - Novedades Católicas',
        customer: {
          name: 'Cliente de Prueba',
          email: 'test@novedadescatolicas.com',
          phone: '+507 6000-0000'
        },
        items: [{
          name: 'Producto de Prueba',
          quantity: 1,
          price: 1.00,
          sku: 'TEST-001'
        }],
        redirectUrls: {
          success: `${window.location.origin}/payment/success?test=true`,
          cancel: `${window.location.origin}/payment/cancel?test=true`,
          notify: `${window.location.origin}/api/webhooks/paguelo-facil`
        }
      };

      if (import.meta.env.DEV) {
        console.log('🚀 Creating test payment...');
      }
      const response = await this.createPayment(testPayment);
      
      if (response.success) {
        if (import.meta.env.DEV) {
          console.log('✅ TEST SUCCESSFUL!');
        }
        return {
          success: true,
          message: 'Conexión exitosa con Paguelo Fácil',
          details: {
            paymentId: response.paymentId,
            paymentUrl: response.paymentUrl,
            testAmount: '$1.00 USD'
          }
        };
      } else {
        if (import.meta.env.DEV) {
          console.log('❌ TEST FAILED!');
        }
        return {
          success: false,
          message: `Error en la conexión: ${response.error}`,
          details: response
        };
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ TEST CONNECTION ERROR:', error);
      }
      return {
        success: false,
        message: `Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
    }
  }

  // Método para probar la validez del token
  private async testTokenValidity(): Promise<{ valid: boolean; error?: string; details?: any }> {
    try {
      if (import.meta.env.DEV) {
        console.log('🔑 Testing token with different API endpoints...');
      }
      
      // Probar diferentes URLs de API de Paguelo Fácil
      const apiUrls = [
        'https://api.paguelofacil.com',
        'https://sandbox.paguelofacil.com', 
        'https://app.paguelofacil.com/api',
        'https://paguelofacil.com/api'
      ];
      
      for (const apiUrl of apiUrls) {
        if (import.meta.env.DEV) {
          console.log(`🌐 Testing API URL: ${apiUrl}`);
        }
        
        try {
          const response = await fetch(`${apiUrl}/v1/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (import.meta.env.DEV) {
            console.log(`📡 Response status: ${response.status}`);
          }
          
          if (response.ok) {
            const data = await response.json();
            if (import.meta.env.DEV) {
              console.log('✅ Token válido con URL:', apiUrl);
            }
            this.apiUrl = apiUrl; // Actualizar URL correcta
            return { valid: true, details: data };
          } else {
            const errorData = await response.json().catch(() => ({}));
            if (import.meta.env.DEV) {
              console.log(`❌ Error with ${apiUrl}:`, errorData);
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.log(`❌ Network error with ${apiUrl}:`, error);
          }
        }
      }
      
      return { 
        valid: false, 
        error: 'No se pudo validar el token con ninguna URL de API' 
      };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }
  
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Paguelo Fácil access token is not configured');
    }

    try {
      if (import.meta.env.DEV) {
        console.log(`🚀 Making request to: ${this.apiUrl}${endpoint}`);
      }

      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (import.meta.env.DEV) {
        console.log(`📡 Response status: ${response.status}`);
      }

      if (!response.ok) {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(errorData.message || `Paguelo Fácil API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to Paguelo Fácil API. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Crear un nuevo pago
  async createPayment(paymentData: PagueloFacilPayment): Promise<PagueloFacilResponse> {
    try {
      if (this.demoMode) {
        if (import.meta.env.DEV) {
          console.log('🎭 DEMO MODE - Simulando creación de pago');
        }
        
        // Simular delay de API
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
        console.log('🚀 Creating Paguelo Fácil payment');
      }
      
      const response = await this.makeRequest('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          description: paymentData.description,
          reference: paymentData.id,
          customer: paymentData.customer,
          items: paymentData.items,
          redirect_urls: paymentData.redirectUrls,
          metadata: {
            source: 'novedades-catolicas',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (import.meta.env.DEV) {
        console.log('✅ Paguelo Fácil payment created');
      }
      
      return {
        success: true,
        paymentId: response.id || response.payment_id,
        paymentUrl: response.payment_url || response.checkout_url,
        message: 'Payment created successfully'
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error creating Paguelo Fácil payment:', error);
      }
      return {
        success: false,
        paymentId: '',
        paymentUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Verificar el estado de un pago
  async getPaymentStatus(paymentId: string): Promise<PagueloFacilStatus> {
    try {
      if (this.demoMode || paymentId.startsWith('DEMO-')) {
        if (import.meta.env.DEV) {
          console.log('🎭 DEMO MODE - Simulando verificación de pago');
        }
        
        // Simular delay de API
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
        console.log('🔍 Checking payment status for:', paymentId);
      }
      
      const response = await this.makeRequest(`/v1/payments/${paymentId}`);
      
      return {
        paymentId: response.id,
        status: this.mapPaymentStatus(response.status),
        amount: response.amount,
        currency: response.currency,
        transactionId: response.transaction_id,
        paidAt: response.paid_at
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error checking payment status:', error);
      }
      throw error;
    }
  }

  // Mapear estados de Paguelo Fácil a nuestros estados
  private mapPaymentStatus(status: string): PagueloFacilStatus['status'] {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
        return 'completed';
      case 'pending':
      case 'processing':
        return 'pending';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  // Generar URL de pago directo (método simplificado)
  generatePaymentUrl(amount: number, description: string, reference: string): string {
    const params = new URLSearchParams({
      amount: amount.toString(),
      currency: 'USD',
      description: description,
      reference: reference,
      access_token: this.accessToken
    });
    
    return `${this.apiUrl}/checkout?${params.toString()}`;
  }

  // Validar webhook de Paguelo Fácil
  validateWebhook(payload: any, signature: string): boolean {
    // Implementar validación de webhook según documentación de Paguelo Fácil
    // Por ahora retornamos true, pero en producción debe validar la firma
    if (import.meta.env.DEV) {
      console.log('🔐 Validating webhook');
    }
    return true;
  }
}

export const pagueloFacilService = new PagueloFacilService();
export default pagueloFacilService;