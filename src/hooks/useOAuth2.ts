import { useState, useEffect } from 'react';

interface OAuth2State {
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
}

export const useOAuth2 = () => {
  const [state, setState] = useState<OAuth2State>({
    isConnected: false,
    loading: false,
    error: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null
  });

  // Check for existing tokens on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('lv_access_token');
    const refreshToken = localStorage.getItem('lv_refresh_token');
    const tokenExpiry = localStorage.getItem('lv_access_token_exp');

    if (accessToken && refreshToken) {
      setState(prev => ({
        ...prev,
        isConnected: true,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? parseInt(tokenExpiry) : null
      }));
    }
  }, []);

  // Initiate OAuth2 flow with popup
  const initiateOAuth2Flow = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const clientId = import.meta.env.VITE_LOYVERSE_CLIENT_ID || 'na0tlm2Whq22j3jTPV_l';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // Usar Supabase Edge Function como redirect URI
    const redirectUri = encodeURIComponent(`${supabaseUrl}/functions/v1/loyverse-public-oauth/callback?auth=${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
    
    const scopes = 'ITEMS_READ%20CUSTOMERS_READ%20RECEIPTS_READ%20OPENID';
    const state = `loyverse-oauth-${Date.now()}`; // Estado único para esta sesión

    const authUrl = `https://api.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${state}`;

    console.log('🚀 OAuth2 Configuration:');
    console.log('  - Client ID:', clientId);
    console.log('  - Redirect URI (Supabase):', decodeURIComponent(redirectUri));
    console.log('  - Current Origin:', window.location.origin);
    console.log('  - Current Path:', window.location.pathname);
    console.log('  - State:', state);
    console.log('  - Auth URL:', authUrl);

    // Open popup window
    const popup = window.open(
      authUrl,
      'loyverse-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes,location=yes'
    );

    if (!popup) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Popup bloqueado. Por favor permite popups para este sitio.' 
      }));
      return;
    }

    console.log('✅ Popup opened successfully');

    // Listen for callback message
    const handleMessage = (event: MessageEvent) => {
      console.log('🔥 MESSAGE RECEIVED in main window:', event);
      console.log('🔥 EVENT DATA:', event.data);
      console.log('🔥 EVENT ORIGIN:', event.origin);
      console.log('🔥 WINDOW ORIGIN:', window.location.origin);
      
      if (event.origin !== window.location.origin) {
        console.log('❌ ORIGIN MISMATCH:', event.origin, 'vs', window.location.origin);
        return;
      }

      if (event.data && typeof event.data === 'object') {
        console.log('🔥 MESSAGE TYPE:', event.data.type);
        
        if (event.data.type === 'LOYVERSE_OAUTH_SUCCESS') {
          console.log('✅ OAuth2 success received:', event.data);
          
          // Store tokens
          localStorage.setItem('lv_access_token', event.data.accessToken);
          localStorage.setItem('lv_refresh_token', event.data.refreshToken);
          localStorage.setItem('lv_access_token_exp', event.data.tokenExpiry.toString());

          setState(prev => ({
            ...prev,
            isConnected: true,
            loading: false,
            error: null,
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
            tokenExpiry: event.data.tokenExpiry
          }));

          popup.close();
          window.removeEventListener('message', handleMessage);
          
        } else if (event.data.type === 'LOYVERSE_OAUTH_ERROR') {
          console.error('❌ OAuth2 error received:', event.data);
          console.error('❌ OAuth2 error:', event.data.error);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: event.data.error 
          }));
          popup.close();
          window.removeEventListener('message', handleMessage);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        if (state.loading) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Autorización cancelada por el usuario' 
          }));
        }
      }
    }, 1000);
  };

  // Disconnect OAuth2
  const disconnect = () => {
    localStorage.removeItem('lv_access_token');
    localStorage.removeItem('lv_refresh_token');
    localStorage.removeItem('lv_access_token_exp');

    setState({
      isConnected: false,
      loading: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null
    });
  };

  return {
    ...state,
    initiateOAuth2Flow,
    disconnect
  };
};