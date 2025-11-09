import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OAuth2State {
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  tokenExpiry: string | null;
}

export const useOAuth2 = () => {
  const [state, setState] = useState<OAuth2State>({
    isConnected: false,
    loading: true,
    error: null,
    tokenExpiry: null,
  });

  const checkConnection = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase
        .from('loyverse_credentials')
        .select('token_expiry, is_active')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking connection:', error);
        setState({
          isConnected: false,
          loading: false,
          error: null,
          tokenExpiry: null,
        });
        return;
      }

      if (data) {
        setState({
          isConnected: true,
          loading: false,
          error: null,
          tokenExpiry: data.token_expiry,
        });
      } else {
        setState({
          isConnected: false,
          loading: false,
          error: null,
          tokenExpiry: null,
        });
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setState({
        isConnected: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        tokenExpiry: null,
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const initiateOAuth2Flow = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const clientId = 'na0tlm2Whq22j3jTPV_l';
    const redirectUri = encodeURIComponent('https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-oauth-v2/callback');
    const scopes = 'ITEMS_READ%20CUSTOMERS_READ%20RECEIPTS_READ%20OPENID';
    const randomState = Math.random().toString(36).substring(2, 15);

    const authUrl = `https://api.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${randomState}`;

    console.log('🚀 OAuth2 Configuration:');
    console.log('  - Client ID:', clientId);
    console.log('  - Redirect URI:', decodeURIComponent(redirectUri));
    console.log('  - State:', randomState);

    const popup = window.open(
      authUrl,
      'loyverse-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes,location=yes'
    );

    if (!popup) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No se pudo abrir la ventana emergente. Verifica que no esté bloqueada por el navegador.',
      }));
      return;
    }

    console.log('✅ Popup opened successfully');

    let intervalId: NodeJS.Timeout | null = null;
    let hasCheckedDatabase = false;

    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Message received from:', event.origin, event.data);

      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'LOYVERSE_OAUTH_SUCCESS') {
          console.log('✅ OAuth2 success message received!');

          window.removeEventListener('message', handleMessage);
          if (intervalId) clearInterval(intervalId);

          setState({
            isConnected: true,
            loading: false,
            error: null,
            tokenExpiry: null,
          });

          try {
            popup.close();
          } catch (e) {
            console.log('Note: Could not close popup manually:', e);
          }

          setTimeout(() => {
            console.log('🔄 Reloading page to refresh connection status...');
            window.location.reload();
          }, 500);

        } else if (event.data.type === 'LOYVERSE_OAUTH_ERROR') {
          console.error('❌ OAuth2 error received:', event.data.error);

          window.removeEventListener('message', handleMessage);
          if (intervalId) clearInterval(intervalId);

          setState(prev => ({
            ...prev,
            loading: false,
            error: event.data.error,
          }));

          try {
            popup.close();
          } catch (e) {
            console.log('Could not close popup on error');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const checkDatabaseForCredentials = async () => {
      if (hasCheckedDatabase) return;

      console.log('🔍 Checking database for saved credentials...');
      hasCheckedDatabase = true;

      try {
        const { data, error: dbError } = await supabase
          .from('loyverse_credentials')
          .select('id, is_active, token_expiry')
          .eq('is_active', true)
          .maybeSingle();

        console.log('Database check result:', { data, dbError });

        if (data) {
          console.log('✅ Credentials found in database! OAuth was successful.');

          window.removeEventListener('message', handleMessage);
          if (intervalId) clearInterval(intervalId);

          setState({
            isConnected: true,
            loading: false,
            error: null,
            tokenExpiry: data.token_expiry,
          });

          setTimeout(() => {
            console.log('🔄 Reloading page to refresh products...');
            window.location.reload();
          }, 1000);
        } else {
          console.log('❌ No credentials found in database. Error:', dbError);
          setState(prev => ({
            ...prev,
            loading: false,
            error: dbError ? dbError.message : 'No se encontraron credenciales. Por favor intenta conectar de nuevo.',
          }));
        }
      } catch (err) {
        console.error('Error checking database:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Error verificando la conexión. Por favor intenta de nuevo.',
        }));
      }
    };

    intervalId = setInterval(() => {
      try {
        if (popup.closed) {
          console.log('🔄 Popup window closed, checking database...');
          window.removeEventListener('message', handleMessage);
          if (intervalId) clearInterval(intervalId);

          setTimeout(() => {
            checkDatabaseForCredentials();
          }, 1000);
        }
      } catch (e) {
        console.error('Error in popup check interval:', e);
      }
    }, 500);
  };

  const disconnect = async () => {
    try {
      const { error } = await supabase
        .from('loyverse_credentials')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true);

      if (error) {
        console.error('Error disconnecting:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to disconnect',
        }));
        return;
      }

      setState({
        isConnected: false,
        loading: false,
        error: null,
        tokenExpiry: null,
      });

      console.log('✅ Disconnected successfully');
    } catch (err) {
      console.error('Error disconnecting:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  };

  return {
    ...state,
    initiateOAuth2Flow,
    disconnect,
    checkConnection,
  };
};
