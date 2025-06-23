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


const ProfilePage = () => {
  const [tabPosition, setTabPosition] = useState<TabsPosition>("left");
  const [orders, setOrders] = useState([]);

  const auth = useSelector(authSelector);
  // 	const orders = [
  //     {
  //       image:
  //         "https://firebasestorage.googleapis.com/v0/b/todolistapp-clone.appspot.com/o/images%2Fiphone16.jpeg?alt=media&token=f5dbc63b-41e2-4c3c-8de7-4576fe93be6d",
  //       title: "Girls Pink Moana Printed Dress",
  //       size: "S",
  //       qty: 1,
  //       price: 80,
  //       status: "COMPLETED",
  //     },
  //     {
  //       image:
  //         "https://firebasestorage.googleapis.com/v0/b/todolistapp-clone.appspot.com/o/images%2Fiphone16.jpeg?alt=media&token=f5dbc63b-41e2-4c3c-8de7-4576fe93be6d",
  //       title: "Women Textured Handheld Bag",
  //       size: "Regular",
  //       qty: 1,
  //       price: 80,
  //       status: "PENDING",
  //     },
  //     {
  //       image:
  //         "https://firebasestorage.googleapis.com/v0/b/todolistapp-clone.appspot.com/o/images%2Fiphone16.jpeg?alt=media&token=f5dbc63b-41e2-4c3c-8de7-4576fe93be6d",
  //       title: "Tailored Cotton Casual Shirt",
  //       size: "M",
  //       qty: 1,
  //       price: 40,
  //       status: "PENDING",
  //     },
  //   ];

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
    const response: any = await handleAPI("/bills/listBills");
    setOrders(response.result);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: any, idx: number) => (
            <OrderItem
              key={idx}
              image={order?.image}
              title={order?.title}
              size={order?.size}
              qty={order?.qty}
              price={order?.totalPrice}
              status={order?.status as any}
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
        <Tabs items={profileTabs} tabPosition={tabPosition} />
      </div>
    </div>
  );
};

export default ProfilePage;
