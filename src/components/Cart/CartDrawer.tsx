import React from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { Link, useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
    isAuthenticated,
    isVerified
  } = useCart();

  const handleCheckout = () => {
    console.log('🛒 Checkout button clicked - Auth:', isAuthenticated, 'Verified:', isVerified);

    if (!isAuthenticated) {
      console.log('❌ User not authenticated, opening auth modal');
      window.dispatchEvent(new CustomEvent('openAuthModal', {
        detail: { mode: 'signin' }
      }));
      return;
    }

    if (!isVerified) {
      console.log('❌ User email not verified, redirecting to verify page');
      onClose();
      navigate('/auth/verify-email');
      return;
    }

    console.log('✅ User authenticated and verified, proceeding to checkout');
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  const total = getTotalPrice();
  const totalItems = getTotalItems();
  
  console.log('🎨 CartDrawer render - Items:', items?.length || 0, 'Total items:', totalItems);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-divine z-[61] transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-divine-gold border-opacity-20 bg-sacred-white">
          <h2 className="font-playfair text-xl font-bold text-navy-devotion">
            Mi Carrito ({totalItems || 0})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-whisper-gray rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-stone-prayer" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-1 min-h-0">
          {!items || items.length === 0 ? (
            /* Empty Cart */
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="bg-white rounded-2xl shadow-sacred p-8 text-center max-w-sm mx-auto">
                <div className="bg-whisper-gray p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-10 w-10 text-dove-gray" />
                </div>
                <h3 className="font-playfair text-2xl font-semibold text-navy-devotion mb-4">
                  Tu carrito está vacío
                </h3>
                <p className="text-stone-prayer mb-6">
                  Descubre nuestros hermosos artículos religiosos
                </p>
                <Link
                  to="/productos"
                  onClick={onClose}
                  className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
                >
                  Explorar Productos
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white min-h-[400px] max-h-[60vh]">
                {items?.map((item) => (
                  <div key={`${item.id}-${item.options || ''}`} className="bg-gray-50 rounded-xl p-5 shadow-sacred border border-gray-100">
                    <div className="flex space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg shadow-sacred flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-navy-devotion text-lg leading-tight mb-2">
                          {item.name}
                        </h4>
                        {item.options && (
                          <p className="text-sm text-stone-prayer mb-1">{item.options}</p>
                        )}
                        <p className="text-xs text-dove-gray mb-3">SKU: {item.sku}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.options)}
                              className="p-2 hover:bg-white rounded-full transition-colors duration-200 border border-gray-200"
                            >
                              <Minus className="h-4 w-4 text-stone-prayer" />
                            </button>
                            <span className="font-semibold text-navy-devotion min-w-[3rem] text-center text-xl">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.options)}
                              className="p-2 hover:bg-white rounded-full transition-colors duration-200 border border-gray-200"
                            >
                              <Plus className="h-4 w-4 text-stone-prayer" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.options)}
                            className="p-2 hover:bg-rose-prayer rounded-full transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4 text-stone-prayer hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-divine-gold text-xl">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-stone-prayer">
                          ${item.price.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-divine-gold border-opacity-20 p-6 bg-white flex-shrink-0">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-playfair text-2xl font-semibold text-navy-devotion">
                    Total:
                  </span>
                  <span className="font-playfair text-4xl font-bold text-divine-gold">
                    ${total.toFixed(2)}
                  </span>
                </div>
                
                {isAuthenticated && isVerified ? (
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white font-semibold py-4 px-6 rounded-full transition-all duration-300 shadow-marian hover:shadow-divine transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <span>Proceder al Pago</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                ) : isAuthenticated && !isVerified ? (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-stone-prayer">
                      Verifica tu email para continuar con tu compra
                    </p>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
                    >
                      Verificar Email
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-stone-prayer">
                      Inicia sesión para continuar con tu compra
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('openAuthModal', {
                          detail: { mode: 'signin' }
                        }));
                      }}
                      className="w-full bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;