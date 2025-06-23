import React from "react";
import { Typography, Empty } from "antd";

const MyOrders = () => {
  return (
    <div>
      <Typography.Title level={4}>My Orders</Typography.Title>
      <Empty description="You have no orders." />
    </div>
  );
};

export default MyOrders;
