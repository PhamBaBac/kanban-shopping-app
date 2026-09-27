/** @format */

import { ProductModel } from "@/models/Products";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

const GUEST_STORAGE_KEY = "kanban_wishlist_guest";

const getStorageKey = (userId?: string | null): string => {
  if (userId && userId.trim() !== "") {
    return `kanban_wishlist_${userId}`;
  }
  return GUEST_STORAGE_KEY;
};

export const loadWishlistFromStorage = (userId?: string | null): ProductModel[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    let items: ProductModel[] = data ? JSON.parse(data) : [];

    // If logged in, merge any items from guest wishlist for immediate optimistic display
    if (userId && userId.trim() !== "") {
      const guestData = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guestData) {
        try {
          const guestItems: ProductModel[] = JSON.parse(guestData);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            const existingIds = new Set(items.map((i) => i.id));
            const merged = [...items];
            guestItems.forEach((g) => {
              if (g?.id && !existingIds.has(g.id)) {
                merged.push(g);
                existingIds.add(g.id);
              }
            });
            items = merged;
          }
        } catch (e) {
          console.error("Failed to parse guest wishlist:", e);
        }
      }
    }

    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error("Failed to load wishlist from localStorage:", error);
    return [];
  }
};

const saveWishlistToStorage = (items: ProductModel[], userId?: string | null) => {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save wishlist to localStorage:", error);
  }
};

interface WishlistState {
  items: ProductModel[];
  ids: string[];
}

const initialState: WishlistState = {
  items: [],
  ids: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    loadWishlist: (
      state,
      action: PayloadAction<{ userId?: string | null }>
    ) => {
      const items = loadWishlistFromStorage(action.payload.userId);
      state.items = items;
      state.ids = items.map((item) => item.id);
    },
    toggleWishlist: (
      state,
      action: PayloadAction<{ product: ProductModel; userId?: string | null }>
    ) => {
      const { product, userId } = action.payload;
      if (!product || !product.id) return;

      const existsIndex = state.items.findIndex((i) => i.id === product.id);
      if (existsIndex >= 0) {
        state.items.splice(existsIndex, 1);
        state.ids = state.ids.filter((id) => id !== product.id);
      } else {
        state.items.unshift(product);
        state.ids.unshift(product.id);
      }
      saveWishlistToStorage(state.items, userId);
    },
    removeWishlist: (
      state,
      action: PayloadAction<{ productId: string; userId?: string | null }>
    ) => {
      const { productId, userId } = action.payload;
      state.items = state.items.filter((item) => item.id !== productId);
      state.ids = state.ids.filter((id) => id !== productId);
      saveWishlistToStorage(state.items, userId);
    },
    clearWishlist: (
      state,
      action: PayloadAction<{ userId?: string | null }>
    ) => {
      state.items = [];
      state.ids = [];
      if (typeof window !== "undefined") {
        try {
          const key = getStorageKey(action.payload.userId);
          localStorage.removeItem(key);
        } catch (e) {
          console.error("Failed to clear wishlist storage", e);
        }
      }
    },
    setWishlistFromServer: (
      state,
      action: PayloadAction<{ items: ProductModel[]; userId?: string | null }>
    ) => {
      state.items = action.payload.items;
      state.ids = action.payload.items.map((i) => i.id);
      saveWishlistToStorage(state.items, action.payload.userId);
    },
  },
});

export const {
  loadWishlist,
  toggleWishlist,
  removeWishlist,
  clearWishlist,
  setWishlistFromServer,
} = wishlistSlice.actions;

export const wishlistReducer = wishlistSlice.reducer;
export const wishlistItemsSelector = (state: RootState): ProductModel[] =>
  state.wishlist?.items || [];
export const wishlistIdsSelector = (state: RootState): string[] =>
  state.wishlist?.ids || [];
export const wishlistCountSelector = (state: RootState): number =>
  state.wishlist?.items?.length || 0;
