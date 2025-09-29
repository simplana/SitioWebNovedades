import { useState, useEffect } from 'react';
import { getAccessToken, hasValidTokens, clearStoredTokens } from '../lib/loyverse/auth';
import { buildApiUrl } from '../lib/loyverse/url';

export interface LoyverseProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  sku?: string;
  image?: string;
  description?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  variants?: LoyverseVariant[];
  availableForSale?: boolean;
  trackStock?: boolean;
  options?: string;
}

export interface LoyverseVariant {
  variantId: string;
  sku: string;
  price: number;
  cost: number;
  availableForSale: boolean;
  options: string;
  barcode?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  cursor?: string;
}

export const useLoyverseProducts = () => {
  const [products, setProducts] = useState<LoyverseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [cursors, setCursors] = useState<string[]>(['']); // Array to store cursors for each page

  const fetchProducts = async (cursor?: string, page: number = 1) => {
    try {
      console.log('Fetching products from Loyverse API...');
      
      // Intentar obtener token de acceso
      let accessToken;
      try {
        if (hasValidTokens()) {
          accessToken = await getAccessToken();
          console.log('Using OAuth2 access token:', accessToken.substring(0, 20) + '...');
        } else {
          console.log('No valid tokens found, attempting direct API call...');
          // Intentar usar token directo si está disponible
          const directToken = import.meta.env.VITE_LOYVERSE_ACCESS_TOKEN;
          if (directToken && directToken !== 'your-loyverse-token-here') {
            accessToken = directToken;
            console.log('Using direct access token from env');
          } else {
            throw new Error('No access token available');
          }
        }
      } catch (tokenError) {
        console.warn('Token error:', tokenError);
        throw new Error('Authentication failed: No valid access token');
      }
      
      let url = buildApiUrl('items') + '?limit=50';
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      console.log('Making request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        if (response.status === 401) {
          console.warn('Unauthorized - clearing invalid tokens');
          clearStoredTokens();
          throw new Error('Authentication failed: Invalid or expired token');
        } else if (response.status === 403) {
          throw new Error('Access forbidden: Check your API permissions');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests');
        } else {
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Data received from Loyverse API, items found:', Array.isArray(data) ? data.length : (data.items?.length || 0));

      // Intentar diferentes estructuras de respuesta de Loyverse
      let items: any[] = [];
      
      if (Array.isArray(data)) {
        console.log('Data is direct array');
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        console.log('Data has items property');
        items = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        console.log('Data has data property');
        items = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        console.log('Data has results property');
        items = data.results;
      } else {
        console.log('Unrecognized data structure, available properties:', Object.keys(data));
        throw new Error('Unrecognized data structure from Loyverse API');
      }

      console.log('Items found:', items.length);

      const loyverseProducts: LoyverseProduct[] = items.map((item: any, index: number) => {
        // Obtener el primer variant para precio y disponibilidad
        const firstVariant = item.variants?.[0];
        
        return {
          id: item.id,
          name: item.item_name || item.name || 'Producto sin nombre',
          price: firstVariant?.default_price || firstVariant?.price || item.price || 0,
          category: item.category?.name || 'Sin categoría',
          sku: firstVariant?.sku || item.id,
          image: item.image_url || 'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=800',
          description: item.description || 'Artículo religioso de alta calidad.',
          availableForSale: firstVariant?.stores?.[0]?.available_for_sale ?? true,
          trackStock: item.track_stock ?? false,
          options: firstVariant?.option1_value || undefined,
          isNew: false, // Loyverse no tiene este campo, podríamos usar created_at
          isFeatured: false, // Loyverse no tiene este campo
          variants: item.variants?.map((variant: any) => ({
            variantId: variant.variant_id,
            sku: variant.sku,
            price: variant.default_price || variant.price || 0,
            cost: variant.cost,
            availableForSale: variant.stores?.[0]?.available_for_sale ?? true,
            options: variant.option1_value || '',
            barcode: variant.barcode
          })) || []
        };
      });

      console.log('Products processed successfully:', loyverseProducts.length);

      setProducts(loyverseProducts);
      
      // Update pagination info
      const nextCursor = data.cursor || data.next_cursor || data.pagination?.next_cursor;
      const hasNextPage = !!nextCursor && items.length === 50; // Solo hay siguiente página si obtuvimos 50 items completos
      const newPagination: PaginationInfo = {
        currentPage: page,
        totalPages: hasNextPage ? page + 1 : page,
        hasNextPage,
        hasPreviousPage: page > 1,
        cursor: nextCursor
      };
      
      setPagination(newPagination);
      
      // Store cursor for next page if it exists
      if (nextCursor && !cursors.includes(nextCursor)) {
        setCursors(prev => {
          const newCursors = [...prev];
          newCursors[page] = nextCursor;
          return newCursors;
        });
      }
      
      setError(null);

    } catch (err) {
      console.error('Error connecting to Loyverse:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Loyverse API');
      setProducts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProducts();
  }, []);

  const goToPage = async (page: number) => {
    if (page < 1) return;
    
    setLoading(true);
    
    if (page === 1) {
      // First page, no cursor needed
      await fetchProducts(undefined, 1);
    } else {
      // Use stored cursor for the previous page
      const cursor = cursors[page - 1];
      await fetchProducts(cursor, page);
    }
  };

  const nextPage = () => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  };

  const previousPage = () => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.currentPage - 1);
    }
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const getProductsByCategory = (category: string) => {
    if (category === 'Todos') return products;
    return products.filter(product => product.category === category);
  };

  const getNewProducts = (limit?: number) => {
    // Como Loyverse no tiene campo "isNew", usamos los productos más recientes
    const newProducts = products.slice(0, limit || products.length);
    return limit ? newProducts.slice(0, limit) : newProducts;
  };

  const getFeaturedProducts = (limit?: number) => {
    if (products.length === 0) return [];
    
    // Usar productos con precio más alto como destacados
    const featuredProducts = [...products]
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, limit || products.length);
    return featuredProducts;
  };
  
  const getCategories = () => {
    if (products.length === 0) return ['Todos'];
    
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return ['Todos', ...categories];
  };

  return {
    products,
    loading,
    error,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    getProductById,
    getProductsByCategory,
    getFeaturedProducts,
    getCategories,
    needsAuth: !hasValidTokens() && !import.meta.env.VITE_LOYVERSE_ACCESS_TOKEN
  };
};