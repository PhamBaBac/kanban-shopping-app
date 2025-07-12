import { useState, useEffect } from "react";
import { orderService } from "@/services/orderService";

export interface OrderItem {
  orderId: string;
  items: {
    image: string;
    title: string;
    size: string;
    qty: number;
    price: number;
    totalPrice: number;
    orderStatus: string;
    subProductId: string;
    isReviewed: boolean;
  }[];
  totalAmount: number;
  orderStatus: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
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
            qty: item.qty,
            price: item.price,
            totalPrice: item.totalPrice,
            orderStatus: item.orderStatus,
            subProductId: item.subProductId,
            isReviewed: item.isReviewed,
          });
          existingOrder.totalAmount += item.totalPrice;
        } else {
          orderMap.set(orderId, {
            orderId: orderId,
            items: [
              {
                image: item.image,
                title: item.title,
                size: item.size,
                qty: item.qty,
                price: item.price,
                totalPrice: item.totalPrice,
                orderStatus: item.orderStatus,
                subProductId: item.subProductId,
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
      setLoading(false);
    }
  };

  const handleOrderDeleted = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.orderId !== orderId)
    );
  };

  const handleOrderStatusChanged = (orderId: string, newStatus: string) => {
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
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    handleOrderDeleted,
    handleOrderStatusChanged,
  };
};
