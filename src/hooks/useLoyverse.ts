import { useState, useEffect } from 'react';
import { getAccessToken, hasValidTokens } from '../lib/loyverse/auth';
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
      console.log('🚀 Fetching products from Loyverse API...');
      
      // Verificar si tenemos tokens válidos
      if (!hasValidTokens()) {
        console.log('✅ Using demo products (OAuth requires HTTPS)');
        const demoProducts = getDemoProducts();
        setProducts(demoProducts);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        });
        setError(null);
        return;
      }
      
      // Obtener token de acceso (se refresca automáticamente si es necesario)
      const accessToken = await getAccessToken();
      console.log('🔑 Using OAuth2 access token');

      let url = buildApiUrl('items') + '?limit=50';
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      console.log('📡 Making request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        if (response.status === 401) {
          console.warn('⚠️ Unauthorized - token may be invalid');
          // Limpiar tokens inválidos y usar productos de demo
          const { clearStoredTokens } = await import('../lib/loyverse/auth');
          clearStoredTokens();
        }
        
        console.log('✅ Using demo products (fallback mode)');
        const demoProducts = getDemoProducts();
        setProducts(demoProducts);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        });
        setError(null);
        return;
      }

      const data = await response.json();
      console.log('📦 Data received from Loyverse API:');
      console.log('📦 Data type:', typeof data);
      console.log('📦 Is array?:', Array.isArray(data));
      console.log('📦 Data keys:', Object.keys(data));

      // Intentar diferentes estructuras de respuesta de Loyverse
      let items: any[] = [];
      
      if (Array.isArray(data)) {
        console.log('✅ Data es un array directo');
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        console.log('✅ Data tiene propiedad items');
        items = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        console.log('✅ Data tiene propiedad data');
        items = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        console.log('✅ Data tiene propiedad results');
        items = data.results;
      } else {
        console.log('❌ Unrecognized data structure');
        console.log('📦 Available properties:', Object.keys(data));
        
        // Use demo products if we can't parse the response
        const demoProducts = getDemoProducts();
        setProducts(demoProducts);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        });
        setError('Unrecognized Loyverse data structure. Showing demo products.');
        return;
      }

      console.log('📦 Items found:', items.length);
      if (items.length > 0) {
        console.log('📦 First item:', items[0]);
      }

      const loyverseProducts: LoyverseProduct[] = items.map((item: any, index: number) => {
        console.log(`📦 Processing item ${index + 1}:`, {
          id: item.id,
          item_name: item.item_name,
          name: item.name,
          variants: item.variants?.length || 0,
          category: item.category
        });
        
        // Obtener el primer variant para precio y disponibilidad
        const firstVariant = item.variants?.[0];
        console.log(`📦 First variant of item ${index + 1}:`, firstVariant);
        
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

      console.log('✅ Products processed:', loyverseProducts.length);
      if (loyverseProducts.length > 0) {
        console.log('📋 First few products:', loyverseProducts.slice(0, 2));
      }

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
      console.error('❌ Error connecting to Loyverse:', err);
      
      // If connection fails, use demo products (this is expected in WebContainer)
      console.log('✅ Using demo products (WebContainer environment)');
      const demoProducts = getDemoProducts();
      setProducts(demoProducts);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });
      setError(null); // Don't show error, just use demo products
    } finally {
      setLoading(false);
    }
  };

  // Productos de demostración para cuando falla Loyverse
  const getDemoProducts = (): LoyverseProduct[] => {
    return [
      {
        id: 'demo-1',
        name: 'Imagen del Sagrado Corazón de Jesús',
        price: 25.00,
        category: 'Imágenes Religiosas',
        sku: 'IMG-SCJ-001',
        image: 'https://images.pexels.com/photos/8989574/pexels-photo-8989574.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: 'Hermosa imagen del Sagrado Corazón de Jesús, perfecta para la decoración de tu hogar cristiano.',
        availableForSale: true,
        trackStock: false,
        isNew: true,
        isFeatured: true,
        variants: []
      },
      {
        id: 'demo-2',
        name: 'Rosario de Cristal Azul',
        price: 18.50,
        category: 'Rosarios',
        sku: 'ROS-CRI-002',
        image: 'https://images.pexels.com/photos/6546283/pexels-photo-6546283.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: 'Rosario de cristal azul con crucifijo plateado, ideal para la oración diaria.',
        availableForSale: true,
        trackStock: false,
        isNew: false,
        isFeatured: true,
        variants: []
      },
      {
        id: 'demo-3',
        name: 'Crucifijo de Madera Tallada',
        price: 35.00,
        category: 'Crucifijos',
        sku: 'CRU-MAD-003',
        image: 'https://images.pexels.com/photos/6985003/pexels-photo-6985003.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: 'Crucifijo artesanal de madera tallada a mano, una obra de arte religiosa.',
        availableForSale: true,
        trackStock: false,
        isNew: false,
        isFeatured: true,
        variants: []
      },
      {
        id: 'demo-4',
        name: 'Vela Votiva Virgen María',
        price: 8.00,
        category: 'Velas',
        sku: 'VEL-VM-004',
        image: 'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: 'Vela votiva con imagen de la Virgen María, perfecta para momentos de oración.',
        availableForSale: true,
        trackStock: false,
        isNew: true,
        isFeatured: false,
        variants: []
      },
      {
        id: 'demo-5',
        name: 'Libro de Oraciones Diarias',
        price: 12.00,
        category: 'Libros',
        sku: 'LIB-ORD-005',
        image: 'https://images.pexels.com/photos/8989587/pexels-photo-8989587.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: 'Libro con oraciones para cada día del año, guía espiritual completa.',
        availableForSale: true,
        trackStock: false,
        isNew: false,
        isFeatured: false,
        variants: []
      },
      {
        id: 'demo-6',
        name: 'Medalla Milagrosa de Plata',
        price: 22.00,
        category: 'Medallas',
        sku: 'MED-MIL-006',
        image: 'https://images.pexels.com/photos/7045933/pexels-photo-7045933.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: 'Medalla Milagrosa de plata con cadena, bendecida y consagrada.',
        availableForSale: true,
        trackStock: false,
        isNew: true,
        isFeatured: true,
        variants: []
      }
    ];
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
    
    // Como Loyverse no tiene campo "isFeatured", usamos productos con precio más alto
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
    needsAuth: !hasValidTokens()
  };
};