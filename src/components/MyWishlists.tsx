import React from "react";
import { Typography, Empty } from "antd";

const MyWishlists = () => {
  return (
    <div>
      <Typography.Title level={4}>My Wishlists</Typography.Title>
      <Empty description="You have no items in your wishlist." />
    </div>
  );
};

export default MyWishlists;
