/** @format */

import HeaderComponent from "@/components/HeaderComponent";
import { localDataNames } from "@/constants/appInfos";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { getSavedCartFromStorage, syncProducts } from "@/redux/reducers/cartReducer";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Layout, Modal, Input, Button } from "antd";
import { useRouter } from "next/router";
import FooterComponent from "@/components/FooterComponent";
import dynamic from "next/dynamic";
import { useCartOperations } from "@/hooks/useCartOperations";
import { useOAuth } from "@/hooks";

const ChatButton = dynamic(() => import("@/components/ChatButton"), {
  ssr: false,
});

const Routers = ({ Component, pageProps }: any) => {
  const path = usePathname();
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const router = useRouter();
  const { getCartInDatabase, getRedisCart, fetchCartById } = useCartOperations();

  const {
    isOAuthProcessing,
    isMfaModalVisible,
    setIsMfaModalVisible,
    otpCode,
    setOtpCode,
    handleVerifyMfa,
  } = useOAuth();

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

    const cartId = localStorage.getItem("cartId");
    if (cartId) {
      fetchCartById(cartId);
    } else {
      getRedisCart();
    }
  };

  const getDatabaseDatas = async () => {
    try {
      await getCartInDatabase();
    } catch (error) {
      console.log(error);
    }
  };

  // Không hiển thị Header và Footer khi ở trang lỗi (404, 500, NotFound, ServerError) hoặc trang yêu cầu noLayout
  const isErrorRoute =
    router.pathname === "/404" ||
    router.pathname === "/500" ||
    router.pathname === "/NotFound" ||
    router.pathname === "/ServerError" ||
    router.pathname === "/_error" ||
    path === "/404" ||
    path === "/500" ||
    path === "/NotFound" ||
    path === "/ServerError" ||
    Boolean(Component?.noLayout) ||
    Boolean(Component?.isErrorPage) ||
    pageProps?.statusCode === 404 ||
    pageProps?.statusCode === 500;

  return (
    <>
      {isErrorRoute ? (
        <main style={{ minHeight: "100vh", width: "100%", margin: 0, padding: 0 }}>
          <Component {...pageProps} pageProps={pageProps} />
        </main>
      ) : path?.includes("/auth") ? (
        <Layout>
          <Component {...pageProps} pageProps={pageProps} />
        </Layout>
      ) : (
        <Layout style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent" }}>
          <Layout.Header
            style={{
              padding: 0,
              height: "auto",
              lineHeight: "inherit",
              background: "transparent",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              width: "100%",
            }}
          >
            <HeaderComponent />
          </Layout.Header>
          <Layout.Content style={{ flex: 1 }}>
            <Component {...pageProps} pageProps={pageProps} />
          </Layout.Content>
          <Layout.Footer style={{ padding: 0, background: "transparent" }}>
            <FooterComponent />
          </Layout.Footer>
          <ChatButton />
        </Layout>
      )}

      {/* Modal xác thực 2 bước (2FA) khi người dùng có bật 2FA */}
      <Modal
        title="Xác thực 2 bước (2FA)"
        open={isMfaModalVisible}
        onCancel={() => setIsMfaModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <p style={{ marginBottom: 16 }}>
          Vui lòng nhập mã xác thực gồm 6 chữ số từ ứng dụng Google Authenticator:
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Input
              key={i}
              maxLength={1}
              value={otpCode[i]}
              id={`mfa-input-${i}`}
              onChange={(e) => {
                const val = e.target.value;
                const newOtp = [...otpCode];
                newOtp[i] = val;
                setOtpCode(newOtp);
                if (val && i < 5) {
                  document.getElementById(`mfa-input-${i + 1}`)?.focus();
                }
              }}
              style={{
                width: 45,
                height: 52,
                fontSize: 22,
                textAlign: "center",
              }}
              autoFocus={i === 0}
            />
          ))}
        </div>
        <Button
          type="primary"
          block
          size="large"
          loading={isOAuthProcessing}
          disabled={otpCode.join("").length !== 6}
          onClick={() => handleVerifyMfa(otpCode.join(""))}
        >
          Xác thực & Đăng nhập
        </Button>
      </Modal>
    </>
  );
};

export default Routers;
