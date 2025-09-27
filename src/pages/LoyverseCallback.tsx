import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { exchangeCodeForTokens } from '../api/loyverse/exchange';

const LoyverseCallback: React.FC = () => {
  const [message, setMessage] = useState("Procesando autorización de Loyverse...");
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('🔄 LoyverseCallback: Processing callback');
        console.log('🔄 Current URL:', window.location.href);
        console.log('🔄 Search params:', window.location.search);
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");
        
        console.log('🔍 URL Parameters:', { code: code?.substring(0, 20) + '...', state, error, errorDescription });

        if (error) {
          const fullError = `${error}${errorDescription ? ': ' + errorDescription : ''}`;
          console.error('❌ OAuth Error from URL:', fullError);
          setStatus('error');
          setMessage(`Error de autorización de Loyverse`);
          setErrorDetails(fullError);
          setShowCloseButton(true);
          
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: fullError
            }, window.location.origin);
          }
          return;
        }

        if (!code) {
          console.error('❌ No authorization code received');
          setStatus('error');
          setMessage("No se recibió el código de autorización");
          setErrorDetails("La URL no contiene el parámetro 'code' necesario para completar la autorización.");
          setShowCloseButton(true);
          
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'No authorization code received in callback URL'
            }, window.location.origin);
          }
          return;
        }

        console.log('🔄 Processing Loyverse callback with code:', code.substring(0, 20) + '...');
        
        // Intercambiar código por tokens
        setMessage("Intercambiando código por tokens...");
        const tokenData = await exchangeCodeForTokens(code);
        
        const tokenExpiry = Date.now() + (tokenData.expires_in - 30) * 1000;

        console.log('✅ Loyverse tokens saved successfully');
        setStatus('success');
        setMessage("¡Autorización exitosa con Loyverse!");
        setShowCloseButton(true);
        
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
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setStatus('error');
        setMessage("Error en el intercambio de tokens");
        setErrorDetails(errorMessage);
        setShowCloseButton(true);
        
        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: errorMessage
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
        <div className={`${getBackgroundColor()} rounded-2xl shadow-lg p-8`}>
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Loyverse OAuth
          </h1>
          
          <p className="text-gray-600 mb-4 text-center">
            {message}
          </p>
          
          {errorDetails && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Detalles del error:</h3>
              <p className="text-sm text-gray-700 break-words">{errorDetails}</p>
              
              <div className="mt-3 text-xs text-gray-600">
                <p><strong>URL actual:</strong> {window.location.href}</p>
                <p><strong>Origen:</strong> {window.location.origin}</p>
              </div>
            </div>
          )}
          
          {showCloseButton && (
            <div className="space-y-3">
              <button
                onClick={() => window.close()}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
                  status === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {status === 'success' ? '✅ Cerrar y Continuar' : '❌ Cerrar Ventana'}
              </button>
              {status === 'error' && <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Intentar de Nuevo
              </button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyverseCallback;