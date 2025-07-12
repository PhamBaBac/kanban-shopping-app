/** @format */

import HeaderComponent from "@/components/HeaderComponent";
import { localDataNames } from "@/constants/appInfos";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Layout, Spin } from "antd";
import { useRouter } from "next/router";
import FooterComponent from "@/components/FooterComponent";
import { useCartOperations } from "@/hooks/useCartOperations";

const Routers = ({ Component, pageProps }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const path = usePathname();
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const router = useRouter();
  const { getCartInDatabase, getRedisCart, fetchCartById } = useCartOperations();

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

  //getRedisCart
  useEffect(() => {
    getRedisCart();
  }, []);

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
        fetchCartById(cartId);
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
      <Layout.Footer style={{ padding: 0, background: "transparent" }}>
        <FooterComponent />
      </Layout.Footer>
    </Layout>
  );
};

export default Routers;
