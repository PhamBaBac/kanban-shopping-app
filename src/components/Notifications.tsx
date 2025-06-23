import React from "react";
import { Typography, Empty } from "antd";

const Notifications = () => {
  return (
    <div>
      <Typography.Title level={4}>Notifications</Typography.Title>
      <Empty description="You have no notifications." />
    </div>
  );
};

export default Notifications;
