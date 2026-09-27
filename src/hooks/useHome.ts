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

export interface HomeInitialData {
  promotions?: PromotionModel[];
  categories?: CategoyModel[];
  bestSellers?: ProductModel[];
  recommendations?: ProductModel[];
  pageProps?: any;
}

export const useHome = (initialData?: HomeInitialData | any): UseHomeReturn => {
  const data = initialData?.promotions ? initialData : (initialData?.pageProps || initialData);
  const hasInitialData = Boolean(
    (data?.promotions && data.promotions.length > 0) ||
    (data?.categories && data.categories.length > 0) ||
    (data?.bestSellers && data.bestSellers.length > 0)
  );

  const [promotions, setPromotions] = useState<PromotionModel[]>(data?.promotions || []);
  const [categories, setCategories] = useState<CategoyModel[]>(data?.categories || []);
  const [bestSellers, setBestSellers] = useState<ProductModel[]>(data?.bestSellers || []);
  const [recommendations, setRecommendations] = useState<ProductModel[]>(data?.recommendations || []);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasInitialData) {
      fetchData();
    }
  }, [hasInitialData]);

  useEffect(() => {
    if (data?.promotions?.length) setPromotions(data.promotions);
    if (data?.categories?.length) setCategories(data.categories);
    if (data?.bestSellers?.length) setBestSellers(data.bestSellers);
    if (data?.recommendations?.length) setRecommendations(data.recommendations);
    if (hasInitialData) setIsLoading(false);
  }, [data, hasInitialData]);

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