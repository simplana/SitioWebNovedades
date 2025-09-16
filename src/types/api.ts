export interface APIConnection {
  id: string;
  name: string;
  clientId: string;
  clientSecret?: string; // Only stored temporarily, never persisted
  authUrl: string;
  tokenUrl: string;
  scope: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  isConnected: boolean;
  lastTested?: string;
  endpoints: APIEndpoint[];
}

export interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  description: string;
  headers?: Record<string, string>;
  body?: string;
  lastResult?: TestResult;
}

export interface TestResult {
  success: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: string;
  timestamp: string;
  responseTime: number;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}