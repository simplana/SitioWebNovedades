import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Heart, MessageCircle } from 'lucide-react';

interface LoyverseProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  sku?: string;
  image?: string;
  description?: string;
}

interface CatalogoProps {
  showFilters?: boolean;
  maxProducts?: number;
  categories?: string[];
  className?: string;
}

const Catalogo: React.FC<CatalogoProps> = ({ 
  showFilters = true, 
  maxProducts, 
  categories,
  className = '' 
}) => {
  const [productos, setProductos] = useState<LoyverseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');

  // Simulación de datos de Loyverse - aquí se conectaría con la API real
  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        // Este componente ahora está obsoleto, usar useLoyverse hook en su lugar
        console.warn('Componente Catalogo obsoleto, usar useLoyverse hook');
        setProductos([]);
      } catch (error) {
        console.error('Error fetching products from Loyverse:', error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Obtener categorías únicas de los productos
  const availableCategories = ['Todos', ...Array.from(new Set(productos.map(p => p.category).filter(Boolean)))];
  const categoriesToShow = categories || availableCategories;

  // Filtrar y ordenar productos
  const filteredProducts = productos
    .filter(producto => {
      const matchesCategory = selectedCategory === 'Todos' || producto.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        producto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.sku && producto.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesProvidedCategories = !categories || categories.includes('Todos') || 
        (producto.category && categories.includes(producto.category));
      
      return matchesCategory && matchesSearch && matchesProvidedCategories;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    })
    .slice(0, maxProducts);

  const handleWhatsAppOrder = (producto: LoyverseProduct) => {
    const message = encodeURIComponent(
      `Hola, me interesa el producto: ${producto.name} ${producto.sku ? `(SKU: ${producto.sku})` : ''} - $${producto.price}`
    );
    const whatsappUrl = `https://wa.me/50760000000?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-64 bg-gray-300"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-500 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                {categoriesToShow.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenar */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
              >
                <option value="name">Alfabético</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {showFilters && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} productos encontrados
            {selectedCategory !== 'Todos' && ` en ${selectedCategory}`}
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        </div>
      )}

      {/* Grid de productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((producto) => (
            <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
              <div className="relative overflow-hidden">
                <img
                  src={producto.image || 'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={producto.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200">
                  <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors duration-200" />
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-playfair font-semibold text-lg text-navy mb-2 hover:text-gold transition-colors duration-200">
                  {producto.name}
                </h3>
                {producto.sku && (
                  <p className="text-sm text-gray-600 mb-2">SKU: {producto.sku}</p>
                )}
                <p className="text-2xl font-bold text-gold mb-4">${producto.price.toFixed(2)}</p>
                
                <button
                  onClick={() => handleWhatsAppOrder(producto)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Solicitar por WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-500">
            Intenta cambiar los filtros o el término de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
};

export default Catalogo;