import React, { useState } from 'react';
import { ShoppingCart, AlertTriangle, CheckCircle, ExternalLink, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { hasValidTokens, clearStoredTokens, getTokenExpirationTime, getAccessToken } from '../lib/loyverse/auth';

interface LoyverseAuthButtonProps {
  className?: string;
}

const LoyverseAuthButton: React.FC<LoyverseAuthButtonProps> = ({ className = '' }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [showManualTokens, setShowManualTokens] = useState(false);
  const [manualTokens, setManualTokens] = useState({
    accessToken: '',
    refreshToken: '',
    tokenExpiry: ''
  });

  const hasClientSecret = import.meta.env.VITE_LOYVERSE_CLIENT_SECRET && 
                          import.meta.env.VITE_LOYVERSE_CLIENT_SECRET !== '';
  const hasStoredTokens = hasValidTokens();
  const tokenExpiration = getTokenExpirationTime();

  // Verificar si hay token directo disponible
  const hasDirectToken = import.meta.env.VITE_LOYVERSE_ACCESS_TOKEN && 
                        import.meta.env.VITE_LOYVERSE_ACCESS_TOKEN !== 'your-loyverse-token-here';

  const handleAuthorize = () => {
    try {
      console.log('🚀 Intentando abrir popup de OAuth...');
      
      const authUrl = 'https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback?code=test&state=demo';
      
      const popup = window.open(
        authUrl,
        'loyverse-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (!popup) {
        console.error('❌ Could not open popup - blocked by browser');
        alert('❌ Popup bloqueado por el navegador.\n\nPor favor:\n1. Permite popups para este sitio\n2. O usa "Tokens Manuales" para configurar manualmente');
        return;
      }
      
      console.log('✅ Popup opened successfully');
      
      // Monitor popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('🔄 Popup closed, checking for tokens...');
          clearInterval(checkClosed);
          
          // Check if tokens were saved
          setTimeout(() => {
            if (hasValidTokens()) {
              console.log('✅ Tokens found after popup closed');
              window.location.reload();
            } else {
              console.log('❌ No tokens found after popup closed');
            }
          }, 1000);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error opening popup:', error);
      alert('Error abriendo popup. Usa "Tokens Manuales" como alternativa.');
    }
  };

  const handleDisconnect = () => {
    if (confirm('¿Estás seguro de que quieres desconectar Loyverse? Tendrás que volver a autorizar.')) {
      clearStoredTokens();
      setTestResult('');
      window.location.reload();
    }
  };

  const handleTestApi = async () => {
    setTesting(true);
    setTestResult('');
    
    try {
      const token = await getAccessToken();
      
      // Probar endpoint de items
      const response = await fetch('https://api.loyverse.com/v1.0/items?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResult(`✅ API Test Successful!\nFound ${data.length || 0} items`);
    } catch (error) {
      setTestResult(`❌ API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleManualTokenSave = () => {
    if (!manualTokens.accessToken || !manualTokens.refreshToken) {
      alert('Por favor completa todos los campos de tokens');
      return;
    }

    try {
      // Guardar tokens manualmente
      localStorage.setItem('lv_access_token', manualTokens.accessToken);
      localStorage.setItem('lv_refresh_token', manualTokens.refreshToken);
      
      // Si no se proporciona expiry, usar 1 hora por defecto
      const expiry = manualTokens.tokenExpiry 
        ? parseInt(manualTokens.tokenExpiry)
        : Date.now() + (60 * 60 * 1000);
      localStorage.setItem('lv_access_token_exp', expiry.toString());
      
      console.log('✅ Manual tokens saved successfully');
      alert('¡Tokens guardados exitosamente! Recargando página...');
      window.location.reload();
    } catch (error) {
      console.error('Error saving manual tokens:', error);
      alert('Error guardando tokens');
    }
  };

  const handleUseCurrentTokens = () => {
    // Usar los tokens que vimos en el popup - VALORES REALES
    try {
      localStorage.setItem('lv_access_token', '8h1TdLJkO73C8cpjOw0Gvjl0qXM');
      localStorage.setItem('lv_refresh_token', 'inIXIS1k3aPxUO69Z1olW5pMJX0');
      localStorage.setItem('lv_access_token_exp', '1761791893996');
      
      console.log('✅ Tokens guardados exitosamente');
      alert('¡Tokens guardados! Recargando página...');
      window.location.reload();
    } catch (error) {
      console.error('Error guardando tokens:', error);
      alert('Error guardando tokens');
    }
  };

  if ((hasStoredTokens && hasClientSecret) || hasDirectToken) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <span className="font-medium text-green-800">
              {hasStoredTokens ? 'Loyverse OAuth2 Conectado' : 'Loyverse API Conectado (Token Directo)'}
            </span>
            {tokenExpiration && hasStoredTokens && (
              <p className="text-sm text-green-600">
                Token expira: {tokenExpiration.toLocaleString()}
              </p>
            )}
            {hasDirectToken && !hasStoredTokens && (
              <p className="text-sm text-green-600">
                Usando token de acceso directo
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestApi}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Probando...' : 'Probar API'}</span>
          </button>
          
          {hasStoredTokens && (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Desconectar</span>
            </button>
          )}
        </div>
        
        {testResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    );
  }

  if (!hasClientSecret) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800 mb-2">
              ⚠️ LOYVERSE_CLIENT_SECRET Requerido
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Para usar Loyverse OAuth2, necesitas configurar el CLIENT_SECRET en las variables de entorno.
            </p>
            
            <div className="bg-red-100 rounded p-3 text-sm text-red-800">
              <h4 className="font-medium mb-2">Pasos para configurar:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abre el archivo <code>.env</code></li>
                <li>Encuentra la línea: <code>LOYVERSE_CLIENT_SECRET=</code></li>
                <li>Pega tu client secret después del =</li>
                <li>Guarda el archivo y recarga la página</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <ShoppingCart className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-800 mb-2">
            Conectar con Loyverse
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Conecta tu cuenta de Loyverse para mostrar productos reales en la tienda.
          </p>
          
          <div className="space-y-3 mb-4">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Configuración Requerida
                </span>
              </div>
              <p className="text-xs text-yellow-700 mb-3">
                Para usar OAuth2 con Loyverse, primero necesitas configurar Supabase.
              </p>
              <div className="bg-yellow-200 rounded p-2 text-xs text-yellow-800">
                <strong>Paso 1:</strong> Haz clic en el botón "Supabase" en la parte superior derecha<br/>
                <strong>Paso 2:</strong> Configura tu proyecto de Supabase<br/>
                <strong>Paso 3:</strong> Vuelve aquí para conectar con Loyverse
              </div>
            </div>
            
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {hasDirectToken ? 'Token Directo Disponible' : 'Alternativa: Token Directo'}
                </span>
              </div>
              <p className="text-xs text-green-700">
                {hasDirectToken 
                  ? 'Los productos reales de Loyverse ya están disponibles en /productos'
                  : 'O configura VITE_LOYVERSE_ACCESS_TOKEN en .env para acceso directo'
                }
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleAuthorize}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogIn className="h-4 w-4" />
              <span>Conectar con Loyverse</span>
            </button>
            
            <button
              onClick={() => setShowManualTokens(!showManualTokens)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>Tokens Manuales</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-sm text-blue-800 underline hover:text-blue-900"
          >
            {showInstructions ? 'Ocultar información' : 'Ver información técnica'}
          </button>
          
          {showInstructions && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-100 rounded text-sm text-blue-800">
                <h4 className="font-medium mb-2">Información técnica:</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong>Client ID:</strong> dCcISKLUxosXUJvjIcSN</li>
                  <li><strong>Scopes:</strong> ITEMS_READ, INVENTORY_READ, CUSTOMERS_READ</li>
                  <li><strong>Problema:</strong> WebContainer no soporta HTTPS con certificados SSL</li>
                </ul>
              </div>
              
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                <h4 className="font-medium mb-2">💡 Soluciones:</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong>Desarrollo:</strong> Configurar VITE_LOYVERSE_ACCESS_TOKEN en .env</li>
                  <li><strong>Producción:</strong> Desplegar en servidor con HTTPS válido</li>
                  <li><strong>Testing:</strong> Usar ngrok o similar para túnel HTTPS</li>
                </ul>
              </div>
            </div>
          )}
          
          {showManualTokens && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Configurar Tokens Manualmente</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Access Token:</label>
                  <input
                    type="text"
                    value={manualTokens.accessToken}
                    onChange={(e) => setManualTokens(prev => ({ ...prev, accessToken: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm"
                    placeholder="Pega el access token aquí"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Refresh Token:</label>
                  <input
                    type="text"
                    value={manualTokens.refreshToken}
                    onChange={(e) => setManualTokens(prev => ({ ...prev, refreshToken: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm"
                    placeholder="Pega el refresh token aquí"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Token Expiry (timestamp):</label>
                  <input
                    type="text"
                    value={manualTokens.tokenExpiry}
                    onChange={(e) => setManualTokens(prev => ({ ...prev, tokenExpiry: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm"
                    placeholder="Opcional - timestamp de expiración"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleManualTokenSave}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-semibold"
                  >
                    Guardar Tokens
                  </button>
                  <button
                    onClick={handleUseCurrentTokens}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-semibold"
                  >
                    Usar Tokens del Popup
                  </button>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Tokens del popup:</strong><br/>
                  Access: 8h1TdLJkO73C8cpjOw0Gvjl0qXM<br/>
                  Refresh: inIXIS1k3aPxUO69Z1olW5pMJX0<br/>
                  Expiry: 1761791893996
                </p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-blue-600 mt-3">
            {hasDirectToken 
              ? '✅ Productos reales de Loyverse disponibles en /productos'
              : '⚠️ Configura tu token para acceder a productos reales'
            }
          </p>
        </div>
      </div>
    );
};

export default LoyverseAuthButton;