/** @format */

import { authSelector } from "@/redux/reducers/authReducer";
import { CartItemModel, removeProduct } from "@/redux/reducers/cartReducer";
import { Button, Modal, message } from "antd";
import { IoTrash } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { cartService } from "@/services";
import { showErrorMessage } from "@/utils/errorHandler";

interface Props {
  item: CartItemModel;
}

const ButtonRemoveCartItem = (props: Props) => {
  const { item } = props;
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const handleRemoveCartItem = async (item: any) => {
    if (!auth.accessToken || !auth.userId) {
      try {
        const sessionId = localStorage.getItem("sessionId");
        const res = await cartService.removeFromRedisCart(sessionId!, item.subProductId);
        dispatch(removeProduct(item));
      } catch (error: any) {
        console.error("Lỗi khi xóa cart Redis:", error);
        showErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng.");
      }
    } else {
      try {
        await cartService.removeFromCart(item.id);
        dispatch(removeProduct(item));
      } catch (error: any) {
        console.error("Lỗi khi xóa cart DB:", error);
        showErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng.");
      }
    }
  };

  return (
    <Button
      onClick={() =>
        Modal.confirm({
          title: "Confirm",
          content: "Are you sure you want to remove this item?",
          onOk: async () => {
            await handleRemoveCartItem(item);
          },
        })
      }
      icon={<IoTrash size={22} />}
      danger
      type="text"
    />
  );
};

export default ButtonRemoveCartItem;
