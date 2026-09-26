/** @format */

import HeaderComponent from "@/components/HeaderComponent";
import { localDataNames } from "@/constants/appInfos";
import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { getSavedCartFromStorage, syncProducts } from "@/redux/reducers/cartReducer";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Layout, Spin, Modal, Input, Button } from "antd";
import { useRouter } from "next/router";
import FooterComponent from "@/components/FooterComponent";
import ChatButton from "@/components/ChatButton";
import { useCartOperations } from "@/hooks/useCartOperations";
import { useOAuth } from "@/hooks";

const Routers = ({ Component, pageProps }: any) => {
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      await getCartInDatabase();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Spin />
      ) : path?.includes("/auth") ? (
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
