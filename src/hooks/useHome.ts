import { useState, useEffect } from "react";
import { homeService } from "@/services";
import { PromotionModel } from "@/models/PromotionModel";
import { CategoyModel, ProductModel } from "@/models/Products";
import { ReviewModel } from "@/models/ReviewModel";

interface UseHomeReturn {
  promotions: PromotionModel[];
  categories: CategoyModel[];
  bestSellers: ProductModel[];
  newArrivals: ProductModel[];
  flashSale: ProductModel[];
  featuredReviews: ReviewModel[];
  recommendations: ProductModel[];
  isLoading: boolean;
  error: string | null;
}

export interface HomeInitialData {
  promotions?: PromotionModel[];
  categories?: CategoyModel[];
  bestSellers?: ProductModel[];
  newArrivals?: ProductModel[];
  flashSale?: ProductModel[];
  featuredReviews?: ReviewModel[];
  recommendations?: ProductModel[];
  pageProps?: any;
}

export const useHome = (initialData?: HomeInitialData | any): UseHomeReturn => {
  const data = initialData?.promotions ? initialData : (initialData?.pageProps || initialData);
  const hasInitialData = Boolean(
    (data?.promotions && data.promotions.length > 0) ||
    (data?.categories && data.categories.length > 0) ||
    (data?.bestSellers && data.bestSellers.length > 0) ||
    (data?.newArrivals && data.newArrivals.length > 0) ||
    (data?.flashSale && data.flashSale.length > 0)
  );

  const [promotions, setPromotions] = useState<PromotionModel[]>(data?.promotions || []);
  const [categories, setCategories] = useState<CategoyModel[]>(data?.categories || []);
  const [bestSellers, setBestSellers] = useState<ProductModel[]>(data?.bestSellers || []);
  const [newArrivals, setNewArrivals] = useState<ProductModel[]>(data?.newArrivals || []);
  const [flashSale, setFlashSale] = useState<ProductModel[]>(data?.flashSale || []);
  const [featuredReviews, setFeaturedReviews] = useState<ReviewModel[]>(data?.featuredReviews || []);
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
    if (data?.newArrivals?.length) setNewArrivals(data.newArrivals);
    if (data?.flashSale?.length) setFlashSale(data.flashSale);
    if (data?.featuredReviews?.length) setFeaturedReviews(data.featuredReviews);
    if (data?.recommendations?.length) setRecommendations(data.recommendations);
    if (hasInitialData) setIsLoading(false);
  }, [data, hasInitialData]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [promRes, catRes, bestSellerRes, newArrivalsRes, flashSaleRes, reviewsRes] = await Promise.all([
        homeService.getPromotions(),
        homeService.getCategories(),
        homeService.getBestSellers(),
        homeService.getNewArrivals(8),
        homeService.getFlashSale(8),
        homeService.getFeaturedReviews(6),
      ]);

      setPromotions(promRes);
      setCategories(catRes);
      setBestSellers(bestSellerRes);
      setNewArrivals(newArrivalsRes);
      setFlashSale(flashSaleRes);
      setFeaturedReviews(reviewsRes);
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
    newArrivals,
    flashSale,
    featuredReviews,
    recommendations,
    isLoading,
    error,
  };
};