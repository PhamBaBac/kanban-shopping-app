import { useState, useEffect } from "react";
import { message } from "antd";
import { chatService, ChatMessage, ChatHistoryItem } from "@/services";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadChatHistory: () => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await chatService.getChatHistory();
      const formattedMessages: Message[] = history.map(
        (item: ChatHistoryItem) => ({
          id: `${item.createdAt}-${item.role}`,
          text: item.message,
          isUser: item.role === "USER",
          timestamp: new Date(item.createdAt),
        })
      );

      setMessages(formattedMessages);
    } catch (error: any) {
      setError(error.message || "Failed to load chat history");
      console.error("Failed to load chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({ message: text });

      if (response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message || "",
          isUser: false,
          timestamp: response.aiCreatedAt
            ? new Date(response.aiCreatedAt)
            : new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error: any) {
      console.error("Chat API error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      message.error(
        "Không thể kết nối với hệ thống chat. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await chatService.clearChatHistory();
      setMessages([]);
      message.success("Chat history cleared");
    } catch (error: any) {
      message.error("Failed to clear chat history");
      console.error("Failed to clear chat history:", error);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    loadChatHistory,
  };
};
