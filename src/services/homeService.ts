import handleAPI from "@/apis/handleApi";
import { PromotionModel } from "@/models/PromotionModel";
import { CategoyModel, ProductModel } from "@/models/Products";

export const homeService = {
  // Lấy promotions
  getPromotions: async (): Promise<PromotionModel[]> => {
    const res = await handleAPI("/promotions");
    return res.data || [];
  },

  // Lấy categories cho home
  getCategories: async (): Promise<CategoyModel[]> => {
    const res = await handleAPI("/public/categories/all");
    return res.data || [];
  },

  // Lấy best sellers
  getBestSellers: async (): Promise<ProductModel[]> => {
    const res = await handleAPI("/public/products/bestSellers");
    console.log("Beseller:", res)
    return res.data || [];
  },

  // Lấy AI recommendations (commented out)
  // getAIRecommendations: async (): Promise<ProductModel[]> => {
  //   const res = await handleAPI("/ai/recommendations");
  //   return res.data || [];
  // },

  // Lấy AI recommendations cho user (commented out)
  // getUserAIRecommendations: async (): Promise<ProductModel[]> => {
  //   const res = await handleAPI(
  //     "/ai/recommendations/user"
  //   );
  //   return res.data || [];
  // },
};
