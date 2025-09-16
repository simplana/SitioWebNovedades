import React from 'react';
import { BookOpen } from 'lucide-react';
import ProductCard from './ProductCard';
import { LoyverseProduct } from '../hooks/useLoyverse';

interface ProductGridProps {
  products: LoyverseProduct[];
  loading?: boolean;
  error?: string | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, error }) => {
  console.log('🎨 ProductGrid renderizado:', { 
    productsCount: products.length, 
    loading, 
    error,
    products: products.slice(0, 2) // Solo mostrar los primeros 2 para debug
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-sacred-white rounded-2xl shadow-sacred overflow-hidden animate-pulse backdrop-blur-divine border border-divine-gold border-opacity-10">
            <div className="w-full h-64 bg-whisper-gray"></div>
            <div className="p-4">
              <div className="h-4 bg-whisper-gray rounded-full mb-2"></div>
              <div className="h-3 bg-whisper-gray rounded-full mb-2 w-1/2"></div>
              <div className="h-6 bg-whisper-gray rounded-full mb-4 w-1/3"></div>
              <div className="h-10 bg-whisper-gray rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-rose-prayer text-navy-devotion p-6 rounded-2xl shadow-sacred max-w-md mx-auto backdrop-blur-divine">
          <p className="text-xl font-semibold mb-2">No pudimos cargar los artículos religiosos</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-sacred-white p-8 rounded-2xl shadow-sacred max-w-md mx-auto backdrop-blur-divine border border-divine-gold border-opacity-10">
          <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-aureola">
            <BookOpen className="h-8 w-8 text-navy-devotion" />
          </div>
          <p className="text-xl font-semibold text-navy-devotion mb-2">No hay artículos disponibles en este momento</p>
          <p className="text-sm mt-2 text-stone-prayer">
            Estamos preparando nuevos artículos para ti. Vuelve pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;