import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { orderService } from "@/services/orderService";
import { authSelector } from "@/redux/reducers/authReducer";
import { getSharedSocket } from "@/connect/SocketIO";
import { NOTIFICATION_EVENT } from "./useNotification";

export interface OrderItem {
  orderId: string;
  trackingCode?: string;
  items: {
    image: string;
    title: string;
    size?: string;
    color?: string;
    attributes?: Record<string, any>;
    qty: number;
    price: number;
    totalPrice: number;
    orderStatus: string;
    subProductId: string;
    trackingCode?: string;
    isReviewed: boolean;
  }[];
  totalAmount: number;
  orderStatus: string;
}

export const useOrders = () => {
  const auth = useSelector(authSelector);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await orderService.getOrders();

      const orderMap = new Map();

      response.forEach((item: any) => {
        const orderId = item.orderId;

        if (orderMap.has(orderId)) {
          const existingOrder = orderMap.get(orderId);
          existingOrder.items.push({
            image: item.image,
            title: item.title,
            size: item.size,
            color: item.color,
            attributes: item.attributes,
            qty: item.qty,
            price: item.price,
            totalPrice: item.totalPrice,
            orderStatus: item.orderStatus,
            subProductId: item.subProductId,
            trackingCode: item.trackingCode,
            isReviewed: item.isReviewed,
          });
          existingOrder.totalAmount += item.totalPrice;
          if (item.trackingCode && !existingOrder.trackingCode) {
            existingOrder.trackingCode = item.trackingCode;
          }
        } else {
          orderMap.set(orderId, {
            orderId: orderId,
            trackingCode: item.trackingCode,
            items: [
              {
                image: item.image,
                title: item.title,
                size: item.size,
                color: item.color,
                attributes: item.attributes,
                qty: item.qty,
                price: item.price,
                totalPrice: item.totalPrice,
                orderStatus: item.orderStatus,
                subProductId: item.subProductId,
                trackingCode: item.trackingCode,
                isReviewed: item.isReviewed,
              },
            ],
            totalAmount: item.totalPrice,
            orderStatus: item.orderStatus,
          });
        }
      });

      const groupedOrders = Array.from(orderMap.values());
      setOrders(groupedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, []);

  const handleOrderDeleted = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.orderId !== orderId)
    );
  };

  const handleOrderStatusChanged = useCallback(
    (orderId: string, newStatus: string) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                orderStatus: newStatus,
                items: order.items.map((item) => ({
                  ...item,
                  orderStatus: newStatus,
                })),
              }
            : order
        )
      );
    },
    []
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime Socket listener for order status changes
  useEffect(() => {
    if (!auth?.userId) return;

    const socket = getSharedSocket(auth.accessToken);

    const handleConnect = () => {
      socket.emit("join_user_channel", { userId: auth.userId });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    // Direct event when order status changes (e.g. admin cancels or confirms)
    const handleOrderStatusUpdate = (data: {
      orderId: string;
      orderStatus: string;
      cancelReason?: string;
    }) => {
      if (data?.orderId && data?.orderStatus) {
        handleOrderStatusChanged(data.orderId, data.orderStatus);
        fetchOrders(true);
      }
    };

    // User notification socket event
    const handleUserNotification = (notify: any) => {
      if (
        notify?.type === "ORDER_STATUS" ||
        notify?.targetUrl?.includes("orders")
      ) {
        fetchOrders(true);
      }
    };

    socket.on("order_status_updated", handleOrderStatusUpdate);
    socket.on("user_notification", handleUserNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("order_status_updated", handleOrderStatusUpdate);
      socket.off("user_notification", handleUserNotification);
    };
  }, [auth?.userId, auth?.accessToken, handleOrderStatusChanged, fetchOrders]);

  // Sync across tabs and listen to notification event
  useEffect(() => {
    const handleSync = () => {
      fetchOrders(true);
    };

    window.addEventListener(NOTIFICATION_EVENT, handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    handleOrderDeleted,
    handleOrderStatusChanged,
  };
};
