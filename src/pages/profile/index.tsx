/** @format */

import { addAuth, authSelector } from "@/redux/reducers/authReducer";
import { Tabs, TabsProps, Typography } from "antd";
import { TabsPosition } from "antd/es/tabs";
import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import ProsionalInfomation from "../../components/PersionalInfomations";
import { FaCog, FaLock, FaShoppingCart } from "react-icons/fa";
import OrderItem from "@/components/OrderItem";
import { SettingsContent } from "@/components";
import ChangePassword from "@/components/ChangePassword";
import { useOrders } from "@/hooks/useOrders";
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

  useEffect(() => {
    const WIDTH = window ? window.innerWidth : undefined;

    if (WIDTH) {
      setTabPosition(WIDTH < 768 ? "top" : "left");
    }
  }, []);

  // Đồng bộ provider nếu phiên đăng nhập cũ trong localStorage chưa lưu provider
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

  // Nếu là tài khoản OAuth2 nhưng URL tab là change-password, tự chuyển về tab edit
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
      label: "Persional Infomations",
      icon: <FaUser size={14} className="text-muted" />,
      children: <ProsionalInfomation />,
    },
    {
      key: "orders",
      label: "Orders",
      icon: <FaShoppingCart size={14} className="text-muted" />,
      children: (
        <div className="space-y-4">
          {loading && <div>Loading orders...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading &&
            !error &&
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
    ...(!isOAuthUser
      ? [
          {
            key: "change-password",
            label: "Change Password",
            icon: <FaLock size={14} className="text-muted" />,
            children: <ChangePassword />,
          },
        ]
      : []),
    {
      key: "settings",
      label: "Settings",
      icon: <FaCog size={14} className="text-muted" />,
      children: <SettingsContent />,
    },
  ];

  return (
    <div className="container mt-4 mb-4">
      <Typography.Title level={2} type="secondary">
        My Profile
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
