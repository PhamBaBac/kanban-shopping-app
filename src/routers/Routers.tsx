/** @format */

import handleAPI from "@/apis/handleApi";
import HeaderComponent from "@/components/HeaderComponent";
import { localDataNames } from "@/constants/appInfos";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { syncProducts } from "@/redux/reducers/cartReducer";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Layout, Spin } from "antd";
import { useRouter } from "next/router";
import { getOrCreateSessionId } from "@/utils/session";

const Routers = ({ Component, pageProps }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const path = usePathname();
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const router = useRouter();

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (auth.userId) {
      getDatabaseDatas();
    }
  }, [auth.userId]);

  useEffect(() => {
    if (auth.accessToken && path.includes("/auth")) {
      router.push("/");
    }
  }, [auth.accessToken, path]);

  const getData = () => {
    const res = localStorage.getItem(localDataNames.authData);
    if (res) {
      const parsed = JSON.parse(res);
      if (parsed?.userId && parsed.userId !== auth.userId) {
        dispatch(addAuth(parsed));
      }
    } else {
      // Người dùng chưa đăng nhập => gọi cart Redis
      getRedisCart();
    }
  };


  const getDatabaseDatas = async () => {
    setIsLoading(true);
    try {
      await getCartInDatabase();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCartInDatabase = async () => {
    try {
      const res: any = await handleAPI("/carts");
      if (res.result && res.result.length > 0) {
        dispatch(syncProducts(res.result));
      }
    } catch (error) {
      console.error("Failed to get cart", error);
    }
  };
  const getRedisCart = async () => {
    const sessionId = getOrCreateSessionId();
    try {
      const res: any = await handleAPI(`/redisCarts?sessionId=${sessionId}`);
      const result = Array.isArray(res.result) ? res.result : [res.result];
      const flatResult = result.flat(); // Đề phòng mảng lồng

      flatResult.forEach((item: any) => {
        if (item && item.subProductId) {
         dispatch(syncProducts(flatResult));

        }
      });
    } catch (err) {
      console.error("Failed to fetch Redis cart", err);
    }
  };


  return isLoading ? (
    <Spin />
  ) : path.includes("/auth") ? (
    <Layout className="bg-white">
      <Component pageProps={pageProps} />
    </Layout>
  ) : (
    <Layout className="bg-white">
      <HeaderComponent />
      <Component pageProps={pageProps} />
    </Layout>
  );
};

export default Routers;
