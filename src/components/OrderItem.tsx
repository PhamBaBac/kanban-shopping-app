"use client";

import React, { useState } from "react";
import {
  Button,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Avatar,
  Card,
  Divider,
} from "antd";
import { VND } from "@/utils/handleCurrency";
import { DownOutlined, UpOutlined, EyeOutlined } from "@ant-design/icons";

interface OrderItemProps {
  order: {
    orderId: string;
    items: Array<{
      image: string;
      title: string;
      size: string;
      qty: number;
      price: number;
      totalPrice: number;
      orderStatus: string;
    }>;
    totalAmount: number;
    orderStatus: string;
  };
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOrderStatusColor = (status: string) => {
    if (!status) return "default";

    switch (status.toLowerCase()) {
      case "delivered":
        return "success";
      case "shipping":
        return "processing";
      case "confirmed":
        return "warning";
      case "pending":
        return "default";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card style={{ marginBottom: "16px" }} bodyStyle={{ padding: "16px" }}>
      {/* Order Summary */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "12px" }}
      >
        <Col>
          <Space direction="vertical" size="small">
            <Typography.Text strong>
              Order #{order.orderId.slice(0, 8)}...
            </Typography.Text>
            <Typography.Text type="secondary">
              {order.items.length} product{order.items.length > 1 ? "s" : ""}
            </Typography.Text>
          </Space>
        </Col>
        <Col>
          <Space size="middle">
            <Tag color={getOrderStatusColor(order.orderStatus)}>
              {order.orderStatus || "PENDING"}
            </Tag>
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide" : "View"}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Total Amount */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "12px" }}
      >
        <Col>
          <Typography.Text type="secondary">Total:</Typography.Text>
        </Col>
        <Col>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {VND.format(order.totalAmount)}
          </Typography.Text>
        </Col>
      </Row>

      {/* Products List - Collapsible */}
      {isExpanded && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  border: "1px solid #f0f0f0",
                  borderRadius: "6px",
                  background: "#fafafa",
                }}
              >
                <Row gutter={[12, 12]} align="middle">
                  <Col>
                    <Avatar src={item.image} size={50} shape="square" />
                  </Col>
                  <Col flex="auto">
                    <Space direction="vertical" size="small">
                      <Typography.Text
                        strong
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 300,
                        }}
                      >
                        {item.title}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Size: {item.size} | Qty: {item.qty}
                      </Typography.Text>
                    </Space>
                  </Col>
                  <Col>
                    <Typography.Text strong>
                      {VND.format(item.totalPrice)}
                    </Typography.Text>
                  </Col>
                </Row>
              </div>
            ))}
          </Space>
        </>
      )}

      {/* Action Buttons */}
      <Row justify="end" style={{ marginTop: "12px" }}>
        <Space>
          <Button type="default" size="small" icon={<EyeOutlined />}>
            View Details
          </Button>
          {order.orderStatus?.toLowerCase() === "delivered" ? (
            <Button type="primary" size="small">
              Write Review
            </Button>
          ) : order.orderStatus?.toLowerCase() === "pending" ? (
            <Button type="primary" danger size="small">
              Cancel Order
            </Button>
          ) : null}
        </Space>
      </Row>
    </Card>
  );
};

export default OrderItem;
