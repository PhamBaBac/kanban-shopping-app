/** @format */

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Typography,
  Avatar,
  Badge,
  Tag,
  Spin,
  message,
} from "antd";
import {
  BsHeadset,
  BsSend,
  BsX,
  BsCheckAll,
} from "react-icons/bs";
import { RiSparklingFill, RiCustomerService2Fill } from "react-icons/ri";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { useRouter } from "next/router";
import { useChat } from "@/hooks/useChat";
import { useChatMessage } from "@/hooks/useChatMessage";
import { themeSelector } from "@/redux/reducers/themeSlice";
import { ChatProductCard } from "./ChatProductCard";

const { TextArea } = Input;
const { Text } = Typography;

const QUICK_LIVE_PROMPTS = [
  "Kiểm tra đơn hàng của tôi",
  "Tư vấn kích thước & form dáng",
  "Hướng dẫn chính sách đổi trả",
  "Cần nhân viên tư vấn gấp",
];

const QUICK_AI_PROMPTS = [
  "Gợi ý trang phục thịnh hành mùa này",
  "Có mã giảm giá nào đang áp dụng không?",
  "Chính sách bảo hành sản phẩm ra sao?",
];

const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "ai">("live");
  const [liveInput, setLiveInput] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [isLiveFocused, setIsLiveFocused] = useState(false);
  const [isAiFocused, setIsAiFocused] = useState(false);

  const auth = useSelector(authSelector);
  const themeState = useSelector(themeSelector);
  const isDarkMode = themeState?.mode === "dark";
  const router = useRouter();

  const currentUserId = auth?.userId || "";
  const currentUsername =
    `${auth?.firstName || ""} ${auth?.lastName || ""}`.trim() ||
    auth?.email ||
    "Khách hàng";
  const currentAvatar = auth?.avatar || "";

  const {
    messages: liveMessages,
    loadingHistory: liveLoading,
    isConnected: socketConnected,
    isStaffTyping,
    unreadCount,
    sendMessage: sendLiveMessage,
    sendTyping,
    markAsRead,
  } = useChatMessage({
    userId: currentUserId,
    username: currentUsername,
    avatar: currentAvatar,
    accessToken: auth?.accessToken,
    isChatOpen: isOpen && activeTab === "live",
  });

  const {
    messages: aiMessages,
    isLoading: aiLoading,
    sendMessage: sendAiMessage,
    clearHistory: clearAiHistory,
  } = useChat();

  const liveEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "live") {
      liveEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveMessages, isStaffTyping, activeTab, isOpen]);

  useEffect(() => {
    if (activeTab === "ai") {
      aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, activeTab, isOpen]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen && activeTab === "live") {
      markAsRead();
    }
  };

  const handleSendLive = (customText?: string) => {
    const textToSend = (customText || liveInput).trim();
    if (!textToSend) return;

    if (!currentUserId) {
      message.info("Vui lòng đăng nhập để gửi tin nhắn tới nhân viên hỗ trợ");
      router.push("/auth/login");
      return;
    }

    sendLiveMessage(textToSend);
    setLiveInput("");
    sendTyping(false);
  };

  const handleLiveInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLiveInput(e.target.value);
    sendTyping(true);
  };

  const handleLiveKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendLive();
    }
  };

  const handleSendAi = (customText?: string) => {
    const textToSend = (customText || aiInput).trim();
    if (!textToSend || aiLoading) return;

    if (!currentUserId) {
      message.info("Vui lòng đăng nhập để trò chuyện cùng trợ lý AI");
      router.push("/auth/login");
      return;
    }

    sendAiMessage(textToSend);
    setAiInput("");
  };

  const handleAiKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendAi();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div
        className="kanban-chat-fab-container"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1050,
        }}
      >
        <Badge
          count={unreadCount}
          overflowCount={99}
          offset={[-4, 4]}
          styles={{
            root: { display: "inline-block" },
          }}
        >
          <button
            id="btn-customer-support-chat"
            onClick={toggleChat}
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: isOpen
                ? "linear-gradient(135deg, #27272A 0%, #18181B 100%)"
                : "linear-gradient(135deg, #131118 0%, #27272A 100%)",
              boxShadow: isOpen
                ? "0 4px 16px rgba(0, 0, 0, 0.3)"
                : "0 8px 24px rgba(19, 17, 24, 0.4), 0 0 0 3px rgba(19, 17, 24, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isOpen ? "rotate(90deg)" : "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = isOpen
                ? "rotate(90deg) scale(1.08)"
                : "scale(1.08)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 12px 32px rgba(19, 17, 24, 0.55), 0 0 0 4px rgba(19, 17, 24, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = isOpen
                ? "rotate(90deg)"
                : "none";
              (e.currentTarget as HTMLElement).style.boxShadow = isOpen
                ? "0 4px 16px rgba(0, 0, 0, 0.3)"
                : "0 8px 24px rgba(19, 17, 24, 0.4), 0 0 0 3px rgba(19, 17, 24, 0.12)";
            }}
            aria-label="Hỗ trợ khách hàng"
          >
            {isOpen ? <BsX size={30} /> : <BsHeadset size={26} />}
          </button>
        </Badge>
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="kanban-chat-window"
          style={{
            position: "fixed",
            bottom: 96,
            right: 24,
            width: "min(410px, calc(100% - 32px))",
            maxWidth: "100%",
            height: 600,
            maxHeight: "calc(100vh - 120px)",
            backgroundColor: isDarkMode ? "#1f1f23" : "#ffffff",
            borderRadius: 20,
            boxShadow:
              "0 20px 48px -12px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1050,
            overflow: "hidden",
            border: isDarkMode ? "1px solid #333338" : "1px solid #EDEDF0",
            animation: "kanbanChatFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #131118 0%, #27272A 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Avatar
                  size={42}
                  style={{
                    backgroundColor: "#2E2D33",
                    color: "#ffffff",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                  icon={<RiCustomerService2Fill size={22} />}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: socketConnected ? "#10B981" : "#F59E0B",
                    border: "2px solid #131118",
                  }}
                />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Text strong style={{ color: "#ffffff", fontSize: 15 }}>
                    Kanban Support
                  </Text>
                  <Tag
                    color="blue"
                    bordered={false}
                    style={{
                      fontSize: 10,
                      lineHeight: "16px",
                      padding: "0 6px",
                      borderRadius: 10,
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      color: "#60A5FA",
                    }}
                  >
                    Official
                  </Tag>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.75)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>
                    {socketConnected
                      ? "Trực tuyến"
                      : "Đang kết nối lại..."}
                  </span>
                  
                </div>
              </div>
            </div>

            <Button
              type="text"
              icon={<BsX size={24} />}
              onClick={() => setIsOpen(false)}
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                padding: 0,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </div>

          <div
            style={{
              padding: "10px 14px",
              backgroundColor: isDarkMode ? "#27272A" : "#F9FAFB",
              borderBottom: isDarkMode ? "1px solid #38383E" : "1px solid #EEEEF2",
              display: "flex",
              gap: 8,
            }}
          >
            <button
              onClick={() => {
                setActiveTab("live");
                markAsRead();
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor:
                  activeTab === "live"
                    ? isDarkMode
                      ? "#131118"
                      : "#ffffff"
                    : "transparent",
                color:
                  activeTab === "live"
                    ? isDarkMode
                      ? "#ffffff"
                      : "#131118"
                    : isDarkMode
                    ? "#A1A1AA"
                    : "#6B7280",
                boxShadow:
                  activeTab === "live"
                    ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              <BsHeadset size={15} />
              <span>Tư vấn viên</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#DC2626",
                    color: "white",
                    borderRadius: 10,
                    padding: "0 6px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor:
                  activeTab === "ai"
                    ? isDarkMode
                      ? "#131118"
                      : "#ffffff"
                    : "transparent",
                color:
                  activeTab === "ai"
                    ? isDarkMode
                      ? "#ffffff"
                      : "#131118"
                    : isDarkMode
                    ? "#A1A1AA"
                    : "#6B7280",
                boxShadow:
                  activeTab === "ai"
                    ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              <RiSparklingFill size={15} style={{ color: "#EAB308" }} />
              <span>Trợ lý AI</span>
            </button>
          </div>

          {/* ================= TAB 1: LIVE CSKH ================= */}
          {activeTab === "live" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {!currentUserId ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px 24px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      color: isDarkMode ? "#ffffff" : "#131118",
                    }}
                  >
                    <BsHeadset size={30} />
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 16,
                      marginBottom: 8,
                      color: isDarkMode ? "#ffffff" : "#131118",
                    }}
                  >
                    Đăng nhập để chat với CSKH
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDarkMode ? "#A1A1AA" : "#6B7280",
                      marginBottom: 20,
                      lineHeight: "20px",
                    }}
                  >
                    Vui lòng đăng nhập để nhân viên có thể xác định đơn hàng, tài
                    khoản và hỗ trợ bạn chu đáo nhất.
                  </Text>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/auth/login");
                    }}
                    style={{
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #131118 0%, #27272A 100%)",
                      padding: "0 24px",
                      fontWeight: 600,
                    }}
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px 16px 8px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Welcome card */}
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        backgroundColor: isDarkMode ? "#27272A" : "#F9FAFB",
                        border: isDarkMode ? "1px solid #333" : "1px solid #F0F0F0",
                        fontSize: 12.5,
                        color: isDarkMode ? "#D4D4D8" : "#4B5563",
                        lineHeight: "18px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: isDarkMode ? "#fff" : "#111" }}>
                        Xin chào {auth?.firstName || "bạn"}!
                      </span>
                      <br />
                      Nhân viên chăm sóc khách hàng luôn sẵn sàng giải đáp thắc
                      mắc về sản phẩm, đơn hàng và các chính sách ưu đãi.
                    </div>

                    {/* Quick suggestion chips (hiển thị khi chưa có nhiều tin nhắn) */}
                    {liveMessages.length <= 4 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: isDarkMode ? "#71717A" : "#9CA3AF",
                          }}
                        >
                          Gợi ý câu hỏi nhanh:
                        </Text>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {QUICK_LIVE_PROMPTS.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendLive(prompt)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 16,
                                border: isDarkMode ? "1px solid #3F3F46" : "1px solid #E5E7EB",
                                backgroundColor: isDarkMode ? "#27272A" : "#ffffff",
                                color: isDarkMode ? "#E4E4E7" : "#374151",
                                fontSize: 12,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                textAlign: "left",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = "#131118";
                                (e.currentTarget as HTMLElement).style.backgroundColor = isDarkMode
                                  ? "#3F3F46"
                                  : "#F3F4F6";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.borderColor = isDarkMode
                                  ? "#3F3F46"
                                  : "#E5E7EB";
                                (e.currentTarget as HTMLElement).style.backgroundColor = isDarkMode
                                  ? "#27272A"
                                  : "#ffffff";
                              }}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Loading history */}
                    {liveLoading && (
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <Spin size="small" />
                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 6,
                            color: isDarkMode ? "#71717A" : "#9CA3AF",
                          }}
                        >
                          Đang tải lịch sử trò chuyện...
                        </div>
                      </div>
                    )}

                    {/* Message list */}
                    {liveMessages.map((msg, index) => {
                      const isUser = msg.role === "USER";
                      const prevMsg = index > 0 ? liveMessages[index - 1] : null;
                      const isSameSender = Boolean(
                        prevMsg &&
                        (prevMsg.senderId && msg.senderId
                          ? prevMsg.senderId === msg.senderId
                          : prevMsg.role === msg.role)
                      );

                      let isWithinTimeThreshold = false;
                      if (isSameSender && prevMsg?.createdAt && msg.createdAt) {
                        const prevTime = new Date(prevMsg.createdAt).getTime();
                        const currTime = new Date(msg.createdAt).getTime();
                        if (!isNaN(prevTime) && !isNaN(currTime)) {
                          const diffMinutes = Math.abs(currTime - prevTime) / (1000 * 60);
                          isWithinTimeThreshold = diffMinutes <= 5;
                        }
                      }

                      const isFirstInChain = !isSameSender || !isWithinTimeThreshold;

                      const nextMsg = index < liveMessages.length - 1 ? liveMessages[index + 1] : null;
                      const isSameNextSender = Boolean(
                        nextMsg &&
                        (nextMsg.senderId && msg.senderId
                          ? nextMsg.senderId === msg.senderId
                          : nextMsg.role === msg.role)
                      );

                      let isNextWithinTimeThreshold = false;
                      if (isSameNextSender && nextMsg?.createdAt && msg.createdAt) {
                        const currTime = new Date(msg.createdAt).getTime();
                        const nextTime = new Date(nextMsg.createdAt).getTime();
                        if (!isNaN(currTime) && !isNaN(nextTime)) {
                          const diffMinutes = Math.abs(nextTime - currTime) / (1000 * 60);
                          isNextWithinTimeThreshold = diffMinutes <= 5;
                        }
                      }

                      const isLastInChain = !isSameNextSender || !isNextWithinTimeThreshold;

                      const timeStr = msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";

                      return (
                        <div
                          key={msg.id || `temp-${index}`}
                          style={{
                            display: "flex",
                            justifyContent: isUser ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: 8,
                            marginTop: isFirstInChain ? (index === 0 ? 0 : 6) : -4,
                          }}
                        >
                          {!isUser && (
                            isLastInChain ? (
                              <Avatar
                                size={28}
                                style={{
                                  backgroundColor: "#131118",
                                  color: "#ffffff",
                                  flexShrink: 0,
                                  fontSize: 12,
                                }}
                              >
                                CSKH
                              </Avatar>
                            ) : (
                              <div style={{ width: 28, flexShrink: 0 }} />
                            )
                          )}

                          <div
                            style={{
                              maxWidth: "76%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isUser ? "flex-end" : "flex-start",
                            }}
                          >
                            {!isUser && isLastInChain && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: isDarkMode ? "#A1A1AA" : "#6B7280",
                                  marginBottom: 2,
                                  marginLeft: 4,
                                  fontWeight: 500,
                                }}
                              >
                                {msg.username || "Nhân viên hỗ trợ"}
                              </span>
                            )}

                            <div
                              style={{
                                padding: "9px 13px",
                                borderRadius: isUser
                                  ? "16px 16px 4px 16px"
                                  : "16px 16px 16px 4px",
                                backgroundColor: isUser
                                  ? "#131118"
                                  : isDarkMode
                                  ? "#2E2D33"
                                  : "#F3F4F6",
                                color: isUser
                                  ? "#ffffff"
                                  : isDarkMode
                                  ? "#F4F4F5"
                                  : "#1F2937",
                                fontSize: 13.5,
                                lineHeight: "19px",
                                wordBreak: "break-word",
                                whiteSpace: "pre-line",
                                boxShadow: isUser
                                  ? "0 2px 6px rgba(19, 17, 24, 0.2)"
                                  : "0 1px 3px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              {msg.content}
                            </div>

                            {isLastInChain && (
                              <div
                                style={{
                                  fontSize: 10,
                                  marginTop: 3,
                                  color: isDarkMode ? "#71717A" : "#9CA3AF",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "0 4px",
                                }}
                              >
                                <span>{timeStr}</span>
                                {isUser && (
                                  <span style={{ color: "#10B981" }}>
                                    <BsCheckAll size={14} />
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    {isStaffTyping && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          margin: "4px 0",
                        }}
                      >
                        <Avatar
                          size={24}
                          style={{ backgroundColor: "#131118", color: "white", fontSize: 10 }}
                        >
                          CSKH
                        </Avatar>
                        <div
                          style={{
                            padding: "6px 12px",
                            borderRadius: "14px 14px 14px 4px",
                            backgroundColor: isDarkMode ? "#2E2D33" : "#F3F4F6",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            className="typing-dot"
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: "#6B7280",
                              display: "inline-block",
                              animation: "kanbanBlink 1.4s infinite both",
                            }}
                          />
                          <span
                            className="typing-dot"
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: "#6B7280",
                              display: "inline-block",
                              animation: "kanbanBlink 1.4s infinite both 0.2s",
                            }}
                          />
                          <span
                            className="typing-dot"
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: "#6B7280",
                              display: "inline-block",
                              animation: "kanbanBlink 1.4s infinite both 0.4s",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div ref={liveEndRef} />
                  </div>

                  {/* Input area */}
                  <div
                    style={{
                      padding: "10px 14px 14px 14px",
                      borderTop: isDarkMode ? "1px solid #333338" : "1px solid #EDEDF0",
                      backgroundColor: isDarkMode ? "#1f1f23" : "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 8,
                        backgroundColor: isLiveFocused
                          ? isDarkMode
                            ? "#222226"
                            : "#ffffff"
                          : isDarkMode
                          ? "#27272A"
                          : "#F3F4F6",
                        borderRadius: 16,
                        padding: "6px 8px 6px 14px",
                        border: isLiveFocused
                          ? isDarkMode
                            ? "1px solid #60A5FA"
                            : "1px solid #131118"
                          : isDarkMode
                          ? "1px solid #3F3F46"
                          : "1px solid #E5E7EB",
                        boxShadow: isLiveFocused
                          ? isDarkMode
                            ? "0 0 0 3px rgba(96, 165, 250, 0.15)"
                            : "0 0 0 3px rgba(19, 17, 24, 0.08)"
                          : "none",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <TextArea
                        value={liveInput}
                        onChange={handleLiveInputChange}
                        onKeyDown={handleLiveKeyPress}
                        onFocus={() => setIsLiveFocused(true)}
                        onBlur={() => {
                          setIsLiveFocused(false);
                          sendTyping(false);
                        }}
                        placeholder="Nhập tin nhắn... (Enter để gửi)"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        bordered={false}
                        variant="borderless"
                        className="chat-textarea-field"
                        style={{
                          padding: "4px 0",
                          resize: "none",
                          fontSize: 13.5,
                          lineHeight: "20px",
                          color: isDarkMode ? "#F4F4F5" : "#18181B",
                          backgroundColor: "transparent",
                          border: "none",
                          boxShadow: "none",
                          outline: "none",
                        }}
                      />
                      <Button
                        type="primary"
                        icon={<BsSend size={15} />}
                        onClick={() => handleSendLive()}
                        disabled={!liveInput.trim()}
                        style={{
                          borderRadius: 12,
                          width: 36,
                          height: 36,
                          minWidth: 36,
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: liveInput.trim()
                            ? "linear-gradient(135deg, #131118 0%, #27272A 100%)"
                            : isDarkMode
                            ? "#38383E"
                            : "#E5E7EB",
                          borderColor: "transparent",
                          color: liveInput.trim()
                            ? "#ffffff"
                            : isDarkMode
                            ? "#71717A"
                            : "#9CA3AF",
                          cursor: liveInput.trim() ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                          transform: liveInput.trim() ? "scale(1)" : "scale(0.96)",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 2: AI ASSISTANT ================= */}
          {activeTab === "ai" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 16px 8px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* AI Welcome card */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    backgroundColor: isDarkMode ? "#27272A" : "#F9FAFB",
                    border: isDarkMode ? "1px solid #333" : "1px solid #F0F0F0",
                    fontSize: 12.5,
                    color: isDarkMode ? "#D4D4D8" : "#4B5563",
                    lineHeight: "18px",
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: isDarkMode ? "#fff" : "#111" }}>
                      Kanban AI Shopping Assistant
                    </span>
                  </div>
                  Tôi có thể tư vấn phối đồ, tìm kiếm sản phẩm phù hợp ngân sách và
                  giải đáp nhanh mọi thắc mắc của bạn!
                </div>

                {/* Quick AI Prompts */}
                {aiMessages.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: isDarkMode ? "#71717A" : "#9CA3AF",
                      }}
                    >
                      Khám phá cùng AI:
                    </Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {QUICK_AI_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendAi(prompt)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 12,
                            border: isDarkMode ? "1px solid #3F3F46" : "1px solid #E5E7EB",
                            backgroundColor: isDarkMode ? "#27272A" : "#ffffff",
                            color: isDarkMode ? "#E4E4E7" : "#374151",
                            fontSize: 12.5,
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = "#131118";
                            (e.currentTarget as HTMLElement).style.backgroundColor = isDarkMode
                              ? "#3F3F46"
                              : "#F3F4F6";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = isDarkMode
                              ? "#3F3F46"
                              : "#E5E7EB";
                            (e.currentTarget as HTMLElement).style.backgroundColor = isDarkMode
                              ? "#27272A"
                              : "#ffffff";
                          }}
                        >
                          <span>{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI messages */}
                {aiMessages.map((msg) => {
                  const hasProducts =
                    !msg.isUser &&
                    Array.isArray(msg.products) &&
                    msg.products.length > 0;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: msg.isUser ? "flex-end" : "flex-start",
                        alignItems: "flex-start",
                        gap: 8,
                        width: "100%",
                      }}
                    >
                      {!msg.isUser && (
                        <Avatar
                          size={28}
                          style={{
                            backgroundColor: "#EAB308",
                            color: "#131118",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                          icon={<RiSparklingFill size={16} />}
                        />
                      )}

                      <div
                        style={{
                          maxWidth: msg.isUser
                            ? "78%"
                            : hasProducts
                            ? "calc(100% - 36px)"
                            : "82%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: msg.isUser ? "flex-end" : "flex-start",
                          width: hasProducts ? "calc(100% - 36px)" : undefined,
                        }}
                      >
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: msg.isUser
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            backgroundColor: msg.isUser
                              ? "#131118"
                              : isDarkMode
                              ? "#2E2D33"
                              : "#F3F4F6",
                            color: msg.isUser
                              ? "#ffffff"
                              : isDarkMode
                              ? "#F4F4F5"
                              : "#1F2937",
                            fontSize: 13.5,
                            lineHeight: "20px",
                            wordBreak: "break-word",
                            whiteSpace: "pre-line",
                            boxShadow: msg.isUser
                              ? "0 2px 6px rgba(19, 17, 24, 0.2)"
                              : "0 1px 3px rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {msg.text}
                        </div>

                        {/* Thẻ sản phẩm trực quan có ảnh + giá + nút mua hàng */}
                        {hasProducts && (
                          <div
                            style={{
                              marginTop: 10,
                              width: "100%",
                              maxWidth: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 6,
                                padding: "0 2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: isDarkMode ? "#FBBF24" : "#D97706",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <RiSparklingFill size={12} />
                                Gợi ý cho bạn ({msg.products!.length})
                              </span>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  color: isDarkMode ? "#71717A" : "#9CA3AF",
                                }}
                              >
                                Vuốt ngang để xem thêm &rarr;
                              </span>
                            </div>

                            <div
                              className="custom-chat-scrollbar"
                              style={{
                                display: "flex",
                                gap: 10,
                                overflowX: "auto",
                                padding: "4px 2px 10px 2px",
                                scrollSnapType: "x mandatory",
                                WebkitOverflowScrolling: "touch",
                              }}
                            >
                              {msg.products!.map((product: any) => (
                                <ChatProductCard
                                  key={product.id}
                                  product={product}
                                  isDarkMode={isDarkMode}
                                  onSelect={(p) => {
                                    router.push(
                                      `/products/${p.slug || "detail"}/${p.id}`
                                    );
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: 10,
                            marginTop: 3,
                            color: isDarkMode ? "#71717A" : "#9CA3AF",
                            padding: "0 4px",
                          }}
                        >
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* AI Loading state */}
                {aiLoading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Avatar
                      size={28}
                      style={{ backgroundColor: "#EAB308", color: "#131118" }}
                      icon={<RiSparklingFill size={16} />}
                    />
                    <div
                      style={{
                        padding: "8px 14px",
                        borderRadius: "16px 16px 16px 4px",
                        backgroundColor: isDarkMode ? "#2E2D33" : "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Spin size="small" />
                      <span
                        style={{
                          fontSize: 12.5,
                          color: isDarkMode ? "#A1A1AA" : "#6B7280",
                          fontStyle: "italic",
                        }}
                      >
                        AI đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={aiEndRef} />
              </div>

              {/* AI Input Area */}
              <div
                style={{
                  padding: "10px 14px 14px 14px",
                  borderTop: isDarkMode ? "1px solid #333338" : "1px solid #EDEDF0",
                  backgroundColor: isDarkMode ? "#1f1f23" : "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    backgroundColor: isAiFocused
                      ? isDarkMode
                        ? "#222226"
                        : "#ffffff"
                      : isDarkMode
                      ? "#27272A"
                      : "#F3F4F6",
                    borderRadius: 16,
                    padding: "6px 8px 6px 14px",
                    border: isAiFocused
                      ? isDarkMode
                        ? "1px solid #EAB308"
                        : "1px solid #131118"
                      : isDarkMode
                      ? "1px solid #3F3F46"
                      : "1px solid #E5E7EB",
                    boxShadow: isAiFocused
                      ? isDarkMode
                        ? "0 0 0 3px rgba(234, 179, 8, 0.15)"
                        : "0 0 0 3px rgba(19, 17, 24, 0.08)"
                      : "none",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <TextArea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleAiKeyPress}
                    onFocus={() => setIsAiFocused(true)}
                    onBlur={() => setIsAiFocused(false)}
                    placeholder="Hỏi AI bất kỳ điều gì về sản phẩm..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    bordered={false}
                    variant="borderless"
                    className="chat-textarea-field"
                    disabled={aiLoading}
                    style={{
                      padding: "4px 0",
                      resize: "none",
                      fontSize: 13.5,
                      lineHeight: "20px",
                      color: isDarkMode ? "#F4F4F5" : "#18181B",
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                      outline: "none",
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<BsSend size={15} />}
                    onClick={() => handleSendAi()}
                    disabled={!aiInput.trim() || aiLoading}
                    loading={aiLoading}
                    style={{
                      borderRadius: 12,
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: aiInput.trim()
                        ? isDarkMode
                          ? "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)"
                          : "linear-gradient(135deg, #131118 0%, #27272A 100%)"
                        : isDarkMode
                        ? "#38383E"
                        : "#E5E7EB",
                      borderColor: "transparent",
                      color: aiInput.trim()
                        ? isDarkMode
                          ? "#131118"
                          : "#ffffff"
                        : isDarkMode
                        ? "#71717A"
                        : "#9CA3AF",
                      cursor: aiInput.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                      transform: aiInput.trim() ? "scale(1)" : "scale(0.96)",
                    }}
                  />
                </div>

                {/* Clear AI History Button */}
                {aiMessages.length > 0 && (
                  <div style={{ textAlign: "center", marginTop: 6 }}>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => clearAiHistory()}
                      disabled={aiLoading}
                      style={{
                        fontSize: 11,
                        color: isDarkMode ? "#71717A" : "#9CA3AF",
                        padding: 0,
                        height: "auto",
                      }}
                    >
                      Xóa lịch sử chat AI
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Style Animations */}
      <style jsx global>{`
        @keyframes kanbanChatFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes kanbanBlink {
          0%,
          80%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .custom-chat-scrollbar::-webkit-scrollbar {
          height: 5px;
        }
        .custom-chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-chat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.3);
          border-radius: 4px;
        }
        .custom-chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.5);
        }

        /* Reset borderless styling for chat inputs */
        .chat-textarea-field,
        .chat-textarea-field.ant-input,
        .chat-textarea-field.ant-input:hover,
        .chat-textarea-field.ant-input:focus,
        .chat-textarea-field.ant-input-focused,
        .chat-textarea-field.ant-input-borderless,
        textarea.chat-textarea-field {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 0 !important;
        }

        .chat-textarea-field::placeholder {
          color: #9CA3AF !important;
          opacity: 0.85;
        }

        body[data-theme="dark"] .chat-textarea-field::placeholder {
          color: #71717A !important;
        }
      `}</style>
    </>
  );
};

export default ChatButton;
