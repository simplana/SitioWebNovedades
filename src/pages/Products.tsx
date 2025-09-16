import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { useLoyverseProducts } from '../hooks/useLoyverse';

const Products = () => {
  const { products, loading, error, pagination, goToPage, nextPage, previousPage, getCategories } = useLoyverseProducts();

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = getCategories();

  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    console.log('🔍 Productos disponibles:', products.length);
    console.log('📦 Productos:', products);
    
    return products
      .filter(product => {
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        const matchesSearch = !searchTerm || 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesCategory && matchesSearch;
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
      });
  }, [products, selectedCategory, searchTerm, sortBy]);

  console.log('✅ Productos filtrados:', filteredProducts.length);

  const handlePageClick = (page: number) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;
    
    // Previous button
    if (pagination.hasPreviousPage) {
      buttons.push(
        <button
          key="prev"
          onClick={previousPage}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </button>
      );
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? 'text-gold bg-light-gold border-gold'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Show ellipsis if there are more pages
    if (pagination.hasNextPage && currentPage < totalPages - 2) {
      buttons.push(
        <span key="ellipsis" className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
          ...
        </span>
      );
    }
    
    // Next button
    if (pagination.hasNextPage) {
      buttons.push(
        <button
          key="next"
          onClick={nextPage}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:text-gray-700"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      );
    }
    
    return buttons;
  };
  return (
    <div className="pt-16 min-h-screen bg-divine-gradient">
      {/* Header */}
      <div className="bg-gradient-to-br from-lavender-peace via-divine-light to-rose-prayer py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-aureola-glow opacity-60"></div>
        <div className="absolute top-10 left-10 text-divine-gold opacity-20">
          <svg className="w-12 h-12 animate-float" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4 text-navy-devotion text-shadow-sacred">
            Artículos Religiosos
          </h1>
          <div className="w-32 h-1 bg-divine-gold mx-auto mb-6 rounded-full"></div>
          <p className="text-navy-devotion text-lg max-w-2xl mx-auto leading-relaxed opacity-90">
            Explora nuestra colección de artículos religiosos católicos, 
            cuidadosamente seleccionados con amor para acompañar tu camino de fe y devoción.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-sacred-white rounded-2xl shadow-sacred p-6 mb-8 backdrop-blur-divine border border-divine-gold border-opacity-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-prayer h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar artículos religiosos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-divine-gold border-opacity-30 rounded-full focus:ring-2 focus:ring-divine-gold focus:border-transparent bg-sacred-white shadow-sacred text-navy-devotion"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="flex items-center space-x-2">
              <Filter className="text-stone-prayer h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-divine-gold border-opacity-30 rounded-full px-4 py-2 focus:ring-2 focus:ring-divine-gold focus:border-transparent bg-sacred-white shadow-sacred text-navy-devotion"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenar */}
            <div className="flex items-center space-x-2">
              <span className="text-navy-devotion font-medium">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-divine-gold border-opacity-30 rounded-full px-4 py-2 focus:ring-2 focus:ring-divine-gold focus:border-transparent bg-sacred-white shadow-sacred text-navy-devotion"
              >
                <option value="name">Alfabético</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-6">
          <p className="text-stone-prayer">
            {filteredProducts.length} productos encontrados
            {selectedCategory !== 'Todos' && ` en ${selectedCategory}`}
            {searchTerm && ` para "${searchTerm}"`}
            {!loading && pagination.totalPages > 1 && (
              <span className="ml-2 text-sm text-dove-gray">
                (Página {pagination.currentPage} de {pagination.hasNextPage ? `${pagination.currentPage}+` : pagination.currentPage})
              </span>
            )}
          </p>
          
        </div>

        {/* Grid de productos */}
        <ProductGrid 
          products={filteredProducts} 
          loading={loading} 
          error={error}
        />
        
        {/* Pagination */}
        {!loading && (pagination.hasNextPage || pagination.hasPreviousPage) && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center" aria-label="Pagination">
              {renderPaginationButtons()}
            </nav>
          </div>
        )}
        
        {/* Loading indicator for pagination */}
        {loading && pagination.currentPage > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2 text-stone-prayer bg-sacred-white bg-opacity-90 py-3 px-6 rounded-full shadow-sacred backdrop-blur-divine">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-divine-gold"></div>
              <span>Cargando productos...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;