/** @format */

import { authSelector } from "@/redux/reducers/authReducer";
import { CartItemModel, removeProduct } from "@/redux/reducers/cartReducer";
import { Button, Modal } from "antd";
import { IoTrashOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { cartService } from "@/services";
import { showErrorMessage } from "@/utils/errorHandler";
import React from "react";

interface Props {
  item: CartItemModel;
  size?: "small" | "middle" | "large";
  style?: React.CSSProperties;
  className?: string;
}

const ButtonRemoveCartItem = (props: Props) => {
  const { item, size = "small", style, className } = props;
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const handleRemoveCartItem = async (targetItem: any) => {
    if (!auth.accessToken || !auth.userId) {
      try {
        const sessionId = localStorage.getItem("sessionId");
        await cartService.removeFromRedisCart(sessionId!, targetItem.subProductId);
        dispatch(removeProduct(targetItem));
      } catch (error: any) {
        console.error("Lỗi khi xóa cart Redis:", error);
        showErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng.");
      }
    } else {
      try {
        await cartService.removeFromCart(targetItem.id);
        dispatch(removeProduct(targetItem));
      } catch (error: any) {
        console.error("Lỗi khi xóa cart DB:", error);
        showErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng.");
      }
    }
  };

  return (
    <Button
      size={size}
      type="text"
      danger
      title="Xóa sản phẩm"
      onClick={() =>
        Modal.confirm({
          title: "Xác nhận xóa",
          content: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
          okText: "Xóa",
          cancelText: "Hủy",
          okButtonProps: { danger: true },
          onOk: async () => {
            await handleRemoveCartItem(item);
          },
        })
      }
      icon={<IoTrashOutline size={17} />}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        minWidth: 28,
        padding: 0,
        borderRadius: 6,
        ...style,
      }}
      className={className}
    />
  );
};

export default ButtonRemoveCartItem;
