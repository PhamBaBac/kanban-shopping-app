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
  title: string;
  productId: string | null;
  image: string;
  id: string | null; // Có thể null nếu chưa login
}

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

      const index = items.findIndex(
        (el) =>
          el.subProductId === item.subProductId &&
          (el.id === item.id || el.id === null || item.id === null)
      );

      if (index !== -1) {
        items[index].count += item.count;
      } else {
        items.push(item);
      }

      state.data = items;
    },

    removeProduct: (state, action) => {
      const { id, subProductId } = action.payload;
      state.data = state.data.filter(
        (el) =>
          !(
            el.subProductId === subProductId &&
            (el.id === id || el.id === null || id === null)
          )
      );
    },

    changeProduct: (state, action) => {
      const { id, subProductId, data } = action.payload;
      const index = state.data.findIndex(
        (el) =>
          el.subProductId === subProductId &&
          (el.id === id || el.id === null || id === null)
      );

      if (index !== -1) {
        state.data[index] = { ...data, id };
      }
    },

    changeCount: (state, action) => {
      const { id, subProductId, val } = action.payload;
      const index = state.data.findIndex(
        (el) =>
          el.subProductId === subProductId &&
          (el.id === id || el.id === null || id === null)
      );

      if (index !== -1) {
        state.data[index].count += val;
      }
    },

    syncProducts: (state, action) => {
      state.data = action.payload;
    },

    removeCarts: (state) => {
      state.data = [];
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
