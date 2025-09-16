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

  const hasClientSecret = import.meta.env.VITE_LOYVERSE_CLIENT_SECRET && 
                          import.meta.env.VITE_LOYVERSE_CLIENT_SECRET !== '';
  const hasStoredTokens = hasValidTokens();
  const tokenExpiration = getTokenExpirationTime();

  const handleAuthorize = () => {
    // Mostrar instrucciones para OAuth manual debido a limitaciones de HTTPS en WebContainer
    alert(
      '🔐 LOYVERSE OAUTH - Instrucciones Manuales\n\n' +
      'Debido a que Loyverse requiere HTTPS y WebContainer no puede generar certificados SSL:\n\n' +
      '1. Ve a: https://api.loyverse.com/oauth/authorize\n' +
      '2. Usa estos parámetros:\n' +
      '   - client_id: dCcISKLUxosXUJvjIcSN\n' +
      '   - response_type: code\n' +
      '   - redirect_uri: https://localhost:5173/auth/loyverse/callback\n' +
      '   - scope: ITEMS_READ INVENTORY_READ CUSTOMERS_READ\n\n' +
      '3. O usa el modo DEMO con productos de muestra\n\n' +
      'Para producción, despliega en un servidor con HTTPS válido.'
    );
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

  if (hasStoredTokens && hasClientSecret) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-5 w-5" />
          <div>
            <span className="font-medium text-green-800">Loyverse OAuth2 Conectado</span>
            {tokenExpiration && (
              <p className="text-sm text-green-600">
                Token expira: {tokenExpiration.toLocaleString()}
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
          
          <button
            onClick={handleDisconnect}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Desconectar</span>
          </button>
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
            Conectar con Loyverse (Modo Demo Disponible)
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            OAuth2 requiere HTTPS. En desarrollo, usa el modo demo con productos de muestra.
          </p>
          
          <div className="space-y-3 mb-4">
            <button
              onClick={handleAuthorize}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogIn className="h-4 w-4" />
              <span>Ver Instrucciones OAuth</span>
            </button>
            
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Modo Demo Activo</span>
              </div>
              <p className="text-xs text-green-700">
                Los productos de demostración están disponibles en <code>/productos</code>
              </p>
            </div>
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
                  <li><strong>Desarrollo:</strong> Usar productos demo (ya activo)</li>
                  <li><strong>Producción:</strong> Desplegar en servidor con HTTPS válido</li>
                  <li><strong>Testing:</strong> Usar ngrok o similar para túnel HTTPS</li>
                </ul>
              </div>
            </div>
          )}
          
          <p className="text-xs text-blue-600 mt-3">
            ✅ Productos de demostración disponibles en /productos
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoyverseAuthButton;