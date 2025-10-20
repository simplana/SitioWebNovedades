import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const EmailVerificationPending = () => {
  const { user, resendVerificationEmail, signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    const { error } = await resendVerificationEmail();

    if (error) {
      setResendError(error.message || 'Error al reenviar el correo');
      setIsResending(false);
      return;
    }

    setResendSuccess(true);
    setIsResending(false);

    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-white via-whisper-gray to-golden-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-divine-gold border-opacity-20">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-divine-gold to-aureola-gold rounded-full flex items-center justify-center mb-6 shadow-aureola">
              <Mail className="h-10 w-10 text-navy-devotion" />
            </div>

            <h1 className="text-3xl font-bold text-navy-devotion mb-3">
              Verifica tu correo electrónico
            </h1>

            <p className="text-stone-prayer mb-2">
              Hemos enviado un correo de verificación a:
            </p>

            <p className="text-divine-gold font-semibold text-lg mb-6">
              {user?.email}
            </p>

            <div className="bg-golden-light bg-opacity-30 border border-divine-gold border-opacity-30 rounded-lg p-4 mb-6">
              <p className="text-sm text-stone-prayer text-left">
                <strong className="text-navy-devotion">Instrucciones:</strong>
                <br />
                1. Revisa tu bandeja de entrada
                <br />
                2. Busca el correo de Novedades Católicas
                <br />
                3. Haz clic en el enlace de verificación
                <br />
                4. Regresa aquí para continuar
              </p>
            </div>

            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Correo reenviado exitosamente</span>
              </div>
            )}

            {resendError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{resendError}</span>
              </div>
            )}

            <button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="w-full bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-golden hover:shadow-aureola disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-4"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Reenviando...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Reenviar en {cooldown}s</span>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  <span>Reenviar correo de verificación</span>
                </>
              )}
            </button>

            <div className="border-t border-divine-gold border-opacity-20 pt-4 mt-4">
              <p className="text-sm text-stone-prayer mb-3">
                ¿No recibes el correo? Revisa tu carpeta de spam o correo no deseado.
              </p>
              <button
                onClick={handleSignOut}
                className="text-stone-prayer hover:text-divine-gold transition-colors duration-200 text-sm underline"
              >
                Cerrar sesión y usar otra cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;
