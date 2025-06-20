"use client";

import React from "react";
import Image from "next/image";
import { Button, Row, Col, Typography, Tag, Space, Avatar } from "antd";
import { VND } from "@/utils/handleCurrency";

type OrderStatus = "delivered" | "in_process";

interface OrderItemProps {
  image: string;
  title: string;
  size: string;
  qty: number;
  price: number;
  status: OrderStatus;
}

const OrderItem: React.FC<OrderItemProps> = ({
  image,
  title,
  size,
  qty,
  price,
  status,
}) => {
  const isDelivered = status === "delivered";

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
      <Row gutter={[16, 16]} align="top">
        <Col>
          <Avatar src={image} size={80} shape="square" />
        </Col>

        <Col flex="auto">
          <Space direction="vertical" size="small">
            <Typography.Text strong>{title}</Typography.Text>
            <Typography.Text type="secondary">Size: {size}</Typography.Text>
            <Typography.Text type="secondary">Qty: {qty}</Typography.Text>
          </Space>
        </Col>

        <Col>
          <Space direction="vertical" align="end" size="middle">
            <Typography.Text strong style={{ fontSize: 16 }}>
              {VND.format(price)}
            </Typography.Text>

            <Button type="default" size="small">
              View Order
            </Button>

            {isDelivered ? (
              <Button type="primary" danger={false} size="small">
                Write A Review
              </Button>
            ) : (
              <Button type="primary" danger size="small">
                Cancel Order
              </Button>
            )}
          </Space>
        </Col>
      </Row>
      <Row style={{ marginLeft: "12px" }}>
        <Space size="middle">
          <Tag color={isDelivered ? "green" : "gold"}>
            {isDelivered ? "Delivered" : "In Process"}
          </Tag>
          <Typography.Text>
            Your product has been {isDelivered ? "delivered" : "in process"}
          </Typography.Text>
        </Space>
      </Row>
    </div>
  );
};

export default OrderItem;
