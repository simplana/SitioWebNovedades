import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import AuthModal from './components/AuthModal';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Restauraciones from './pages/Restauraciones';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import EmailVerificationPending from './pages/EmailVerificationPending';
import EmailVerified from './pages/EmailVerified';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import DevTools from './pages/Admin/DevTools';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleAuthModalOpen = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Listen for auth modal events from other components
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      const { mode } = event.detail;
      handleAuthModalOpen(mode);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    };
  }, []);
  return (
    <Router>
      <div className="min-h-screen bg-white font-inter">
        <Header onAuthModalOpen={handleAuthModalOpen} />
        <EmailVerificationBanner />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/restauraciones" element={<Restauraciones />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<EmailVerificationPending />} />
            <Route path="/auth/verified" element={<EmailVerified />} />
            <Route path="/admin" element={<Admin />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute requireVerification={true}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute requireVerification={true}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/admin/dev" element={<DevTools />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppFloat />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </div>
    </Router>
  );
}

export default App;