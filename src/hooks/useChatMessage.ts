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

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    setUnreadCount(0);
    try {
      await supportService.markAsRead(conversationId);
    } catch (error) {
      console.error("Lỗi markAsRead:", error);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isChatOpen && conversationId) {
      markAsRead();
    }
  }, [isChatOpen, conversationId, markAsRead]);

  useEffect(() => {
    if (!userId) {
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
      socket.emit("join_conversation", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("receive_message", (receivedMsg: SupportMessage) => {
      if (receivedMsg.conversationId === conversationId) {
        setMessages((prev) => {
          if (receivedMsg.id && prev.some((m) => m.id === receivedMsg.id)) {
            return prev;
          }
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

        if (receivedMsg.role !== "USER") {
          setIsStaffTyping(false);
          if (!isChatOpenRef.current) {
            setUnreadCount((c) => c + 1);
          }
        }
      }
    });

    socket.on("user_typing", (data: { conversationId: string; isTyping: boolean; senderId?: string; role?: string }) => {
      if (data.senderId && data.senderId === userId) return;
      if (data.role && data.role === "USER") return;

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

  const sendMessage = useCallback(
    async (content: string, images?: string[], type?: "TEXT" | "IMAGE" | "FILE") => {
      const trimmed = content ? content.trim() : "";
      const hasImages = Array.isArray(images) && images.length > 0;
      if ((!trimmed && !hasImages) || !userId) return;

      const messageType: "TEXT" | "IMAGE" | "FILE" = type || (hasImages ? "IMAGE" : "TEXT");

      const payload: SendMessageRequest = {
        conversationId,
        senderId: userId,
        receiverId: undefined,
        username: username || "Khách hàng",
        avatar: avatar || "",
        role: "USER",
        content: trimmed,
        type: messageType,
        images: hasImages ? images.slice(0, 5) : undefined,
      };

      const optimisticMsg: SupportMessage = {
        ...payload,
        conversationId,
        status: "SENT",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      if (socketRef.current && isConnected) {
        socketRef.current.emit("send_message", payload);
      } else {
        try {
          const saved = await supportService.sendMessage(payload);
          if (saved) {
            setMessages((prev) =>
              prev.map((m) =>
                !m.id && (m.content === trimmed || (hasImages && m.images === images))
                  ? { ...m, id: saved.id, images: saved.images, type: saved.type }
                  : m
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

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || !conversationId) return;

      socketRef.current.emit("typing", {
        conversationId,
        senderId: userId,
        role: "USER",
        username: username || "Khách hàng",
        isTyping,
      });

      if (isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          socketRef.current?.emit("typing", {
            conversationId,
            senderId: userId,
            role: "USER",
            username: username || "Khách hàng",
            isTyping: false,
          });
        }, 1500);
      }
    },
    [conversationId, username, userId]
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
