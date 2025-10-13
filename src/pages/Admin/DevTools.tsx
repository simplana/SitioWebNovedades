import React from 'react';
import { Settings, Zap, CheckCircle, XCircle, LogIn, LogOut, AlertTriangle } from 'lucide-react';
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

  const isTokenExpired = tokenExpiry ? Date.now() >= new Date(tokenExpiry).getTime() : false;

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

      {/* Paguelo Fácil Test Section */}
      <PagueloFacilTestButton />
    </div>
  );
};

export default DevTools;