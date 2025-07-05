import React from "react";
import { Row, Col, Typography, Space, Input, Button, Divider } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

const { Text, Title } = Typography;

const paymentIcons = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg",
    alt: "Visa",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    alt: "Paypal",
  },
];

const FooterComponent: React.FC = () => {
  return (
    <footer
      style={{
        background: "#18161C",
        color: "#fff",
        padding: "40px 0 0 0",
        fontSize: 15,
      }}
    >
      <div className="container">
        <Row gutter={[32, 32]} justify="space-between">
          {/* Logo & Contact */}
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 24 }}>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 28 }}>K</span>rist
              </Title>
            </div>
            <Space direction="vertical" size={8} style={{ color: "#fff" }}>
              <span>
                <PhoneOutlined /> (704) 555-0127
              </span>
              <span>
                <MailOutlined /> krist@example.com
              </span>
              <span>
                <EnvironmentOutlined /> 3891 Ranchview Dr. Richardson,
                California 62639
              </span>
            </Space>
          </Col>

          {/* Information */}
          <Col xs={12} md={4}>
            <Title level={5} style={{ color: "#fff" }}>
              Information
            </Title>
            <Space direction="vertical" size={8}>
              <a href="#" style={{ color: "#fff" }}>
                My Account
              </a>
              <a href="#" style={{ color: "#fff" }}>
                Login
              </a>
              <a href="#" style={{ color: "#fff" }}>
                My Cart
              </a>
              <a href="#" style={{ color: "#fff" }}>
                My Wishlist
              </a>
              <a href="#" style={{ color: "#fff" }}>
                Checkout
              </a>
            </Space>
          </Col>

          {/* Service */}
          <Col xs={12} md={4}>
            <Title level={5} style={{ color: "#fff" }}>
              Service
            </Title>
            <Space direction="vertical" size={8}>
              <a href="#" style={{ color: "#fff" }}>
                About Us
              </a>
              <a href="#" style={{ color: "#fff" }}>
                Careers
              </a>
              <a href="#" style={{ color: "#fff" }}>
                Delivery Information
              </a>
              <a href="#" style={{ color: "#fff" }}>
                Privacy Policy
              </a>
              <a href="#" style={{ color: "#fff" }}>
                Terms & Conditions
              </a>
            </Space>
          </Col>

          {/* Subscribe */}
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: "#fff" }}>
              Subscribe
            </Title>
            <Text style={{ color: "#fff" }}>
              Enter your email below to be the first to know about new
              collections and product launches.
            </Text>
            <form style={{ marginTop: 16, display: "flex", maxWidth: 340 }}>
              <Input
                size="large"
                placeholder="Your Email"
                prefix={<MailOutlined />}
                style={{ borderRadius: "24px 0 0 24px" }}
              />
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                style={{
                  borderRadius: "0 24px 24px 0",
                  background: "#fff",
                  color: "#18161C",
                  border: 0,
                }}
                icon={<ArrowRightOutlined />}
              />
            </form>
          </Col>
        </Row>

        <Divider style={{ background: "#2D2B34", margin: "32px 0 16px 0" }} />

        <Row
          align="middle"
          justify="space-between"
          style={{ flexWrap: "wrap" }}
        >
          <Col>
            <Space size={16}>
              {paymentIcons.map((icon) => (
                <img
                  key={icon.alt}
                  src={icon.src}
                  alt={icon.alt}
                  style={{
                    height: 28,
                    background: "#fff",
                    borderRadius: 4,
                    padding: 2,
                  }}
                />
              ))}
            </Space>
          </Col>
          <Col style={{ color: "#fff", fontSize: 14 }}>
            ©2023 Krist All Rights are reserved
          </Col>
          <Col>
            <Space size={16}>
              <a href="#" style={{ color: "#fff", fontSize: 18 }}>
                <FaFacebookF />
              </a>
              <a href="#" style={{ color: "#fff", fontSize: 18 }}>
                <FaInstagram />
              </a>
              <a href="#" style={{ color: "#fff", fontSize: 18 }}>
                <FaTwitter />
              </a>
            </Space>
          </Col>
        </Row>
      </div>
    </footer>
  );
};

export default FooterComponent;
