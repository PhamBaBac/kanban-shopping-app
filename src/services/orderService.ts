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
}

export const orderService = {
  // Lấy danh sách orders
  getOrders: async (): Promise<OrderItem[]> => {
    const res = await handleAPI("/orders/listOrders");
    return res.data || [];
  },

  // Lấy chi tiết order
  getOrderDetail: async (orderId: string): Promise<any> => {
    const res = await handleAPI(`/orders/${orderId}`, {}, "get");
    return res.data;
  },

  // Tạo order mới
  createOrder: async (data: CreateOrderData): Promise<any> => {
    const res = await handleAPI(
      `/orders/create?paymentType=${data.paymentType}`,
      data,
      "post"
    );
    return res.data;
  },

  // Hủy order
  cancelOrder: async (orderId: string): Promise<any> => {
    const res = await handleAPI(`/orders/${orderId}/cancel`, {}, "patch");
    return res.data;
  },

  // Xóa order
  deleteOrder: async (orderId: string): Promise<any> => {
    const res = await handleAPI(`/orders/${orderId}`, {}, "delete");
    return res.data;
  },
};
