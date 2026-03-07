import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const EmailTest = () => {
  const { user } = useAuth();
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null);

  const loadEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  useEffect(() => {
    loadEmailLogs();
  }, []);

  const testWelcomeEmail = async () => {
    if (!user) return;

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
          })
        }
      );

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        setResendConfigured(true);
      } else if (result.error === 'RESEND_API_KEY not configured') {
        setResendConfigured(false);
      }

      await loadEmailLogs();
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testOrderEmail = async () => {
    if (!user) return;

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-confirmation-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            customerName: user.user_metadata?.full_name || 'Cliente Test',
            customerEmail: user.email,
            orderNumber: `TEST-${Date.now()}`,
            orderDate: new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            total: 25.50,
            status: 'Confirmada',
            items: [
              { name: 'Producto de Prueba', quantity: 1, price: 25.50 }
            ]
          })
        }
      );

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        setResendConfigured(true);
      } else if (result.error === 'RESEND_API_KEY not configured') {
        setResendConfigured(false);
      }

      await loadEmailLogs();
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Sistema de Emails</h1>

      {/* Resend Configuration Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Mail className="mr-2" />
          Estado de Resend API
        </h2>

        {resendConfigured === null && (
          <div className="flex items-center text-gray-600">
            <AlertCircle className="mr-2" />
            Haz clic en "Probar Email" para verificar la configuración
          </div>
        )}

        {resendConfigured === true && (
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-2" />
            Resend API está configurado correctamente
          </div>
        )}

        {resendConfigured === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  RESEND_API_KEY no configurado
                </h3>
                <p className="text-yellow-700 mb-3">
                  Para enviar emails, necesitas configurar tu API key de Resend:
                </p>
                <ol className="list-decimal list-inside text-yellow-700 space-y-2">
                  <li>Ve a <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com</a> y crea una cuenta</li>
                  <li>Obtén tu API key desde el dashboard</li>
                  <li>En Supabase Dashboard, ve a Edge Functions → Secrets</li>
                  <li>Agrega un nuevo secret: <code className="bg-yellow-100 px-2 py-1 rounded">RESEND_API_KEY</code> con tu API key</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pruebas de Email</h2>
        <div className="space-y-4">
          <button
            onClick={testWelcomeEmail}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={20} />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2" size={20} />
                Probar Email de Bienvenida
              </>
            )}
          </button>

          <button
            onClick={testOrderEmail}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={20} />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2" size={20} />
                Probar Email de Confirmación de Orden
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-lg shadow-md p-6 mb-6 ${
          testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {testResult.success ? (
              <>
                <CheckCircle className="text-green-600 mr-2" />
                Email Enviado Exitosamente
              </>
            ) : (
              <>
                <XCircle className="text-red-600 mr-2" />
                Error al Enviar Email
              </>
            )}
          </h2>
          <div className="space-y-2">
            <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
              <strong>Mensaje:</strong> {testResult.message || 'Sin mensaje'}
            </p>
            {testResult.error && (
              <p className="text-red-700">
                <strong>Error:</strong> {testResult.error}
              </p>
            )}
            {testResult.note && (
              <p className="text-gray-700 text-sm mt-2">
                <strong>Nota:</strong> {testResult.note}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Email Logs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Registro de Emails</h2>
          <button
            onClick={loadEmailLogs}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <RefreshCw size={18} className="mr-1" />
            Actualizar
          </button>
        </div>

        {emailLogs.length === 0 ? (
          <p className="text-gray-500">No hay registros de emails todavía</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Destinatario</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emailLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(log.created_at).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {log.email_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.recipient_email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.status === 'success' ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={16} className="mr-1" />
                          Exitoso
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle size={16} className="mr-1" />
                          Fallido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTest;
