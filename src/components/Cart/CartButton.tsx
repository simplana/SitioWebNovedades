import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

interface CartButtonProps {
  onClick: () => void;
  className?: string;
}

const CartButton: React.FC<CartButtonProps> = ({ onClick, className = '' }) => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <button 
      onClick={onClick}
      className={`relative p-2 text-stone-prayer hover:text-divine-gold transition-colors duration-200 ${className}`}
    >
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-divine-gold text-navy-devotion text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-golden animate-gentle-glow">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
};

export default CartButton;