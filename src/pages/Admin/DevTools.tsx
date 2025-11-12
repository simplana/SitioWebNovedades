import React, { useState } from 'react';
import { Settings, Zap, CheckCircle, XCircle, LogIn, LogOut, AlertTriangle, Database, RefreshCw, Info } from 'lucide-react';
import { useOAuth2 } from '../../hooks/useOAuth2';
import PagueloFacilTestButton from '../../components/PagueloFacilTestButton';

const DevTools = () => {
  const {
    isConnected,
    loading,
    error,
    tokenExpiry,
    initiateOAuth2Flow,
    disconnect,
  } = useOAuth2();

  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showFullTokens, setShowFullTokens] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  const isTokenExpired = tokenExpiry ? Date.now() >= new Date(tokenExpiry).getTime() : false;

  const fetchTokenDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loyverse-token-refresh?action=details`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      const data = await response.json();
      setTokenDetails(data.credentials);
    } catch (err) {
      console.error('Error fetching token details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const testRefreshToken = async (force: boolean) => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loyverse-token-refresh?force=${force}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      const data = await response.json();
      setRefreshResult(data);
    } catch (err: any) {
      setRefreshResult({ error: err.message });
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (isConnected) {
      fetchTokenDetails();
    }
  }, [isConnected]);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h2 className="font-playfair text-2xl font-bold text-navy">
          Herramientas de Desarrollo
        </h2>
      </div>

      {/* Loyverse OAuth2 Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-600 text-white p-2 rounded-lg text-sm font-bold">
            Loyverse
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            OAuth2 Authentication
          </h3>
          {isConnected && !isTokenExpired && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {isConnected && isTokenExpired && (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          {!isConnected && (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Estado de Conexión:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={`font-semibold ${
                  isConnected 
                    ? (isTokenExpired ? 'text-yellow-600' : 'text-green-600')
                    : 'text-red-600'
                }`}>
                  {isConnected 
                    ? (isTokenExpired ? 'Token Expirado' : 'Conectado')
                    : 'Desconectado'
                  }
                </span>
              </div>
              {tokenExpiry && (
                <div className="flex justify-between">
                  <span>Expira:</span>
                  <span className="text-xs">
                    {new Date(tokenExpiry).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                onClick={initiateOAuth2Flow}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Conectar con Loyverse</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <LogOut className="h-4 w-4" />
                <span>Desconectar</span>
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <strong>Instrucciones:</strong> Haz clic en "Conectar con Loyverse" para abrir una ventana popup
                donde podrás autorizar el acceso a tu cuenta de Loyverse. Las credenciales se guardarán
                de forma segura en el servidor y podrás ver los productos reales en la sección de productos.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Details Panel */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Detalles de Conexión
              </h3>
            </div>
            <button
              onClick={fetchTokenDetails}
              disabled={loadingDetails}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loadingDetails ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : tokenDetails ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Connection ID</div>
                  <div className="text-sm font-mono text-gray-900 break-all">{tokenDetails.connection_id}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Estado</div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      tokenDetails.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tokenDetails.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Creado</div>
                  <div className="text-sm text-gray-900">
                    {new Date(tokenDetails.created_at).toLocaleString('es-ES')}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Última Actualización</div>
                  <div className="text-sm text-gray-900">
                    {new Date(tokenDetails.updated_at).toLocaleString('es-ES')}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Expira</div>
                  <div className="text-sm text-gray-900">
                    {new Date(tokenDetails.token_expiry).toLocaleString('es-ES')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isTokenExpired ? (
                      <span className="text-red-600 font-semibold">⚠️ Expirado</span>
                    ) : (
                      `En ${Math.floor((new Date(tokenDetails.token_expiry).getTime() - Date.now()) / (1000 * 60 * 60))} horas`
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Último Refresh</div>
                  <div className="text-sm text-gray-900">
                    {tokenDetails.last_refreshed_at
                      ? new Date(tokenDetails.last_refreshed_at).toLocaleString('es-ES')
                      : 'Nunca'}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-start space-x-2 mb-2">
                  <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-yellow-800 mb-2">Tokens de Acceso</div>
                    <button
                      onClick={() => setShowFullTokens(!showFullTokens)}
                      className="text-xs text-yellow-700 underline hover:text-yellow-900"
                    >
                      {showFullTokens ? 'Ocultar tokens completos' : 'Mostrar tokens completos'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Access Token</div>
                    <div className="text-xs font-mono bg-white p-2 rounded border border-yellow-300 break-all">
                      {showFullTokens ? tokenDetails.access_token : `${tokenDetails.access_token.substring(0, 40)}...`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Refresh Token</div>
                    <div className="text-xs font-mono bg-white p-2 rounded border border-yellow-300 break-all">
                      {showFullTokens ? tokenDetails.refresh_token : `${tokenDetails.refresh_token.substring(0, 40)}...`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No se encontraron detalles de conexión
            </div>
          )}
        </div>
      )}

      {/* Refresh Token Test Panel */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center space-x-3 mb-4">
            <RefreshCw className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Prueba de Refresh Token
            </h3>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="text-xs text-purple-800">
                  <strong>Información:</strong> El refresh automático ocurre cuando el token expira en menos de 24 horas.
                  Puedes probar manualmente el proceso de refresh aquí.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => testRefreshToken(false)}
                disabled={refreshing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  refreshing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 transform hover:scale-105'
                } text-white`}
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Probar Refresh (Solo si expira pronto)</span>
              </button>

              <button
                onClick={() => testRefreshToken(true)}
                disabled={refreshing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  refreshing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 transform hover:scale-105'
                } text-white`}
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                <span>Forzar Refresh Ahora</span>
              </button>
            </div>

            {refreshResult && (
              <div className={`rounded-lg p-4 border-2 ${
                refreshResult.success
                  ? 'bg-green-50 border-green-300'
                  : refreshResult.error
                  ? 'bg-red-50 border-red-300'
                  : 'bg-blue-50 border-blue-300'
              }`}>
                <div className="flex items-start space-x-2 mb-3">
                  {refreshResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : refreshResult.error ? (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold mb-2 ${
                      refreshResult.success ? 'text-green-800' : refreshResult.error ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      {refreshResult.message || refreshResult.error || 'Resultado'}
                    </div>
                    <div className="text-sm space-y-1">
                      {Object.entries(refreshResult).map(([key, value]) => {
                        if (key === 'message' || key === 'error' || key === 'success') return null;
                        return (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="font-mono font-semibold">{key}:</span>
                            <span className="font-mono ml-2 break-all max-w-md">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paguelo Fácil Test Section */}
      <PagueloFacilTestButton />
    </div>
  );
};

export default DevTools;