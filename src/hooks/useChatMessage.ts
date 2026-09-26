import { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { initSocket } from "../connect/SocketIO";
import {
  supportService,
  SupportMessage,
  SendMessageRequest,
} from "../services/supportService";

interface UseLiveSupportOptions {
  userId?: string;
  username?: string;
  avatar?: string;
  accessToken?: string;
  isChatOpen?: boolean;
}

export const useChatMessage = (options: UseLiveSupportOptions) => {
  const { userId, username, avatar, accessToken, isChatOpen } = options;

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const conversationId = userId ? `user_${userId}` : "";

  // 1. Tải lịch sử tin nhắn
  const loadHistory = useCallback(async () => {
    if (!conversationId) return;
    setLoadingHistory(true);
    try {
      const history = await supportService.getHistory(conversationId);
      setMessages(history);
    } catch (error) {
      console.error("Không thể tải lịch sử trò chuyện:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [conversationId]);

  // 2. Đánh dấu đã đọc
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    setUnreadCount(0);
    try {
      await supportService.markAsRead(conversationId);
    } catch (error) {
      console.error("Lỗi markAsRead:", error);
    }
  }, [conversationId]);

  // Khi người dùng mở hộp thoại chat, tự động reset unreadCount và gọi markAsRead
  useEffect(() => {
    if (isChatOpen && conversationId) {
      markAsRead();
    }
  }, [isChatOpen, conversationId, markAsRead]);

  // 3. Khởi tạo Socket.IO kết nối
  useEffect(() => {
    if (!userId) {
      // Nếu chưa đăng nhập thì ngắt kết nối nếu có
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setMessages([]);
      return;
    }

    loadHistory();

    const socket = initSocket(accessToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Join vào room trò chuyện riêng của khách hàng: "conversation_user_{userId}"
      socket.emit("join_conversation", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Lắng nghe tin nhắn mới từ nhân viên / admin
    socket.on("receive_message", (receivedMsg: SupportMessage) => {
      if (receivedMsg.conversationId === conversationId) {
        setMessages((prev) => {
          // Tránh duplicate nếu ID đã tồn tại
          if (receivedMsg.id && prev.some((m) => m.id === receivedMsg.id)) {
            return prev;
          }
          // Thay thế tin nhắn optimistic tạm thời nếu trùng content và sender
          const optIndex = prev.findIndex(
            (m) =>
              !m.id &&
              m.content === receivedMsg.content &&
              m.senderId === receivedMsg.senderId
          );
          if (optIndex > -1) {
            const updated = [...prev];
            updated[optIndex] = receivedMsg;
            return updated;
          }
          return [...prev, receivedMsg];
        });

        // Nếu tin nhắn là từ nhân viên và người dùng đang không mở cửa sổ chat
        if (receivedMsg.role !== "USER") {
          setIsStaffTyping(false);
          if (!isChatOpenRef.current) {
            setUnreadCount((c) => c + 1);
          }
        }
      }
    });

    // Lắng nghe sự kiện nhân viên đang soạn tin
    socket.on("user_typing", (data: { conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId) {
        setIsStaffTyping(data.isTyping);
      }
    });

    return () => {
      if (socket) {
        socket.emit("leave_conversation", { conversationId });
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, accessToken, conversationId, loadHistory]);

  // 4. Gửi tin nhắn
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !userId) return;

      const payload: SendMessageRequest = {
        conversationId,
        senderId: userId,
        receiverId: undefined,
        username: username || "Khách hàng",
        avatar: avatar || "",
        role: "USER",
        content: trimmed,
      };

      // Optimistic update
      const optimisticMsg: SupportMessage = {
        ...payload,
        conversationId,
        status: "SENT",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Emit qua Socket
      if (socketRef.current && isConnected) {
        socketRef.current.emit("send_message", payload);
      } else {
        // Fallback qua REST API nếu Socket tạm mất kết nối
        try {
          const saved = await supportService.sendMessage(payload);
          if (saved) {
            setMessages((prev) =>
              prev.map((m) =>
                !m.id && m.content === trimmed ? { ...m, id: saved.id } : m
              )
            );
          }
        } catch (error) {
          console.error("Gửi tin nhắn qua REST thất bại:", error);
        }
      }
    },
    [conversationId, userId, username, avatar, isConnected]
  );

  // 5. Báo trạng thái người dùng đang gõ
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || !conversationId) return;

      socketRef.current.emit("typing", {
        conversationId,
        username: username || "Khách hàng",
        isTyping,
      });

      if (isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          socketRef.current?.emit("typing", {
            conversationId,
            username: username || "Khách hàng",
            isTyping: false,
          });
        }, 1500);
      }
    },
    [conversationId, username]
  );

  return {
    messages,
    loadingHistory,
    isConnected,
    isStaffTyping,
    unreadCount,
    sendMessage,
    sendTyping,
    markAsRead,
    reloadHistory: loadHistory,
  };
};

export default useChatMessage;
