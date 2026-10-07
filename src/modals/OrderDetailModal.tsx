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
  Button,
  message,
} from "antd";
import { VND } from "@/utils/handleCurrency";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  CopyOutlined,
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
    carrier?: string;
    shippingStatus?: string;
    shippingFee?: number;
    subtotal?: number;
    total?: number;
    discountAmount?: number;
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
  const [currentOrder, setCurrentOrder] = useState<any>(orderDetail);

  const activeOrder = currentOrder || orderDetail;

  const fetchOrder = async () => {
    if (!orderDetail?.id) return;
    try {
      const res = await orderService.getOrderDetail(orderDetail.id);
      if (res) setCurrentOrder(res);
    } catch (err) {
      console.error("Failed to refresh order:", err);
    }
  };

  useEffect(() => {
    setCurrentOrder(orderDetail);
    if (visible && orderDetail?.id) {
      fetchOrder();
    }
  }, [visible, orderDetail?.id]);
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

  const isSystemOrPriceAttribute = (key: string): boolean => {
    const k = key.trim().toLowerCase().replace(/[-_]/g, "");
    return (
      k === "discounttype" ||
      k === "discountvalue" ||
      k === "discountamount" ||
      k === "discount" ||
      k === "price" ||
      k === "cost" ||
      k === "stock" ||
      k === "qty" ||
      k === "reservedstock"
    );
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
      if (Array.isArray(attrs)) {
        attrs.forEach((it: any) => {
          const k = it?.name || it?.key || it?.label;
          const v = it?.value;
          if (
            k &&
            !isSystemOrPriceAttribute(String(k)) &&
            v !== null &&
            v !== undefined &&
            String(v).trim() !== ""
          ) {
            res[String(k)] = String(v);
          }
        });
      } else {
        Object.entries(attrs).forEach(([k, v]) => {
          if (
            !isSystemOrPriceAttribute(k) &&
            v !== null &&
            v !== undefined &&
            String(v).trim() !== ""
          ) {
            res[k] = String(v);
          }
        });
      }
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
      style={{
        maxWidth: "calc(100vw - 32px)",
      }}
      styles={{
        body: {
          maxHeight: "calc(85vh - 130px)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 8,
        },
      }}
      bodyStyle={{
        maxHeight: "calc(85vh - 130px)",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: 8,
      }}
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
                  <Descriptions.Item label="Email" span={2}>
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

              {orderDetail.trackingCode && (() => {
                const code = orderDetail.trackingCode?.trim() || "";
                const rawCarrier = (orderDetail.carrier || "").toUpperCase();
                let carrierType = rawCarrier;
                if (!carrierType) {
                  if (code.startsWith("SHOP-")) carrierType = "SHOP_DELIVERY";
                  else if (code.startsWith("VIETTEL_POST-") || code.startsWith("VT")) carrierType = "VIETTEL_POST";
                  else if (code.startsWith("GHTK-")) carrierType = "GHTK";
                  else if (code.startsWith("J_AND_T-")) carrierType = "J_AND_T";
                  else if (code.startsWith("VNPOST-")) carrierType = "VNPOST";
                  else carrierType = "GHN";
                }

                let carrierName = "Đối tác vận chuyển";
                let tagColor = "default";
                let trackingUrl: string | null = null;

                if (carrierType === "SHOP_DELIVERY") {
                  carrierName = "Cửa hàng tự giao";
                  tagColor = "green";
                } else if (carrierType === "VIETTEL_POST") {
                  carrierName = "Viettel Post";
                  tagColor = "red";
                  trackingUrl = `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code=${code}`;
                } else if (carrierType === "GHTK") {
                  carrierName = "GHTK";
                  tagColor = "cyan";
                  trackingUrl = `https://giaohangtietkiem.vn/tra-cuu-don-hang/?order_code=${code}`;
                } else if (carrierType === "GHN") {
                  carrierName = "Giao Hàng Nhanh (GHN)";
                  tagColor = "blue";
                  trackingUrl = `https://tracking.ghn.dev/?order_code=${code}`;
                } else {
                  carrierName = orderDetail.carrier || "Đơn vị vận chuyển";
                }

                return (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px dashed #E5E7EB",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <Tag
                        color={tagColor}
                        style={{
                          fontWeight: 600,
                          fontSize: "12px",
                          padding: "2px 8px",
                          margin: 0,
                          borderRadius: "4px",
                        }}
                      >
                        {carrierName}
                      </Tag>
                      <span style={{ fontSize: "13px", color: "#6B7280" }}>
                        Mã vận đơn:
                      </span>
                      <Tag
                        color="orange"
                        style={{
                          fontWeight: 600,
                          fontSize: "12px",
                          padding: "2px 8px",
                          margin: 0,
                        }}
                      >
                        {code}
                      </Tag>
                    </div>

                    {trackingUrl ? (
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<ExportOutlined />}
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          borderRadius: "6px",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Tra cứu trên {carrierName}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          message.success("Đã sao chép mã vận đơn!");
                        }}
                        style={{
                          borderRadius: "6px",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Sao chép mã
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

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
          {(() => {
            const itemsSubtotal = calculateTotalAmount();
            const shipFee =
              activeOrder?.shippingFee !== undefined && activeOrder?.shippingFee !== null
                ? activeOrder.shippingFee
                : itemsSubtotal >= 400000
                  ? 0
                  : 20000;
            const finalTotal =
              activeOrder?.total !== undefined && activeOrder?.total !== null
                ? activeOrder.total
                : Math.max(0, itemsSubtotal - (activeOrder?.discountAmount || 0)) + shipFee;

            return (
              <div
                style={{
                  background: "#FAFAFA",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Tiền hàng:</span>
                  <span style={{ fontWeight: 600, color: "#131118" }}>
                    {VND.format(activeOrder?.subtotal || itemsSubtotal)}
                  </span>
                </div>

                {activeOrder?.discountAmount && activeOrder.discountAmount > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px" }}>
                    <span style={{ color: "#6B7280" }}>Giảm giá:</span>
                    <span style={{ fontWeight: 600, color: "#059669" }}>
                      -{VND.format(activeOrder.discountAmount)}
                    </span>
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Phí vận chuyển:</span>
                  {shipFee === 0 ? (
                    <span style={{ color: "#059669", fontWeight: 600 }}>Miễn phí</span>
                  ) : (
                    <span style={{ fontWeight: 600, color: "#131118" }}>{VND.format(shipFee)}</span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "260px",
                    borderTop: "1px solid #E5E7EB",
                    paddingTop: "8px",
                    marginTop: "2px",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#131118" }}>
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
                    {VND.format(finalTotal)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
