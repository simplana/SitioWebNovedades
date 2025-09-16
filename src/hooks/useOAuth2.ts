import { useState, useCallback, useEffect } from 'react';
import { APIConnection, APIEndpoint, TestResult, OAuth2Config, TokenResponse } from '../types/api';
import { useDebugLogger } from './useDebugLogger';

const STORAGE_KEY = 'loyverse_oauth2_connections';

// Default Loyverse configuration
const DEFAULT_LOYVERSE_CONFIG: OAuth2Config = {
  clientId: 'dCcISKLUxosXUJvjIcSN',
  clientSecret: '0gimBKgOZ0JgKKK1v_9caB48vpNMz6qp-yMum46iliXspzF-CTTLCg==',
  authUrl: 'https://api.loyverse.com/oauth/authorize',
  tokenUrl: 'https://api.loyverse.com/oauth/token',
  scope: 'ITEMS_READ CUSTOMERS_READ RECEIPTS_READ OPENID',
  redirectUri: 'https://sitio-web-novedades-1f3gm5to1-simplanas-projects.vercel.app/oauth/callback'
};

const DEFAULT_LOYVERSE_ENDPOINTS: APIEndpoint[] = [
  {
    id: 'items',
    name: 'Get Items',
    method: 'GET',
    url: 'https://api.loyverse.com/v1.0/items',
    description: 'Retrieve all items from your Loyverse store'
  },
  {
    id: 'customers',
    name: 'Get Customers',
    method: 'GET',
    url: 'https://api.loyverse.com/v1.0/customers',
    description: 'Retrieve all customers from your Loyverse store'
  },
  {
    id: 'receipts',
    name: 'Get Receipts',
    method: 'GET',
    url: 'https://api.loyverse.com/v1.0/receipts',
    description: 'Retrieve all receipts from your Loyverse store'
  }
];

