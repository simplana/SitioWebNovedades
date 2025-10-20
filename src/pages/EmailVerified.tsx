import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const EmailVerified = () => {
  const navigate = useNavigate();
  const { isVerified } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sacred-white via-whisper-gray to-golden-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-divine-gold border-opacity-20">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-navy-devotion mb-3">
              ¡Email Verificado!
            </h1>

            <p className="text-stone-prayer mb-6 text-lg">
              Tu cuenta ha sido verificada exitosamente. Ahora puedes disfrutar de todas las funcionalidades de Novedades Católicas.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>¡Bienvenido a nuestra comunidad!</strong>
                <br />
                Ya puedes realizar pedidos, seguir tus compras y acceder a contenido exclusivo.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-golden hover:shadow-aureola flex items-center justify-center space-x-2 mb-4"
            >
              <span>Ir al Inicio</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-xs text-stone-prayer">
              Serás redirigido automáticamente en 5 segundos...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;
