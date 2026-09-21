import React, { useState } from "react";
import { Row, Col, Typography, Input, Button, Divider, message } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import Link from "next/link";

const { Text } = Typography;

const paymentIcons = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg",
    alt: "Visa",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
    alt: "Mastercard",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    alt: "Paypal",
  },
];

const FooterComponent: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      message.warning("Vui lòng nhập địa chỉ email của bạn!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      message.error("Định dạng email không hợp lệ!");
      return;
    }
    message.success("Cảm ơn bạn đã đăng ký nhận thông tin khuyến mãi!");
    setEmail("");
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <Row gutter={[32, 36]} justify="space-between">
          {/* Logo & Contact */}
          <Col xs={24} sm={12} lg={7}>
            <div style={{ marginBottom: 16 }}>
              <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
                <img
                  src="/images/logo.png"
                  alt="Kanban Shop Logo"
                  style={{
                    width: 96,
                    height: "auto",
                    display: "block",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </Link>
            </div>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: 18,
                maxWidth: 320,
              }}
            >
              Cửa hàng thời trang & phụ kiện chất lượng cao, mang đến phong cách
              hiện đại và sự hài lòng tuyệt đối cho bạn.
            </p>
            <div>
              <div className="site-footer-contact-item">
                <PhoneOutlined />
                <a href="tel:07045550127">(704) 555-0127</a>
              </div>
              <div className="site-footer-contact-item">
                <MailOutlined />
                <a href="mailto:krist@example.com">krist@example.com</a>
              </div>
              <div className="site-footer-contact-item">
                <EnvironmentOutlined />
                <span>
                  3891 Ranchview Dr. Richardson, California 62639
                </span>
              </div>
            </div>
          </Col>

          {/* Information */}
          <Col xs={12} sm={6} lg={4}>
            <div className="site-footer-title">Thông tin</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/profile" className="site-footer-link">
                Tài khoản của tôi
              </Link>
              <Link href="/auth/login" className="site-footer-link">
                Đăng nhập
              </Link>
              <Link href="/shop/checkout" className="site-footer-link">
                Giỏ hàng
              </Link>
              <Link href="/shop" className="site-footer-link">
                Tất cả sản phẩm
              </Link>
              <Link href="/story" className="site-footer-link">
                Về chúng tôi
              </Link>
            </div>
          </Col>

          {/* Service */}
          <Col xs={12} sm={6} lg={4}>
            <div className="site-footer-title">Dịch vụ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/story" className="site-footer-link">
                Câu chuyện thương hiệu
              </Link>
              <Link href="/blog" className="site-footer-link">
                Bài viết & Xu hướng
              </Link>
              <Link href="/contact" className="site-footer-link">
                Hỗ trợ & Liên hệ
              </Link>
              <Link href="/contact" className="site-footer-link">
                Chính sách giao hàng
              </Link>
              <Link href="/contact" className="site-footer-link">
                Điều khoản dịch vụ
              </Link>
            </div>
          </Col>

          {/* Subscribe */}
          <Col xs={24} sm={12} lg={8}>
            <div className="site-footer-title">Đăng ký nhận tin</div>
            <Text
              style={{
                color: "#9ca3af",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                display: "block",
              }}
            >
              Nhập email bên dưới để nhận thông tin sớm nhất về các bộ sưu tập và
              ưu đãi đặc quyền.
            </Text>
            <form onSubmit={handleSubscribe} className="site-footer-subscribe-form">
              <Input
                size="large"
                placeholder="Email của bạn..."
                prefix={<MailOutlined style={{ color: "rgba(255, 255, 255, 0.45)" }} />}
                className="site-footer-subscribe-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                className="site-footer-subscribe-btn"
                icon={<ArrowRightOutlined />}
                aria-label="Đăng ký nhận tin"
              />
            </form>
          </Col>
        </Row>

        <Divider
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
            margin: "36px 0 20px 0",
          }}
        />

        {/* Bottom Bar: Responsive across all devices */}
        <div className="site-footer-bottom">
          <div>
            <span style={{ fontSize: "0.85rem", color: "#9ca3af", marginRight: 10 }}>
              Phương thức thanh toán:
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                verticalAlign: "middle",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {paymentIcons.map((icon) => (
                <img
                  key={icon.alt}
                  src={icon.src}
                  alt={icon.alt}
                  style={{
                    height: 24,
                    background: "#fff",
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            © {new Date().getFullYear()} Krist. Tất cả các quyền được bảo lưu.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-social-btn"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-social-btn"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-social-btn"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-social-btn"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
