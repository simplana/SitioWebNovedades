import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Shield, Truck, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useLoyverseProducts } from '../hooks/useLoyverse';
import { useCart } from '../hooks/useCart';
import { useProductComments } from '../hooks/useProductComments';
import ProductGrid from '../components/ProductGrid';
import StarRating from '../components/StarRating';
import ProductComments from '../components/ProductComments';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { products, loading, getProductById, getProductsByCategory } = useLoyverseProducts({
  });
  const { addToCart, getItemQuantity } = useCart();
  const product = getProductById(id || '');
  const { comments, getAverageRating } = useProductComments(id || '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'comments'>('description');

  const averageRating = getAverageRating();
  const commentsCount = comments.length;

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Producto no encontrado</h2>
          <Link to="/productos" className="text-gold hover:text-yellow-600">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const relatedProducts = getProductsByCategory(product.category || '')
    .filter(p => p.id !== product.id)
    .slice(0, 3);

  const currentQuantityInCart = getItemQuantity(product.id);
  const isOutOfStock = product.trackStock && !product.availableForSale;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        sku: product.sku || '',
        image: product.image,
        options: product.options,
        loyverse_variant_id: product.variantId
      }, quantity);

      // Mostrar confirmación
      // Crear notificación temporal
      const notification = document.createElement('div');
      notification.innerHTML = `✅ ¡${product.name} agregado al carrito! (${quantity} unidades)`;
      notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
      document.body.appendChild(notification);

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  };

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

  const handleShare = () => {
    const productUrl = window.location.href;
    const message = encodeURIComponent(
      `¡Mira este producto de Novedades Católicas!\n\n*${product.name}*\n\nPrecio: $${product.price.toFixed(2)}\n\n${productUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/productos"
            className="inline-flex items-center text-gold hover:text-yellow-600 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al catálogo
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
            {/* Imagen del producto */}
            <div className="aspect-square overflow-hidden rounded-lg relative">
              {isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                  AGOTADO
                </div>
              )}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Información del producto */}
            <div className="flex flex-col">
              {/* Badges */}
              <div className="mb-4">
                <span className="text-gold text-sm font-medium bg-light-gold bg-opacity-20 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                {product.isNew && (
                  <span className="ml-2 text-green-600 text-sm font-medium bg-green-100 px-3 py-1 rounded-full">
                    Nuevo
                  </span>
                )}
                {product.availableForSale && (
                  <span className="ml-2 text-blue-600 text-sm font-medium bg-blue-100 px-3 py-1 rounded-full">
                    Disponible
                  </span>
                )}
              </div>

              {/* Título */}
              <h1 className="font-playfair text-3xl font-bold text-navy mb-4">
                {product.name}
              </h1>

              {/* SKU y opciones */}
              <div className="mb-4">
                {product.sku && (
                  <p className="text-gray-600 mb-2">SKU: {product.sku}</p>
                )}
                {product.options && (
                  <p className="text-gray-600 mb-2">Opciones: {product.options}</p>
                )}
              </div>

              {/* Rating */}
              {commentsCount > 0 && (
                <div className="flex items-center space-x-2 mb-6">
                  <StarRating rating={averageRating} />
                  <span className="text-gray-600">({commentsCount} {commentsCount === 1 ? 'opinión' : 'opiniones'})</span>
                </div>
              )}

              {/* Precio */}
              <div className="text-4xl font-bold text-gold mb-6">
                ${product.price.toFixed(2)}
              </div>

              {/* Selector de cantidad */}
              {!isOutOfStock && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={decrementQuantity}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors duration-200"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {currentQuantityInCart > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      Ya tienes {currentQuantityInCart} unidades en el carrito
                    </p>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 ${
                    isOutOfStock
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                      : 'bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-bold border-2 border-divine-gold shadow-golden hover:shadow-aureola transform hover:scale-105'
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{isOutOfStock ? 'No disponible' : 'Agregar al carrito'}</span>
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp</span>
                </button>

                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Favoritos</span>
                </button>

                <button
                  onClick={handleShare}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Compartir</span>
                </button>
              </div>

              {/* Garantías */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gold" />
                  <span className="text-gray-700">Calidad garantizada</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-gold" />
                  <span className="text-gray-700">Entrega en Panamá</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-gold" />
                  <span className="text-gray-700">Asesoría personalizada</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Descripción y Comentarios */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Opiniones {commentsCount > 0 ? `(${commentsCount})` : ''}
              </button>
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="font-playfair text-2xl font-bold text-navy mb-4">
                  Descripción del Producto
                </h3>
                <div className="prose prose-lg max-w-none">
                  {product.description ? (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic mb-4">
                      No hay descripción disponible para este producto.
                    </p>
                  )}

                  {/* Información adicional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Especificaciones</h4>
                      <ul className="text-gray-700 space-y-1">
                        <li>• SKU: {product.sku}</li>
                        {product.options && <li>• Variante: {product.options}</li>}
                        <li>• Categoría: {product.category}</li>
                        <li>• Control de inventario: {product.trackStock ? 'Sí' : 'No'}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-2">Disponibilidad</h4>
                      <ul className="text-gray-700 space-y-1">
                        <li>• Estado: {product.availableForSale ? 'Disponible' : 'Agotado'}</li>
                        <li>• Entrega: 2-3 días hábiles</li>
                        <li>• Garantía: 30 días</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <ProductComments productId={product.id} productName={product.name} />
            )}
          </div>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-playfair text-3xl font-bold text-navy mb-8 text-center">
              Productos Relacionados
            </h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;