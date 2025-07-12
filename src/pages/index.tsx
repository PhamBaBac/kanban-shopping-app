/** @format */

import React from "react";
import HomePage from "./HomePage";
import { useHome } from "@/hooks";
import { homeService } from "@/services";
import { Skeleton } from "antd";

const Home = () => {
  const {
    promotions,
    categories,
    bestSellers,
    recommendations,
    isLoading,
    error,
  } = useHome();

  if (error) {
    return <div>Error: {error}</div>;
  }

  return isLoading ? (
    <Skeleton />
  ) : (
    <HomePage
      promotions={promotions}
      categories={categories}
      bestSellers={bestSellers}
      // recommendations={recommendations}
    />
  );
};

export default Home;

export const getStaticProps = async () => {
  try {
    const [promotions, categories, bestSellers] = await Promise.all([
      homeService.getPromotions(),
      homeService.getCategories(),
      homeService.getBestSellers(),
    ]);

    return {
      props: {
        promotions,
        categories,
        bestSellers,
        listProductRecommendations: [],
      },
    };
  } catch (err) {
    return {
      props: {
        promotions: [],
        categories: [],
        bestSellers: [],
        listProductRecommendations: [],
      },
    };
  }
};
