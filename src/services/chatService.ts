import handleAPI from "@/apis/handleApi";

export interface ChatMessage {
  message: string;
}

export interface ChatHistoryItem {
  role: "USER" | "ASSISTANT";
  message: string;
  createdAt: string;
  products?: any[];
}

export interface AiChatResponseData {
  message: string;
  aiCreatedAt: string;
  products?: any[];
}

export const chatService = {
  getChatHistory: async (): Promise<ChatHistoryItem[]> => {
    const res = await handleAPI("/ai/chat/history", {}, "get");
    return res.data || [];
  },

  sendMessage: async (data: ChatMessage): Promise<any> => {
    const res = await handleAPI("/ai/chat/support", data, "post");
    return res.data;
  },

  clearChatHistory: async (): Promise<any> => {
    const res = await handleAPI("/ai/chat/history", {}, "delete");
    return res.data;
  },
};
