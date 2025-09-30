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
    console.log('🔍 Checking for existing tokens...');
    const accessToken = localStorage.getItem('lv_access_token');
    const refreshToken = localStorage.getItem('lv_refresh_token');
    const tokenExpiry = localStorage.getItem('lv_access_token_exp');

    if (accessToken && refreshToken) {
      console.log('✅ Found existing tokens in localStorage');
      setState(prev => ({
        ...prev,
        isConnected: true,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? parseInt(tokenExpiry) : null
      }));
    } else {
      console.log('❌ No existing tokens found');
    }
  }, []);

  // Add message listener for OAuth popup - FIXED VERSION
  useEffect(() => {
    console.log('🎧 Setting up message listener for OAuth popup...');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 RAW MESSAGE RECEIVED:', event.data);
      console.log('📨 Message type:', event.data?.type);
      
      // Accept messages from any origin for OAuth (less restrictive)
      if (!event.data || typeof event.data !== 'object') {
        console.log('❌ Invalid message format');
        return;
      }
      
      if (event.data?.type === 'LOYVERSE_OAUTH_SUCCESS') {
        console.log('🎉 OAUTH SUCCESS! SAVING TOKENS NOW...');
        console.log('🔑 Access Token:', event.data.accessToken);
        console.log('🔄 Refresh Token:', event.data.refreshToken);
        console.log('⏰ Token Expiry:', event.data.tokenExpiry);
        
        try {
          // Save tokens immediately
          localStorage.setItem('lv_access_token', event.data.accessToken);
          localStorage.setItem('lv_refresh_token', event.data.refreshToken);
          localStorage.setItem('lv_access_token_exp', event.data.tokenExpiry.toString());
          
          console.log('💾 TOKENS SAVED TO LOCALSTORAGE!');
          console.log('💾 Saved access token:', localStorage.getItem('lv_access_token'));
          console.log('💾 Saved refresh token:', localStorage.getItem('lv_refresh_token'));
          console.log('💾 Saved expiry:', localStorage.getItem('lv_access_token_exp'));
        } catch (error) {
          console.error('❌ Error saving tokens:', error);
        }
        
        // Update state immediately
        setState({
          isConnected: true,
          loading: false,
          error: null,
          accessToken: event.data.accessToken,
          refreshToken: event.data.refreshToken,
          tokenExpiry: event.data.tokenExpiry
        });
        
        console.log('🔄 STATE UPDATED! Reloading page in 1 second...');
        
        // Reload page to use new tokens - give it a moment
        setTimeout(() => {
          console.log('🔄 RELOADING PAGE NOW...');
          window.location.reload();
        }, 1000);
        
      } else if (event.data?.type === 'LOYVERSE_OAUTH_ERROR') {
        console.error('❌ OAuth error received:', event.data.error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: event.data.error 
        }));
      }
    };

    // Add the listener
    window.addEventListener('message', handleMessage);
    console.log('✅ MESSAGE LISTENER ADDED AND READY');
    
    // Cleanup
    return () => {
      console.log('🧹 REMOVING MESSAGE LISTENER');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const initiateOAuth2Flow = () => {
    console.log('🚀 Starting OAuth2 flow...');
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Primero verificar si el navegador permite popups
    const testPopup = window.open('', 'test', 'width=1,height=1');
    if (!testPopup) {
      console.error('❌ Popup blocked by browser');
      setState(prev => ({ 
        ...prev,
        loading: false, 
        error: 'El navegador está bloqueando popups. Por favor permite popups para este sitio y vuelve a intentar.' 
      }));
      return;
    }
    testPopup.close();

    const clientId = 'na0tlm2Whq22j3jTPV_l';
    const redirectUri = encodeURIComponent('https://iabrhkvwhmliemgioxce.supabase.co/functions/v1/loyverse-public-oauth/callback');
    const scopes = 'ITEMS_READ%20CUSTOMERS_READ%20RECEIPTS_READ%20OPENID';
    const randomState = Math.random().toString(36).substring(2, 15);

    const authUrl = `https://api.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${randomState}`;

    console.log('🔗 Opening popup with URL:', authUrl);

    const popup = window.open(authUrl, 'loyverse-oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');

    if (!popup) {
      console.error('❌ Could not open popup');
      setState(prev => ({ 
        ...prev,
        loading: false, 
        error: 'Popup bloqueado. Habilita popups para este sitio en tu navegador y vuelve a intentar.' 
      }));
      return;
    }

    console.log('✅ Popup opened successfully');

    // Check if popup closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        console.log('🔄 Popup closed manually');
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
          console.log('Could not close popup');
        }
        clearInterval(checkClosed);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Timeout: La autorización tomó demasiado tiempo' 
        }));
      }
    }, 120000);
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting from Loyverse...');
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
    
    console.log('✅ Disconnected and tokens cleared');
    window.location.reload();
  };

  return {
    ...state,
    initiateOAuth2Flow,
    disconnect
  };
};