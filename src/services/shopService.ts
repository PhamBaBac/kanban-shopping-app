import handleAPI from "@/apis/handleApi";
import { ProductModel } from "@/models/Products";
import { CategoyModel } from "@/models/Products";

export interface FilterValues {
  colors: string[];
  sizes: string[];
  prices: number[];
}

export interface ShopFilters {
  catIds?: string[];
  colors?: string[];
  sizes?: string[];
  price?: [number, number];
  search?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export const shopService = {
  getProductsByFilter: async (
    filters: ShopFilters
  ): Promise<{
    data: ProductModel[];
    totalElements: number;
  }> => {
    const params = new URLSearchParams();

    if (filters.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    if (filters.catIds && filters.catIds.length > 0) {
      filters.catIds.forEach((id) => params.append("catIds", id));
    }

    if (filters.sizes && filters.sizes.length > 0) {
      filters.sizes.forEach((size) => params.append("sizes", size));
    }

    if (filters.colors && filters.colors.length > 0) {
      filters.colors.forEach((color) => params.append("colors", color));
    }

    if (filters.price && filters.price.length === 2) {
      params.append("price", filters.price[0].toString());
      params.append("price", filters.price[1].toString());
    }

    if (filters.sortBy && filters.sortBy.trim()) {
      params.append("sortBy", filters.sortBy.trim());
    }

    if (filters.page) {
      params.append("page", filters.page.toString());
    }

    if (filters.pageSize) {
      params.append("pageSize", filters.pageSize.toString());
    }

    const queryString = params.toString();
    const url = `/public/products/filter${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("API URL:", url);

    const res = await handleAPI(url, undefined, "post");
    console.log("API Response:", res);
    return {
      data: res.data?.data || [],
      totalElements: res.data?.totalElements || 0,
    };
  },

  getCategoriesForFilter: async (): Promise<CategoyModel[]> => {
    const res = await handleAPI("/public/categories/all");
    return res.data || [];
  },

  getCategoryBranch: async (catId: string): Promise<CategoyModel[]> => {
    const res = await handleAPI(
      `/public/categories/branch?catId=${encodeURIComponent(catId)}`
    );
    return res.data || [];
  },

  getFilterValues: async (
    catIds?: string[],
    search?: string
  ): Promise<FilterValues> => {
    const params = new URLSearchParams();
    if (catIds && catIds.length > 0) {
      catIds.forEach((id) => params.append("catIds", id));
    }
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    const queryString = params.toString();
    const res = await handleAPI(
      `/subProducts/get-filter-values${queryString ? `?${queryString}` : ""}`
    );
    return res.data || { colors: [], sizes: [], prices: [] };
  },

  searchProducts: async (query: string): Promise<ProductModel[]> => {
    const res = await handleAPI(
      `/public/products/search?q=${encodeURIComponent(query)}`
    );
    return res.data || [];
  },
};
