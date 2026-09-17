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
import { BsX, BsSend, BsRobot } from "react-icons/bs";
import { RiSparklingFill } from "react-icons/ri";
import axiosClient from "@/apis/axiosClient";
import { useChat } from "@/hooks";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { useRouter } from "next/router";

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
  const [inputValue, setInputValue] = useState("");
  const auth = useSelector(authSelector);
  const router = useRouter();

  const { messages, isLoading, sendMessage, clearHistory } = useChat();

  const handleOpen = () => {
    if (!auth.userId) {
      message.info("Please login to chat with AI");
      router.push("/auth/login");
      return;
    }
    setIsOpen(true);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    await clearHistory();
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => handleOpen()}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.5), 0 0 0 4px rgba(124,58,237,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(124, 58, 237, 0.7), 0 0 0 6px rgba(124,58,237,0.2)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(124, 58, 237, 0.5), 0 0 0 4px rgba(124,58,237,0.15)";
        }}
      >
        <RiSparklingFill size={28} />
      </button>

      <Modal
        title={
          <Space>
            <Avatar size="small" style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              <RiSparklingFill />
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
            {isLoading ? (
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
              disabled={isLoading}
            />
            <Divider type="vertical" />
            <Button
              type="primary"
              icon={<BsSend />}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              loading={isLoading}
            />
          </Space.Compact>

          {/* Clear chat button */}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <Button
              type="link"
              size="small"
              onClick={handleClearChat}
              style={{ fontSize: "12px" }}
              disabled={isLoading}
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
