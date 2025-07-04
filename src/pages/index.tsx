/** @format */

import React, { useEffect, useState } from "react";
import HomePage from "./HomePage";
import { appInfo } from "@/constants/appInfos";
import { PromotionModel } from "@/models/PromotionModel";
import { CategoyModel, ProductModel } from "@/models/Products";
import handleAPI from "@/apis/handleApi";
import { Skeleton } from "antd";

const Home = () => {
  const [promotions, setPromotions] = useState<PromotionModel[]>([]);
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductModel[]>([]);
  const [recommendations, setRecommendations] = useState<ProductModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [promRes, catRes, bestSellerRes, idRes]: any = await Promise.all([
        handleAPI("/promotions"),
        handleAPI("/categories/all"),
        handleAPI("/products/bestSellers"),
        // handleAPI("/ai/recommendations"),
      ]);

      setPromotions(promRes?.result || []);
      setCategories(catRes?.result || []);
      setBestSellers(bestSellerRes?.result || []);

      const ids: string[] = idRes?.result || [];
      // const recRes: any = await handleAPI(
      //   "/products/listProductRecommendations",
      //   ids,
      //   "post"
      // );
      // if (ids.length > 0) {
      //   setRecommendations(recRes?.result || []);
      // }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu trang chủ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <Skeleton />
  ) : (
    <HomePage
      promotions={promotions}
      categories={categories}
      bestSellers={bestSellers}
      recommendations={recommendations}
    />
  );
};

export default Home;

export const getStaticProps = async () => {
  try {
    const [promRes, catRes, bestSellerRes] = await Promise.all([
      fetch(`${appInfo.baseUrl}/promotions`).then((res) => res.json()),
      fetch(`${appInfo.baseUrl}/categories/all`).then((res) => res.json()),
      fetch(`${appInfo.baseUrl}/products/bestSellers`).then((res) =>
        res.json()
      ),
      // fetch(`${appInfo.baseUrl}/ai/recommendations`).then((res) => res.json()),
    ]);

    let recRes = { result: [] };

    return {
      props: {
        promotions: Array.isArray(promRes.result) ? promRes.result : [],
        categories: Array.isArray(catRes.result) ? catRes.result : [],
        bestSellers: Array.isArray(bestSellerRes.result)
          ? bestSellerRes.result
          : [],
        listProductRecommendations: Array.isArray(recRes.result)
          ? recRes.result
          : [],
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
