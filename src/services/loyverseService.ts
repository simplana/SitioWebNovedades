import { APIConnection, TestResult } from '../types/api';

export class LoyverseService {
  private baseUrl = 'https://api.loyverse.com/v1.0';

  async makeRequest(
    endpoint: string, 
    accessToken: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch('/api/test-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getItems(accessToken: string, limit: number = 50, cursor?: string) {
    let endpoint = `/items?limit=${limit}`;
    if (cursor) {
      endpoint += `&cursor=${cursor}`;
    }
    return this.makeRequest(endpoint, accessToken);
  }

  async getCustomers(accessToken: string, limit: number = 50, cursor?: string) {
    let endpoint = `/customers?limit=${limit}`;
    if (cursor) {
      endpoint += `&cursor=${cursor}`;
    }
    return this.makeRequest(endpoint, accessToken);
  }

  async getReceipts(accessToken: string, limit: number = 50, cursor?: string) {
    let endpoint = `/receipts?limit=${limit}`;
    if (cursor) {
      endpoint += `&cursor=${cursor}`;
    }
    return this.makeRequest(endpoint, accessToken);
  }

  async getStores(accessToken: string) {
    return this.makeRequest('/stores', accessToken);
  }

  async getCategories(accessToken: string) {
    return this.makeRequest('/categories', accessToken);
  }
}

export const loyverseService = new LoyverseService();