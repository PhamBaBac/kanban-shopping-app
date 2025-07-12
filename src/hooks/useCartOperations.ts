import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { syncProducts } from "@/redux/reducers/cartReducer";
import { cartService } from "@/services/cartService";
import { getOrCreateSessionId } from "@/utils/session";

export const useCartOperations = () => {
  const dispatch = useDispatch();

  // Lấy cart từ database (cho user đã đăng nhập)
  const getCartInDatabase = async () => {
    try {
      const result = await cartService.getCart();
      if (result && result.length > 0) {
        dispatch(syncProducts(result));
      }
    } catch (error) {
      console.error("Failed to get cart", error);
    }
  };

  // Lấy cart từ Redis (cho user chưa đăng nhập)
  const getRedisCart = async () => {
    const sessionId = getOrCreateSessionId();
    try {
      const result = await cartService.getRedisCart(sessionId);
      const flatResult = Array.isArray(result) ? result.flat() : [result];

      flatResult.forEach((item: any) => {
        if (item && item.subProductId) {
          dispatch(syncProducts(flatResult));
        }
      });
    } catch (err) {
      console.error("Failed to fetch Redis cart", err);
    }
  };

  // Lấy cart theo ID
  const fetchCartById = async (cartId: string) => {
    try {
      const result = await cartService.getCartById(cartId);
      const flatResult = result.flat(); // Prevent nested arrays
      dispatch(syncProducts(flatResult));
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  return {
    getCartInDatabase,
    getRedisCart,
    fetchCartById,
  };
}; 