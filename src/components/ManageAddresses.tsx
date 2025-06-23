import React from "react";
import { Typography, Empty } from "antd";

const ManageAddresses = () => {
  return (
    <div>
      <Typography.Title level={4}>Manage Addresses</Typography.Title>
      <Empty description="You have no saved addresses." />
    </div>
  );
};

export default ManageAddresses;
