import { useState, useEffect } from 'react';

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
  const [cursors, setCursors] = useState<string[]>(['']);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchProducts = async (cursor?: string, page: number = 1) => {
    try {
      console.log('📦 Fetching products from Edge Function...');
      setLoading(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let url = `${supabaseUrl}/functions/v1/loyverse-get-items?limit=50`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      console.log('Making request to Edge Function:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);

        if (response.status === 401) {
          setNeedsAuth(true);
          throw new Error('No Loyverse connection found. Please connect in Admin panel.');
        }

        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Data received from Edge Function, items found:', data.items?.length || 0);

      const items = data.items || [];

      const loyverseProducts: LoyverseProduct[] = items.map((item: any) => {
        const firstVariant = item.variants?.[0];

        return {
          id: item.id,
          name: item.item_name || item.name || 'Producto sin nombre',
          price: firstVariant?.default_price || firstVariant?.price || item.price || 0,
          category: item.category?.name || 'Sin categoría',
          sku: firstVariant?.sku || item.id,
          image: item.image_url || 'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=800',
          description: item.description || undefined,
          availableForSale: firstVariant?.stores?.[0]?.available_for_sale ?? true,
          trackStock: item.track_stock ?? false,
          options: firstVariant?.option1_value || undefined,
          isNew: false,
          isFeatured: false,
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

      const nextCursor = data.cursor || data.next_cursor || data.pagination?.next_cursor;
      const hasNextPage = !!nextCursor && items.length === 50;
      const newPagination: PaginationInfo = {
        currentPage: page,
        totalPages: hasNextPage ? page + 1 : page,
        hasNextPage,
        hasPreviousPage: page > 1,
        cursor: nextCursor
      };

      setPagination(newPagination);

      if (nextCursor && !cursors.includes(nextCursor)) {
        setCursors(prev => {
          const newCursors = [...prev];
          newCursors[page] = nextCursor;
          return newCursors;
        });
      }

      setError(null);
      setNeedsAuth(false);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
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
    console.log('🔄 useLoyverse: Initializing product fetch...');
    fetchProducts();
  }, []);

  const goToPage = async (page: number) => {
    if (page < 1) return;

    setLoading(true);

    if (page === 1) {
      await fetchProducts(undefined, 1);
    } else {
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
    const newProducts = products.slice(0, limit || products.length);
    return limit ? newProducts.slice(0, limit) : newProducts;
  };

  const getFeaturedProducts = (limit?: number) => {
    if (products.length === 0) return [];

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
    needsAuth
  };
};
