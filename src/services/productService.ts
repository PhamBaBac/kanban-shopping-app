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

export const productService = {
  // Lấy tất cả sản phẩm
  getAllProducts: async (filter?: ProductFilter): Promise<Product[]> => {
    const res = await handleAPI("/products", filter);
    return res.data || [];
  },

  // Lấy sản phẩm theo ID
  getProductById: async (id: string): Promise<Product> => {
    const res = await handleAPI(`/products/${id}`);
    return res.data;
  },

  // Lấy chi tiết sản phẩm theo slug và id
  getProductDetail: async (slug: string, id: string): Promise<ProductModel> => {
    const decodedSlug = decodeURIComponent(slug);
    const url = `/public/products/${decodedSlug}/${id}`;
    console.log("Calling API:", url);

    try {
      const res = await handleAPI(url);
      console.log("API Response:", res);
      return res.data;
    } catch (error) {
      console.error("API Error in getProductDetail:", error);
      throw error;
    }
  },

  // Lấy sub products theo product ID
  getSubProductsByProductId: async (
    productId: string
  ): Promise<SubProductModel[]> => {
    const res = await handleAPI(
      `/subProducts/get-all-sub-product/${productId}`
    );
    return res.data || [];
  },

  // Lấy sản phẩm theo category
  getProductsByCategory: async (categoryId: string): Promise<Product[]> => {
    const res = await handleAPI(`/products/category/${categoryId}`);
    return res.data || [];
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (query: string): Promise<Product[]> => {
    const res = await handleAPI(`/products/search?q=${query}`);
    return res.data || [];
  },

  // Lấy thông tin supplier
  getSupplier: async (supplierId: string): Promise<SupplierModel> => {
    const res = await handleAPI(`/suppliers/${supplierId}`);
    return res.data;
  },

  // Lấy tất cả reviews cho sub products
  getReviews: async (subProductIds: string[]): Promise<any[]> => {
    if (subProductIds.length === 0) return [];

    const res = await handleAPI(
      `/reviewProducts/subProducts?subProductIds=${subProductIds.join(",")}`,
      undefined,
      "get"
    );
    return res.data || [];
  },

  // Lấy filter values
  getFilterValues: async (): Promise<any> => {
    const res = await handleAPI("/subProducts/get-filter-values");
    return res.data;
  },

  // Lấy categories
  getCategories: async (): Promise<any[]> => {
    const res = await handleAPI("/public/categories/all");
    return res.data || [];
  },
};
