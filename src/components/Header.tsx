import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cross, Menu, X, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './UserMenu';
import CartButton from './Cart/CartButton';
import CartDrawer from './Cart/CartDrawer';

interface HeaderProps {
  onAuthModalOpen: (mode: 'signin' | 'signup') => void;
}

const Header: React.FC<HeaderProps> = ({ onAuthModalOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Productos', href: '/productos' },
    { name: 'Restauraciones', href: '/restauraciones' },
    { name: 'Mensajes de la Virgen', href: '/blog' },
    { name: 'Contacto', href: '/contacto' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-sacred-white bg-opacity-95 backdrop-blur-divine shadow-sacred fixed top-0 left-0 right-0 z-50 border-b border-divine-gold border-opacity-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-2 rounded-full shadow-aureola">
              <img 
                src="/novedades_catolicas_logo_transparent.png" 
                alt="Novedades Católicas Logo" 
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-playfair font-bold text-base text-navy-devotion text-shadow-sacred">
                Novedades Católicas
              </h1>
              <div className="w-full h-px bg-divine-gold my-1 shadow-golden"></div>
              <p className="text-xs text-stone-prayer whitespace-nowrap">María Reina de la Paz</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2 lg:space-x-4 xl:space-x-6 flex-1 justify-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 text-xs lg:text-sm xl:text-base whitespace-nowrap px-1 lg:px-2 ${
                  isActive(item.href)
                    ? 'text-divine-gold border-b-2 border-divine-gold pb-1 text-shadow-sacred'
                    : 'text-stone-prayer hover:text-divine-gold'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/oauth2-tester"
              className={`font-medium transition-colors duration-200 text-xs lg:text-sm xl:text-base whitespace-nowrap px-1 lg:px-2 ${
                isActive('/oauth2-tester')
                  ? 'text-divine-gold border-b-2 border-divine-gold pb-1 text-shadow-sacred'
                  : 'text-stone-prayer hover:text-divine-gold'
              }`}
            >
              OAuth2 Tester
            </Link>
          </nav>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {/* Auth Section */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => {
                    onAuthModalOpen('signin');
                  }}
                  className="text-stone-prayer hover:text-divine-gold transition-all duration-200 font-medium text-xs lg:text-sm xl:text-base whitespace-nowrap px-3 py-2 rounded-full hover:bg-whisper-gray active:bg-golden-light active:text-navy-devotion transform active:scale-95"
                >
                  Iniciar Sesión
                </button>
                <span className="text-dove-gray">|</span>
                <button
                  onClick={() => {
                    onAuthModalOpen('signup');
                  }}
                  className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-medium px-3 py-2 rounded-full transition-all duration-300 text-sm shadow-golden hover:shadow-aureola transform hover:scale-105 active:scale-95 active:shadow-sacred whitespace-nowrap"
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Cart Icon */}
            <CartButton onClick={() => setIsCartOpen(true)} />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1 text-stone-prayer hover:text-divine-gold transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-divine-gold border-opacity-20 bg-sacred-white bg-opacity-95 backdrop-blur-sacred">
            <div className="py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-divine-gold bg-golden-light bg-opacity-30'
                      : 'text-stone-prayer hover:text-divine-gold hover:bg-whisper-gray'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="border-t border-divine-gold border-opacity-20 pt-4 space-y-2">
                  <button
                    onClick={() => {
                      onAuthModalOpen('signin');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-stone-prayer hover:text-divine-gold hover:bg-whisper-gray transition-colors duration-200"
                  >
                    <User className="h-5 w-5" />
                    <span>Iniciar Sesión</span>
                  </button>
                  <button
                    onClick={() => {
                      onAuthModalOpen('signup');
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-medium py-2 px-4 rounded-full transition-all duration-300 mx-4 shadow-golden hover:shadow-aureola transform hover:scale-105"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};

export default Header;