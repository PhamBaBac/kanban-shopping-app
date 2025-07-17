import { useState, useEffect } from "react";
import { message } from "antd";
import { chatService, ChatMessage, ChatHistoryItem } from "@/services";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
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

    // Thêm message AI tạm thời với isLoading: true
    const aiLoadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "Đang nhập...",
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, aiLoadingMessage]);
    // Không setIsLoading(true) nữa

    try {
      const response = await chatService.sendMessage({ message: text });

      if (response) {
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: response.message || "",
          isUser: false,
          timestamp: response.aiCreatedAt
            ? new Date(response.aiCreatedAt)
            : new Date(),
        };
        // Thay thế message AI tạm thời bằng message thật
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.isLoading) {
            return [...prev.slice(0, -1), botMessage];
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.error("Chat API error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.isLoading) {
          return [...prev.slice(0, -1), errorMessage];
        }
        return prev;
      });

      message.error(
        "Không thể kết nối với hệ thống chat. Vui lòng thử lại sau."
      );
    }
    // Không setIsLoading(false) nữa
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
    isLoading: false, // Luôn trả về false để không loading toàn bộ chat
    error,
    sendMessage,
    clearHistory,
    loadChatHistory,
  };
};
