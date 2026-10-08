/**
 * Client-side in-memory cache (session lifetime).
 *
 * Phase 3 – Frontend Experience Caching:
 *  1. `productDetailCache`  – prefetch product detail on hover, read on navigation
 *  2. `shopFilterCache`     – remember shop filter pages (Stale-While-Revalidate)
 */

// ---------------------------------------------------------------------------
// Generic entry type
// ---------------------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  /** Unix timestamp (ms) when this entry expires */
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Generic TTL Map
// ---------------------------------------------------------------------------
class TtlMap<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Number of live (non-expired) entries */
  get size(): number {
    const now = Date.now();
    let count = 0;
    this.store.forEach((v) => {
      if (v.expiresAt > now) count++;
    });
    return count;
  }
}

// ---------------------------------------------------------------------------
// 1. Product Detail Prefetch Cache  (TTL: 5 minutes)
// ---------------------------------------------------------------------------
// Key format: `{id}`
// Value: raw ProductModel JSON from API
export const productDetailPrefetchCache = new TtlMap<any>(5 * 60 * 1000);

/**
 * Fire-and-forget prefetch for a product detail page.
 * Called onMouseEnter from ProductItem. Silently skips if already cached.
 */
export function prefetchProductDetail(
  slug: string,
  id: string,
  fetcher: (slug: string, id: string) => Promise<any>
): void {
  if (!id || productDetailPrefetchCache.has(id)) return;

  // Mark as "in-flight" with a placeholder to prevent duplicate requests
  productDetailPrefetchCache.set(id, null);

  fetcher(slug, id)
    .then((data) => {
      if (data) {
        productDetailPrefetchCache.set(id, data);
      }
    })
    .catch(() => {
      // Remove placeholder on error so next hover can retry
      productDetailPrefetchCache.delete(id);
    });
}

// ---------------------------------------------------------------------------
// 2. Shop Filter Response Cache  (TTL: 3 minutes)
// ---------------------------------------------------------------------------
// Key: stable JSON of the ShopFilters object (sorted keys)
// Value: { data: ProductModel[]; totalElements: number }
export const shopFilterCache = new TtlMap<{
  data: any[];
  totalElements: number;
}>(3 * 60 * 1000);

/**
 * Build a deterministic string key from a filter object.
 * Arrays are sorted to ensure `[A, B]` ≡ `[B, A]`.
 */
export function buildFilterCacheKey(filters: Record<string, any>): string {
  const normalized: Record<string, any> = {};
  Object.keys(filters)
    .sort()
    .forEach((k) => {
      const v = filters[k];
      normalized[k] = Array.isArray(v) ? [...v].sort() : v;
    });
  return JSON.stringify(normalized);
}
