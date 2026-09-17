import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import {
  CartItemModel,
  cartSelector,
  removeProduct,
  syncProducts,
} from "@/redux/reducers/cartReducer";
import { authSelector } from "@/redux/reducers/authReducer";
import { productService } from "@/services/productService";
import { cartService } from "@/services/cartService";

export const isItemDeleted = (item: CartItemModel): boolean => {
  return Boolean(item.isDeleted);
};

export const isItemSoldOut = (item: CartItemModel): boolean => {
  if (isItemDeleted(item)) return false;
  if (item.stock !== undefined && item.stock <= 0) return true;
  if (item.qty === 0) return true;
  return false;
};

export const isItemInvalid = (item: CartItemModel): boolean => {
  return isItemDeleted(item) || isItemSoldOut(item);
};

export const useCartValidation = () => {
  const carts: CartItemModel[] = useSelector(cartSelector);
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const [isValidating, setIsValidating] = useState(false);
  const validatingRef = useRef(false);

  const validateCart = useCallback(async () => {
    if (!carts || carts.length === 0 || validatingRef.current) return;

    validatingRef.current = true;
    setIsValidating(true);

    try {
      // Nhóm theo productId để giảm số lượng request gọi API
      const productIds = Array.from(
        new Set(
          carts
            .map((c) => c.productId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const productResults: Record<
        string,
        { success: boolean; subProducts: any[] }
      > = {};

      await Promise.allSettled(
        productIds.map(async (pId) => {
          try {
            const subProducts = await productService.getSubProductsByProductId(pId);
            productResults[pId] = {
              success: true,
              subProducts: subProducts || [],
            };
          } catch (e) {
            productResults[pId] = { success: false, subProducts: [] };
          }
        })
      );

      let hasChanges = false;
      const updatedCarts = carts.map((item) => {
        let isDeleted = Boolean(item.isDeleted);
        let stock = item.stock ?? item.qty;
        let qty = item.qty;

        if (item.productId && productResults[item.productId]) {
          const res = productResults[item.productId];
          if (!res.success) {
            // Sản phẩm đã bị xóa hoặc không tìm thấy
            isDeleted = true;
            stock = 0;
            qty = 0;
          } else {
            const matchedSub = res.subProducts.find(
              (sp: any) => sp.id === item.subProductId
            );
            if (!matchedSub) {
              // Biến thể (subProduct) đã bị xóa
              isDeleted = true;
              stock = 0;
              qty = 0;
            } else {
              isDeleted = false;
              stock = matchedSub.stock ?? matchedSub.qty ?? 0;
              qty = stock;
            }
          }
        }

        if (
          item.isDeleted !== isDeleted ||
          item.stock !== stock ||
          item.qty !== qty
        ) {
          hasChanges = true;
          return {
            ...item,
            isDeleted,
            stock,
            qty,
          };
        }

        return item;
      });

      if (hasChanges) {
        dispatch(syncProducts(updatedCarts));
      }
    } catch (error) {
      console.error("Lỗi kiểm tra giỏ hàng:", error);
    } finally {
      validatingRef.current = false;
      setIsValidating(false);
    }
  }, [carts, dispatch]);

  useEffect(() => {
    validateCart();
  }, [carts.length]);

  const invalidItems = carts.filter(isItemInvalid);
  const hasInvalidItems = invalidItems.length > 0;

  const removeAllInvalidItems = async () => {
    if (invalidItems.length === 0) return;

    for (const item of invalidItems) {
      try {
        if (!auth.accessToken || !auth.userId) {
          const sessionId = localStorage.getItem("sessionId");
          if (sessionId) {
            await cartService.removeFromRedisCart(sessionId, item.subProductId);
          }
        } else if (item.id) {
          await cartService.removeFromCart(item.id);
        }
      } catch (err) {
        console.error("Lỗi khi xóa sản phẩm không hợp lệ:", err);
      }
      dispatch(removeProduct(item));
    }
    message.success("Đã xóa tất cả sản phẩm không khả dụng khỏi giỏ hàng!");
  };

  return {
    carts,
    isValidating,
    invalidItems,
    hasInvalidItems,
    isItemDeleted,
    isItemSoldOut,
    isItemInvalid,
    validateCart,
    removeAllInvalidItems,
  };
};
