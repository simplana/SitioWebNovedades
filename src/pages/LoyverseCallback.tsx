import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const LoyverseCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autorización de Loyverse...');
  const [debugInfo, setDebugInfo] = useState<any>(null);

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
        
        const debugData = {
          url: window.location.href,
          params: {
            code: code ? `${code.substring(0, 20)}...` : null,
            state,
            error,
            errorDescription
          },
          windowOpener: !!window.opener,
          origin: window.location.origin
        };
        
        setDebugInfo(debugData);
        console.log('🔍 URL Parameters:', debugData);

        if (error) {
          const fullError = `${error}${errorDescription ? ': ' + errorDescription : ''}`;
          console.error('❌ OAuth Error from URL:', fullError);
          setStatus('error');
          setMessage(`Error de autorización: ${fullError}`);
          
          // Send error to parent window
          if (window.opener) {
            console.log('📤 Sending error message to parent window');
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: fullError,
              connectionId: state
            }, window.location.origin);
          }
          return;
        }

        if (!code) {
          console.error('❌ No authorization code received');
          setStatus('error');
          setMessage("No se recibió el código de autorización");
          
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: 'No authorization code received in callback URL',
              connectionId: state
            }, window.location.origin);
          }
          return;
        }

        console.log('🔄 Processing Loyverse callback with code:', code.substring(0, 20) + '...');
        setMessage("Intercambiando código por tokens...");
        
        // Exchange code for tokens using our proxy
        const tokenResponse = await fetch('/api/loyverse/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            code,
            redirect_uri: import.meta.env.VITE_LOYVERSE_REDIRECT_URL
          })
        });

        console.log('📡 Token exchange response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          console.error('❌ Token exchange failed:', errorData);
          
          // Show detailed error information
          const detailedError = {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            errorData,
            rawResponse: errorText
          };
          
          setStatus('error');
          setMessage(`Error en intercambio de tokens (${tokenResponse.status}): ${errorData.error || errorText}`);
          setDebugInfo(prev => ({ ...prev, tokenExchangeError: detailedError }));
          
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'LOYVERSE_OAUTH_ERROR',
              error: `Token exchange failed via proxy: ${errorData.error || errorText}`,
              connectionId: state
            }, window.location.origin);
          }
          return;
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ Token exchange successful');
        
        const tokenExpiry = Date.now() + (tokenData.expires_in - 30) * 1000;

        // Store tokens in localStorage
        localStorage.setItem('lv_access_token', tokenData.access_token);
        localStorage.setItem('lv_refresh_token', tokenData.refresh_token);
        localStorage.setItem('lv_access_token_exp', tokenExpiry.toString());

        console.log('✅ Loyverse tokens saved successfully');
        setStatus('success');
        setMessage("¡Autorización exitosa con Loyverse!");
        
        // Send success to parent window
        if (window.opener) {
          console.log('📤 Sending success message to parent window');
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_SUCCESS',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpiry: tokenExpiry,
            connectionId: state
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
        setMessage(`Error procesando callback: ${errorMessage}`);
        
        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'LOYVERSE_OAUTH_ERROR',
            error: errorMessage,
            connectionId: urlParams.get("state")
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
      <div className="max-w-2xl w-full">
        <div className={`${getBackgroundColor()} rounded-2xl shadow-lg p-8`}>
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Loyverse OAuth
          </h1>
          
          <p className="text-gray-600 mb-6 text-center">
            {message}
          </p>
          
          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">🔍 Información de Debug:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>URL:</strong> 
                  <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs break-all">
                    {debugInfo.url}
                  </code>
                </div>
                <div>
                  <strong>Código:</strong> 
                  <span className={`ml-2 ${debugInfo.params.code ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.params.code ? '✅ Presente' : '❌ Ausente'}
                  </span>
                </div>
                <div>
                  <strong>State:</strong> 
                  <span className={`ml-2 ${debugInfo.params.state ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.params.state || '❌ Ausente'}
                  </span>
                </div>
                <div>
                  <strong>Window Opener:</strong> 
                  <span className={`ml-2 ${debugInfo.windowOpener ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.windowOpener ? '✅ Disponible' : '❌ No disponible'}
                  </span>
                </div>
                {debugInfo.params.error && (
                  <div>
                    <strong>Error OAuth:</strong> 
                    <span className="ml-2 text-red-600">
                      {debugInfo.params.error}
                      {debugInfo.params.errorDescription && ` - ${debugInfo.params.errorDescription}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
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
            
            {status === 'error' && (
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Intentar de Nuevo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyverseCallback;