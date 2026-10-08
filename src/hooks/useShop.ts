import { useState, useEffect, useCallback, useRef } from "react";
import { shopService, ShopFilters, FilterValues } from "@/services";
import { ProductModel } from "@/models/Products";
import { CategoyModel } from "@/models/Products";
import { shopFilterCache, buildFilterCacheKey } from "@/utils/clientCache";

interface UseShopProps {
  initialFilters?: ShopFilters;
}

interface UseShopReturn {
  products: ProductModel[];
  categories: CategoyModel[];
  filterValues: FilterValues;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  fetchProducts: (filters: ShopFilters) => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
}

export const useShop = ({
  initialFilters,
}: UseShopProps = {}): UseShopReturn => {
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    colors: [],
    sizes: [],
    prices: [],
  });
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(0);

  const fetchProducts = useCallback(async (filters: ShopFilters) => {
    const cacheKey = buildFilterCacheKey(filters as Record<string, any>);
    const cached = shopFilterCache.get(cacheKey);
    if (cached) {
      setProducts(cached.data);
      setTotalItems(cached.totalElements);
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentReq = ++requestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await shopService.getProductsByFilter(filters);
      if (currentReq === requestRef.current) {
        setProducts(result.data);
        setTotalItems(result.totalElements);
        shopFilterCache.set(cacheKey, {
          data: result.data,
          totalElements: result.totalElements,
        });
      }
    } catch (error: any) {
      if (currentReq === requestRef.current) {
        setError(error.message || "Lỗi khi lấy danh sách sản phẩm");
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        setProducts([]);
        setTotalItems(0);
      }
    } finally {
      if (currentReq === requestRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await shopService.searchProducts(query);
      setProducts(result);
      setTotalItems(result.length);
    } catch (error: any) {
      setError(error.message || "Lỗi khi tìm kiếm sản phẩm");
      console.error("Lỗi khi tìm kiếm sản phẩm:", error);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filterValuesRes = await shopService.getFilterValues();
        setFilterValues(filterValuesRes);

        if (initialFilters) {
          await fetchProducts(initialFilters);
        }
      } catch (error: any) {
        setError(error.message || "Lỗi khi lấy dữ liệu shop");
        console.error("Lỗi khi lấy dữ liệu shop:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [initialFilters, fetchProducts]);

  return {
    products,
    categories,
    filterValues,
    totalItems,
    isLoading,
    error,
    fetchProducts,
    searchProducts,
  };
};
