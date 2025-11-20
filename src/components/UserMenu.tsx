import React, { useState } from 'react';
import { User, LogOut, Settings, Heart, ShoppingBag, ChevronDown, Package } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const userAvatar = user.user_metadata?.avatar_url;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gold transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userDisplayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 bg-gold rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-navy" />
          </div>
        )}
        <span className="hidden sm:block font-medium">{userDisplayName}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gold rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-navy" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-navy">{userDisplayName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Settings className="h-5 w-5" />
                <span>Mi Perfil</span>
              </Link>

              <Link
                to="/orders"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Package className="h-5 w-5" />
                <span>Mis Órdenes</span>
              </Link>
              
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                <Heart className="h-5 w-5" />
                <span>Favoritos</span>
              </button>
            </div>

            <div className="border-t border-gray-200 py-2">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                <span>{loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;