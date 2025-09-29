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

  // Direct token exchange with Loyverse API
  const exchangeCodeForTokens = async (code: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      const clientId = 'na0tlm2Whq22j3jTPV_l';
      const clientSecret = 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw====';
      const redirectUri = `${window.location.origin}/auth/loyverse/callback`;
      
      console.log('🚀 DIRECT TOKEN EXCHANGE:');
      console.log('📋 client_id:', clientId);
      console.log('📋 client_secret length:', clientSecret.length);
      console.log('📋 redirect_uri:', redirectUri);
      console.log('📋 code:', code);

      // Usar application/x-www-form-urlencoded según documentación
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);

      console.log('📋 Form data:', formData.toString());

      const response = await fetch('https://api.loyverse.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData.toString()
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Loyverse error:', errorText);
        
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = { error: errorText };
        }
        
        return {
          success: false,
          error: `Loyverse API error: ${response.status} - ${parsedError.error || errorText}`
        };
      }

      const tokenData = await response.json();
      console.log('✅ Token exchange successful!');
      console.log('📋 Token data keys:', Object.keys(tokenData));

      return {
        success: true,
        data: tokenData
      };

    } catch (error) {
      console.error('❌ Token exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Initiate OAuth2 flow with popup
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
        error: 'No se pudo abrir la ventana emergente. Verifica que no esté bloqueada por el navegador.' 
      }));
      return;
    }

    console.log('✅ Popup opened successfully');

      // Allow messages from any origin for OAuth callback
      console.log('✅ Processing message from:', event.origin);

      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'LOYVERSE_OAUTH_SUCCESS') {
          console.log('OAuth2 success received, storing tokens...');
          
          // Store tokens
          localStorage.setItem('lv_access_token', event.data.accessToken);
          localStorage.setItem('lv_refresh_token', event.data.refreshToken);
          localStorage.setItem('lv_access_token_exp', event.data.tokenExpiry.toString());

          console.log('Tokens stored successfully');
          
          setState(prev => ({
            ...prev,
            isConnected: true,
            loading: false,
            error: null,
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
            tokenExpiry: event.data.tokenExpiry
          }));

          // Cleanup
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          
          // Force close popup immediately
          try {
            popup.close();
          } catch (e) {
            console.log('❌ Could not close popup manually:', e);
          }
          
          // Reload page after short delay to refresh products
          setTimeout(() => {
            console.log('🔄 Reloading page to load products...');
            window.location.reload();
          }, 500);
          
        } else if (event.data.type === 'LOYVERSE_OAUTH_ERROR') {
          console.error('OAuth2 error received:', event.data.error);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: event.data.error 
          }));
          
          // Cleanup
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

    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        console.log('🔄 Popup was closed manually');
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
        if (state.loading) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: null // No mostrar error si se cerró manualmente después del éxito
          }));
        }
      }
    }, 500); // Check more frequently
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
    disconnect,
    exchangeCodeForTokens
  };
};