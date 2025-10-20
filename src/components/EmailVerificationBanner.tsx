import React, { useState } from 'react';
import { AlertCircle, X, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const EmailVerificationBanner = () => {
  const { user, isVerified, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!user || isVerified || isDismissed) return null;

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    const { error } = await resendVerificationEmail();

    if (error) {
      setResendError('Error al reenviar el correo');
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

    setTimeout(() => setResendSuccess(false), 5000);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                <strong>Verifica tu correo electrónico</strong>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Hemos enviado un correo de verificación a <strong>{user.email}</strong>. Por favor, verifica tu email para acceder a todas las funcionalidades.
              </p>
              {resendSuccess && (
                <div className="flex items-center space-x-1 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">
                    Correo reenviado exitosamente
                  </span>
                </div>
              )}
              {resendError && (
                <p className="text-xs text-red-600 mt-2">{resendError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="flex items-center space-x-1 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Reenviar en {cooldown}s</span>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  <span>Reenviar</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-amber-600 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
