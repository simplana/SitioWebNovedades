// Loyverse API service
const LOYVERSE_API_BASE = 'https://api.loyverse.com/v1.0';

export class LoyverseService {
  private accessToken: string;

  constructor() {
    this.accessToken = import.meta.env.VITE_LOYVERSE_ACCESS_TOKEN;
    
    if (!this.accessToken) {
      console.warn('Loyverse access token not found. Please check your environment variables.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Loyverse access token is not configured');
    }

    try {
      const response = await fetch(`${LOYVERSE_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid or expired Loyverse access token');
        }
        throw new Error(`Loyverse API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to Loyverse API. Please check your internet connection and access token.');
      }
      throw error;
    }
  }

  async getItems(limit: number = 50) {
    return this.makeRequest(`/items?limit=${limit}`);
  }

  async getItem(itemId: string) {
    return this.makeRequest(`/items/${itemId}`);
  }

  async getCategories() {
    return this.makeRequest('/categories');
  }
}

export const loyverseService = new LoyverseService();