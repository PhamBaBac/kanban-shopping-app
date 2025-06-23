import React from "react";
import { Typography, Empty } from "antd";

const SavedCards = () => {
  return (
    <div>
      <Typography.Title level={4}>Saved Cards</Typography.Title>
      <Empty description="You have no saved cards." />
    </div>
  );
};

export default SavedCards;
