import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import OAuthCallback from './pages/OAuthCallback.tsx';
import './index.css';

// Manejar callback de OAuth mejorado
if (window.location.pathname === '/oauth/callback' || window.location.pathname === '/auth/loyverse/callback') {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  console.log('🔄 OAuth callback received:', { 
    path: window.location.pathname,
    hasCode: !!code, 
    hasState: !!state, 
    error 
  });

  if (error) {
    // Enviar error a la ventana padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_ERROR',
        error: error,
        error_description: urlParams.get('error_description'),
        timestamp: new Date().toISOString()
      }, window.location.origin);
      console.log('❌ OAuth error sent to parent window');
    }
  } else if (code && state) {
    // Enviar éxito a la ventana padre
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_SUCCESS',
        code: code,
        state: state,
        timestamp: new Date().toISOString()
      }, window.location.origin);
      console.log('✅ OAuth success sent to parent window');
    }
  } else {
    console.log('⚠️ OAuth callback without code or error');
  }

  // Cerrar popup después de enviar mensaje
  setTimeout(() => {
    console.log('🔒 Closing OAuth popup window');
    window.close();
  }, 1000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  </StrictMode>
);
