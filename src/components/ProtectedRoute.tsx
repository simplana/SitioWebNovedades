import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerification = true
}) => {
  const { isAuthenticated, isVerified, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);

      const event = new CustomEvent('openAuthModal', {
        detail: { mode: 'signin' }
      });
      window.dispatchEvent(event);
    }
  }, [loading, isAuthenticated, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sacred-white via-whisper-gray to-golden-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-divine-gold mx-auto mb-4"></div>
          <p className="text-stone-prayer">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireVerification && !isVerified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
