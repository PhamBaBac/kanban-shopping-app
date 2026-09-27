/** @format */

import React from "react";
import HomePage from "./HomePage";
import { useHome } from "@/hooks";
import { homeService } from "@/services";
import { Skeleton } from "antd";
import ServerError500Page from "./500";

const Home = (props: any) => {
  const initialData = props?.promotions ? props : (props?.pageProps || props);
  const {
    promotions,
    categories,
    bestSellers,
    recommendations,
    isLoading,
    error,
  } = useHome(initialData);

  if (error && !promotions.length && !categories.length && !bestSellers.length) {
    return <ServerError500Page />;
  }

  const hasData = Boolean(
    (promotions && promotions.length > 0) ||
    (categories && categories.length > 0) ||
    (bestSellers && bestSellers.length > 0)
  );

  return isLoading && !hasData ? (
    <div style={{ padding: "24px 16px", maxWidth: 1200, margin: "0 auto" }}>
      <Skeleton active paragraph={{ rows: 10 }} />
    </div>
  ) : (
    <HomePage
      promotions={promotions}
      categories={categories}
      bestSellers={bestSellers}
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
        promotions: promotions || [],
        categories: categories || [],
        bestSellers: bestSellers || [],
        listProductRecommendations: [],
      },
      revalidate: 60,
    };
  } catch (err) {
    return {
      props: {
        promotions: [],
        categories: [],
        bestSellers: [],
        listProductRecommendations: [],
      },
      revalidate: 10,
    };
  }
};
