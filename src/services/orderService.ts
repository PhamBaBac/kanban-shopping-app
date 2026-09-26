import handleAPI from "@/apis/handleApi";

export interface OrderItem {
  orderId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: any[];
}

export interface CreateOrderData {
  addressId: string;
  items: any[];
  paymentType: string;
  idempotencyKey?: string;
}

export const orderService = {
  getOrders: async (): Promise<OrderItem[]> => {
    const res = await handleAPI("/orders/listOrders");
    return res.data || [];
  },

  getOrderDetail: async (orderId: string): Promise<any> => {
    const res = await handleAPI(`/orders/${orderId}`, {}, "get");
    return res.data;
  },

  createOrder: async (data: CreateOrderData): Promise<any> => {
    const idempotencyKey =
      data.idempotencyKey ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    const res = await handleAPI(
      `/orders/create?paymentType=${data.paymentType}`,
      data,
      "post",
      { "Idempotency-Key": idempotencyKey }
    );
    return res.data;
  },

  cancelOrder: async (orderId: string): Promise<any> => {
    const res = await handleAPI(`/orders/${orderId}/cancel`, {}, "patch");
    return res.data;
  },

  deleteOrder: async (orderId: string): Promise<any> => {
    const res = await handleAPI(`/orders/${orderId}`, {}, "delete");
    return res.data;
  },

  getTrackingByCode: async (trackingCode: string): Promise<any> => {
    const res: any = await handleAPI(`/shipping/tracking/${trackingCode}`, {}, "get");
    return res?.data !== undefined ? res.data : res;
  },

  getOrderTracking: async (orderId: string): Promise<any> => {
    const res: any = await handleAPI(`/shipping/order/${orderId}`, {}, "get");
    return res?.data !== undefined ? res.data : res;
  },
};
