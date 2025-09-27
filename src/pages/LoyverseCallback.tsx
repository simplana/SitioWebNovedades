import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { exchangeCodeForTokens } from '../api/loyverse/exchange';

const LoyverseCallback: React.FC = () => {
  const [message, setMessage] = useState("Procesando autorización...");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");

        if (error) {
          setStatus('error');
          setMessage(`Error de autorización: ${error}`);
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: `Authorization error: ${error}`
            }, window.location.origin);
          }
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage("No se recibió el código de autorización en la URL.");
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'No authorization code received'
            }, window.location.origin);
          }
          return;
        }

        console.log('🔄 Processing Loyverse callback with code:', code);
        
        // Intercambiar código por tokens
        const tokenData = await exchangeCodeForTokens(code);
        
        const tokenExpiry = Date.now() + (tokenData.expires_in - 30) * 1000;

        console.log('✅ Loyverse tokens saved successfully');
        setStatus('success');
        setMessage("¡Autorización exitosa! Cerrando ventana...");
        
        // Send success to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: tokenExpiry
          }, window.location.origin);
        }
        
        // Close popup after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);

      } catch (error) {
        console.error('❌ Loyverse callback error:', error);
        setStatus('error');
        setMessage(`Error en el intercambio de tokens: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        
        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, window.location.origin);
        }
      }
    };

    processCallback();
  }, []);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50';
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className={`${getBackgroundColor()} rounded-2xl shadow-lg p-8 text-center`}>
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Loyverse OAuth
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => window.close()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Cerrar Ventana
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Intentar de Nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyverseCallback;