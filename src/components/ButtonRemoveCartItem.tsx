/** @format */

import handleAPI from "@/apis/handleApi";
import { authSelector } from "@/redux/reducers/authReducer";
import { CartItemModel, removeProduct } from "@/redux/reducers/cartReducer";
import { Button, Modal, message } from "antd";
import { IoTrash } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";

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
        console.log("sessionId", sessionId); // hoặc nơi bạn lưu sessionId
        const res = await handleAPI(
          `/redisCarts/remove?sessionId=${sessionId}&cartId=${item.subProductId}`,
          null,
          "delete"
        );
        dispatch(removeProduct(item));
      } catch (error: any) {
        console.error("Lỗi khi xóa cart Redis:", error);
        if (error?.code === 1012) {
          message.error("Product not found in cart.");
        } else if (error?.message) {
          message.error(error.message);
        } else {
          message.error("Failed to remove item from cart.");
        }
      }
    } else {
      try {
        await handleAPI(`/carts/remove?id=${item.id}`, null, "delete");
        dispatch(removeProduct(item));
      } catch (error: any) {
        console.error("Lỗi khi xóa cart DB:", error);
        if (error?.code === 1020) {
          message.error("Cart item not found.");
        } else if (error?.message) {
          message.error(error.message);
        } else {
          message.error("Failed to remove item from cart.");
        }
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
