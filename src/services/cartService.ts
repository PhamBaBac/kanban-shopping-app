import handleAPI from "@/apis/handleApi";

export interface CartItem {
  id?: string;
  subProductId: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  count: number;
  size: string;
  color: string;
  qty: number;
}

export interface UpdateCartItemData {
  id?: string;
  subProductId: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  count: number;
  size: string;
  color: string;
  qty: number;
}

export const cartService = {
  // Lấy cart từ database
  getCart: async (): Promise<CartItem[]> => {
    const res = await handleAPI("/carts");
    return res.data || [];
  },

  // Lấy cart từ Redis
  getRedisCart: async (sessionId: string): Promise<CartItem[]> => {
    const res = await handleAPI(`/redisCarts?sessionId=${sessionId}`);
    return res.data || [];
  },

  // Lấy cart theo ID
  getCartById: async (cartId: string): Promise<CartItem[]> => {
    const res = await handleAPI(`/carts/${cartId}`);
    return res.data || [];
  },

  // Thêm sản phẩm vào cart
  addToCart: async (data: CartItem): Promise<any> => {
    const res = await handleAPI("/carts/add", data, "post");
    return res.data;
  },

  // Thêm sản phẩm vào Redis cart
  addToRedisCart: async (sessionId: string, data: CartItem): Promise<any> => {
    const res = await handleAPI(
      `/redisCarts?sessionId=${sessionId}`,
      data,
      "post"
    );
    return res.data;
  },

  // Cập nhật cart item
  updateCartItem: async (
    id: string,
    data: UpdateCartItemData
  ): Promise<any> => {
    const res = await handleAPI(`/carts/updateFull?id=${id}`, data, "put");
    return res.data;
  },

  // Cập nhật Redis cart item
  updateRedisCartItem: async (
    sessionId: string,
    currentSubProductId: string,
    data: UpdateCartItemData
  ): Promise<any> => {
    const res = await handleAPI(
      `/redisCarts/updateFull?sessionId=${sessionId}&currentSubProductId=${currentSubProductId}`,
      data,
      "put"
    );
    return res.data;
  },

  // Xóa sản phẩm khỏi cart
  removeFromCart: async (id: string): Promise<any> => {
    const res = await handleAPI(`/carts/${id}`, {}, "delete");
    return res.data;
  },

  // Xóa sản phẩm khỏi Redis cart
  removeFromRedisCart: async (
    sessionId: string,
    subProductId: string
  ): Promise<any> => {
    const res = await handleAPI(
      `/redisCarts?sessionId=${sessionId}&subProductId=${subProductId}`,
      {},
      "delete"
    );
    return res.data;
  },

  // Xóa toàn bộ cart
  clearCart: async (): Promise<any> => {
    const res = await handleAPI("/carts", {}, "delete");
    return res.data;
  },

  // Xóa toàn bộ Redis cart
  clearRedisCart: async (sessionId: string): Promise<any> => {
    const res = await handleAPI(
      `/redisCarts?sessionId=${sessionId}`,
      {},
      "delete"
    );
    return res.data;
  },
};
