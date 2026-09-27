/** @format */

import handleAPI from "@/apis/handleApi";
import { ProductModel } from "@/models/Products";

export interface WishlistToggleResult {
  productId: string;
  isFavorite: boolean;
  message: string;
}

export const wishlistService = {
  getWishlist: async (): Promise<ProductModel[]> => {
    try {
      const res = await handleAPI("/wishlists");
      return res.data || [];
    } catch (error) {
      console.error("Error fetching wishlist from server:", error);
      return [];
    }
  },

  getWishlistIds: async (): Promise<string[]> => {
    try {
      const res = await handleAPI("/wishlists/ids");
      return res.data || [];
    } catch (error) {
      console.error("Error fetching wishlist ids from server:", error);
      return [];
    }
  },

  toggleWishlist: async (productId: string): Promise<WishlistToggleResult | null> => {
    try {
      const res = await handleAPI("/wishlists/toggle", { productId }, "post");
      return res.data;
    } catch (error) {
      console.error("Error toggling wishlist on server:", error);
      return null;
    }
  },

  syncWishlist: async (productIds: string[]): Promise<string[]> => {
    try {
      const res = await handleAPI("/wishlists/sync", { productIds }, "post");
      return res.data || [];
    } catch (error) {
      console.error("Error syncing wishlist with server:", error);
      return [];
    }
  },

  removeFromWishlist: async (productId: string): Promise<boolean> => {
    try {
      await handleAPI(`/wishlists/${productId}`, undefined, "delete");
      return true;
    } catch (error) {
      console.error("Error removing from wishlist on server:", error);
      return false;
    }
  },

  clearWishlist: async (): Promise<boolean> => {
    try {
      await handleAPI("/wishlists/clear", undefined, "delete");
      return true;
    } catch (error) {
      console.error("Error clearing wishlist on server:", error);
      return false;
    }
  },

  getLikesCount: async (productId: string): Promise<number> => {
    try {
      const res = await handleAPI(`/wishlists/count/${productId}`);
      return res.data || 0;
    } catch (error) {
      console.error("Error getting likes count from server:", error);
      return 0;
    }
  },
};

export default wishlistService;
