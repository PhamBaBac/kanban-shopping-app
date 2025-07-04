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
  message,
} from "antd";
import { VND } from "@/utils/handleCurrency";
import {
  DownOutlined,
  UpOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import handleAPI from "@/apis/handleApi";
import { useRouter } from "next/router";
import { OrderDetailModal } from "@/modals";

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
  onOrderDeleted?: (orderId: string) => void;
  onOrderStatusChanged?: (orderId: string, newStatus: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({
  order,
  onOrderDeleted,
  onOrderStatusChanged,
}) => {
  const router = useRouter();
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const getOrderStatusColor = (status: string) => {
    if (!status) return "default";
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "success";
      case "PROCESSING":
        return "processing";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "error";
      case "REFUNDED":
        return "default";
      default:
        return "default";
    }
  };

  const getOrderStatusText = (status: string) => {
    if (!status) return "";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const getOrderStatusDescription = (status: string) => {
    if (!status) return "";
    switch (status.toUpperCase()) {
      case "PENDING":
        return "Waiting for confirmation";
      case "PROCESSING":
        return "Order is being processed";
      case "COMPLETED":
        return "Order completed";
      case "CANCELLED":
        return "Order cancelled";
      case "REFUNDED":
        return "Order refunded";
      default:
        return "";
    }
  };

  const updateOrderStatus = async () => {
    try {
      setCancelLoading(true);
      await handleAPI(`/orders/${order.orderId}/cancel`, {}, "patch");
      message.success("Order status updated successfully");
      // Gọi callback để thông báo cho component cha
      onOrderStatusChanged?.(order.orderId, "CANCELLED");
    } catch (error) {
      message.error("Failed to update order status");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleViewOrderDetails = async () => {
    try {
      setLoading(true);
      const response: any = await handleAPI(
        `/orders/${order.orderId}`,
        {},
        "get"
      );
      if (response?.result) {
        setOrderDetail(response.result);
        setOrderDetailVisible(true);
      }
    } catch (error) {
      message.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrderDetail = () => {
    setOrderDetailVisible(false);
    setOrderDetail(null);
  };

  const handleDeleteOrder = async () => {
    try {
      setDeleteLoading(true);
      await handleAPI(`/orders/${order.orderId}`, {}, "delete");
      message.success("Order deleted successfully");
      // Gọi callback để thông báo cho component cha
      onOrderDeleted?.(order.orderId);
    } catch (error) {
      message.error("Failed to delete order");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: "16px" }} bodyStyle={{ padding: "16px" }}>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: "12px" }}
        ></Row>
        {order.items.length === 1 ? (
          // Nếu chỉ có 1 sản phẩm, hiển thị luôn
          <div
            style={{
              background: "#fafafa",
            }}
          >
            <Row gutter={[12, 12]} align="middle">
              <Col>
                <Avatar src={order.items[0].image} size={80} shape="square" />
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
                      maxWidth: 400,
                    }}
                  >
                    {order.items[0].title}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Size: {order.items[0].size}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Qty: {order.items[0].qty}
                  </Typography.Text>
                </Space>
              </Col>
              <Col style={{ marginRight: "10px" }}>
                <Typography.Text strong>
                  {VND.format(order.items[0].totalPrice)}
                </Typography.Text>
              </Col>
            </Row>
          </div>
        ) : (
          <>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {order.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <Row gutter={[12, 12]} align="middle">
                    <Col>
                      <Avatar src={item.image} size={80} shape="square" />
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
                            maxWidth: 400,
                          }}
                        >
                          {item.title}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Size: {item.size}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Qty: {item.qty}
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

        <Row justify="space-between" style={{ marginTop: "12px" }}>
          <Col>
            <Space size="middle">
              <Tag color={getOrderStatusColor(order.orderStatus)}>
                {getOrderStatusText(order.orderStatus) || "PENDING"}
              </Tag>
              <Typography.Text type="secondary">
                {getOrderStatusDescription(order.orderStatus)}
              </Typography.Text>
            </Space>
          </Col>
          <Space>
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined />}
              onClick={handleViewOrderDetails}
              loading={loading}
            >
              View Details
            </Button>

            {order.orderStatus?.toLowerCase() === "delivered" && (
              <Button type="primary" size="small">
                Write Review
              </Button>
            )}

            {order.orderStatus?.toLowerCase() === "pending" && (
              <Button
                type="primary"
                danger
                size="small"
                onClick={() => updateOrderStatus()}
                icon={<CloseOutlined />}
                loading={cancelLoading}
              >
                Cancel Order
              </Button>
            )}

            {(order.orderStatus?.toLowerCase() === "cancelled" ||
              order.orderStatus?.toLowerCase() === "refunded" ||
              order.orderStatus?.toLowerCase() === "completed") && (
              <Button
                type="primary"
                danger
                size="small"
                onClick={() => handleDeleteOrder()}
                icon={<DeleteOutlined />}
                loading={deleteLoading}
              >
                Delete Order
              </Button>
            )}
          </Space>
        </Row>
      </Card>

      <OrderDetailModal
        visible={orderDetailVisible}
        onClose={handleCloseOrderDetail}
        orderDetail={orderDetail}
      />
    </>
  );
};

export default OrderItem;
