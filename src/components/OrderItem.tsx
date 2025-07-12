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
import { orderService } from "@/services";
import { useRouter } from "next/router";
import { OrderDetailModal } from "@/modals";
import Reviews from "./Reviews";

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
      subProductId: string;
      isReviewed?: boolean;
    }>;
    totalAmount: number;
    orderStatus: string;
  };
  onOrderDeleted?: (orderId: string) => void;
  onOrderStatusChanged?: (orderId: string, newStatus: string) => void;
  onReviewSubmitted?: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({
  order,
  onOrderDeleted,
  onOrderStatusChanged,
  onReviewSubmitted,
}) => {
  const router = useRouter();
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [openReviewProductId, setOpenReviewProductId] = useState<string | null>(
    null
  );

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
      await orderService.cancelOrder(order.orderId);
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
      const response = await orderService.getOrderDetail(order.orderId);
      if (response) {
        setOrderDetail(response);
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
      await orderService.deleteOrder(order.orderId);
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
          <div
            style={{
              background: "#fafafa",
              paddingLeft: "12px",
              paddingTop: "12px",
              paddingBottom: "12px",
            }}
          >
            <Row
              gutter={[12, 12]}
              align="top"
              style={{
                minHeight: "100px",
                display: "flex",
                alignItems: "flex-start",
              }}
            >
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
              <Col style={{ textAlign: "right", marginRight: "10px" }}>
                <div style={{ marginTop: "12px" }}>
                  <Typography.Text strong>
                    {VND.format(order.items[0].totalPrice)}
                  </Typography.Text>
                  <div
                    style={{
                      minHeight: "36px",
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {order.orderStatus?.toLowerCase() === "completed" &&
                      !order.items[0].isReviewed && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() =>
                            setOpenReviewProductId(
                              openReviewProductId ===
                                order.items[0].subProductId
                                ? null
                                : order.items[0].subProductId
                            )
                          }
                        >
                          {openReviewProductId === order.items[0].subProductId
                            ? "Hide Review"
                            : "Write Review"}
                        </Button>
                      )}
                    {order.orderStatus?.toLowerCase() === "completed" &&
                      order.items[0].isReviewed && (
                        <span style={{ color: "green", fontSize: "12px" }}>
                          Bạn đã đánh giá sản phẩm này
                        </span>
                      )}
                  </div>
                </div>
              </Col>
            </Row>
            {order.orderStatus?.toLowerCase() === "completed" &&
              openReviewProductId === order.items[0].subProductId &&
              !order.items[0].isReviewed && (
                <div style={{ marginTop: 16 }}>
                  <Reviews
                    subProductId={order.items[0].subProductId}
                    orderId={order.orderId}
                    isReviewed={order.items[0].isReviewed}
                  />
                </div>
              )}
          </div>
        ) : (
          <>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {order.items.map((item, index) => {
                const isLast = index === order.items.length - 1;
                console.log("item", item);
                return (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      paddingTop: "12px",
                      background: "#fafafa",
                      marginBottom: isLast ? 0 : 8,
                    }}
                  >
                    <Row
                      gutter={[12, 12]}
                      align="top"
                      style={{
                        minHeight: "100px",
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
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
                      <Col style={{ textAlign: "right", marginRight: "10px" }}>
                        <div style={{ marginTop: "12px" }}>
                          <Typography.Text strong>
                            {VND.format(item.totalPrice)}
                          </Typography.Text>
                          <div
                            style={{
                              minHeight: "36px",
                              marginTop: "8px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {order.orderStatus?.toLowerCase() === "completed" &&
                              !item.isReviewed && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() =>
                                    setOpenReviewProductId(
                                      openReviewProductId === item.subProductId
                                        ? null
                                        : item.subProductId
                                    )
                                  }
                                >
                                  {openReviewProductId === item.subProductId
                                    ? "Hide Review"
                                    : "Write Review"}
                                </Button>
                              )}
                            {order.orderStatus?.toLowerCase() === "completed" &&
                              item.isReviewed && (
                                <span
                                  style={{ color: "green", fontSize: "12px" }}
                                >
                                  Bạn đã đánh giá sản phẩm này
                                </span>
                              )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                    {order.orderStatus?.toLowerCase() === "completed" &&
                      openReviewProductId === item.subProductId &&
                      !item.isReviewed && (
                        <div style={{ marginTop: 16 }}>
                          <Reviews
                            subProductId={item.subProductId}
                            orderId={order.orderId}
                            isReviewed={item.isReviewed}
                            onReviewed={async () => {
                              setOpenReviewProductId(null);
                              await onReviewSubmitted?.();
                            }}
                          />
                        </div>
                      )}
                  </div>
                );
              })}
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
