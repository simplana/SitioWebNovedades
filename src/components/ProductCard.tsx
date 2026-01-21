import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import PagueloFacilButton from './PagueloFacilButton';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  category: string;
  availableForSale?: boolean;
  trackStock?: boolean;
  options?: string;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const { addToCart } = useCart();
  
  const handleWhatsAppOrder = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '50769594358';
    const message = encodeURIComponent(
      'Hola 👋🏼, bendiciones.\n' +
      'Estoy interesado/a en conocer más sobre los productos de Novedades Católicas María Reina de la Paz.\n' +
      '¿Podrían brindarme información y disponibilidad, por favor?\n' +
      'Gracias.'
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('🛒 ProductCard: Adding to cart:', product.name);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      sku: product.sku,
      image: product.image,
      options: product.options
    });
    
    // Force a small delay to ensure state updates
    setTimeout(() => {
      console.log('✅ ProductCard: Item added successfully');
    }, 100);
  };

  const isOutOfStock = product.trackStock && !product.availableForSale;
  return (
    <div className={`bg-sacred-white rounded-2xl shadow-sacred overflow-hidden hover:shadow-divine transition-all duration-300 group relative backdrop-blur-divine border border-divine-gold border-opacity-10 ${className}`}>
      {isOutOfStock && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-stone-prayer bg-opacity-60 z-10 flex items-center justify-center backdrop-blur-sacred">
          <span className="bg-rose-prayer text-navy-devotion px-4 py-2 rounded-full font-semibold shadow-sacred">
            AGOTADO
          </span>
        </div>
      )}
      <div className="relative overflow-hidden">
        <Link to={`/producto/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 img-divine"
          />
        </Link>
        <button className="absolute top-3 right-3 bg-sacred-white bg-opacity-90 p-2 rounded-full shadow-sacred hover:bg-rose-prayer transition-all duration-200 backdrop-blur-sacred">
          <Heart className="h-5 w-5 text-stone-prayer hover:text-marian-blue transition-colors duration-200" />
        </button>
      </div>
      
      <div className="p-4">
        <Link to={`/producto/${product.id}`}>
          <h3 className="font-playfair font-semibold text-lg text-navy-devotion mb-2 hover:text-divine-gold transition-colors duration-200 text-shadow-sacred">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-stone-prayer">SKU: {product.sku}</p>
          {!product.availableForSale && product.trackStock && (
            <span className="text-xs bg-rose-prayer text-navy-devotion px-2 py-1 rounded-full">
              Sin stock
            </span>
          )}
          {product.availableForSale && (
            <span className="text-xs bg-mint-serenity text-marian-blue px-2 py-1 rounded-full">
              Disponible
            </span>
          )}
        </div>
        {product.options && (
          <p className="text-sm text-dove-gray mb-2">{product.options}</p>
        )}
        <p className="text-2xl font-bold text-divine-gold mb-4 text-shadow-sacred">${product.price.toFixed(2)}</p>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
              isOutOfStock 
                ? 'bg-whisper-gray text-dove-gray cursor-not-allowed' 
                : 'bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold shadow-golden hover:shadow-aureola transform hover:scale-105 active:scale-95'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-xs">{isOutOfStock ? 'Agotado' : 'Carrito'}</span>
          </button>
          
          <button
            onClick={handleWhatsAppOrder}
            className="flex-1 bg-gradient-to-r from-mint-serenity to-celestial-blue hover:from-celestial-blue hover:to-marian-blue text-navy-devotion hover:text-sacred-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 shadow-sacred hover:shadow-divine transform hover:scale-105 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;