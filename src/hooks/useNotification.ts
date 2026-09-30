import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { notification } from "antd";
import { UserNotification, NotificationType } from "@/models/NotificationModel";
import { notificationService } from "@/services/notificationService";
import { authSelector } from "@/redux/reducers/authReducer";
import { getSharedSocket } from "@/connect/SocketIO";

export const NOTIFICATION_EVENT = "kanban_notification_updated";

// Tránh hiển thị trùng lặp toast khi nhiều component cùng gọi useNotification
const displayedNotificationIds = new Set<string>();

export const useNotification = () => {
  const auth = useSelector(authSelector);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async (tab: string = activeTab) => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(tab);
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab, fetchNotifications]);

  // Realtime Socket listener cho thông báo người dùng
  useEffect(() => {
    if (!auth?.userId) return;

    const socket = getSharedSocket(auth.accessToken);

    const handleConnect = () => {
      socket.emit("join_user_channel", { userId: auth.userId });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    const handleUserNotification = (newNotify: UserNotification) => {
      if (!newNotify) return;

      setNotifications((prev) => {
        if (newNotify.id && prev.some((n) => n.id === newNotify.id)) {
          return prev;
        }
        return [newNotify, ...prev];
      });

      setUnreadCount((prev) => prev + 1);

      // Hiển thị Toast nổi cho người dùng (nếu chưa hiển thị)
      const notifyKey = newNotify.id || `${newNotify.title}_${Date.now()}`;
      if (!displayedNotificationIds.has(notifyKey)) {
        displayedNotificationIds.add(notifyKey);
        if (displayedNotificationIds.size > 200) {
          const first = displayedNotificationIds.values().next().value;
          if (first) displayedNotificationIds.delete(first);
        }

        notification.info({
          message: newNotify.title || "Thông báo đơn hàng",
          description: newNotify.content || "Đơn hàng của bạn đã có cập nhật mới.",
          placement: "topRight",
          duration: 6,
        });
      }

      dispatchUpdate();
    };

    const handleUnreadCount = (data: { unreadCount: number }) => {
      if (data && typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    };

    socket.on("user_notification", handleUserNotification);
    socket.on("user_unread_count", handleUnreadCount);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("user_notification", handleUserNotification);
      socket.off("user_unread_count", handleUnreadCount);
    };
  }, [auth?.userId, auth?.accessToken]);

  // Sync between tabs and components
  useEffect(() => {
    const handleSync = () => {
      fetchNotifications(activeTab);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(NOTIFICATION_EVENT, handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(NOTIFICATION_EVENT, handleSync);
    };
  }, [activeTab, fetchNotifications]);

  const dispatchUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(NOTIFICATION_EVENT));
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await notificationService.markAsRead(id);
    dispatchUpdate();
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );
    setUnreadCount(0);

    await notificationService.markAllAsRead();
    dispatchUpdate();
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    await notificationService.deleteNotification(id);
    dispatchUpdate();
  };

  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await notificationService.clearAll();
    dispatchUpdate();
  };

  return {
    notifications,
    unreadCount,
    activeTab,
    setActiveTab,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};
