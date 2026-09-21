/** @format */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Row,
  Col,
  Avatar,
  Space,
  Tag,
  Descriptions,
  Timeline,
  Spin,
  Steps,
  Button,
} from "antd";
import { VND } from "@/utils/handleCurrency";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CarOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { orderService } from "@/services";

const { Title, Text } = Typography;

interface OrderDetailModalProps {
  visible: boolean;
  onClose: () => void;
  orderDetail: {
    id: string;
    userName: string;
    nameRecipient: string;
    address: string;
    phoneNumber: string;
    email: string;
    paymentType: string;
    orderStatus: string;
    cancelReason?: string;
    trackingCode?: string;
    shippingStatus?: string;
    orderResponses: Array<{
      orderId: string;
      image: string;
      title: string;
      size?: string;
      color?: string;
      attributes?: Record<string, any>;
      qty: number;
      price: number;
      totalPrice: number;
      orderStatus: string;
    }>;
    createdAt: string;
  } | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  onClose,
  orderDetail,
}) => {
  const [shippingTracking, setShippingTracking] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(orderDetail);

  const activeOrder = currentOrder || orderDetail;

  const fetchTrackingAndOrder = async () => {
    if (!orderDetail) return;
    setTrackingLoading(true);
    try {
      const promises: Promise<any>[] = [];
      if (orderDetail.trackingCode) {
        promises.push(
          orderService
            .getTrackingByCode(orderDetail.trackingCode)
            .then((data) => setShippingTracking(data))
            .catch((err) => {
              console.error("Failed to fetch tracking data:", err);
              setShippingTracking(null);
            })
        );
      }
      if (orderDetail.id) {
        promises.push(
          orderService
            .getOrderDetail(orderDetail.id)
            .then((res) => {
              if (res) setCurrentOrder(res);
            })
            .catch((err) => console.error("Failed to refresh order:", err))
        );
      }
      await Promise.allSettled(promises);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    setCurrentOrder(orderDetail);
    if (visible && orderDetail) {
      fetchTrackingAndOrder();
    } else {
      setShippingTracking(null);
    }
  }, [visible, orderDetail?.id, orderDetail?.trackingCode]);

  const getShippingStatusRank = (status?: string): number => {
    const s = (status || "").toLowerCase();
    if (["ready_to_pick", "picking", "money_collect_picking"].includes(s)) return 0;
    if (["picked", "storing", "transporting", "sorting"].includes(s)) return 1;
    if (["delivering", "money_collect_delivering"].includes(s)) return 2;
    if (["delivered"].includes(s)) return 3;
    if (["cancel", "return", "return_transporting", "return_sorting", "returning", "return_fail", "returned", "delivery_fail", "damage", "lost"].includes(s)) return 99;
    return -1;
  };

  const mapShippingStatusToTitle = (status?: string): string => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "ready_to_pick": return "Mới tạo đơn - Chờ lấy hàng";
      case "picking": return "Shipper đang đi lấy hàng";
      case "picked": return "Đã lấy hàng thành công";
      case "storing": return "Hàng đã nhập kho GHN";
      case "transporting": return "Đang luân chuyển hàng giữa các kho";
      case "sorting": return "Đang phân loại hàng hóa";
      case "delivering": return "Shipper đang trên đường giao hàng";
      case "money_collect_delivering": return "Shipper đang thu tiền khi giao";
      case "delivered": return "Giao hàng thành công";
      case "cancel": return "Đơn hàng đã hủy";
      default: return status || "Mới tạo đơn - Chờ lấy hàng";
    }
  };
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

  const getPaymentTypeText = (paymentType: string) => {
    switch (paymentType?.toUpperCase()) {
      case "COD":
        return "Thanh toán khi nhận hàng (COD)";
      case "CREDIT_CARD":
        return "Thẻ tín dụng / Ghi nợ";
      case "BANK_TRANSFER":
        return "Chuyển khoản ngân hàng";
      default:
        return paymentType;
    }
  };

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

  const calculateTotalAmount = () => {
    if (!orderDetail?.orderResponses) return 0;
    return orderDetail.orderResponses.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
  };

  const statusBadge = orderDetail ? getOrderStatusBadge(orderDetail.orderStatus) : null;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "17px",
              fontWeight: 700,
              color: "#131118",
            }}
          >
            Chi tiết đơn hàng
          </span>
          {orderDetail && (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: 600,
                color: "#6B7280",
                background: "#F3F4F6",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              #{orderDetail.id}
            </span>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          onClick={onClose}
          style={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Đóng
        </Button>,
      ]}
      width={820}
      centered
    >
      {orderDetail && statusBadge && (
        <div style={{ padding: "10px 0" }}>
          {/* Order Header Status Banner */}
          <div
            style={{
              background: "#FAFAFA",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
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
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                Ngày đặt: <strong style={{ color: "#131118" }}>{orderDetail.createdAt}</strong>
              </span>
            </div>

            <div style={{ fontSize: "13px", color: "#4B5563" }}>
              Phương thức: <strong style={{ color: "#131118" }}>{getPaymentTypeText(orderDetail.paymentType)}</strong>
            </div>
          </div>

          {/* Customer & Shipping Addresses */}
          <div style={{ marginBottom: "20px" }}>
            <Title
              level={5}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#131118",
                marginBottom: "12px",
              }}
            >
              Thông tin nhận hàng
            </Title>
            <div
              style={{
                background: "#FAFAFA",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="Người nhận">
                  <Space>
                    <UserOutlined style={{ color: "#131118" }} />
                    <strong style={{ color: "#131118" }}>{orderDetail.nameRecipient || orderDetail.userName}</strong>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <Space>
                    <PhoneOutlined style={{ color: "#131118" }} />
                    <span style={{ color: "#131118" }}>{orderDetail.phoneNumber}</span>
                  </Space>
                </Descriptions.Item>
                {orderDetail.email && (
                  <Descriptions.Item label="Email">
                    <Space>
                      <MailOutlined style={{ color: "#131118" }} />
                      <span style={{ color: "#4B5563" }}>{orderDetail.email}</span>
                    </Space>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Địa chỉ giao" span={2}>
                  <Space align="start">
                    <EnvironmentOutlined style={{ color: "#131118", marginTop: "3px" }} />
                    <span style={{ color: "#131118", fontWeight: 500 }}>
                      {orderDetail.address}
                    </span>
                  </Space>
                </Descriptions.Item>
                {orderDetail.orderStatus?.toUpperCase() === "CANCELLED" &&
                  orderDetail.cancelReason && (
                    <Descriptions.Item
                      label="Lý do hủy đơn"
                      span={2}
                      labelStyle={{ color: "#DC2626" }}
                    >
                      <Text type="danger" strong>
                        {orderDetail.cancelReason}
                      </Text>
                    </Descriptions.Item>
                  )}
              </Descriptions>
            </div>
          </div>

          {/* Shipping / GHN Tracking Information */}
          {orderDetail.trackingCode ? (
            <div
              style={{
                marginBottom: "20px",
                padding: "18px",
                borderRadius: "12px",
                background: "#FAFAFA",
                border: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <Space align="center" size="middle">
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "#131118",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                    }}
                  >
                    <CarOutlined style={{ fontSize: "18px" }} />
                  </div>
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#131118",
                        display: "block",
                      }}
                    >
                      Giao Hàng Nhanh (GHN)
                    </span>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      Theo dõi lộ trình giao hàng trực tiếp
                    </span>
                  </div>
                </Space>

                <Space size="small">
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      color: "#131118",
                    }}
                  >
                    Vận đơn: <strong>{orderDetail.trackingCode}</strong>
                  </span>
                  <Button
                    size="small"
                    type="default"
                    icon={<ExportOutlined />}
                    href={`https://tracking.ghn.dev/?order_code=${orderDetail.trackingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: "1px solid #E5E7EB",
                      color: "#131118",
                      cursor: "pointer",
                    }}
                  >
                    Tra cứu GHN
                  </Button>
                </Space>
              </div>

              {/* Progress Steps */}
              {(() => {
                const trkStatus = shippingTracking?.status;
                const dbStatus = activeOrder?.shippingStatus;

                const effectiveStatus = (
                  getShippingStatusRank(dbStatus) > getShippingStatusRank(trkStatus)
                    ? dbStatus
                    : (trkStatus || dbStatus || "ready_to_pick")
                ).toLowerCase();

                let currentStep = 0;
                let isFailed = false;

                if (["ready_to_pick", "picking", "money_collect_picking"].includes(effectiveStatus)) {
                  currentStep = 0;
                } else if (["picked", "storing", "transporting", "sorting"].includes(effectiveStatus)) {
                  currentStep = 1;
                } else if (["delivering", "money_collect_delivering"].includes(effectiveStatus)) {
                  currentStep = 2;
                } else if (["delivered"].includes(effectiveStatus)) {
                  currentStep = 3;
                } else if (["cancel", "return", "return_transporting", "return_sorting", "returning", "return_fail", "returned", "delivery_fail", "damage", "lost"].includes(effectiveStatus)) {
                  currentStep = 1;
                  isFailed = true;
                }

                return (
                  <div
                    style={{
                      background: "#FFFFFF",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <Steps
                      size="small"
                      current={currentStep}
                      status={isFailed ? "error" : undefined}
                      items={[
                        { title: "Chờ lấy hàng", description: "Shop đóng gói" },
                        { title: "Đang luân chuyển", description: "Đã nhập kho GHN" },
                        { title: "Đang giao", description: "Shipper đang giao" },
                        { title: "Thành công", description: "Đã giao hàng" },
                      ]}
                    />
                  </div>
                );
              })()}

              <div
                style={{
                  background: "#FFFFFF",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", color: "#6B7280", marginRight: "8px" }}>
                    Trạng thái hiện tại:
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "#F3F4F6",
                      color: "#131118",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    {(() => {
                      const trkStatus = shippingTracking?.status;
                      const dbStatus = activeOrder?.shippingStatus;
                      return getShippingStatusRank(dbStatus) > getShippingStatusRank(trkStatus)
                        ? mapShippingStatusToTitle(dbStatus)
                        : (shippingTracking?.statusName || mapShippingStatusToTitle(dbStatus || "ready_to_pick"));
                    })()}
                  </span>
                </div>

                {shippingTracking?.expectedDeliveryTime && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ClockCircleOutlined style={{ color: "#131118" }} />
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>Dự kiến giao:</span>
                    <strong style={{ fontSize: "12px", color: "#131118" }}>
                      {new Date(shippingTracking.expectedDeliveryTime).toLocaleString("vi-VN")}
                    </strong>
                  </div>
                )}
              </div>

              {trackingLoading ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Spin tip="Đang đồng bộ lộ trình GHN..." size="small" />
                </div>
              ) : (
                <div
                  style={{
                    background: "#FFFFFF",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "#131118",
                      }}
                    >
                      Lịch sử lộ trình
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<SyncOutlined spin={trackingLoading} />}
                      onClick={fetchTrackingAndOrder}
                      style={{ color: "#4B5563", fontSize: "12px", cursor: "pointer" }}
                    >
                      Làm mới
                    </Button>
                  </div>
                  <Timeline
                    items={(() => {
                      const trkStatus = shippingTracking?.status;
                      const dbStatus = activeOrder?.shippingStatus;
                      const effectiveStatus = (
                        getShippingStatusRank(dbStatus) > getShippingStatusRank(trkStatus)
                          ? dbStatus
                          : (trkStatus || dbStatus || "ready_to_pick")
                      ).toLowerCase();
                      const effectiveStatusName =
                        getShippingStatusRank(dbStatus) > getShippingStatusRank(trkStatus)
                          ? mapShippingStatusToTitle(dbStatus)
                          : (shippingTracking?.statusName || mapShippingStatusToTitle(effectiveStatus));

                      const rawLogs = shippingTracking?.logs || [];
                      const logsToRender = [...rawLogs];
                      if (getShippingStatusRank(effectiveStatus) > 0) {
                        const hasCurrent = logsToRender.some(
                          (l: any) => (l.status || "").toLowerCase() === effectiveStatus
                        );
                        if (!hasCurrent) {
                          logsToRender.unshift({
                            status: effectiveStatus,
                            statusName: effectiveStatusName,
                            location: "Hệ thống GHN đang cập nhật lộ trình giao hàng",
                            updatedDate: new Date().toISOString(),
                          });
                        }
                      }

                      if (logsToRender.length === 0) {
                        return [
                          {
                            color: "#131118",
                            children: (
                              <div>
                                <Text strong style={{ color: "#131118" }}>
                                  {effectiveStatusName}
                                </Text>
                                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                                  {effectiveStatus === "delivering"
                                    ? "Shipper đang trên đường giao hàng đến địa chỉ nhận."
                                    : "Đơn hàng đã được tạo thành công trên hệ thống Giao Hàng Nhanh (GHN). Shipper sẽ sớm đến lấy hàng."}
                                </div>
                                {activeOrder?.createdAt && (
                                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                                    {activeOrder.createdAt}
                                  </div>
                                )}
                              </div>
                            ),
                          },
                        ];
                      }

                      return logsToRender.map((log: any, idx: number) => {
                        const isLatest = idx === 0;
                        return {
                          color: isLatest ? "#131118" : "#9CA3AF",
                          children: (
                            <div>
                              <Text strong={isLatest} style={{ color: isLatest ? "#131118" : "#4B5563" }}>
                                {log.statusName || mapShippingStatusToTitle(log.status)}
                              </Text>
                              {log.location && (
                                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                                  {log.location}
                                </div>
                              )}
                              {(log.updatedDate || log.action_at) && (
                                <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                                  {new Date(log.updatedDate || log.action_at).toLocaleString("vi-VN")}
                                </div>
                              )}
                            </div>
                          ),
                        };
                      });
                    })()}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                borderRadius: "10px",
                background: "#FAFAFA",
                border: "1px dashed #D1D5DB",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <CarOutlined style={{ fontSize: "22px", color: "#9CA3AF" }} />
              <div>
                <Text strong style={{ color: "#374151", display: "block" }}>
                  Thông tin vận chuyển
                </Text>
                <Text type="secondary" style={{ fontSize: "13px", color: "#6B7280" }}>
                  Đơn hàng đang chờ cửa hàng chuẩn bị và bàn giao cho đơn vị vận chuyển Giao Hàng Nhanh (GHN).
                </Text>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div style={{ marginBottom: "20px" }}>
            <Title
              level={5}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#131118",
                marginBottom: "12px",
              }}
            >
              Danh sách sản phẩm ({orderDetail.orderResponses.length})
            </Title>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {orderDetail.orderResponses.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "14px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    background: "#FAFAFA",
                  }}
                >
                  <Row gutter={[16, 12]} align="middle">
                    <Col>
                      <Avatar
                        src={item.image}
                        size={68}
                        shape="square"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          objectFit: "cover",
                        }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Space direction="vertical" size={2} style={{ width: "100%" }}>
                        <Text
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
                        </Text>

                        {/* Attributes */}
                        {(() => {
                          const attrs = getItemAttributes(item);
                          const entries = Object.entries(attrs);
                          if (entries.length === 0) return null;

                          return (
                            <Space wrap size={[4, 4]}>
                              {entries.map(([key, val]) => {
                                const isColorKey = /màu|color/i.test(key);
                                const isHexOrRgb =
                                  isColorKey &&
                                  (val.startsWith("#") || val.startsWith("rgb"));
                                return (
                                  <Tag
                                    key={key}
                                    style={{
                                      margin: 0,
                                      padding: "1px 8px",
                                      borderRadius: "4px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      fontSize: "11px",
                                      background: "#FFFFFF",
                                      border: "1px solid #E5E7EB",
                                    }}
                                  >
                                    {isHexOrRgb && (
                                      <span
                                        style={{
                                          width: 9,
                                          height: 9,
                                          borderRadius: "50%",
                                          backgroundColor: val,
                                          display: "inline-block",
                                          border: "1px solid rgba(0,0,0,0.15)",
                                        }}
                                      />
                                    )}
                                    <span style={{ color: "#6B7280" }}>{key}:</span>
                                    <span style={{ fontWeight: 600, color: "#131118" }}>
                                      {val}
                                    </span>
                                  </Tag>
                                );
                              })}
                            </Space>
                          );
                        })()}

                        <Text type="secondary" style={{ fontSize: "12px", color: "#6B7280" }}>
                          Số lượng: <strong style={{ color: "#131118" }}>{item.qty}</strong>
                          {"  "}·{"  "}
                          Đơn giá: {VND.format(item.price)}
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Text
                        strong
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#131118",
                        }}
                      >
                        {VND.format(item.totalPrice)}
                      </Text>
                    </Col>
                  </Row>
                </div>
              ))}
            </Space>
          </div>

          {/* Order Summary */}
          <div
            style={{
              background: "#FAFAFA",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontSize: "14px", color: "#4B5563" }}>
                Tổng thanh toán:
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#131118",
                }}
              >
                {VND.format(calculateTotalAmount())}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
