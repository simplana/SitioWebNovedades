import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
  variantId?: string;
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

export type SortOption = 'name' | 'price-low' | 'price-high';

const PLACEHOLDER_IMAGE =
  'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=800';

const STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * Must match normalizeSearch() in supabase/functions/_shared/loyverse.ts --
 * the query is normalised the same way the stored search_text was.
 */
export const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Columns needed to render a product card. Deliberately excludes `raw`, which
 * holds the full Loyverse item (~2KB each) and would multiply the payload of a
 * 50-product page for data no card ever reads.
 */
const LIST_COLUMNS =
  'id, item_name, price, category_name, sku, image_url, description, ' +
  'available_for_sale, track_stock, variant_id, option_value';

/** Maps a `loyverse_products` row onto the shape the UI components expect. */
const rowToProduct = (row: any): LoyverseProduct => {
  // `raw` is only selected on the detail query, so variants may be absent here.
  const variants = row.raw?.variants ?? [];

  return {
    id: row.id,
    name: row.item_name,
    price: Number(row.price) || 0,
    category: row.category_name || 'Sin categoría',
    sku: row.sku ?? undefined,
    image: row.image_url || PLACEHOLDER_IMAGE,
    description: row.description ?? undefined,
    availableForSale: row.available_for_sale ?? true,
    trackStock: row.track_stock ?? false,
    options: row.option_value || undefined,
    variantId: row.variant_id ?? undefined,
    isNew: false,
    isFeatured: false,
    variants: variants.map((variant: any) => ({
      variantId: variant.variant_id,
      sku: variant.sku,
      price: variant.default_price || variant.price || 0,
      cost: variant.cost,
      availableForSale: variant.stores?.[0]?.available_for_sale ?? true,
      options: variant.option1_value || '',
      barcode: variant.barcode,
    })),
  };
};

/** `%` and `_` are ilike wildcards -- a stray `%` would otherwise match everything. */
const escapeLike = (term: string): string => term.replace(/[%_\\]/g, '\\$&');

const SORT_COLUMNS: Record<SortOption, { column: string; ascending: boolean }> = {
  name: { column: 'item_name', ascending: true },
  'price-low': { column: 'price', ascending: true },
  'price-high': { column: 'price', ascending: false },
};

/**
 * Asks the sync function to refresh the catalog when it has gone stale.
 * Fire-and-forget: the function re-checks freshness and holds a lock server
 * side, so simultaneous visitors still produce a single sync.
 */
let refreshPromise: Promise<boolean> | null = null;

