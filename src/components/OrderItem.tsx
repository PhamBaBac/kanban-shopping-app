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
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import { VND } from "@/utils/handleCurrency";
import {
  EyeOutlined,
  DeleteOutlined,
  CloseOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { orderService } from "@/services";
import { useRouter } from "next/router";
import { OrderDetailModal } from "@/modals";
import Reviews from "./Reviews";

interface OrderItemProps {
  order: {
    orderId: string;
    trackingCode?: string;
    items: Array<{
      image: string;
      title: string;
      size?: string;
      color?: string;
      attributes?: Record<string, any>;
      qty: number;
      price: number;
      totalPrice: number;
      orderStatus: string;
      subProductId: string;
      trackingCode?: string;
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

  const getItemAttributes = (item: any): Record<string, string> => {
    let attrs: any = item.attributes;
    if (typeof attrs === "string") {
      try {
        attrs = JSON.parse(attrs);
      } catch (e) {
        attrs = null;
      }
    }
    const res: Record<string, string> = {};
    if (attrs && typeof attrs === "object") {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v !== null && v !== undefined && String(v).trim() !== "") {
          res[k] = String(v);
        }
      });
    }
    if (item.color && !Object.keys(res).some((k) => /màu|color/i.test(k))) {
      res["Màu sắc"] = item.color;
    }
    if (item.size && !Object.keys(res).some((k) => /size|kích/i.test(k))) {
      res["Size"] = item.size;
    }
    return res;
  };
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [openReviewProductId, setOpenReviewProductId] = useState<string | null>(
    null
  );

  const getOrderStatusBadge = (status: string) => {
    const s = (status || "PENDING").toUpperCase();
    switch (s) {
      case "COMPLETED":
        return {
          bg: "#ECFDF5",
          color: "#059669",
          border: "#A7F3D0",
          text: "Đã hoàn thành",
        };
      case "PROCESSING":
        return {
          bg: "#EFF6FF",
          color: "#2563EB",
          border: "#BFDBFE",
          text: "Đang xử lý",
        };
      case "PENDING":
        return {
          bg: "#FFFBEB",
          color: "#D97706",
          border: "#FDE68A",
          text: "Chờ xác nhận",
        };
      case "CANCELLED":
        return {
          bg: "#FEF2F2",
          color: "#DC2626",
          border: "#FECACA",
          text: "Đã hủy",
        };
      case "REFUNDED":
        return {
          bg: "#F3F4F6",
          color: "#4B5563",
          border: "#E5E7EB",
          text: "Đã hoàn tiền",
        };
      default:
        return {
          bg: "#F3F4F6",
          color: "#4B5563",
          border: "#E5E7EB",
          text: s,
        };
    }
  };

  const getOrderStatusDescription = (status: string) => {
    if (!status) return "";
    switch (status.toUpperCase()) {
      case "PENDING":
        return "Đang chờ cửa hàng xác nhận";
      case "PROCESSING":
        return "Đơn hàng đang được chuẩn bị và đóng gói";
      case "COMPLETED":
        return "Đơn hàng đã được giao thành công";
      case "CANCELLED":
        return "Đơn hàng đã bị hủy";
      case "REFUNDED":
        return "Đã hoàn tất thủ tục hoàn tiền";
      default:
        return "";
    }
  };

  const updateOrderStatus = async () => {
    if (cancelLoading) return;
    try {
      setCancelLoading(true);
      await orderService.cancelOrder(order.orderId);
      message.success("Hủy đơn hàng thành công");
      onOrderStatusChanged?.(order.orderId, "CANCELLED");
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể hủy đơn hàng";
      message.error(errMsg);
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
      message.error("Không thể tải chi tiết đơn hàng.");
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
      message.success("Xóa đơn hàng thành công!");
      onOrderDeleted?.(order.orderId);
    } catch (error) {
      message.error("Không thể xóa đơn hàng.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusBadge = getOrderStatusBadge(order.orderStatus);
  const trackingCode = order.trackingCode || order.items?.[0]?.trackingCode;

  return (
    <>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          marginBottom: "16px",
          overflow: "hidden",
          transition: "all 0.2s ease-in-out",
        }}
      >
        {/* Card Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #F3F4F6",
            background: "#FAFAFA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "14px",
                color: "#131118",
                letterSpacing: "-0.01em",
              }}
            >
              Mã đơn: #{order.orderId}
            </span>

            {trackingCode && (
              <Tooltip title="Bấm để xem chi tiết lộ trình vận chuyển GHN">
                <span
                  onClick={handleViewOrderDetails}
                  style={{
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    background: "#FFFFFF",
                    color: "#131118",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <CarOutlined style={{ fontSize: "13px", color: "#131118" }} />
                  <span>GHN: {trackingCode}</span>
                </span>
              </Tooltip>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                background: statusBadge.bg,
                color: statusBadge.color,
                border: `1px solid ${statusBadge.border}`,
              }}
            >
              {statusBadge.text}
            </span>
          </div>
        </div>

        {/* Card Body - Items */}
        <div style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {order.items.map((item, index) => {
              const attrs = getItemAttributes(item);
              const entries = Object.entries(attrs);
              const isItemReviewed = item.isReviewed;
              const isReviewOpen = openReviewProductId === item.subProductId;

              return (
                <div
                  key={item.subProductId || index}
                  style={{
                    background: "#FAFAFA",
                    border: "1px solid #F3F4F6",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <Row gutter={[16, 12]} align="middle">
                    <Col>
                      <Avatar
                        src={item.image}
                        size={72}
                        shape="square"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          objectFit: "cover",
                        }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <Typography.Text
                          strong
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#131118",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 420,
                          }}
                        >
                          {item.title}
                        </Typography.Text>

                        {entries.length > 0 && (
                          <Space wrap size={[4, 4]}>
                            {entries.map(([key, val]) => (
                              <Tag
                                key={key}
                                style={{
                                  margin: 0,
                                  fontSize: "11px",
                                  padding: "1px 8px",
                                  borderRadius: "4px",
                                  background: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                  color: "#4B5563",
                                }}
                              >
                                {key}: <strong>{val}</strong>
                              </Tag>
                            ))}
                          </Space>
                        )}

                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: "12px", color: "#6B7280" }}
                        >
                          Số lượng: <strong style={{ color: "#131118" }}>{item.qty}</strong>
                        </Typography.Text>
                      </Space>
                    </Col>

                    <Col style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontWeight: 700,
                          fontSize: "15px",
                          color: "#131118",
                        }}
                      >
                        {VND.format(item.totalPrice)}
                      </div>

                      {order.orderStatus?.toLowerCase() === "completed" && (
                        <div style={{ marginTop: "8px" }}>
                          {!isItemReviewed ? (
                            <Button
                              size="small"
                              style={{
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 500,
                                background: isReviewOpen ? "#F3F4F6" : "#131118",
                                color: isReviewOpen ? "#131118" : "#FFFFFF",
                                border: isReviewOpen ? "1px solid #E5E7EB" : "none",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onClick={() =>
                                setOpenReviewProductId(
                                  isReviewOpen ? null : item.subProductId
                                )
                              }
                            >
                              {isReviewOpen ? "Đóng đánh giá" : "Viết đánh giá"}
                            </Button>
                          ) : (
                            <span
                              style={{
                                color: "#059669",
                                fontSize: "12px",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              ✓ Đã đánh giá
                            </span>
                          )}
                        </div>
                      )}
                    </Col>
                  </Row>

                  {order.orderStatus?.toLowerCase() === "completed" &&
                    isReviewOpen &&
                    !isItemReviewed && (
                      <div
                        style={{
                          marginTop: "14px",
                          paddingTop: "14px",
                          borderTop: "1px dashed #E5E7EB",
                        }}
                      >
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
          </div>

          {/* Card Footer: Summary & Actions */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid #F3F4F6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                {getOrderStatusDescription(order.orderStatus)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "13px", color: "#4B5563" }}>
                  Tổng thanh toán:
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#131118",
                  }}
                >
                  {VND.format(order.totalAmount)}
                </span>
              </div>

              <Space size="small">
                <Button
                  type="default"
                  size="middle"
                  icon={<EyeOutlined />}
                  onClick={handleViewOrderDetails}
                  loading={loading}
                  style={{
                    borderRadius: "8px",
                    fontWeight: 500,
                    border: "1px solid #E5E7EB",
                    color: "#131118",
                    cursor: "pointer",
                  }}
                >
                  Chi tiết
                </Button>

                {order.orderStatus?.toLowerCase() === "pending" && (
                  <Popconfirm
                    title="Hủy đơn hàng"
                    description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
                    onConfirm={() => updateOrderStatus()}
                    okText="Hủy đơn"
                    cancelText="Đóng"
                    okButtonProps={{ danger: true, loading: cancelLoading }}
                  >
                    <Button
                      type="default"
                      danger
                      size="middle"
                      icon={<CloseOutlined />}
                      loading={cancelLoading}
                      style={{
                        borderRadius: "8px",
                        fontWeight: 500,
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#DC2626",
                        cursor: "pointer",
                      }}
                    >
                      Hủy đơn
                    </Button>
                  </Popconfirm>
                )}

                {(order.orderStatus?.toLowerCase() === "cancelled" ||
                  order.orderStatus?.toLowerCase() === "refunded" ||
                  order.orderStatus?.toLowerCase() === "completed") && (
                  <Popconfirm
                    title="Xóa đơn hàng"
                    description="Xóa đơn hàng này khỏi lịch sử mua sắm của bạn?"
                    onConfirm={() => handleDeleteOrder()}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      type="text"
                      danger
                      size="middle"
                      icon={<DeleteOutlined />}
                      loading={deleteLoading}
                      style={{
                        borderRadius: "8px",
                        fontWeight: 500,
                        color: "#9CA3AF",
                        cursor: "pointer",
                      }}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </div>
        </div>
      </div>

      <OrderDetailModal
        visible={orderDetailVisible}
        onClose={handleCloseOrderDetail}
        orderDetail={orderDetail}
      />
    </>
  );
};

export default OrderItem;
