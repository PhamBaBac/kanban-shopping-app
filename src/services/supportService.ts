import handleAPI from "../apis/handleApi";

export interface SupportMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
  status: "PENDING" | "SENT" | "ANSWERED" | "READ" | "DELIVERED";
  createdAt: string;
  updatedAt?: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
}

export const supportService = {
  /**
   * Lấy lịch sử tin nhắn của cuộc hội thoại
   * @param conversationId - ID cuộc hội thoại (thường là "user_" + userId)
   */
  getHistory: async (conversationId: string): Promise<SupportMessage[]> => {
    try {
      const response = await handleAPI(`/support/historyMessage/${conversationId}`);
      return response.data || [];
    } catch (error) {
      console.error("Lỗi khi tải lịch sử tin nhắn:", error);
      return [];
    }
  },

  /**
   * Gửi tin nhắn qua REST API (fallback khi Socket tạm thời mất kết nối)
   */
  sendMessage: async (data: SendMessageRequest): Promise<SupportMessage> => {
    const response = await handleAPI("/support/save", data, "post");
    return response.data;
  },

  /**
   * Đánh dấu cuộc hội thoại đã đọc
   */
  markAsRead: async (conversationId: string): Promise<any> => {
    try {
      const response = await handleAPI(`/support/markAsRead/${conversationId}`, {}, "put");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
      return null;
    }
  },
};
