import { useState, useEffect } from "react";
import { homeService } from "@/services";
import { PromotionModel } from "@/models/PromotionModel";
import { CategoyModel, ProductModel } from "@/models/Products";

interface UseHomeReturn {
  promotions: PromotionModel[];
  categories: CategoyModel[];
  bestSellers: ProductModel[];
  recommendations: ProductModel[];
  isLoading: boolean;
  error: string | null;
}

export const useHome = (): UseHomeReturn => {
  const [promotions, setPromotions] = useState<PromotionModel[]>([]);
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductModel[]>([]);
  const [recommendations, setRecommendations] = useState<ProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [promRes, catRes, bestSellerRes] = await Promise.all([
        homeService.getPromotions(),
        homeService.getCategories(),
        homeService.getBestSellers(),
        // homeService.getRecommendations(),
      ]);

      setPromotions(promRes);
      setCategories(catRes);
      setBestSellers(bestSellerRes);

    //   // Fetch recommended products if we have IDs
    //   if (idRes && idRes.length > 0) {
    //     const recRes = await homeService.getRecommendedProducts(idRes);
    //     setRecommendations(recRes);
    //   }
    } catch (error: any) {
      setError(error.message || "Lỗi khi lấy dữ liệu trang chủ");
      console.error("Lỗi khi lấy dữ liệu trang chủ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    promotions,
    categories,
    bestSellers,
    recommendations,
    isLoading,
    error,
  };
}; 