export const useOAuth2 = () => {
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const logger = useDebugLogger();

  // Load connections from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConnections = JSON.parse(stored);
        setConnections(parsedConnections);
        logger.info('Storage', 'Loaded connections from localStorage', { count: parsedConnections.length });
      } else {
        // Create default Loyverse connection
        const defaultConnection = createDefaultLoyverseConnection();
        setConnections([defaultConnection]);
        logger.info('Storage', 'Created default Loyverse connection');
      }
    } catch (error) {
      logger.error('Storage', 'Failed to load connections from localStorage', error);
    }
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    if (connections.length > 0) {
      try {
        // Don't persist client secrets for security
        const connectionsToStore = connections.map(conn => ({
          ...conn,
          clientSecret: undefined
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(connectionsToStore));
        logger.info('Storage', 'Saved connections to localStorage', { count: connections.length });
      } catch (error) {
        logger.error('Storage', 'Failed to save connections to localStorage', error);
      }
    }
  }, [connections]);

  const createDefaultLoyverseConnection = (): APIConnection => ({
    id: 'loyverse-default',
    name: 'Loyverse API',
    clientId: DEFAULT_LOYVERSE_CONFIG.clientId,
    authUrl: DEFAULT_LOYVERSE_CONFIG.authUrl,
    tokenUrl: DEFAULT_LOYVERSE_CONFIG.tokenUrl,
    scope: DEFAULT_LOYVERSE_CONFIG.scope,
    redirectUri: DEFAULT_LOYVERSE_CONFIG.redirectUri,
    isConnected: false,
    endpoints: DEFAULT_LOYVERSE_ENDPOINTS
  });

  const addConnection = useCallback((connection: Omit<APIConnection, 'id' | 'isConnected'>) => {
    const newConnection: APIConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
      isConnected: false
    };
    
    setConnections(prev => [...prev, newConnection]);
    logger.info('Connection', 'Added new connection', { name: newConnection.name });
    return newConnection.id;
  }, [logger]);

  const updateConnection = useCallback((id: string, updates: Partial<APIConnection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === id ? { ...conn, ...updates } : conn
    ));
    logger.info('Connection', 'Updated connection', { id, updates });
  }, [logger]);

  const deleteConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
    logger.info('Connection', 'Deleted connection', { id });
  }, [logger]);

  const initiateOAuth2Flow = useCallback(async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
      logger.error('OAuth2', 'Connection not found', { connectionId });
      return;
    }

    setIsLoading(true);
    logger.info('OAuth2', 'Starting OAuth2 flow', { connectionId, name: connection.name });

    try {
      // Build authorization URL
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: connection.clientId,
        redirect_uri: connection.redirectUri,
        scope: connection.scope,
        state: connectionId // Use connection ID as state
      });

      const authUrl = `${connection.authUrl}?${authParams.toString()}`;
      logger.info('OAuth2', 'Opening authorization popup', { authUrl });

      // Open popup window
      const popup = window.open(
        authUrl,
        'oauth2_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.');
      }

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        logger.info('OAuth2', 'Received message from popup', event.data);

        if (event.data.type === 'OAUTH_SUCCESS') {
          const { code, state } = event.data;
          if (state === connectionId) {
            exchangeCodeForToken(connectionId, code);
          }
          popup.close();
        } else if (event.data.type === 'OAUTH_ERROR') {
          logger.error('OAuth2', 'OAuth error from popup', event.data.error);
          popup.close();
        }
      };

      window.addEventListener('message', handleMessage);

      // Clean up listener when popup closes
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
          logger.info('OAuth2', 'Popup closed');
        }
      }, 1000);

    } catch (error) {
      logger.error('OAuth2', 'Failed to initiate OAuth2 flow', error);
      setIsLoading(false);
    }
  }, [connections, logger]);

  const exchangeCodeForToken = useCallback(async (connectionId: string, code: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
      logger.error('OAuth2', 'Connection not found for token exchange', { connectionId });
      return;
    }

    logger.info('OAuth2', 'Exchanging code for token', { connectionId });

    try {
      // Use our serverless function for secure token exchange
      const response = await fetch('/api/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          clientId: connection.clientId,
          clientSecret: DEFAULT_LOYVERSE_CONFIG.clientSecret, // Use from config
          tokenUrl: connection.tokenUrl,
          redirectUri: connection.redirectUri
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: TokenResponse = await response.json();
      logger.success('OAuth2', 'Token exchange successful', { 
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in 
      });

      // Update connection with tokens
      const tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      updateConnection(connectionId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        isConnected: true,
        lastTested: new Date().toISOString()
      });

    } catch (error) {
      logger.error('OAuth2', 'Token exchange failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [connections, updateConnection, logger]);

  const testApiEndpoint = useCallback(async (connectionId: string, endpointId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    const endpoint = connection?.endpoints.find(e => e.id === endpointId);
    
    if (!connection || !endpoint) {
      logger.error('API Test', 'Connection or endpoint not found', { connectionId, endpointId });
      return;
    }

    if (!connection.accessToken) {
      logger.error('API Test', 'No access token available', { connectionId });
      return;
    }

    logger.info('API Test', 'Testing endpoint', { 
      connectionId, 
      endpointId, 
      method: endpoint.method, 
      url: endpoint.url 
    });

    const startTime = Date.now();

    try {
      // Use our proxy endpoint to avoid CORS issues
      const response = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: endpoint.method,
          url: endpoint.url,
          headers: {
            'Authorization': `Bearer ${connection.accessToken}`,
            'Accept': 'application/json',
            ...endpoint.headers
          },
          body: endpoint.body
        })
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const result: TestResult = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString(),
        responseTime
      };

      if (response.ok) {
        logger.success('API Test', 'Endpoint test successful', { 
          endpointId, 
          status: response.status,
          responseTime: `${responseTime}ms`
        });
      } else {
        logger.error('API Test', 'Endpoint test failed', { 
          endpointId, 
          status: response.status,
          error: data
        });
      }

      // Update endpoint with result
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? {
              ...conn,
              endpoints: conn.endpoints.map(ep => 
                ep.id === endpointId ? { ...ep, lastResult: result } : ep
              )
            }
          : conn
      ));

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        success: false,
        status: 0,
        statusText: 'Network Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime
      };

      logger.error('API Test', 'Endpoint test error', { endpointId, error });

      // Update endpoint with error result
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? {
              ...conn,
              endpoints: conn.endpoints.map(ep => 
                ep.id === endpointId ? { ...ep, lastResult: result } : ep
              )
            }
          : conn
      ));

      return result;
    }
  }, [connections, logger]);

  const exportConnections = useCallback(() => {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        connections: connections.map(conn => ({
          ...conn,
          accessToken: undefined, // Don't export tokens
          refreshToken: undefined,
          clientSecret: undefined
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loyverse-connections-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.success('Export', 'Connections exported successfully');
    } catch (error) {
      logger.error('Export', 'Failed to export connections', error);
    }
  }, [connections, logger]);

  const importConnections = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.connections && Array.isArray(importData.connections)) {
          const importedConnections = importData.connections.map((conn: any) => ({
            ...conn,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isConnected: false,
            accessToken: undefined,
            refreshToken: undefined
          }));

          setConnections(prev => [...prev, ...importedConnections]);
          logger.success('Import', 'Connections imported successfully', { 
            count: importedConnections.length 
          });
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        logger.error('Import', 'Failed to import connections', error);
      }
    };
    reader.readAsText(file);
  }, [logger]);

  return {
    connections,
    isLoading,
    logger,
    addConnection,
    updateConnection,
    deleteConnection,
    initiateOAuth2Flow,
    testApiEndpoint,
    exportConnections,
    importConnections
  };
};