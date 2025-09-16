import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const { signInWithEmail, signUpWithEmail, resetPassword, loading, error } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          alert('¡Cuenta creada exitosamente! Puedes iniciar sesión inmediatamente.');
          onClose();
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