const ensureCatalogFresh = (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data } = await supabase
        .from('loyverse_sync_state')
        .select('last_synced_at')
        .eq('id', 1)
        .maybeSingle();

      const lastSynced = data?.last_synced_at ? new Date(data.last_synced_at).getTime() : 0;
      if (Date.now() - lastSynced < STALE_AFTER_MS) return false;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loyverse-sync-products`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return false;
      const result = await response.json();
      return result.synced === true;
    } catch {
      // A failed refresh is not fatal -- the cached catalog still renders.
      return false;
    } finally {
      // Allow another attempt on the next navigation.
      setTimeout(() => {
        refreshPromise = null;
      }, 30_000);
    }
  })();

  return refreshPromise;
};

interface ProductQuery {
  search?: string;
  category?: string;
  sortBy?: SortOption;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated catalog query. Filtering, sorting and paging all run in SQL, so the
 * page count is a real COUNT and search covers every product -- not just the
 * ones already downloaded.
 */
export const useLoyverseProducts = ({
  search = '',
  category = 'Todos',
  sortBy = 'name',
  page = 1,
  pageSize = 50,
}: ProductQuery = {}) => {
  const [products, setProducts] = useState<LoyverseProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const runQuery = useCallback(async () => {
    const { column, ascending } = SORT_COLUMNS[sortBy] ?? SORT_COLUMNS.name;
    const from = (page - 1) * pageSize;

    let query = supabase
      .from('loyverse_products')
      .select(LIST_COLUMNS, { count: 'exact' });

    // Every word must match, so "rosario plata" finds "Rosario de plata".
    for (const term of normalizeSearch(search).split(/\s+/).filter(Boolean)) {
      query = query.ilike('search_text', `%${escapeLike(term)}%`);
    }

    if (category && category !== 'Todos') {
      query = query.eq('category_name', category);
    }

    const { data, error: queryError, count } = await query
      .order(column, { ascending })
      .range(from, from + pageSize - 1);

    if (queryError) throw new Error(queryError.message);

    setProducts((data ?? []).map(rowToProduct));
    setTotal(count ?? 0);
  }, [search, category, sortBy, page, pageSize]);

  // Lets the mount-only sync effect below re-run whatever the *current* query is
  // without itself depending on the filters.
  const runQueryRef = useRef(runQuery);
  useEffect(() => {
    runQueryRef.current = runQuery;
  }, [runQuery]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        await runQuery();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos');
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runQuery]);

  // Refresh in the background if the cache has aged out, then re-run the query.
  // Deliberately mount-only: this must not fire again on every keystroke.
  useEffect(() => {
    let cancelled = false;

    setSyncing(true);
    ensureCatalogFresh()
      .then((didSync) => {
        if (didSync && !cancelled) runQueryRef.current().catch(() => {});
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    products,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    // On a cold cache the table is empty while the first sync runs. Keep showing
    // the skeleton rather than flashing "no hay artículos disponibles".
    loading: loading || (syncing && total === 0),
    error,
  };
};

/** Single product by id -- works for any product, not just a loaded page. */
export const useProductById = (id: string) => {
  const [product, setProduct] = useState<LoyverseProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from('loyverse_products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (queryError) throw new Error(queryError.message);
        if (cancelled) return;

        setProduct(data ? rowToProduct(data) : null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el producto');
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { product, loading, error };
};

/** Category names for the filter dropdown, across the whole catalog. */
export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>(['Todos']);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Reads the loyverse_categories view: SELECT DISTINCT server side, so it
      // can't be truncated by PostgREST's row cap the way the raw table would.
      const { data } = await supabase.from('loyverse_categories').select('category_name');

      if (cancelled || !data) return;

      const unique = data.map((row: any) => row.category_name).filter(Boolean);
      setCategories(['Todos', ...unique]);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
};

/** Related products from the same category, excluding the current one. */
export const useRelatedProducts = (category?: string, excludeId?: string, limit = 3) => {
  const [products, setProducts] = useState<LoyverseProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!category || category === 'Sin categoría') {
        setProducts([]);
        return;
      }

      let query = supabase
        .from('loyverse_products')
        .select(LIST_COLUMNS)
        .eq('category_name', category)
        .limit(limit);

      if (excludeId) query = query.neq('id', excludeId);

      const { data } = await query;
      if (!cancelled) setProducts((data ?? []).map(rowToProduct));
    })();

    return () => {
      cancelled = true;
    };
  }, [category, excludeId, limit]);

  return products;
};

/** Highest-priced products, used for the home page showcase. */
export const useFeaturedProducts = (limit = 6) => {
  const [products, setProducts] = useState<LoyverseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from('loyverse_products')
          .select(LIST_COLUMNS)
          .order('price', { ascending: false })
          .limit(limit);

        if (queryError) throw new Error(queryError.message);
        if (cancelled) return;

        setProducts((data ?? []).map(rowToProduct));
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    ensureCatalogFresh();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { products, loading, error };
};

/**
 * Live stock from Loyverse, bypassing the cache. `available_for_sale` on a
 * cached row is a setting, not a quantity, so this is the only trustworthy
 * source before taking someone's money.
 */
export const checkLiveStock = async (
  variantIds: string[]
): Promise<Record<string, number> | null> => {
  const ids = variantIds.filter(Boolean);
  if (ids.length === 0) return {};

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loyverse-check-stock`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variant_ids: ids }),
      }
    );

    if (!response.ok) return null;
    const result = await response.json();
    return result.stock ?? null;
  } catch {
    // null means "unknown" -- callers fall back to the cached flag.
    return null;
  }
};
