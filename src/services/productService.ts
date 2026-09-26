import handleAPI from "@/apis/handleApi";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { appInfo } from "@/constants/appInfos";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discount?: number;
  images: string[];
  categoryId: string;
  supplierId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubProduct {
  id: string;
  productId: string;
  size: string;
  color: string;
  price: number;
  discount?: number;
  qty: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  categoryId?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

const supplierCache = new Map<string, Promise<SupplierModel>>();

export const productService = {
  getAllProducts: async (filter?: ProductFilter): Promise<Product[]> => {
    const res = await handleAPI("/products", filter);
    return res.data || [];
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await handleAPI(`/products/${id}`);
    return res.data;
  },

  getProductDetail: async (slug: string, id: string): Promise<ProductModel> => {
    const decodedSlug = decodeURIComponent(slug);
    const url = `/public/products/${decodedSlug}/${id}`;

    try {
      const res = await handleAPI(url);
      return res.data;
    } catch (error) {
      console.error("API Error in getProductDetail:", error);
      throw error;
    }
  },

  getSubProductsByProductId: async (
    productId: string
  ): Promise<SubProductModel[]> => {
    const res = await handleAPI(
      `/subProducts/get-all-sub-product/${productId}`
    );
    return res.data || [];
  },

  getProductsByCategory: async (categoryId: string): Promise<ProductModel[]> => {
    try {
      const res = await handleAPI(`/public/products/category/${categoryId}`);
      return res.data || [];
    } catch (error) {
      console.log("Failed to fetch products by category:", error);
      return [];
    }
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const res = await handleAPI(`/products/search?q=${query}`);
    return res.data || [];
  },

  getSupplier: async (supplierId: string): Promise<SupplierModel> => {
    if (!supplierId) return null as any;
    if (supplierCache.has(supplierId)) {
      return supplierCache.get(supplierId)!;
    }
    const promise = handleAPI(`/suppliers/${supplierId}`)
      .then((res) => res.data)
      .catch((err) => {
        supplierCache.delete(supplierId);
        throw err;
      });
    supplierCache.set(supplierId, promise);
    return promise;
  },

  getReviews: async (subProductIds: string[]): Promise<any[]> => {
    if (subProductIds.length === 0) return [];

    const res = await handleAPI(
      `/reviewProducts/subProducts?subProductIds=${subProductIds.join(",")}`,
      undefined,
      "get"
    );
    return res.data || [];
  },

  getFilterValues: async (): Promise<any> => {
    const res = await handleAPI("/subProducts/get-filter-values");
    return res.data;
  },

  getCategories: async (): Promise<any[]> => {
    const res = await handleAPI("/public/categories/all");
    return res.data || [];
  },

  getRelatedProducts: async (
    productId: string,
    limit: number = 4
  ): Promise<ProductModel[]> => {
    try {
      const res = await handleAPI(
        `/public/products/related/${productId}?limit=${limit}`
      );
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.slice(0, Math.min(limit, 4));
      }
    } catch (error) {
      console.log("Failed to fetch related products from API:", error);
    }
    return [];
  },
};
