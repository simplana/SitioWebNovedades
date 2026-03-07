import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  emailVerified: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    emailVerified: false
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setAuthState(prev => ({ ...prev, error, loading: false }));
          return;
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
          emailVerified: true
        });
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: error as AuthError, 
          loading: false 
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
          emailVerified: true
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const error = new Error('Supabase no está configurado. Por favor configura las variables de entorno.');
      setAuthState(prev => ({ ...prev, error: error as any, loading: false }));
      return { data: null, error };
    }

    try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { data: null, error };
    }

    return { data, error: null };
    } catch (networkError) {
      console.error('Network error during sign in:', networkError);
      const error = new Error('Error de conexión. Verifica tu conexión a internet y la configuración de Supabase.');
      setAuthState(prev => ({ ...prev, error: error as any, loading: false }));
      return { data: null, error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const error = new Error('Supabase no está configurado. Por favor configura las variables de entorno.');
      setAuthState(prev => ({ ...prev, error: error as any, loading: false }));
      return { data: null, error };
    }

    try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: metadata
      }
    });

    // Ignore email confirmation errors since we disabled confirmations
    if (error && error.message.includes('Error sending confirmation email')) {
      console.warn('Email confirmation disabled - proceeding with signup');
      // If we got a user despite the email error, treat it as success
      if (data?.user) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null,
          user: data.user,
          session: data.session,
          emailVerified: true  // Mark as verified since confirmations are disabled
        }));

        // Send welcome email
        try {
          const welcomeEmailResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email,
                name: metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario'
              })
            }
          );

          const emailResult = await welcomeEmailResponse.json();
          console.log('Welcome email result:', emailResult);
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
        }

        return { data, error: null };
      }
    }

    if (error) {
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { data: null, error };
    }

    // Send welcome email after successful signup
    if (data?.user) {
      try {
        const welcomeEmailResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              name: metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario'
            })
          }
        );

        const emailResult = await welcomeEmailResponse.json();
        console.log('Welcome email result:', emailResult);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    }

    return { data, error: null };
    } catch (networkError) {
      console.error('Network error during sign up:', networkError);
      const error = new Error('Error de conexión. Verifica tu conexión a internet y la configuración de Supabase.');
      setAuthState(prev => ({ ...prev, error: error as any, loading: false }));
      return { data: null, error };
    }
  };


  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    return { data, error };
  };

  const resendVerificationEmail = async () => {
    if (!authState.user?.email) {
      return { error: new Error('No hay un usuario autenticado') };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authState.user.email
      });

      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as AuthError;
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { data: null, error };
    }
  };

  const signInWithFacebook = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as AuthError;
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { data: null, error };
    }
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    resendVerificationEmail,
    isAuthenticated: !!authState.user,
    isVerified: authState.emailVerified
  };
};