/** @format */

import { authSelector } from "@/redux/reducers/authReducer";
import { List, Select, Switch, Tabs, TabsProps, Typography } from "antd";
import { TabsPosition } from "antd/es/tabs";
import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa6";
import { useSelector } from "react-redux";
import ProsionalInfomation from "../../components/PersionalInfomations";
import { FaCog, FaLock, FaShoppingCart } from "react-icons/fa";
import OrderItem from "@/components/OrderItem";
import { SettingsContent, TwoFactorAuthSettings } from "@/components";
import ChangePassword from "@/components/ChangePassword";
import { useOrders } from "@/hooks/useOrders";

import { useRouter } from "next/router";

const ProfilePage = () => {
  const router = useRouter();
  const [tabPosition, setTabPosition] = useState<TabsPosition>("left");
  const defaultTab = router.query.tab?.toString() || "edit";

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
    {
      key: "change-password",
      label: "Change Password",
      icon: <FaLock size={14} className="text-muted" />,
      children: <ChangePassword />,
    },
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
          defaultActiveKey={defaultTab}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
