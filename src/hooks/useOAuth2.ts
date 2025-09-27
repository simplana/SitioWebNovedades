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
    
    // Usar la URL de redirect configurada en .env o fallback al origen actual
    const configuredRedirectUri = import.meta.env.VITE_LOYVERSE_REDIRECT_URL || 
                                  import.meta.env.VITE_AUTH_REDIRECT_URL ||
                                  `${window.location.origin}/auth/loyverse/callback`;
    const redirectUri = encodeURIComponent(configuredRedirectUri);
    
    const scopes = 'ITEMS_READ%20CUSTOMERS_READ%20RECEIPTS_READ%20OPENID';
    const state = `loyverse-${Date.now()}`;

    const authUrl = `https://api.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${state}`;

    console.log('🚀 OAuth2 Configuration:');
    console.log('  - Client ID:', clientId);
    console.log('  - Redirect URI:', decodeURIComponent(redirectUri));
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
        error: 'Popup blocked. Please allow popups for this site.' 
      }));
      return;
    }

    // Listen for callback message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'LOYVERSE_OAUTH_SUCCESS') {
        console.log('✅ OAuth2 success received:', event.data);
        console.log('✅ OAuth2 success:', event.data);
        
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
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        if (state.loading) { // Solo mostrar error si estaba cargando
          setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Authorization cancelled by user' 
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