import { useState, useCallback, useEffect } from 'react';
import { APIConnection, APIEndpoint, TestResult, OAuth2Config, TokenResponse } from '../types/api';
import { useDebugLogger } from './useDebugLogger';

const STORAGE_KEY = 'loyverse_oauth2_connections_enhanced';

// Configuración mejorada de Loyverse con tu dominio de Vercel
const LOYVERSE_CONFIG: OAuth2Config = {
  clientId: 'dCcISKLUxosXUJvjIcSN',
  clientSecret: '0gimBKgOZ0JgKKK1v_9caB48vpNMz6qp-yMum46iliXspzF-CTTLCg==',
  authUrl: 'https://api.loyverse.com/oauth/authorize',
  tokenUrl: 'https://api.loyverse.com/oauth/token',
  scope: 'ITEMS_READ CUSTOMERS_READ RECEIPTS_READ INVENTORY_READ OPENID',
  redirectUri: 'https://sitio-web-novedades-1f3gm5to1-simplanas-projects.vercel.app/oauth/callback'
};

const LOYVERSE_ENDPOINTS: APIEndpoint[] = [
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
  },
  {
    id: 'inventory',
    name: 'Get Inventory',
    method: 'GET',
    url: 'https://api.loyverse.com/v1.0/inventory',
    description: 'Retrieve inventory information'
  }
];

export const useOAuth2Enhanced = () => {
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const logger = useDebugLogger();

  // Cargar conexiones desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConnections = JSON.parse(stored);
        setConnections(parsedConnections);
        
        // Verificar si hay una conexión autenticada
        const authenticatedConnection = parsedConnections.find((conn: APIConnection) => 
          conn.isConnected && conn.accessToken && !isTokenExpired(conn.tokenExpiry)
        );
        setIsAuthenticated(!!authenticatedConnection);
        
        logger.info('Storage', 'Loaded connections from localStorage', { 
          count: parsedConnections.length,
          authenticated: !!authenticatedConnection
        });
      } else {
        // Crear conexión por defecto de Loyverse
        const defaultConnection = createDefaultLoyverseConnection();
        setConnections([defaultConnection]);
        logger.info('Storage', 'Created default Loyverse connection');
      }
    } catch (error) {
      logger.error('Storage', 'Failed to load connections from localStorage', error);
    }
  }, []);

  // Guardar conexiones en localStorage cuando cambien
  useEffect(() => {
    if (connections.length > 0) {
      try {
        // No persistir client secrets por seguridad
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
    id: 'loyverse-enhanced',
    name: 'Loyverse API (Enhanced)',
    clientId: LOYVERSE_CONFIG.clientId,
    authUrl: LOYVERSE_CONFIG.authUrl,
    tokenUrl: LOYVERSE_CONFIG.tokenUrl,
    scope: LOYVERSE_CONFIG.scope,
    redirectUri: LOYVERSE_CONFIG.redirectUri,
    isConnected: false,
    endpoints: LOYVERSE_ENDPOINTS
  });

  const isTokenExpired = (tokenExpiry?: number): boolean => {
    if (!tokenExpiry) return true;
    return Date.now() >= tokenExpiry;
  };

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
    setConnections(prev => prev.map(conn => {
      if (conn.id === id) {
        const updatedConn = { ...conn, ...updates };
        
        // Verificar si la conexión está autenticada
        if (updatedConn.isConnected && updatedConn.accessToken && !isTokenExpired(updatedConn.tokenExpiry)) {
          setIsAuthenticated(true);
        }
        
        return updatedConn;
      }
      return conn;
    }));
    logger.info('Connection', 'Updated connection', { id, updates });
  }, [logger]);

  const deleteConnection = useCallback((id: string) => {
    setConnections(prev => {
      const newConnections = prev.filter(conn => conn.id !== id);
      
      // Verificar si aún hay conexiones autenticadas
      const hasAuthenticatedConnection = newConnections.some(conn => 
        conn.isConnected && conn.accessToken && !isTokenExpired(conn.tokenExpiry)
      );
      setIsAuthenticated(hasAuthenticatedConnection);
      
      return newConnections;
    });
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
      // Construir URL de autorización
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: connection.clientId,
        redirect_uri: connection.redirectUri,
        scope: connection.scope,
        state: connectionId // Usar connection ID como state
      });

      const authUrl = `${connection.authUrl}?${authParams.toString()}`;
      logger.info('OAuth2', 'Opening authorization popup', { authUrl });

      // Abrir ventana popup
      const popup = window.open(
        authUrl,
        'oauth2_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.');
      }

      // Escuchar mensajes del popup
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
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Limpiar listener cuando se cierre el popup
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
      // Usar función serverless para intercambio seguro de tokens
      const response = await fetch('/api/loyverse-token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          clientId: connection.clientId,
          clientSecret: LOYVERSE_CONFIG.clientSecret,
          tokenUrl: connection.tokenUrl,
          redirectUri: connection.redirectUri
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: TokenResponse = await response.json();
      logger.success('OAuth2', 'Token exchange successful', { 
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in 
      });

      // Actualizar conexión con tokens
      const tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      updateConnection(connectionId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        isConnected: true,
        lastTested: new Date().toISOString()
      });

      setIsAuthenticated(true);

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
      // Usar proxy endpoint para evitar problemas de CORS
      const response = await fetch('/api/loyverse-test-endpoint', {
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

      // Actualizar endpoint con resultado
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

      // Actualizar endpoint con resultado de error
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
          accessToken: undefined, // No exportar tokens
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

  const getAuthenticatedConnection = useCallback((): APIConnection | null => {
    return connections.find(conn => 
      conn.isConnected && conn.accessToken && !isTokenExpired(conn.tokenExpiry)
    ) || null;
  }, [connections]);

  const refreshToken = useCallback(async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection || !connection.refreshToken) {
      logger.error('OAuth2', 'Cannot refresh token - connection or refresh token not found', { connectionId });
      return false;
    }

    try {
      logger.info('OAuth2', 'Refreshing access token', { connectionId });

      const response = await fetch('/api/loyverse-refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: connection.refreshToken,
          clientId: connection.clientId,
          clientSecret: LOYVERSE_CONFIG.clientSecret,
          tokenUrl: connection.tokenUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: TokenResponse = await response.json();
      logger.success('OAuth2', 'Token refresh successful');

      // Actualizar conexión con nuevos tokens
      const tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      updateConnection(connectionId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || connection.refreshToken,
        tokenExpiry,
        isConnected: true,
        lastTested: new Date().toISOString()
      });

      return true;
    } catch (error) {
      logger.error('OAuth2', 'Token refresh failed', error);
      
      // Marcar conexión como desconectada
      updateConnection(connectionId, {
        isConnected: false,
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiry: undefined
      });
      
      setIsAuthenticated(false);
      return false;
    }
  }, [connections, updateConnection, logger]);

  const disconnectLoyverse = useCallback(() => {
    const loyverseConnection = connections.find(conn => conn.name.includes('Loyverse'));
    if (loyverseConnection) {
      updateConnection(loyverseConnection.id, {
        isConnected: false,
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiry: undefined
      });
      setIsAuthenticated(false);
      logger.info('OAuth2', 'Disconnected from Loyverse');
    }
  }, [connections, updateConnection, logger]);

  return {
    connections,
    isLoading,
    isAuthenticated,
    logger,
    addConnection,
    updateConnection,
    deleteConnection,
    initiateOAuth2Flow,
    testApiEndpoint,
    exportConnections,
    importConnections,
    getAuthenticatedConnection,
    refreshToken,
    disconnectLoyverse
  };
};