/** @format */

import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { Tabs, TabsProps, Typography, Skeleton, Empty, Button, Alert } from "antd";
import { TabsPosition } from "antd/es/tabs";
import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import ProsionalInfomation from "../../components/PersionalInfomations";
import { FaBell, FaCog, FaHeart, FaLock, FaShoppingCart } from "react-icons/fa";
import OrderItem from "@/components/OrderItem";
import { SettingsContent, ProfileNotifications, ProfileWishlist } from "@/components";
import ChangePassword from "@/components/ChangePassword";
import { useOrders } from "@/hooks/useOrders";
import { useNotification } from "@/hooks/useNotification";
import { useWishlist } from "@/hooks/useWishlist";
import { authService } from "@/services";
import { localDataNames } from "@/constants/appInfos";

import { useRouter } from "next/router";

const ProfilePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const [tabPosition, setTabPosition] = useState<TabsPosition>("left");
  const [currentTab, setCurrentTab] = useState<string>(
    router.query.tab?.toString() || "edit"
  );

  const {
    orders,
    loading,
    error,
    refetch,
    handleOrderDeleted,
    handleOrderStatusChanged,
  } = useOrders();

  const { unreadCount } = useNotification();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const WIDTH = window ? window.innerWidth : undefined;

    if (WIDTH) {
      setTabPosition(WIDTH < 768 ? "top" : "left");
    }
  }, []);

  useEffect(() => {
    if (auth?.accessToken && !auth?.provider) {
      authService
        .getCurrentUser()
        .then((userData) => {
          if (userData?.provider) {
            const updatedAuth = { ...auth, provider: userData.provider };
            dispatch(addAuth(updatedAuth));
            localStorage.setItem(
              localDataNames.authData,
              JSON.stringify(updatedAuth)
            );
          }
        })
        .catch((err) => console.error("Error fetching user profile:", err));
    }
  }, [auth?.accessToken, auth?.provider]);

  const isOAuthUser = Boolean(auth?.provider && auth.provider !== "LOCAL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAuth = localStorage.getItem(localDataNames.authData);
      const hasToken = Boolean(auth?.accessToken || storedAuth);
      if (!hasToken) {
        if (router.query.tab === "wishlist") {
          router.replace("/wishlist");
        } else {
          router.replace("/auth/login");
        }
      }
    }
  }, [auth?.accessToken, router.query.tab]);

  useEffect(() => {
    const tabParam = router.query.tab?.toString();
    if (isOAuthUser && tabParam === "change-password") {
      setCurrentTab("edit");
    } else if (tabParam) {
      setCurrentTab(tabParam);
    }
  }, [router.query.tab, isOAuthUser]);

  const profileTabs: TabsProps["items"] = [
    {
      key: "edit",
      label: "Thông tin cá nhân",
      icon: <FaUser size={14} className="text-muted" />,
      children: <ProsionalInfomation />,
    },
    {
      key: "orders",
      label: `Đơn hàng ${orders.length > 0 ? `(${orders.length})` : ""}`,
      icon: <FaShoppingCart size={14} className="text-muted" />,
      children: (
        <div>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    padding: "20px",
                  }}
                >
                  <Skeleton active avatar paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert
              type="error"
              message="Không thể tải danh sách đơn hàng"
              description={error}
              showIcon
              action={
                <Button size="small" onClick={refetch} style={{ borderRadius: "6px" }}>
                  Thử lại
                </Button>
              }
              style={{ borderRadius: "8px", marginBottom: "16px" }}
            />
          )}

          {!loading && !error && orders.length === 0 && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "60px 24px",
                textAlign: "center",
              }}
            >
              <Empty
                description={
                  <div style={{ marginTop: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#131118",
                        display: "block",
                      }}
                    >
                      Bạn chưa có đơn hàng nào
                    </span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>
                      Hãy khám phá hàng ngàn sản phẩm chất lượng tại cửa hàng!
                    </span>
                  </div>
                }
              >
                <Button
                  type="primary"
                  onClick={() => router.push("/")}
                  style={{
                    marginTop: "12px",
                    background: "#131118",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    fontWeight: 600,
                    height: "40px",
                    padding: "0 24px",
                    cursor: "pointer",
                  }}
                >
                  Khám phá ngay
                </Button>
              </Empty>
            </div>
          )}

          {!loading &&
            !error &&
            orders.length > 0 &&
            orders.map((order: any, idx: number) => (
              <OrderItem
                key={order.orderId || idx}
                order={order}
                onOrderDeleted={handleOrderDeleted}
                onOrderStatusChanged={handleOrderStatusChanged}
                onReviewSubmitted={refetch}
              />
            ))}
        </div>
      ),
    },
    {
      key: "wishlist",
      label: `Yêu thích ${wishlistCount > 0 ? `(${wishlistCount})` : ""}`,
      icon: <FaHeart size={14} className="text-muted" />,
      children: <ProfileWishlist />,
    },
    {
      key: "notifications",
      label: `Thông báo ${unreadCount > 0 ? `(${unreadCount})` : ""}`,
      icon: <FaBell size={14} className="text-muted" />,
      children: <ProfileNotifications />,
    },
    ...(!isOAuthUser
      ? [
          {
            key: "change-password",
            label: "Đổi mật khẩu",
            icon: <FaLock size={14} className="text-muted" />,
            children: <ChangePassword />,
          },
        ]
      : []),
    {
      key: "settings",
      label: "Cài đặt",
      icon: <FaCog size={14} className="text-muted" />,
      children: <SettingsContent />,
    },
  ];

  const hasToken = Boolean(
    auth?.accessToken ||
      (typeof window !== "undefined" &&
        localStorage.getItem(localDataNames.authData))
  );

  if (!hasToken) {
    return (
      <div className="container py-5" style={{ minHeight: "60vh" }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-4">
      <Typography.Title
        level={2}
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          color: "#131118",
          letterSpacing: "-0.02em",
          marginBottom: "16px",
        }}
      >
        Tài khoản của tôi
      </Typography.Title>
      <div className="mt-4">
        <Tabs
          items={profileTabs}
          tabPosition={tabPosition}
          activeKey={currentTab}
          onChange={(key) => {
            setCurrentTab(key);
            router.push(
              {
                pathname: router.pathname,
                query: { ...router.query, tab: key },
              },
              undefined,
              { shallow: true }
            );
          }}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
