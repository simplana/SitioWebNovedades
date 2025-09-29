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

    const clientId = 'na0tlm2Whq22j3jTPV_l';
    const redirectUri = encodeURIComponent('https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback');
    const scopes = 'ITEMS_READ%20CUSTOMERS_READ%20RECEIPTS_READ%20OPENID';
    const randomState = Math.random().toString(36).substring(2, 15);

    const authUrl = `https://api.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${randomState}`;

    console.log('🚀 Opening OAuth popup...');

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
        error: 'No se pudo abrir la ventana emergente. Verifica que no esté bloqueada por el navegador.' 
      }));
      return;
    }

    // Message handler
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Message received:', event.data);
      
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'LOYVERSE_OAUTH_SUCCESS') {
          console.log('✅ OAuth success! Storing tokens...');
          
          // Store tokens immediately
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

          // Force close popup
          try {
            popup.close();
          } catch (e) {
            console.log('Could not close popup:', e);
          }
          
          // Cleanup
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          
          // Reload page to use new tokens
          console.log('🔄 Reloading page to load products...');
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
        } else if (event.data.type === 'LOYVERSE_OAUTH_ERROR') {
          console.error('❌ OAuth error:', event.data.error);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: event.data.error 
          }));
          
          try {
            popup.close();
          } catch (e) {
            console.log('Could not close popup on error');
          }
          
          // Cleanup
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        console.log('🔄 Popup was closed manually');
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: null
        }));
      }
    }, 1000);

    // Timeout after 2 minutes
    setTimeout(() => {
      if (!popup.closed) {
        console.log('⏰ OAuth timeout, closing popup');
        try {
          popup.close();
        } catch (e) {
          console.log('Could not close popup on timeout');
        }
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Timeout: La autorización tomó demasiado tiempo' 
        }));
      }
    }, 120000);
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
    
    // Reload to clear products
    window.location.reload();
  };

  return {
    ...state,
    initiateOAuth2Flow,
    disconnect
  };
};