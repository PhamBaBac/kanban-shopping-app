import handleAPI from "@/apis/handleApi";
import { UserNotification } from "@/models/NotificationModel";

const STORAGE_KEY = "kanban_user_notifications";

const getStoredNotifications = (): UserNotification[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    // Tự động dọn dẹp các dữ liệu mock/fake cũ nếu còn lưu trong localStorage
    const cleanItems = items.filter(
      (n: any) => !n?.id?.toString().startsWith("notif-")
    );
    if (cleanItems.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanItems));
    }
    return cleanItems;
  } catch (e) {
    return [];
  }
};

const saveStoredNotifications = (items: UserNotification[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    // ignore
  }
};

export const notificationService = {
  getNotifications: async (type?: string): Promise<UserNotification[]> => {
    try {
      const params = type && type !== "ALL" ? { type } : undefined;
      const res: any = await handleAPI("/notifications", params, "get");
      if (Array.isArray(res?.data)) {
        return res.data;
      }
    } catch (e) {
      // Fallback local storage khi backend chưa kết nối hoặc đang offline
    }

    const items = getStoredNotifications();
    if (!type || type === "ALL") return items;
    return items.filter((n) => n.type === type);
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const res: any = await handleAPI("/notifications/unread-count", undefined, "get");
      if (typeof res?.data === "number") {
        return res.data;
      }
    } catch (e) {
      // Fallback
    }

    const items = getStoredNotifications();
    return items.filter((n) => !n.isRead).length;
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await handleAPI(`/notifications/${id}/read`, undefined, "patch");
    } catch (e) {
      // Fallback
    }

    const items = getStoredNotifications().map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveStoredNotifications(items);
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await handleAPI("/notifications/read-all", undefined, "patch");
    } catch (e) {
      // Fallback
    }

    const items = getStoredNotifications().map((n) => ({ ...n, isRead: true }));
    saveStoredNotifications(items);
  },

  deleteNotification: async (id: string): Promise<void> => {
    try {
      await handleAPI(`/notifications/${id}`, undefined, "delete");
    } catch (e) {
      // Fallback
    }

    const items = getStoredNotifications().filter((n) => n.id !== id);
    saveStoredNotifications(items);
  },

  clearAll: async (): Promise<void> => {
    try {
      await handleAPI("/notifications/clear-all", undefined, "delete");
    } catch (e) {
      // Fallback
    }

    saveStoredNotifications([]);
  },
};
