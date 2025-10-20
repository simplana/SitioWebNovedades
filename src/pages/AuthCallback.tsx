import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Cross } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const type = searchParams.get('type');

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/?error=auth_error');
          return;
        }

        if (data.session) {
          const isEmailVerified = data.session.user.email_confirmed_at !== null;

          if (type === 'signup' && isEmailVerified) {
            navigate('/auth/verified');
            return;
          }

          if (!isEmailVerified) {
            navigate('/auth/verify-email');
            return;
          }

          const redirectTo = sessionStorage.getItem('auth_redirect') || '/';
          sessionStorage.removeItem('auth_redirect');
          navigate(redirectTo);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="bg-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <Cross className="h-8 w-8 text-navy" />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
        <h2 className="font-playfair text-2xl font-bold text-navy mb-2">
          Confirmando tu cuenta
        </h2>
        <p className="text-gray-600">
          Estamos verificando tu email y activando tu cuenta...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;