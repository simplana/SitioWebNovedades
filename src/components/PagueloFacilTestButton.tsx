import React, { useState } from 'react';
import { TestTube, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { pagueloFacilService } from '../services/pagueloFacilService';

const PagueloFacilTestButton: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await pagueloFacilService.testConnection();
      setTestResult(result);
      
      if (result.success && result.details?.paymentUrl) {
        // Mostrar opción para abrir URL de pago de prueba
        const openPayment = window.confirm(
          `✅ ¡Conexión exitosa!\n\n` +
          `Payment ID: ${result.details.paymentId}\n` +
          `Monto de prueba: ${result.details.testAmount}\n\n` +
          `¿Quieres abrir la página de pago de prueba de Paguelo Fácil?`
        );
        
        if (openPayment) {
          window.open(result.details.paymentUrl, '_blank');
        }
      } else if (result.details?.mode === 'DEMO') {
        // Mostrar información del modo demo
        alert(
          `🎭 MODO DEMOSTRACIÓN\n\n` +
          `✅ Simulación exitosa de Paguelo Fácil\n` +
          `Payment ID: ${result.details.paymentId}\n` +
          `Monto: ${result.details.testAmount}\n\n` +
          `Nota: Para usar la API real, configura tu ACCESS TOKEN válido en el archivo .env`
        );
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center space-x-3 mb-4">
        <TestTube className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Prueba de Integración Paguelo Fácil
        </h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        Prueba la conexión con la API de Paguelo Fácil y crea un pago de prueba de $1.00 USD.
      </p>
      
      <button
        onClick={runTest}
        disabled={testing}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
          testing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
        } text-white`}
      >
        {testing ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            <span>Probando conexión...</span>
          </>
        ) : (
          <>
            <TestTube className="h-5 w-5" />
            <span>Probar Integración</span>
          </>
        )}
      </button>
      
      {/* Resultado de la prueba */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg border-l-4 ${
          testResult.success 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-start space-x-3">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? '✅ Prueba Exitosa' : '❌ Prueba Fallida'}
              </h4>
              <p className={`text-sm mt-1 ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>
              
              {testResult.details && (
                <div className="mt-3 p-3 bg-gray-100 rounded text-xs">
                  <strong>Detalles:</strong>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Información adicional */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <strong>Nota:</strong> Esta prueba crea un pago real de $1.00 USD en Paguelo Fácil. 
            Puedes cancelarlo sin completar el pago.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagueloFacilTestButton;