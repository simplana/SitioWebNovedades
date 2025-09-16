import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    console.log('🔄 Enhanced OAuth Callback received:', { 
      path: window.location.pathname,
      code: !!code, 
      state, 
      error,
      timestamp: new Date().toISOString()
    });

    if (error) {
      // Enviar error a la ventana padre con más detalles
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          error: error,
          error_description: urlParams.get('error_description'),
          state: state,
          timestamp: new Date().toISOString()
        }, window.location.origin);
        console.log('❌ Enhanced OAuth error sent to parent window');
      }
    } else if (code && state) {
      // Enviar éxito a la ventana padre con más detalles
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_SUCCESS',
          code: code,
          state: state,
          timestamp: new Date().toISOString(),
          provider: 'loyverse'
        }, window.location.origin);
        console.log('✅ Enhanced OAuth success sent to parent window');
      }
    } else {
      console.log('⚠️ OAuth callback received without code or error');
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_ERROR',
          error: 'invalid_callback',
          error_description: 'No authorization code or error received',
          timestamp: new Date().toISOString()
        }, window.location.origin);
      }
    }

    // Cerrar popup después de un breve delay
    setTimeout(() => {
      console.log('🔒 Closing enhanced OAuth popup window');
      window.close();
    }, 1500);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const code = urlParams.get('code');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Authorization Failed
            </h1>
            <p className="text-gray-600 mb-4">
              {error}: {urlParams.get('error_description') || 'Unknown error occurred'}
            </p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        ) : code ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Authorization Successful
            </h1>
            <p className="text-gray-600 mb-4">
              You have successfully authorized the application.
            </p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        ) : (
          <>
            <Loader className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Authorization
            </h1>
            <p className="text-gray-600 mb-4">
              Please wait while we process your authorization...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;