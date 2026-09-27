import { useState, useEffect, useCallback } from "react";
import { UserNotification, NotificationType } from "@/models/NotificationModel";
import { notificationService } from "@/services/notificationService";

export const NOTIFICATION_EVENT = "kanban_notification_updated";

export const useNotification = () => {
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
