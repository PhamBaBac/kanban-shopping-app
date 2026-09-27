/** @format */

import React from "react";
import {
  Badge,
  Button,
  Card,
  Empty,
  Popconfirm,
  Tabs,
  Tag,
  Typography,
  theme,
} from "antd";
import { useRouter } from "next/router";
import { useNotification } from "@/hooks/useNotification";
import { UserNotification, NotificationType } from "@/models/NotificationModel";
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkOutline,
  IoTrashOutline,
  IoBagCheckOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
  IoShieldCheckmarkOutline,
  IoArrowForward,
} from "react-icons/io5";

const { useToken } = theme;

const formatDateTime = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

const getTypeMeta = (type: NotificationType) => {
  switch (type) {
    case "ORDER_STATUS":
      return {
        icon: <IoBagCheckOutline size={20} />,
        bg: "rgba(37, 99, 235, 0.1)",
        color: "#2563EB",
        label: "Đơn hàng",
      };
    case "PROMOTION":
      return {
        icon: <IoPricetagOutline size={20} />,
        bg: "rgba(234, 88, 12, 0.1)",
        color: "#EA580C",
        label: "Khuyến mãi",
      };
    case "SUPPORT":
      return {
        icon: <IoChatbubbleEllipsesOutline size={20} />,
        bg: "rgba(16, 185, 129, 0.1)",
        color: "#10B981",
        label: "Hỗ trợ",
      };
    case "SYSTEM":
    default:
      return {
        icon: <IoShieldCheckmarkOutline size={20} />,
        bg: "rgba(139, 92, 246, 0.1)",
        color: "#8B5CF6",
        label: "Hệ thống",
      };
  }
};

export const ProfileNotifications: React.FC = () => {
  const { token } = useToken();
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    activeTab,
    setActiveTab,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotification();

  const handleActionClick = (item: UserNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.targetUrl) {
      router.push(item.targetUrl);
    }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Top Header Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Thông báo của bạn
              </Typography.Title>
              {unreadCount > 0 && (
                <Tag color="red" style={{ borderRadius: 10, margin: 0 }}>
                  {unreadCount} chưa đọc
                </Tag>
              )}
            </div>
            <Typography.Text type="secondary" style={{ fontSize: "0.88rem" }}>
              Cập nhật tin tức đơn hàng, mã giảm giá và thông tin tài khoản
            </Typography.Text>
          </div>

          {notifications.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <Button
                  icon={<IoCheckmarkDoneOutline size={18} />}
                  onClick={markAllAsRead}
                  style={{ borderRadius: 8 }}
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
              <Popconfirm
                title="Xóa tất cả thông báo?"
                description="Bạn có chắc chắn muốn xóa toàn bộ thông báo không?"
                onConfirm={clearAll}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<IoTrashOutline size={16} />}
                  style={{ borderRadius: 8 }}
                >
                  Xóa tất cả
                </Button>
              </Popconfirm>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "ALL", label: "Tất cả" },
              { key: "ORDER_STATUS", label: "Đơn hàng" },
              { key: "PROMOTION", label: "Khuyến mãi" },
              { key: "SYSTEM", label: "Hệ thống" },
            ]}
          />
        </div>
      </Card>

      {/* Notification items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.length === 0 ? (
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              padding: "48px 24px",
              textAlign: "center",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Typography.Text strong style={{ fontSize: "1rem", display: "block" }}>
                    Không có thông báo nào
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
                    Các thông báo mới về đơn hàng và ưu đãi sẽ hiển thị tại đây.
                  </Typography.Text>
                </div>
              }
            />
          </Card>
        ) : (
          notifications.map((item) => {
            const meta = getTypeMeta(item.type);
            return (
              <Card
                key={item.id}
                bordered={false}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${
                    !item.isRead ? token.colorPrimary : token.colorBorderSecondary
                  }`,
                  backgroundColor: !item.isRead
                    ? token.colorBgElevated
                    : token.colorBgContainer,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                }}
                bodyStyle={{ padding: "16px 20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  {/* Type Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: meta.bg,
                      color: meta.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Tag
                          style={{
                            color: meta.color,
                            backgroundColor: meta.bg,
                            border: "none",
                            borderRadius: 6,
                            margin: 0,
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        >
                          {meta.label}
                        </Tag>
                        <Typography.Text
                          strong
                          style={{
                            fontSize: "0.95rem",
                            color: token.colorText,
                          }}
                        >
                          {item.title}
                        </Typography.Text>
                        {!item.isRead && (
                          <Badge status="processing" color="#2563EB" />
                        )}
                      </div>

                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {formatDateTime(item.createdAt)}
                      </Typography.Text>
                    </div>

                    <Typography.Paragraph
                      type="secondary"
                      style={{
                        margin: "6px 0 12px 0",
                        fontSize: "0.88rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.content}
                    </Typography.Paragraph>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        {item.targetUrl && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleActionClick(item)}
                            icon={<IoArrowForward size={14} />}
                            style={{
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              flexDirection: "row-reverse",
                            }}
                          >
                            Xem chi tiết
                          </Button>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!item.isRead && (
                          <Button
                            size="small"
                            type="text"
                            icon={<IoCheckmarkOutline size={16} />}
                            onClick={() => markAsRead(item.id)}
                            style={{ borderRadius: 6 }}
                          >
                            Đánh dấu đã đọc
                          </Button>
                        )}
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<IoTrashOutline size={15} />}
                          onClick={() => deleteNotification(item.id)}
                          style={{ borderRadius: 6 }}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProfileNotifications;
