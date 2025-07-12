import handleAPI from "@/apis/handleApi";

export interface ChatMessage {
  message: string;
}

export interface ChatHistoryItem {
  role: "USER" | "ASSISTANT";
  message: string;
  createdAt: string;
}

export const chatService = {
  // Lấy chat history
  getChatHistory: async (): Promise<ChatHistoryItem[]> => {
    const res = await handleAPI("/ai/chat/history", {}, "get");
    return res.data || [];
  },

  // Gửi tin nhắn chat
  sendMessage: async (data: ChatMessage): Promise<any> => {
    const res = await handleAPI("/ai/chat/support", data, "post");
    return res.data;
  },

  // Xóa chat history
  clearChatHistory: async (): Promise<any> => {
    const res = await handleAPI("/ai/chat/history", {}, "delete");
    return res.data;
  },
};
