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
      const cartId = localStorage.getItem("cartId");
      if (cartId) {
        // Only call Redis cart when not on auth page and not logged in
        fetchCart(cartId);
      }
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

  const fetchCart = async (newCartId: string) => {
    try {
      const response: any = await handleAPI(`/carts/${newCartId}`);
      const result = response.result || [];
      const flatResult = result.flat(); // Prevent nested arrays
      dispatch(syncProducts(flatResult));
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  return isLoading ? (
    <Spin />
  ) : path.includes("/auth") || path.includes("/oauth-callback") ? (
    <Layout>
      <Component pageProps={pageProps} />
    </Layout>
  ) : (
    <Layout>
      <Layout.Header
        style={{
          padding: 0,
          height: "auto",
          lineHeight: "inherit",
        }}
      >
        <HeaderComponent />
      </Layout.Header>
      <Layout.Content>
        <Component pageProps={pageProps} />
      </Layout.Content>
    </Layout>
  );
};

export default Routers;
