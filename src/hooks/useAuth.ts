import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
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
          error: null
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
          error: null
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
        data: metadata,
        emailConfirm: false
      }
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { data: null, error };
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

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    isAuthenticated: !!authState.user
  };
};