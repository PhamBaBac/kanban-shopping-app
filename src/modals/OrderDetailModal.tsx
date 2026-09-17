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
  Divider,
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
  CalendarOutlined,
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

  const getPaymentTypeText = (paymentType: string) => {
    switch (paymentType?.toUpperCase()) {
      case "COD":
        return "Cash on Delivery";
      case "CREDIT_CARD":
        return "Credit Card";
      case "BANK_TRANSFER":
        return "Bank Transfer";
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
    // Bổ sung color nếu chưa có
    if (item.color && !Object.keys(res).some((k) => /màu|color/i.test(k))) {
      res["Màu sắc"] = item.color;
    }
    // Bổ sung size nếu chưa có
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

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Order Details
        </Title>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      {orderDetail && (
        <div style={{ padding: "16px 0" }}>
          {/* Order Header */}
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: "24px" }}
          >
            <Col>
              <Text strong>Order ID: </Text>
              <Text code>{orderDetail.id}</Text>
            </Col>
            <Col>
              <Tag
                color={getOrderStatusColor(orderDetail.orderStatus)}
                style={{ fontSize: "14px", padding: "4px 12px" }}
              >
                {getOrderStatusText(orderDetail.orderStatus)}
              </Tag>
            </Col>
          </Row>

          {/* Customer Information */}
          <div style={{ marginBottom: "24px" }}>
            <Title level={5} style={{ marginBottom: "16px" }}>
              Customer Information
            </Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Customer Name">
                <Space>
                  <UserOutlined />
                  {orderDetail.userName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Recipient Name">
                <Space>
                  <UserOutlined />
                  {orderDetail.nameRecipient}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone Number">
                <Space>
                  <PhoneOutlined />
                  {orderDetail.phoneNumber}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {orderDetail.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Address">
                <Space>
                  <EnvironmentOutlined />
                  {orderDetail.address}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Order Information */}
          <div style={{ marginBottom: "24px" }}>
            <Title level={5} style={{ marginBottom: "16px" }}>
              Order Information
            </Title>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Order Date">
                <Space>
                  <CalendarOutlined />
                  {orderDetail.createdAt}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {getPaymentTypeText(orderDetail.paymentType)}
              </Descriptions.Item>
              {orderDetail.orderStatus?.toUpperCase() === "CANCELLED" &&
                orderDetail.cancelReason && (
                  <Descriptions.Item
                    label="Lý do hủy đơn"
                    span={2}
                    labelStyle={{ color: "#ff4d4f" }}
                  >
                    <Text type="danger">{orderDetail.cancelReason}</Text>
                  </Descriptions.Item>
                )}
            </Descriptions>
          </div>

          {/* Shipping / GHN Tracking Information */}
          {orderDetail.trackingCode ? (
            <div
              style={{
                marginBottom: "24px",
                padding: "20px",
                borderRadius: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Space align="center">
                  <CarOutlined style={{ fontSize: "22px", color: "#16a34a" }} />
                  <div>
                    <Title level={5} style={{ margin: 0, color: "#15803d" }}>
                      Vận chuyển Giao Hàng Nhanh (GHN)
                    </Title>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Theo dõi lộ trình giao hàng trực tiếp
                    </Text>
                  </div>
                </Space>
                <Space>
                  <Tag color="green" style={{ fontSize: "13px", padding: "2px 8px" }}>
                    Mã vận đơn: <strong>{orderDetail.trackingCode}</strong>
                  </Tag>
                  <Button
                    size="small"
                    type="link"
                    icon={<ExportOutlined />}
                    href={`https://tracking.ghn.dev/?order_code=${orderDetail.trackingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: 0, fontSize: "13px" }}
                  >
                    Xem trên GHN
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

                const effectiveStatusName =
                  getShippingStatusRank(dbStatus) > getShippingStatusRank(trkStatus)
                    ? mapShippingStatusToTitle(dbStatus)
                    : (shippingTracking?.statusName || mapShippingStatusToTitle(effectiveStatus));

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
                  <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
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

              <Descriptions column={2} size="small" style={{ marginBottom: "16px" }}>
                <Descriptions.Item label="Trạng thái vận chuyển">
                  <Tag color="processing" style={{ fontSize: "13px" }}>
                    {(() => {
                      const trkStatus = shippingTracking?.status;
                      const dbStatus = activeOrder?.shippingStatus;
                      return getShippingStatusRank(dbStatus) > getShippingStatusRank(trkStatus)
                        ? mapShippingStatusToTitle(dbStatus)
                        : (shippingTracking?.statusName || mapShippingStatusToTitle(dbStatus || "ready_to_pick"));
                    })()}
                  </Tag>
                </Descriptions.Item>
                {shippingTracking?.expectedDeliveryTime && (
                  <Descriptions.Item label="Dự kiến giao">
                    <Space>
                      <ClockCircleOutlined style={{ color: "#16a34a" }} />
                      <Text strong>
                        {new Date(shippingTracking.expectedDeliveryTime).toLocaleString(
                          "vi-VN"
                        )}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {trackingLoading ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <Spin tip="Đang đồng bộ lộ trình GHN..." size="small" />
                </div>
              ) : (
                <div
                  style={{
                    background: "#fff",
                    padding: "16px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <Text strong style={{ fontSize: "13px" }}>
                      Lộ trình di chuyển:
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<SyncOutlined spin={trackingLoading} />}
                      onClick={fetchTrackingAndOrder}
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
                            color: "green",
                            children: (
                              <div>
                                <Text strong style={{ color: "#16a34a" }}>
                                  {effectiveStatusName}
                                </Text>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  {effectiveStatus === "delivering"
                                    ? "Shipper đang trên đường giao hàng đến địa chỉ nhận."
                                    : "Đơn hàng đã được tạo thành công trên hệ thống Giao Hàng Nhanh (GHN). Shipper sẽ sớm đến lấy hàng."}
                                </div>
                                {activeOrder?.createdAt && (
                                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
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
                          color: isLatest ? "green" : "blue",
                          children: (
                            <div>
                              <Text strong={isLatest} style={{ color: isLatest ? "#16a34a" : undefined }}>
                                {log.statusName || mapShippingStatusToTitle(log.status)}
                              </Text>
                              {log.location && (
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                  {log.location}
                                </div>
                              )}
                              {(log.updatedDate || log.action_at) && (
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
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
                marginBottom: "24px",
                padding: "16px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <CarOutlined style={{ fontSize: "24px", color: "#94a3b8" }} />
              <div>
                <Text strong style={{ color: "#475569", display: "block" }}>
                  Thông tin vận chuyển
                </Text>
                <Text type="secondary" style={{ fontSize: "13px" }}>
                  Đơn hàng đang chờ shop chuẩn bị và bàn giao cho đơn vị vận chuyển Giao Hàng Nhanh (GHN).
                </Text>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div style={{ marginBottom: "24px" }}>
            <Title level={5} style={{ marginBottom: "16px" }}>
              Order Items ({orderDetail.orderResponses.length})
            </Title>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {orderDetail.orderResponses.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "16px",
                    border: "1px solid #f0f0f0",
                    borderRadius: "8px",
                    background: "#fafafa",
                  }}
                >
                  <Row gutter={[16, 16]} align="middle">
                    <Col>
                      <Avatar src={item.image} size={80} shape="square" />
                    </Col>
                    <Col flex="auto">
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        <Text
                          strong
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 420,
                          }}
                        >
                          {item.title}
                        </Text>

                        {/* Thuộc tính linh hoạt từ subProduct */}
                        {(() => {
                          const attrs = getItemAttributes(item);
                          const entries = Object.entries(attrs);
                          if (entries.length === 0) return null;

                          return (
                            <Space wrap size={[6, 6]}>
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
                                      fontSize: "12px",
                                      background: "#f8fafc",
                                      border: "1px solid #e2e8f0",
                                    }}
                                  >
                                    {isHexOrRgb && (
                                      <span
                                        style={{
                                          width: 10,
                                          height: 10,
                                          borderRadius: "50%",
                                          backgroundColor: val,
                                          display: "inline-block",
                                          border: "1px solid rgba(0,0,0,0.15)",
                                        }}
                                      />
                                    )}
                                    <span style={{ color: "#64748b" }}>{key}:</span>
                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>
                                      {val}
                                    </span>
                                  </Tag>
                                );
                              })}
                            </Space>
                          );
                        })()}

                        <Text type="secondary">
                          Quantity: <Text strong>{item.qty}</Text>
                        </Text>
                        <Text type="secondary">
                          Unit Price: {VND.format(item.price)}
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Text strong style={{ fontSize: "16px" }}>
                        {VND.format(item.totalPrice)}
                      </Text>
                    </Col>
                  </Row>
                </div>
              ))}
            </Space>
          </div>

          {/* Order Summary */}
          <Divider />
          <Row justify="end">
            <Col>
              <Space direction="vertical" align="end">
                <Text strong style={{ fontSize: "18px" }}>
                  Total Amount: {VND.format(calculateTotalAmount())}
                </Text>
              </Space>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
