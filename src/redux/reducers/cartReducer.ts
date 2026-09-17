/** @format */

import { createSlice } from "@reduxjs/toolkit";

export interface CartItemModel {
  createdBy: string;
  count: number;
  subProductId: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  stock?: number;
  isDeleted?: boolean;
  title: string;
  productId: string | null;
  image: string;
  slug: string;
  id: string | null; // Can be null if not logged in
  addressId?: string;
  discountValue?: DiscountValue;
}

export interface DiscountValue {
  value: number;
  type: string;
}

const CART_STORAGE_KEY = "kanban_cart_items";

const saveCartToStorage = (items: CartItemModel[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }
};

export const getSavedCartFromStorage = (): CartItemModel[] => {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to read cart from localStorage", e);
    }
  }
  return [];
};

const initialState: CartItemModel[] = [];

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    data: initialState,
  },
  reducers: {
    addProduct: (state, action) => {
      const item: CartItemModel = action.payload;
      const items = [...state.data];

      // Cart items represent unique subProductId
      const index = items.findIndex(
        (el) => el.subProductId === item.subProductId
      );

      if (index !== -1) {
        items[index].count += item.count;
        if (!items[index].id && item.id) {
          items[index].id = item.id;
        }
      } else {
        items.push(item);
      }

      state.data = items;
      saveCartToStorage(items);
    },

    removeProduct: (state, action) => {
      const { id, subProductId } = action.payload || {};
      state.data = state.data.filter(
        (el) => {
          if (subProductId && el.subProductId === subProductId) return false;
          if (id && el.id === id) return false;
          return true;
        }
      );
      saveCartToStorage(state.data);
    },

    changeProduct: (state, action) => {
      const { id, subProductId, data } = action.payload;
      const index = state.data.findIndex(
        (el) => (id && el.id === id) || el.subProductId === subProductId
      );

      if (index !== -1) {
        state.data[index] = { ...data, id: id || state.data[index].id };
        saveCartToStorage(state.data);
      }
    },

    changeCount: (state, action) => {
      const { id, subProductId, val } = action.payload;
      const index = state.data.findIndex(
        (el) => (id && el.id === id) || el.subProductId === subProductId
      );

      if (index !== -1) {
        state.data[index].count += val;
        saveCartToStorage(state.data);
      }
    },

    syncProducts: (state, action) => {
      state.data = action.payload || [];
      saveCartToStorage(state.data);
    },

    removeCarts: (state) => {
      state.data = [];
      saveCartToStorage([]);
    },
  },
});

export const cartReducer = cartSlice.reducer;
export const {
  addProduct,
  syncProducts,
  removeProduct,
  changeCount,
  changeProduct,
  removeCarts,
} = cartSlice.actions;

export const cartSelector = (state: any) => state.cart.data;
