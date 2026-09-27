/** @format */

import React, { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Empty,
  Popover,
  Tabs,
  Tooltip,
  Typography,
  theme,
} from "antd";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { themeSelector } from "@/redux/reducers/themeSlice";
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
} from "react-icons/io5";

const { useToken } = theme;

const formatRelativeTime = (dateString: string): string => {
  try {
    const now = new Date().getTime();
    const past = new Date(dateString).getTime();
    const diffSeconds = Math.max(0, Math.floor((now - past) / 1000));

    if (diffSeconds < 60) return "Vừa xong";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

const getTypeMeta = (type: NotificationType) => {
  switch (type) {
    case "ORDER_STATUS":
      return {
        icon: <IoBagCheckOutline size={18} />,
        bg: "rgba(37, 99, 235, 0.12)",
        color: "#2563EB",
        label: "Đơn hàng",
      };
    case "PROMOTION":
      return {
        icon: <IoPricetagOutline size={18} />,
        bg: "rgba(234, 88, 12, 0.12)",
        color: "#EA580C",
        label: "Khuyến mãi",
      };
    case "SUPPORT":
      return {
        icon: <IoChatbubbleEllipsesOutline size={18} />,
        bg: "rgba(16, 185, 129, 0.12)",
        color: "#10B981",
        label: "Hỗ trợ",
      };
    case "SYSTEM":
    default:
      return {
        icon: <IoShieldCheckmarkOutline size={18} />,
        bg: "rgba(139, 92, 246, 0.12)",
        color: "#8B5CF6",
        label: "Hệ thống",
      };
  }
};

interface NotificationPopoverProps {
  className?: string;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { token } = useToken();
  const auth = useSelector(authSelector);
  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const isLoggedIn = Boolean(auth.accessToken && auth.userId);

  const handleItemClick = (item: UserNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setOpen(false);
    if (item.targetUrl) {
      router.push(item.targetUrl);
    }
  };

  const popoverContent = (
    <div
      className="notification-popover-panel"
      style={{
        width: 380,
        maxWidth: "calc(100vw - 24px)",
        backgroundColor: token.colorBgContainer,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="notification-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 10px 16px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Title level={5} style={{ margin: 0, fontWeight: 700 }}>
            Thông báo
          </Typography.Title>
          {unreadCount > 0 && isLoggedIn && (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "1px 8px",
                borderRadius: 10,
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                color: token.colorTextSecondary,
                fontWeight: 600,
              }}
            >
              {unreadCount} chưa đọc
            </span>
          )}
        </div>

        {isLoggedIn && notifications.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {unreadCount > 0 && (
              <Tooltip title="Đánh dấu tất cả đã đọc">
                <Button
                  type="text"
                  size="small"
                  icon={<IoCheckmarkDoneOutline size={18} />}
                  onClick={markAllAsRead}
                  style={{
                    color: token.colorPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.8rem",
                    padding: "2px 6px",
                  }}
                >
                  <span className="d-none d-sm-inline">Đã đọc tất cả</span>
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Xóa tất cả">
              <Button
                type="text"
                size="small"
                danger
                icon={<IoTrashOutline size={16} />}
                onClick={clearAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "2px 6px",
                }}
              />
            </Tooltip>
          </div>
        )}
      </div>

      {!isLoggedIn ? (
        <div style={{ padding: "36px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: isDark ? "#262626" : "#F3F4F6",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorTextSecondary,
              marginBottom: 12,
            }}
          >
            <IoNotificationsOutline size={26} />
          </div>
          <Typography.Title level={5} style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>
            Đăng nhập để nhận thông báo
          </Typography.Title>
          <Typography.Paragraph
            type="secondary"
            style={{ fontSize: "0.85rem", marginBottom: 16 }}
          >
            Theo dõi trạng thái đơn hàng, ưu đãi mã giảm giá và thông tin tài khoản kịp thời nhất.
          </Typography.Paragraph>
          <Button
            type="primary"
            style={{ borderRadius: 8, padding: "0 24px" }}
            onClick={() => {
              setOpen(false);
              router.push("/auth/login");
            }}
          >
            Đăng nhập ngay
          </Button>
        </div>
      ) : (
        <>
          {/* Tabs Filter */}
          <div className="notification-tabs-wrapper">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="small"
              tabBarStyle={{
                margin: 0,
                padding: "0 14px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
              items={[
                { key: "ALL", label: "Tất cả" },
                { key: "ORDER_STATUS", label: "Đơn hàng" },
                { key: "PROMOTION", label: "Khuyến mãi" },
                { key: "SYSTEM", label: "Hệ thống" },
              ]}
            />
          </div>

          {/* List items */}
          <div
            className="notification-list-scroll custom-scrollbar"
            style={{
              maxHeight: 380,
              overflowY: "auto",
              minHeight: 140,
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 16px" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ fontSize: "0.85rem", color: token.colorTextSecondary }}>
                      Không có thông báo nào trong mục này
                    </span>
                  }
                />
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getTypeMeta(item.type);
                return (
                  <div
                    key={item.id}
                    className={`notification-item ${!item.isRead ? "unread" : ""}`}
                    onClick={() => handleItemClick(item)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                      position: "relative",
                      backgroundColor: !item.isRead
                        ? isDark
                          ? "rgba(255, 255, 255, 0.04)"
                          : "#F8FAFC"
                        : "transparent",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
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

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          marginBottom: 3,
                        }}
                      >
                        <Typography.Text
                          strong={!item.isRead}
                          style={{
                            fontSize: "0.88rem",
                            lineHeight: "1.3",
                            color: token.colorText,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.title}
                        </Typography.Text>

                        {/* Unread indicator */}
                        {!item.isRead && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#2563EB",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>

                      <Typography.Paragraph
                        type="secondary"
                        style={{
                          fontSize: "0.8rem",
                          lineHeight: "1.35",
                          margin: "0 0 6px 0",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.content}
                      </Typography.Paragraph>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: token.colorTextTertiary || token.colorTextSecondary,
                          }}
                        >
                          {formatRelativeTime(item.createdAt)}
                        </span>

                        {/* Quick action buttons */}
                        <div
                          className="notification-item-actions"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {!item.isRead && (
                            <Tooltip title="Đánh dấu đã đọc">
                              <Button
                                type="text"
                                size="small"
                                icon={<IoCheckmarkOutline size={15} />}
                                onClick={() => markAsRead(item.id)}
                                style={{
                                  padding: 0,
                                  width: 22,
                                  height: 22,
                                  minWidth: 22,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="Xóa thông báo">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<IoTrashOutline size={14} />}
                              onClick={() => deleteNotification(item.id)}
                              style={{
                                padding: 0,
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 16px",
              textAlign: "center",
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA",
            }}
          >
            <Button
              type="link"
              size="small"
              onClick={() => {
                setOpen(false);
                router.push("/profile?tab=notifications");
              }}
              style={{
                fontSize: "0.82rem",
                color: token.colorPrimary,
                fontWeight: 500,
                padding: 0,
              }}
            >
              Xem tất cả thông báo trong tài khoản →
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="notification-popover-overlay"
      arrow={false}
      overlayInnerStyle={{ padding: 0, borderRadius: 12 }}
    >
      <div className={`d-inline-flex align-items-center ${className || ""}`}>
        <Badge
          count={isMounted && isLoggedIn ? unreadCount : 0}
          overflowCount={99}
          size="small"
          offset={[-2, 4]}
          color="#EF4444"
        >
          <Button
            className={`header-action-btn ${open ? "active" : ""}`}
            icon={<IoNotificationsOutline size={21} />}
            type="text"
            aria-label="Thông báo"
            title="Thông báo"
          />
        </Badge>
      </div>
    </Popover>
  );
};

export default NotificationPopover;
