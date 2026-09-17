/** @format */

import HeaderComponent from "@/components/HeaderComponent";
import { localDataNames } from "@/constants/appInfos";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { getSavedCartFromStorage, syncProducts } from "@/redux/reducers/cartReducer";
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
    if (auth.accessToken && path?.includes("/auth")) {
      router.push("/");
    }
  }, [auth.accessToken, path]);

  const getData = () => {
    // 1. Phục hồi giỏ hàng từ localStorage ngay khi tải trang (tránh mất giỏ hàng khi reload)
    const savedCart = getSavedCartFromStorage();
    if (savedCart && savedCart.length > 0) {
      dispatch(syncProducts(savedCart));
    }

    const res = localStorage.getItem(localDataNames.authData);
    if (res) {
      try {
        const parsed = JSON.parse(res);
        if (parsed?.userId) {
          if (parsed.userId !== auth.userId) {
            dispatch(addAuth(parsed));
          }
          getDatabaseDatas();
          return;
        }
      } catch (e) {
        console.error("Failed to parse authData", e);
      }
    }

    // Chỉ gọi Redis cart khi người dùng chưa đăng nhập
    const cartId = localStorage.getItem("cartId");
    if (cartId) {
      fetchCartById(cartId);
    } else {
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

  return isLoading ? (
    <Spin />
  ) : path?.includes("/auth") || path?.includes("/oauth-callback") ? (
    <Layout>
      <Component pageProps={pageProps} />
    </Layout>
  ) : (
    <Layout style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Layout.Header
        style={{
          padding: 0,
          height: "auto",
          lineHeight: "inherit",
        }}
      >
        <HeaderComponent />
      </Layout.Header>
      <Layout.Content style={{ flex: 1 }}>
        <Component pageProps={pageProps} />
      </Layout.Content>
      <Layout.Footer style={{ padding: 0, background: "transparent" }}>
        <FooterComponent />
      </Layout.Footer>
    </Layout>
  );
};

export default Routers;
