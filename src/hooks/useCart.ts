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
import { buildCartItemPayload } from "@/utils/cartItemHelper";
import { SubProductModel, ProductModel } from "@/models/Products";

interface UseCartProps {
  subProductSelected: SubProductModel | undefined;
  product: ProductModel;
}

interface UseCartReturn {
  count: number;
  setCount: (count: number) => void;
  instockQuantity: number;
  handleCart: () => Promise<boolean>;
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

  useEffect(() => {
    setCount(1);
  }, [subProductSelected]);

  useEffect(() => {
    const targetSubProductId =
      subProductSelected?.id ||
      (subProductSelected as any)?._id ||
      (subProductSelected as any)?.subProductId;
    const item = cart.find((el) => el.subProductId === targetSubProductId);
    if (subProductSelected) {
      if (item) {
        setInstockQuantity(subProductSelected.stock - item.count);
      } else {
        setInstockQuantity(subProductSelected.stock);
      }
    }
  }, [cart, subProductSelected]);

  const handleCart = async (): Promise<boolean> => {
    const targetSubProductId =
      subProductSelected?.id ||
      (subProductSelected as any)?._id ||
      (subProductSelected as any)?.subProductId;

    if (!subProductSelected || !targetSubProductId) {
      message.error("Vui lòng chọn đầy đủ phân loại / biến thể sản phẩm!");
      return false;
    }

    const isLoggedIn = auth.userId && auth.accessToken;
    const sessionId = getOrCreateSessionId();

    const value = buildCartItemPayload({
      subProduct: subProductSelected,
      product,
      count,
      createdBy: isLoggedIn ? auth.userId : sessionId,
    });

    const index = cart.findIndex(
      (el) => el.subProductId === value.subProductId
    );

    try {
      if (index !== -1 && cart[index]) {
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
      return true;
    } catch (error: any) {
      showErrorMessage(error, "Thêm vào giỏ hàng thất bại. Vui lòng thử lại!");
      return false;
    }
  };

  return {
    count,
    setCount,
    instockQuantity,
    handleCart,
  };
};
