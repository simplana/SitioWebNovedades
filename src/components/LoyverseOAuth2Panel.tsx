import React, { useState } from 'react';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  Key, 
  ExternalLink, 
  RefreshCw, 
  LogOut,
  TestTube,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useOAuth2Enhanced } from '../hooks/useOAuth2Enhanced';
import ApiConnectionCard from './ApiConnectionCard';

const LoyverseOAuth2Panel: React.FC = () => {
  const {
    connections,
    isLoading,
    isAuthenticated,
    logger,
    initiateOAuth2Flow,
    testApiEndpoint,
    disconnectLoyverse,
    getAuthenticatedConnection
  } = useOAuth2Enhanced();

  const [showDebug, setShowDebug] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const loyverseConnection = connections.find(conn => conn.name.includes('Loyverse'));
  const authenticatedConnection = getAuthenticatedConnection();

  const handleConnect = async () => {
    if (loyverseConnection) {
      await initiateOAuth2Flow(loyverseConnection.id);
    }
  };

  const handleTestEndpoint = async (endpointId: string) => {
    if (loyverseConnection) {
      setTestingEndpoint(endpointId);
      await testApiEndpoint(loyverseConnection.id, endpointId);
      setTestingEndpoint(null);
    }
  };

  const handleDisconnect = () => {
    if (confirm('¿Estás seguro de que quieres desconectar Loyverse? Tendrás que volver a autorizar.')) {
      disconnectLoyverse();
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de Conexión */}
      <div className={`rounded-lg p-6 border-2 ${
        isAuthenticated 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-full ${
            isAuthenticated ? 'bg-green-500' : 'bg-blue-600'
          }`}>
            {isAuthenticated ? (
              <CheckCircle className="h-5 w-5 text-white" />
            ) : (
              <ShoppingCart className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {isAuthenticated ? 'Loyverse OAuth2 Conectado' : 'Conectar con Loyverse OAuth2'}
            </h3>
            <p className="text-sm text-gray-600">
              {isAuthenticated 
                ? 'API de Loyverse lista para usar' 
                : 'Autoriza el acceso a tu tienda Loyverse'
              }
            </p>
          </div>
        </div>

        {/* Información de la conexión autenticada */}
        {authenticatedConnection && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Detalles de la Conexión</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Client ID:</span>
                <p className="font-mono text-xs">{authenticatedConnection.clientId.substring(0, 12)}...</p>
              </div>
              <div>
                <span className="text-gray-600">Token expira:</span>
                <p className="text-xs">
                  {authenticatedConnection.tokenExpiry 
                    ? new Date(authenticatedConnection.tokenExpiry).toLocaleString()
                    : 'No disponible'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <Key className="h-4 w-4" />
              <span>{isLoading ? 'Conectando...' : 'Conectar OAuth2'}</span>
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Desconectar</span>
            </button>
          )}

          <a
            href="https://api.loyverse.com/oauth/authorize"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Ver Loyverse OAuth</span>
          </a>

          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              showDebug
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
            }`}
          >
            <TestTube className="h-4 w-4" />
            <span>Debug</span>
            {logger.logs.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {logger.logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Información importante */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Importante:</strong> OAuth2 requiere HTTPS. En desarrollo local, 
              usa productos de demostración. En producción (Vercel), OAuth2 funcionará automáticamente.
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Testing de Endpoints */}
      {isAuthenticated && loyverseConnection && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">
            Probar Endpoints de Loyverse
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loyverseConnection.endpoints.map((endpoint) => (
              <div key={endpoint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-800">{endpoint.name}</h4>
                    <p className="text-sm text-gray-600">{endpoint.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {endpoint.method}
                  </span>
                </div>

                <div className="mb-3">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                    {endpoint.url}
                  </code>
                </div>

                {endpoint.lastResult && (
                  <div className="mb-3 text-xs">
                    <div className={`flex items-center space-x-2 ${
                      endpoint.lastResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {endpoint.lastResult.success ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>
                        {endpoint.lastResult.status} - {endpoint.lastResult.responseTime}ms
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleTestEndpoint(endpoint.id)}
                  disabled={testingEndpoint === endpoint.id}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-md transition-colors text-sm"
                >
                  {testingEndpoint === endpoint.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Probando...</span>
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      <span>Probar</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-gray-900 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Debug Logs</h3>
            <div className="flex space-x-2">
              <button
                onClick={logger.clearLogs}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logger.logs.slice(0, 10).map((log) => (
              <div key={log.id} className="text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.level === 'error' ? 'bg-red-600' :
                    log.level === 'warn' ? 'bg-yellow-600' :
                    log.level === 'success' ? 'bg-green-600' :
                    'bg-blue-600'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-gray-400">{log.category}</span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
                {log.data && (
                  <pre className="mt-1 ml-4 text-gray-400 text-xs overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyverseOAuth2Panel;