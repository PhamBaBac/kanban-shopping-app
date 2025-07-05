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
import handleAPI from "@/apis/handleApi";
import { SettingsContent, TwoFactorAuthSettings } from "@/components";
import ChangePassword from "@/components/ChangePassword";

import { useRouter } from "next/router";

const ProfilePage = () => {
  const router = useRouter();
  const [tabPosition, setTabPosition] = useState<TabsPosition>("left");
  const [orders, setOrders] = useState<any[]>([]);
  const defaultTab = router.query.tab?.toString() || "edit"; // <-- đọc query tab

  useEffect(() => {
    getOrders();
  }, []);

  useEffect(() => {
    const WIDTH = window ? window.innerWidth : undefined;

    if (WIDTH) {
      setTabPosition(WIDTH < 768 ? "top" : "left");
    }
  }, []);

  const getOrders = async () => {
    const response: any = await handleAPI("/orders/listOrders");

    const orderMap = new Map();

    response.result.forEach((item: any) => {
      const orderId = item.orderId;

      if (orderMap.has(orderId)) {
        const existingOrder = orderMap.get(orderId);
        existingOrder.items.push({
          image: item.image,
          title: item.title,
          size: item.size,
          qty: item.qty,
          price: item.price,
          totalPrice: item.totalPrice,
          orderStatus: item.orderStatus,
          subProductId: item.subProductId, 
          isReviewed: item.isReviewed, 
        });
        existingOrder.totalAmount += item.totalPrice;
      } else {
        orderMap.set(orderId, {
          orderId: orderId,
          items: [
            {
              image: item.image,
              title: item.title,
              size: item.size,
              qty: item.qty,
              price: item.price,
              totalPrice: item.totalPrice,
              orderStatus: item.orderStatus,
              subProductId: item.subProductId,
              isReviewed: item.isReviewed,
            },
          ],
          totalAmount: item.totalPrice,
          orderStatus: item.orderStatus,
        });
      }
    });

    const groupedOrders = Array.from(orderMap.values());
    setOrders(groupedOrders);
  };


  // Callback khi order bị xóa
  const handleOrderDeleted = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.orderId !== orderId)
    );
  };

  // Callback khi trạng thái order thay đổi
  const handleOrderStatusChanged = (orderId: string, newStatus: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              orderStatus: newStatus,
              items: order.items.map((item: any) => ({
                ...item,
                orderStatus: newStatus,
              })),
            }
          : order
      )
    );
  };

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
          {orders.map((order: any, idx: number) => (
            <OrderItem
              key={order.orderId || idx}
              order={order}
              onOrderDeleted={handleOrderDeleted}
              onOrderStatusChanged={handleOrderStatusChanged}
              onReviewSubmitted={getOrders} 
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
