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
  page?: number;
  pageSize?: number;
}

export const shopService = {
  // Lấy sản phẩm theo filter
  getProductsByFilter: async (
    filters: ShopFilters
  ): Promise<{
    data: ProductModel[];
    totalElements: number;
  }> => {
    // Build query parameters
    const params = new URLSearchParams();

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

    console.log("API URL:", url); // Debug: check URL

    const res = await handleAPI(url, undefined, "post");
    console.log("API Response:", res); // Debug: check API response
    return {
      data: res.data?.data || [],
      totalElements: res.data?.totalElements || 0,
    };
  },

  // Lấy tất cả categories cho filter
  getCategoriesForFilter: async (): Promise<CategoyModel[]> => {
    const res = await handleAPI("/public/categories/all");
    return res.data || [];
  },

  // Lấy filter values (colors, sizes, prices)
  getFilterValues: async (): Promise<FilterValues> => {
    const res = await handleAPI("/subProducts/get-filter-values");
    return res.data || { colors: [], sizes: [], prices: [] };
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (query: string): Promise<ProductModel[]> => {
    const res = await handleAPI(
      `/public/products/search?q=${encodeURIComponent(query)}`
    );
    return res.data || [];
  },
};
