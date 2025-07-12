/** @format */

import {
  Button,
  Modal,
  Input,
  Space,
  Typography,
  Avatar,
  message,
  Divider,
} from "antd";
import { useState, useEffect } from "react";
import { BsChatDots, BsX, BsSend } from "react-icons/bs";
import axiosClient from "@/apis/axiosClient";
import handleAPI from "@/apis/handleApi";

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatResponse {
  code: number;
  message: string;
  result: string;
  aiCreatedAt?: string; // Thêm timestamp từ AI response
}

interface ChatHistoryItem {
  userMessage: string;
  aiResponse: string;
  userCreatedAt: string;
  aiCreatedAt: string;
  userId: string | null;
}

interface ChatHistoryResponse {
  code: number;
  result: ChatHistoryItem[];
}

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Helper function để format timestamp cho Java LocalDateTime
  const formatTimestampForJava = (date: Date): string => {
    // Sử dụng local time thay vì UTC để tránh lệch múi giờ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Helper function để parse timestamp từ API
  const parseTimestamp = (timestamp: string): Date => {
    return new Date(timestamp);
  };

  // Load chat history khi mở modal
  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response: any = await handleAPI("/ai/chat/history", {}, "get");

      if (response.code === 1000 && response.result) {
        const historyMessages: Message[] = [];
        const rawHistory = response.result;

        // Nếu không có lịch sử thì hiển thị tin nhắn chào mừng
        if (rawHistory.length === 0) {
          historyMessages.push({
            id: "welcome",
            text: "Xin chào! Tôi có thể giúp gì cho bạn?",
            isUser: false,
            timestamp: new Date(),
          });
        } else {
          // Ghép từng cặp USER/ASSISTANT thành các message
          for (let i = 0; i < rawHistory.length; i++) {
            const item = rawHistory[i];
            if (item.role === "USER") {
              historyMessages.push({
                id: `user-${i}`,
                text: item.message,
                isUser: true,
                timestamp: new Date(item.createdAt),
              });
            } else if (item.role === "ASSISTANT") {
              historyMessages.push({
                id: `ai-${i}`,
                text: item.message,
                isUser: false,
                timestamp: new Date(item.createdAt),
              });
            }
          }
        }
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Fallback to welcome message
      setMessages([
        {
          id: "welcome",
          text: "Xin chào! Tôi có thể giúp gì cho bạn?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history khi mở modal
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputValue,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        const response: any = await handleAPI(
          `/ai/chat/support`,
          { message: userMessage.text },
          "post"
        );

        if (response.code === 1000) {
          // Sử dụng message và aiCreatedAt từ response.result
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.result?.message || "",
            isUser: false,
            timestamp: response.result?.aiCreatedAt
              ? new Date(response.result.aiCreatedAt)
              : new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          throw new Error(response.message || "Có lỗi xảy ra");
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
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    try {
      await handleAPI("/ai/chat/history", {}, "delete");
      message.success("Đã xóa lịch sử chat thành công");

      // Reset về tin nhắn chào mừng
      setMessages([
        {
          id: "welcome",
          text: "Xin chào! Tôi có thể giúp gì cho bạn?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
      message.error("Không thể xóa lịch sử chat");
    }
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<BsChatDots size={24} />}
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 60,
          height: 60,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      />

      <Modal
        title={
          <Space>
            <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
              <BsChatDots />
            </Avatar>
            <Text strong>Hỗ trợ khách hàng</Text>
          </Space>
        }
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        width={400}
        style={{
          position: "fixed",
          bottom: 100,
          right: 20,
          top: "auto",
          margin: 0,
          padding: 0,
        }}
        closeIcon={<BsX size={20} />}
        wrapClassName="chat-modal-wrapper"
      >
        <div style={{ height: 400, display: "flex", flexDirection: "column" }}>
          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 0",
              borderBottom: "1px solid #f0f0f0",
              marginBottom: 10,
            }}
          >
            {isLoadingHistory ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Text style={{ color: "#666" }}>Đang tải lịch sử chat...</Text>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: message.isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "8px 12px",
                      borderRadius: 12,
                      backgroundColor: message.isUser ? "#1890ff" : "#f5f5f5",
                      color: message.isUser ? "white" : "black",
                    }}
                  >
                    <Text
                      style={{
                        color: message.isUser ? "white" : "black",
                        whiteSpace: "pre-line", // Để hiển thị \n thành xuống dòng
                      }}
                    >
                      {message.text}
                    </Text>
                    <div
                      style={{
                        fontSize: "10px",
                        marginTop: 4,
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <Text style={{ fontStyle: "italic", color: "#666" }}>
                    Đang nhập...
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <Space.Compact style={{ width: "100%" }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ resize: "none" }}
              disabled={isLoading || isLoadingHistory}
            />
            <Divider type="vertical" />
            <Button
              type="primary"
              icon={<BsSend />}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || isLoadingHistory}
              loading={isLoading}
            />
          </Space.Compact>

          {/* Clear chat button */}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <Button
              type="link"
              size="small"
              onClick={clearChat}
              style={{ fontSize: "12px" }}
              disabled={isLoadingHistory}
            >
              Xóa lịch sử chat
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .chat-modal-wrapper .ant-modal {
          position: fixed !important;
          bottom: 100px !important;
          right: 20px !important;
          top: auto !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .chat-modal-wrapper .ant-modal-content {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .chat-modal-wrapper .ant-modal {
            width: calc(100vw - 40px) !important;
            right: 20px !important;
            left: 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatButton;
