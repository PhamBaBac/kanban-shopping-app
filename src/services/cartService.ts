import handleAPI from "@/apis/handleApi";

export interface CartItem {
  id?: string | null;
  subProductId: string;
  productId?: string | null;
  title: string;
  image: string;
  price: number;
  count: number;
  size: string;
  color: string;
  qty: number;
}

export interface UpdateCartItemData {
  id?: string | null;
  subProductId: string;
  productId?: string | null;
  title: string;
  image: string;
  price: number;
  count: number;
  size: string;
  color: string;
  qty: number;
}

export const cartService = {
  getCart: async (): Promise<CartItem[]> => {
    const res = await handleAPI("/carts");
    return res.data || [];
  },

  getRedisCart: async (sessionId: string): Promise<CartItem[]> => {
    const res = await handleAPI(`/redisCarts?sessionId=${sessionId}`);
    return res.data || [];
  },

  getCartById: async (cartId: string): Promise<CartItem[]> => {
    const res = await handleAPI(`/carts/${cartId}`);
    return res.data || [];
  },

  addToCart: async (data: CartItem): Promise<any> => {
    const res = await handleAPI("/carts/add", data, "post");
    return res.data;
  },

  addToRedisCart: async (sessionId: string, data: CartItem): Promise<any> => {
    const res = await handleAPI(
      `/redisCarts?sessionId=${sessionId}`,
      data,
      "post"
    );
    return res.data;
  },

  updateCartItem: async (
    id: string,
    data: UpdateCartItemData
  ): Promise<any> => {
    const res = await handleAPI(`/carts/updateFull?id=${id}`, data, "put");
    return res.data;
  },

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

  removeFromCart: async (id: string): Promise<any> => {
    const res = await handleAPI(`/carts/${id}`, {}, "delete");
    return res.data;
  },

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

  clearCart: async (): Promise<any> => {
    const res = await handleAPI("/carts", {}, "delete");
    return res.data;
  },

  clearRedisCart: async (sessionId: string): Promise<any> => {
    const res = await handleAPI(
      `/redisCarts?sessionId=${sessionId}`,
      {},
      "delete"
    );
    return res.data;
  },
};
