import handleAPI from "@/apis/handleApi";
import { UserNotification } from "@/models/NotificationModel";

const STORAGE_KEY = "kanban_user_notifications";

const INITIAL_MOCK_NOTIFICATIONS: UserNotification[] = [
  {
    id: "notif-1",
    type: "ORDER_STATUS",
    title: "Đơn hàng #KB-89412 đang được giao",
    content: "Đơn hàng gồm Áo Thun Nam Frontier và 1 sản phẩm khác đang trên đường giao đến bạn.",
    targetUrl: "/profile?tab=orders",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-2",
    type: "PROMOTION",
    title: "Tặng bạn Voucher 50.000đ",
    content: "Ưu đãi độc quyền: Sử dụng mã KANBAN50 để được giảm 50.000đ cho đơn hàng từ 300.000đ.",
    targetUrl: "/shop",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "notif-3",
    type: "SUPPORT",
    title: "Chăm sóc khách hàng",
    content: "Nhân viên hỗ trợ đã phản hồi tin nhắn tư vấn kích cỡ (size) sản phẩm của bạn.",
    targetUrl: "/",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "notif-4",
    type: "SYSTEM",
    title: "Bảo mật tài khoản",
    content: "Tài khoản của bạn vừa đăng nhập thành công qua Google. Nếu không phải bạn, hãy kiểm tra lại.",
    targetUrl: "/profile",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const getStoredNotifications = (): UserNotification[] => {
  if (typeof window === "undefined") return INITIAL_MOCK_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
      return INITIAL_MOCK_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MOCK_NOTIFICATIONS;
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
