import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import OAuthCallback from './pages/OAuthCallback.tsx';
import './index.css';

// Handle OAuth callback
if (window.location.pathname === '/oauth/callback') {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    // Send error to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_ERROR',
        error: error,
        error_description: urlParams.get('error_description')
      }, window.location.origin);
    }
  } else if (code && state) {
    // Send success to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_SUCCESS',
        code: code,
        state: state
      }, window.location.origin);
    }
  }

  // Close popup after sending message
  setTimeout(() => {
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
