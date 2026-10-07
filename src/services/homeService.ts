import handleAPI from "@/apis/handleApi";
import { PromotionModel } from "@/models/PromotionModel";
import { CategoyModel, ProductModel } from "@/models/Products";
import { ReviewModel } from "@/models/ReviewModel";

export const homeService = {
  getPromotions: async (): Promise<PromotionModel[]> => {
    try {
      const res = await handleAPI("/promotions");
      return res.data || [];
    } catch {
      return [];
    }
  },

  getCategories: async (): Promise<CategoyModel[]> => {
    try {
      const res = await handleAPI("/public/categories/all");
      return res.data || [];
    } catch {
      return [];
    }
  },

  getBestSellers: async (): Promise<ProductModel[]> => {
    try {
      const res = await handleAPI("/public/products/bestSellers");
      return res.data || [];
    } catch {
      return [];
    }
  },

  getNewArrivals: async (limit = 8): Promise<ProductModel[]> => {
    try {
      const res = await handleAPI(`/public/products/newArrivals?limit=${limit}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  getFlashSale: async (limit = 8): Promise<ProductModel[]> => {
    try {
      const res = await handleAPI(`/public/products/flashSale?limit=${limit}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  getFeaturedReviews: async (limit = 6): Promise<ReviewModel[]> => {
    try {
      const res = await handleAPI(`/reviewProducts/featured?limit=${limit}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  subscribeNewsletter: async (email: string): Promise<any> => {
    const res = await handleAPI("/public/newsletter/subscribe", { email }, "post");
    return res;
  },
};

