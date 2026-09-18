import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import { authSelector } from "@/redux/reducers/authReducer";
import { showErrorMessage } from "@/utils/errorHandler";
import {
  addProduct,
  changeCount,
  cartSelector,
  CartItemModel,
} from "@/redux/reducers/cartReducer";
import { cartService } from "@/services/cartService";
import { getOrCreateSessionId } from "@/utils/session";
import { SubProductModel, ProductModel } from "@/models/Products";

interface UseCartProps {
  subProductSelected: SubProductModel | undefined;
  product: ProductModel;
}

interface UseCartReturn {
  count: number;
  setCount: (count: number) => void;
  instockQuantity: number;
  handleCart: () => Promise<void>;
}

export const useCart = ({
  subProductSelected,
  product,
}: UseCartProps): UseCartReturn => {
  const [count, setCount] = useState(1);
  const [instockQuantity, setInstockQuantity] = useState(
    subProductSelected?.stock ?? 0
  );

  const auth = useSelector(authSelector);
  const cart: CartItemModel[] = useSelector(cartSelector);
  const dispatch = useDispatch();

  // Reset count when sub product changes
  useEffect(() => {
    setCount(1);
  }, [subProductSelected]);

  // Calculate available quantity
  useEffect(() => {
    const item = cart.find((el) => el.subProductId === subProductSelected?.id);
    if (subProductSelected) {
      if (item) {
        setInstockQuantity(subProductSelected.stock - item.count);
      } else {
        setInstockQuantity(subProductSelected.stock);
      }
    }
  }, [cart, subProductSelected]);

  const handleCart = async () => {
    if (!subProductSelected) {
      message.error("Vui lòng chọn phân loại / biến thể sản phẩm!");
      return;
    }

    const isLoggedIn = auth.userId && auth.accessToken;
    const sessionId = getOrCreateSessionId();

    // Parse attributes from subProductSelected
    let attrs: Record<string, any> = {};
    if (subProductSelected.attributes) {
      if (typeof subProductSelected.attributes === "string") {
        try {
          attrs = JSON.parse(subProductSelected.attributes);
        } catch (e) {
          attrs = {};
        }
      } else if (typeof subProductSelected.attributes === "object") {
        attrs = subProductSelected.attributes;
      }
    }

    // Resolve color
    let resolvedColor = subProductSelected.color || "";
    if (!resolvedColor) {
      for (const [key, val] of Object.entries(attrs)) {
        const lowerKey = key.trim().toLowerCase();
        if (
          lowerKey.includes("màu") ||
          lowerKey.includes("color") ||
          lowerKey.includes("colour")
        ) {
          resolvedColor = String(val);
          break;
        }
      }
    }

    // Resolve size / specs
    const nonColorList: string[] = [];
    for (const [key, val] of Object.entries(attrs)) {
      const lowerKey = key.trim().toLowerCase();
      if (
        !lowerKey.includes("màu") &&
        !lowerKey.includes("color") &&
        !lowerKey.includes("colour")
      ) {
        if (val) nonColorList.push(String(val));
      }
    }

    let resolvedSize = "";
    if (nonColorList.length > 0) {
      resolvedSize = nonColorList.join(" - ");
    } else if (subProductSelected.size) {
      resolvedSize = subProductSelected.size;
    }

    const resolvedImage =
      subProductSelected.imgURL ||
      subProductSelected.images?.[0] ||
      product.images?.[0] ||
      "";

    const value = {
      createdBy: isLoggedIn ? auth.userId : sessionId,
      count,
      subProductId: subProductSelected.id,
      size: resolvedSize,
      title: product.title,
      color: resolvedColor,
      price: subProductSelected.discount ?? subProductSelected.price,
      qty: subProductSelected.stock,
      productId: product.id,
      image: resolvedImage,
    };

    const index = cart.findIndex(
      (el) => el.subProductId === value.subProductId
    );

    try {
      if (index !== -1 && cart[index]) {
        // Update existing cart item
        if (isLoggedIn && cart[index].id) {
          await cartService.updateCartItem(cart[index].id!, value);
          dispatch(
            changeCount({
              id: cart[index].id,
              subProductId: cart[index].subProductId,
              val: count,
            })
          );
        } else if (!isLoggedIn) {
          // For non-logged in users, update Redis cart
          await cartService.updateRedisCartItem(
            sessionId,
            cart[index].subProductId,
            value
          );
          dispatch(
            changeCount({
              id: null,
              subProductId: cart[index].subProductId,
              val: count,
            })
          );
        }
      } else {
        // Add new cart item
        if (isLoggedIn) {
          const res = await cartService.addToCart(value);
          if (res?.id) {
            dispatch(addProduct({ ...value, id: res.id }));
          } else {
            message.warning("Add to cart but no ID returned!");
          }
        } else {
          await cartService.addToRedisCart(sessionId, value);
          dispatch(addProduct(value));
        }
      }
      setCount(1);
    } catch (error: any) {
      showErrorMessage(error, "Thêm vào giỏ hàng thất bại. Vui lòng thử lại!");
    }
  };

  return {
    count,
    setCount,
    instockQuantity,
    handleCart,
  };
};
