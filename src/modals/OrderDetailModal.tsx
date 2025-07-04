/** @format */

import React from "react";
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
} from "antd";
import { VND } from "@/utils/handleCurrency";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

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
    orderResponses: Array<{
      orderId: string;
      image: string;
      title: string;
      size: string;
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
                size="large"
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
            </Descriptions>
          </div>

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
                      <Space direction="vertical" size="small">
                        <Text
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
                        </Text>
                        <Text type="secondary">
                          Size: {item.size} | Quantity: {item.qty}
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
