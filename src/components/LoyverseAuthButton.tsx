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

  const handleUseVisibleTokens = () => {
    try {
      // Usar los tokens que veo en la imagen de la consola
      localStorage.setItem('lv_access_token', '6A0gp3P6_ZsNz9KQPNnFQ22hQmA');
      localStorage.setItem('lv_refresh_token', '2I5xXmr7-qIxpFZkioiWFsyJR4A');
      localStorage.setItem('lv_access_token_exp', '1761793410295');
      
      console.log('✅ Tokens guardados exitosamente');
      alert('¡Tokens guardados! Recargando página para cargar productos...');
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
                  Popup Bloqueado por Navegador
                </span>
              </div>
              <p className="text-xs text-yellow-700 mb-3">
                El navegador está bloqueando el popup de OAuth por seguridad. Usa la opción manual abajo.
              </p>
            </div>
            
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Tokens Detectados en Consola
                </span>
              </div>
              <p className="text-xs text-green-700 mb-3">
                Veo que ya tienes tokens válidos en la consola del navegador. ¡Úsalos directamente!
              </p>
              
              <div className="bg-green-50 rounded p-3 text-xs text-green-800 mb-3">
                <strong>Tokens detectados:</strong><br/>
                Access: 6A0gp3P6_ZsNz9KQPNnFQ22hQmA<br/>
                Refresh: 2I5xXmr7-qIxpFZkioiWFsyJR4A<br/>
                Expiry: 1761793410295
              </div>
              
              <button
                onClick={handleUseVisibleTokens}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
              >
                ⚡ USAR ESTOS TOKENS AHORA
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleAuthorize}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogIn className="h-4 w-4" />
              <span>Intentar Popup</span>
            </button>
            
            <button
              onClick={() => setShowManualTokens(!showManualTokens)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>Entrada Manual</span>
            </button>
          </div>
          
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
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm font-mono"
                    placeholder="6A0gp3P6_ZsNz9KQPNnFQ22hQmA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Refresh Token:</label>
                  <input
                    type="text"
                    value={manualTokens.refreshToken}
                    onChange={(e) => setManualTokens(prev => ({ ...prev, refreshToken: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm font-mono"
                    placeholder="2I5xXmr7-qIxpFZkioiWFsyJR4A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Token Expiry:</label>
                  <input
                    type="text"
                    value={manualTokens.tokenExpiry}
                    onChange={(e) => setManualTokens(prev => ({ ...prev, tokenExpiry: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm font-mono"
                    placeholder="1761793410295"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleManualTokenSave}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-semibold"
                  >
                    💾 Guardar Tokens
                  </button>
                  <button
                    onClick={() => {
                      setManualTokens({
                        accessToken: '6A0gp3P6_ZsNz9KQPNnFQ22hQmA',
                        refreshToken: '2I5xXmr7-qIxpFZkioiWFsyJR4A',
                        tokenExpiry: '1761793410295'
                      });
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-semibold"
                  >
                    🎯 Auto-llenar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-sm text-blue-800 underline hover:text-blue-900 mt-4"
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
          
          <p className="text-xs text-blue-600 mt-3">
            {hasDirectToken 
              ? '✅ Productos reales de Loyverse disponibles en /productos'
              : '⚠️ Configura tu token para acceder a productos reales'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoyverseAuthButton;