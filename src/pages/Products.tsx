import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { useLoyverseProducts, useCategories, SortOption } from '../hooks/useLoyverse';

const PRODUCTS_PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const categories = useCategories();

  // Debounce typing so we don't fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Any change to the filters invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, sortBy]);

  const { products, total, totalPages, loading, error } = useLoyverseProducts({
    search,
    category: selectedCategory,
    sortBy,
    page,
    pageSize: PRODUCTS_PER_PAGE,
  });

  const isFiltering = Boolean(search) || selectedCategory !== 'Todos';

  const handlePageClick = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Page numbers with first/last always present and ellipses across the gaps. */
  const getPageNumbers = () => {
    const pages: (number | 'gap-left' | 'gap-right')[] = [];
    const windowStart = Math.max(2, page - 2);
    const windowEnd = Math.min(totalPages - 1, page + 2);

    pages.push(1);
    if (windowStart > 2) pages.push('gap-left');
    for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
    if (windowEnd < totalPages - 1) pages.push('gap-right');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const navButton =
    'flex items-center px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500';

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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border border-divine-gold border-opacity-30 rounded-full px-4 py-2 focus:ring-2 focus:ring-divine-gold focus:border-transparent bg-sacred-white shadow-sacred text-navy-devotion"
              >
                <option value="name">Alfabético</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados: solo al buscar o filtrar */}
        {isFiltering && !loading && (
          <div className="mb-6">
            <p className="text-stone-prayer">
              {total} {total === 1 ? 'resultado' : 'resultados'}
              {selectedCategory !== 'Todos' && ` en ${selectedCategory}`}
              {search && ` para "${search}"`}
            </p>
          </div>
        )}

        {/* Grid de productos */}
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
        />

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center" aria-label="Pagination">
              <button
                onClick={() => handlePageClick(page - 1)}
                disabled={page <= 1}
                className={`${navButton} rounded-l-lg`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>

              {getPageNumbers().map((entry) =>
                typeof entry === 'number' ? (
                  <button
                    key={entry}
                    onClick={() => handlePageClick(entry)}
                    aria-current={entry === page ? 'page' : undefined}
                    className={`px-3 py-2 text-sm font-medium border ${
                      entry === page
                        ? 'text-gold bg-light-gold border-gold'
                        : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {entry}
                  </button>
                ) : (
                  <span
                    key={entry}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300"
                  >
                    …
                  </span>
                )
              )}

              <button
                onClick={() => handlePageClick(page + 1)}
                disabled={page >= totalPages}
                className={`${navButton} rounded-r-lg`}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
