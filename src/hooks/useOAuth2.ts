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
    // Usar tokens directamente - sin popup
    console.log('🚀 Usando tokens directamente...');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Guardar tokens directamente
      localStorage.setItem('lv_access_token', '8h1TdLJkO73C8cpjOw0Gvjl0qXM');
      localStorage.setItem('lv_refresh_token', 'inIXIS1k3aPxUO69Z1olW5pMJX0');
      localStorage.setItem('lv_access_token_exp', '1761791893996');
      
      console.log('✅ Tokens guardados directamente');
      
      setState({
        isConnected: true,
        loading: false,
        error: null,
        accessToken: '8h1TdLJkO73C8cpjOw0Gvjl0qXM',
        refreshToken: 'inIXIS1k3aPxUO69Z1olW5pMJX0',
        tokenExpiry: 1761791893996
      });
      
      // Recargar página para usar tokens
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error guardando tokens:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error guardando tokens' 
      }));
    }
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