/** @format */

import React, { useState } from "react";
import { Button, Card, Col, Collapse, Row, Tag, Tooltip, Typography, message, theme } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { themeSelector } from "@/redux/reducers/themeSlice";
import {
  IoServerOutline,
  IoReloadOutline,
  IoHomeOutline,
  IoWarningOutline,
  IoPulseOutline,
  IoCheckmarkCircleOutline,
  IoWifiOutline,
  IoHelpBuoyOutline,
  IoCopyOutline,
  IoSpeedometerOutline,
  IoCloudOfflineOutline,
} from "react-icons/io5";

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const ServerError500Page: React.FC = () => {
  const router = useRouter();
  const { token } = useToken();
  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";

  const [isRetrying, setIsRetrying] = useState(false);
  const [isCheckingPing, setIsCheckingPing] = useState(false);
  const [pingStatus, setPingStatus] = useState<"idle" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

  // Sinh ID sự cố ngẫu nhiên để phục vụ tra cứu log kỹ thuật
  const [incidentId] = useState(
    () => `ERR-500-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const timestamp = new Date().toISOString();

  // Xử lý tải lại trang
  const handleReload = () => {
    setIsRetrying(true);
    message.loading({ content: "Đang kết nối lại máy chủ...", key: "retry" });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // Kiểm tra sức khỏe kết nối máy chủ (Ping test)
  const handlePingServer = async () => {
    setIsCheckingPing(true);
    setPingStatus("idle");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Thử ping endpoint public của backend
      const res = await fetch("http://localhost:8080/api/v1/public/products?page=0&size=1", {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setPingStatus("success");
        message.success("Máy chủ đã hoạt động trở lại! Bạn có thể tải lại trang.");
      } else {
        setPingStatus("error");
        message.warning(`Máy chủ phản hồi với mã trạng thái: ${res.status}. Vui lòng thử lại sau ít phút.`);
      }
    } catch (err: any) {
      setPingStatus("error");
      message.error("Chưa thể kết nối tới máy chủ. Dịch vụ có thể đang bảo trì hoặc mất kết nối mạng.");
    } finally {
      setIsCheckingPing(false);
    }
  };

  // Sao chép mã lỗi kỹ thuật
  const handleCopyDebugInfo = () => {
    const debugInfo = JSON.stringify(
      {
        incidentId,
        statusCode: 500,
        error: "INTERNAL_SERVER_ERROR",
        timestamp,
        currentUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
      },
      null,
      2
    );

    navigator.clipboard.writeText(debugInfo);
    setCopied(true);
    message.success("Đã sao chép mã thông tin sự cố vào clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>500 - Lỗi máy chủ nội bộ | Kanban Shopping</title>
        <meta
          name="description"
          content="Máy chủ gặp sự cố gián đoạn hoặc mất kết nối cơ sở dữ liệu. Vui lòng thử lại sau ít phút."
        />
      </Head>

      <div
        style={{
          minHeight: "calc(100vh - 140px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          background: isDark
            ? "radial-gradient(circle at 50% 20%, #1f1f2e 0%, #0d0d12 100%)"
            : "radial-gradient(circle at 50% 20%, #f1f5f9 0%, #e2e8f0 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow ambient trang trí */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 480,
            height: 480,
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            maxWidth: 820,
            width: "100%",
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          {/* Huy hiệu trạng thái lỗi */}
          <div style={{ marginBottom: 20 }}>
            <Tag
              color="error"
              style={{
                padding: "6px 16px",
                fontSize: 14,
                borderRadius: 20,
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 10px rgba(239, 68, 68, 0.2)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#EF4444",
                  animation: "pulse 1.8s infinite",
                }}
              />
              HTTP 500 • INTERNAL SERVER ERROR
            </Tag>
          </div>

          {/* Biểu tượng Server & Mã lỗi 500 nổi bật */}
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 28,
                background: isDark
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.05))"
                  : "linear-gradient(135deg, #FEE2E2, #FEF2F2)",
                border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.3)" : "#FCA5A5"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EF4444",
                boxShadow: isDark
                  ? "0 10px 30px rgba(239, 68, 68, 0.25)"
                  : "0 10px 25px rgba(239, 68, 68, 0.15)",
              }}
            >
              <IoServerOutline size={64} />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: -8,
                right: -8,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#DC2626",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `3px solid ${isDark ? "#0d0d12" : "#ffffff"}`,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
              }}
            >
              <IoWarningOutline size={24} />
            </div>
          </div>

          <Title
            level={1}
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              margin: "12px 0 8px",
              letterSpacing: "-0.03em",
              background: isDark
                ? "linear-gradient(180deg, #FFFFFF 0%, #94A3B8 100%)"
                : "linear-gradient(180deg, #0F172A 0%, #475569 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hệ thống đang gặp sự cố máy chủ
          </Title>

          <Paragraph
            style={{
              fontSize: "1.05rem",
              color: isDark ? "#94A3B8" : "#64748B",
              maxWidth: 620,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            Đường dẫn của bạn hoàn toàn chính xác, tuy nhiên máy chủ tạm thời không thể hoàn thành
            yêu cầu. Sự cố này thường do cơ sở dữ liệu gián đoạn kết nối, máy chủ đang bảo trì hoặc mạng bị ngắt quãng.
          </Paragraph>

          {/* Khối 3 nguyên nhân thường gặp */}
          <Row gutter={[16, 16]} style={{ marginBottom: 36, textAlign: "left" }}>
            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  height: "100%",
                  background: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"}`,
                  borderRadius: 14,
                  backdropFilter: "blur(10px)",
                }}
                bodyStyle={{ padding: "18px 16px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      color: "#F59E0B",
                      background: "rgba(245, 158, 11, 0.12)",
                      padding: 6,
                      borderRadius: 8,
                      display: "inline-flex",
                    }}
                  >
                    <IoSpeedometerOutline size={18} />
                  </span>
                  <Text strong style={{ fontSize: "0.95rem" }}>
                    Cơ sở dữ liệu bận
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5, display: "block" }}>
                  Hệ thống xử lý vượt ngưỡng kết nối hoặc đang thực hiện truy vấn đồng bộ dữ liệu.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  height: "100%",
                  background: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"}`,
                  borderRadius: 14,
                  backdropFilter: "blur(10px)",
                }}
                bodyStyle={{ padding: "18px 16px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      color: "#3B82F6",
                      background: "rgba(59, 130, 246, 0.12)",
                      padding: 6,
                      borderRadius: 8,
                      display: "inline-flex",
                    }}
                  >
                    <IoCloudOfflineOutline size={18} />
                  </span>
                  <Text strong style={{ fontSize: "0.95rem" }}>
                    Bảo trì hệ thống
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5, display: "block" }}>
                  Máy chủ dịch vụ backend đang tự động khởi động lại hoặc cập nhật phiên bản vá lỗi.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  height: "100%",
                  background: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"}`,
                  borderRadius: 14,
                  backdropFilter: "blur(10px)",
                }}
                bodyStyle={{ padding: "18px 16px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      color: "#10B981",
                      background: "rgba(16, 185, 129, 0.12)",
                      padding: 6,
                      borderRadius: 8,
                      display: "inline-flex",
                    }}
                  >
                    <IoWifiOutline size={18} />
                  </span>
                  <Text strong style={{ fontSize: "0.95rem" }}>
                    Gián đoạn mạng
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5, display: "block" }}>
                  Đường truyền internet từ thiết bị tới gateway máy chủ bị chậm hoặc mất kết nối.
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Các nút hành động chính */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 36,
            }}
          >
            <Button
              type="primary"
              size="large"
              icon={<IoReloadOutline size={18} />}
              loading={isRetrying}
              onClick={handleReload}
              style={{
                height: 46,
                padding: "0 24px",
                fontSize: "0.95rem",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#DC2626",
                borderColor: "#DC2626",
                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
              }}
            >
              Tải lại trang ngay
            </Button>

            <Button
              size="large"
              icon={<IoPulseOutline size={18} />}
              loading={isCheckingPing}
              onClick={handlePingServer}
              style={{
                height: 46,
                padding: "0 20px",
                fontSize: "0.95rem",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: isDark ? "rgba(255, 255, 255, 0.06)" : "#FFFFFF",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1",
              }}
            >
              Kiểm tra kết nối máy chủ
            </Button>

            <Button
              size="large"
              icon={<IoHomeOutline size={18} />}
              onClick={() => router.push("/")}
              style={{
                height: 46,
                padding: "0 20px",
                fontSize: "0.95rem",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: isDark ? "rgba(255, 255, 255, 0.06)" : "#FFFFFF",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1",
              }}
            >
              Về trang chủ
            </Button>

            <Button
              type="text"
              size="large"
              icon={<IoHelpBuoyOutline size={18} />}
              onClick={() => router.push("/contact")}
              style={{
                height: 46,
                padding: "0 16px",
                fontSize: "0.95rem",
                borderRadius: 10,
                color: isDark ? "#94A3B8" : "#64748B",
              }}
            >
              Báo lỗi hỗ trợ
            </Button>
          </div>

          {/* Phần thông tin chẩn đoán kỹ thuật cho Admin / Developer */}
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "left" }}>
            <Collapse
              ghost
              items={[
                {
                  key: "tech-info",
                  label: (
                    <span style={{ fontSize: "0.85rem", color: isDark ? "#64748B" : "#94A3B8" }}>
                      Xem thông tin sự cố kỹ thuật (Diagnostics)
                    </span>
                  ),
                  children: (
                    <div
                      style={{
                        background: isDark ? "#0A0A0F" : "#F8FAFC",
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: `1px solid ${isDark ? "#1E1E2E" : "#E2E8F0"}`,
                        fontFamily: "monospace",
                        fontSize: "0.82rem",
                        color: isDark ? "#E2E8F0" : "#334155",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text strong style={{ fontSize: "0.82rem" }}>
                          Mã sự cố: <span style={{ color: "#EF4444" }}>{incidentId}</span>
                        </Text>
                        <Tooltip title={copied ? "Đã chép!" : "Sao chép mã lỗi"}>
                          <Button
                            type="text"
                            size="small"
                            icon={copied ? <IoCheckmarkCircleOutline color="#10B981" /> : <IoCopyOutline />}
                            onClick={handleCopyDebugInfo}
                          >
                            {copied ? "Đã chép" : "Sao chép"}
                          </Button>
                        </Tooltip>
                      </div>

                      <div style={{ lineHeight: 1.7, opacity: 0.85 }}>
                        <div>• Trạng thái HTTP: 500 (Internal Server Error)</div>
                        <div>• Thời điểm: {timestamp}</div>
                        <div>• Điểm kết nối mục tiêu: {typeof window !== "undefined" ? window.location.pathname : "/"}</div>
                        <div>• Gợi ý: Kiểm tra container backend Springboot và kết nối MySQL/PostgreSQL/Redis.</div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.3);
          }
        }
      `}</style>
    </>
  );
};

export default ServerError500Page;
