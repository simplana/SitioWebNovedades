import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const navigate = useNavigate();

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithFacebook, resetPassword, loading, error } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setOauthMessage('Esta función estará disponible próximamente. Estamos trabajando para habilitarla.');
    setTimeout(() => setOauthMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      console.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      console.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(formData.email, formData.password);
        if (!error) {
          onClose();
        } else {
          console.error('Error de inicio de sesión:', error.message);
        }
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(formData.email, formData.password, {
          full_name: formData.fullName
        });
        if (!error) {
          onClose();
          navigate('/auth/verify-email');
        } else {
          console.error('Error de registro:', error.message);
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(formData.email);
        if (!error) {
          alert('Se ha enviado un enlace de recuperación a tu email.');
          setMode('signin');
        } else {
          console.error('Error de recuperación:', error.message);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[60]">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out scale-100">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100 z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="p-8 pb-6">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
              {mode === 'signin' && 'Iniciar Sesión'}
              {mode === 'signup' && 'Crear Cuenta'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h2>
            <p className="text-gray-600 text-center">
              {mode === 'signin' && 'Ingresa a tu cuenta'}
              {mode === 'signup' && 'Únete a nuestra comunidad'}
              {mode === 'forgot' && 'Te enviaremos un enlace de recuperación'}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {/* OAuth Message */}
            {oauthMessage && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-blue-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{oauthMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Error:</strong> {error.message}
                  {error.message.includes('Supabase') && (
                    <div className="mt-2 text-xs bg-red-100 p-2 rounded">
                      <strong>Solución:</strong> Necesitas configurar Supabase haciendo click en "Connect to Supabase" en la parte superior derecha.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OAuth Buttons - Only for signin and signup */}
            {mode !== 'forgot' && (
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 relative group"
                >
                  <GoogleIcon />
                  <span className="font-medium text-gray-700">Continuar con Google</span>
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                    Próximamente
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('facebook')}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 relative group"
                >
                  <FacebookIcon />
                  <span className="font-medium text-gray-700">Continuar con Facebook</span>
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                    Próximamente
                  </span>
                </button>

                <div className="relative flex items-center justify-center my-6">
                  <div className="border-t border-gray-300 w-full"></div>
                  <span className="absolute bg-white px-4 text-sm text-gray-500">o continúa con email</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* EMAIL FIELD - ALWAYS VISIBLE FIRST */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
              </div>

              {/* FULL NAME - Only for signup */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                </div>
              )}

              {/* PASSWORD FIELD - Not for forgot mode */}
              {mode !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Tu contraseña"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* CONFIRM PASSWORD - Only for signup */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Repite tu contraseña"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <>
                    {mode === 'signin' && 'Iniciar Sesión'}
                    {mode === 'signup' && 'Crear Cuenta'}
                    {mode === 'forgot' && 'Enviar Enlace'}
                  </>
                )}
              </button>
            </form>

            {/* Mode Switch Links */}
            <div className="mt-6 text-center space-y-3">
              {mode === 'signin' && (
                <>
                  <p className="text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline"
                    >
                      Crear cuenta
                    </button>
                  </p>
                  <p>
                    <button
                      onClick={() => setMode('forgot')}
                      className="text-gray-500 hover:text-gray-700 underline text-sm"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </p>
                </>
              )}

              {mode === 'signup' && (
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    Iniciar sesión
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p className="text-gray-600">
                  ¿Recordaste tu contraseña?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    Iniciar sesión
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;