/** @format */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import HomePage from './HomePage';
import { appInfo } from '@/constants/appInfos';
import { PromotionModel } from '@/models/PromotionModel';
import { CategoyModel, ProductModel } from '@/models/Products';
import handleAPI from '@/apis/handleApi';
import { Empty, Skeleton } from 'antd';

const Home = (data: any) => {
	const pageProps = data.pageProps;

	const [promotions, setPromotions] = useState<PromotionModel[]>([]);
	const [categories, setCategories] = useState<CategoyModel[]>([]);
	const [bestSellers, setBestSellers] = useState<ProductModel[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		getDatas();
	}, []);

	const getDatas = async () => {
		setIsLoading(true);
		try {
			await getPromotions();
			await getCategories();
			await getProducts();
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	const getPromotions = async () => {
		const res: any = await handleAPI("/promotions");

		res && res.result && setPromotions(res.result);
	};

	const getCategories = async () => {
		const res: any = await handleAPI(`/categories/all` );
		res && res.result && setCategories(res.result);
	};

	const getProducts = async () => {
		const res: any = await handleAPI(`/products/page?page=1&pageSize=10`);
		console.log(res);
		res && res.result.data && setBestSellers(res.result.data);
	};

	return isLoading ? (
		<Skeleton />
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
		const res = await fetch(`${appInfo.baseUrl}/promotions`);
		const resultPromotions = await res.json();

		const resCats = await fetch(`${appInfo.baseUrl}/categories/all`);
		const resultCats = await resCats.json();

		const resBestSeller = await fetch(
			`${appInfo.baseUrl}/products/page?page=1&pageSize=10`
		);
		const resultsSeller = await resBestSeller.json();

		return {
      props: {
        promotions: resultPromotions.result,
        categories: resultCats.result,
        bestSellers: resultsSeller.result.data,
      },
    };
	} catch (error) {
		return {
			props: {
				data: [],
			},
		};
	}
};
