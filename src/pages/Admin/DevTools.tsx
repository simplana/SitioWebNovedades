import React, { useState } from 'react';
import { Settings, Zap, CheckCircle, XCircle, LogIn, LogOut, AlertTriangle, Key } from 'lucide-react';
import { useOAuth2 } from '../../hooks/useOAuth2';
import PagueloFacilTestButton from '../../components/PagueloFacilTestButton';

const DevTools = () => {
  const {
    isConnected,
    loading,
    error,
    accessToken,
    tokenExpiry,
    initiateOAuth2Flow,
    disconnect,
    setTokensManually
  } = useOAuth2();

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAccessToken, setManualAccessToken] = useState('');
  const [manualRefreshToken, setManualRefreshToken] = useState('');

  const isTokenExpired = tokenExpiry ? Date.now() >= tokenExpiry : false;

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
              {accessToken && (
                <div className="flex justify-between">
                  <span>Token:</span>
                  <span className="font-mono text-xs">
                    {accessToken.substring(0, 20)}...
                  </span>
                </div>
              )}
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
            {!isConnected || isTokenExpired ? (
              <>
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
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <Key className="h-4 w-4" />
                  <span>{showManualInput ? 'Ocultar' : 'Ingresar Tokens Manualmente'}</span>
                </button>
              </>
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

          {/* Manual Token Input Form */}
          {showManualInput && (!isConnected || isTokenExpired) && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-800">Ingresar Tokens Manualmente</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token
                  </label>
                  <input
                    type="text"
                    value={manualAccessToken}
                    onChange={(e) => setManualAccessToken(e.target.value)}
                    placeholder="Pega tu access token aquí..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refresh Token
                  </label>
                  <input
                    type="text"
                    value={manualRefreshToken}
                    onChange={(e) => setManualRefreshToken(e.target.value)}
                    placeholder="Pega tu refresh token aquí..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    setTokensManually(manualAccessToken, manualRefreshToken);
                    setManualAccessToken('');
                    setManualRefreshToken('');
                    setShowManualInput(false);
                  }}
                  disabled={!manualAccessToken || !manualRefreshToken}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    !manualAccessToken || !manualRefreshToken
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                  } text-white`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Guardar Tokens</span>
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <strong>Instrucciones:</strong> Haz clic en "Conectar con Loyverse" para abrir una ventana popup 
                donde podrás autorizar el acceso a tu cuenta de Loyverse. Una vez autorizado, 
                podrás ver los productos reales en la sección de productos.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paguelo Fácil Test Section */}
      <PagueloFacilTestButton />
    </div>
  );
};

export default DevTools;