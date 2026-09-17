import handleAPI from "../apis/handleApi";

export interface SupportMessage {
  conversationId?: string;
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
  status: "PENDING" | "SENT" | "ANSWERED" | "READ";
  createdAt: string;
  updatedAt: string;
}

export const supportService = {
  /**
   * Lấy lịch sử tin nhắn của user
   * @param conversationId - ID của cuộc hội thoại
   */
  getHistory: async (conversationId: string): Promise<SupportMessage[]> => {
    const response = await handleAPI(
      `/support/historyMessage/${conversationId}`
    );
    return response.data;
  },
};
