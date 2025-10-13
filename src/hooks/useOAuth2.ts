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
    const redirectUri = encodeURIComponent('https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback');
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

    const handleMessage = (event: MessageEvent) => {
      console.log('✅ Processing message from:', event.origin);

      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'LOYVERSE_OAUTH_SUCCESS') {
          console.log('OAuth2 success received');

          setState({
            isConnected: true,
            loading: false,
            error: null,
            tokenExpiry: null,
          });

          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);

          try {
            popup.close();
          } catch (e) {
            console.log('❌ Could not close popup manually:', e);
          }

          setTimeout(() => {
            console.log('🔄 Reloading page to refresh connection status...');
            window.location.reload();
          }, 200);

        } else if (event.data.type === 'LOYVERSE_OAUTH_ERROR') {
          console.error('OAuth2 error received:', event.data.error);
          setState(prev => ({
            ...prev,
            loading: false,
            error: event.data.error,
          }));

          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);

          try {
            popup.close();
          } catch (e) {
            console.log('Could not close popup on error');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const checkClosed = setInterval(async () => {
      if (popup.closed) {
        console.log('🔄 Popup was closed');
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);

        console.log('🔍 Checking database for saved credentials...');

        const { data, error } = await supabase
          .from('loyverse_credentials')
          .select('id, is_active')
          .eq('is_active', true)
          .maybeSingle();

        if (data) {
          console.log('✅ Credentials found in database! OAuth was successful.');
          setState({
            isConnected: true,
            loading: false,
            error: null,
            tokenExpiry: null,
          });

          setTimeout(() => {
            console.log('🔄 Reloading page to refresh products...');
            window.location.reload();
          }, 500);
        } else {
          console.log('❌ No credentials found in database');
          setState(prev => ({
            ...prev,
            loading: false,
            error: error ? error.message : 'No se encontraron credenciales. Intenta de nuevo.',
          }));
        }
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
