/** @format */

import handleAPI from '@/apis/handleApi';
import { authSelector } from '@/redux/reducers/authReducer';
import { CartItemModel, removeProduct } from '@/redux/reducers/cartReducer';
import { Button, Modal } from 'antd';
import { IoTrash } from 'react-icons/io5';
import { useDispatch, useSelector } from 'react-redux';

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
      } catch (error) {
        console.error("Lỗi khi xóa cart Redis:", error);
      }
    } else {
      try {
        await handleAPI(`/carts/remove?id=${item.id}`, null, "delete");
        dispatch(removeProduct(item));
      } catch (error) {
        console.error("Lỗi khi xóa cart DB:", error);
      }
    }
  };


	return (
		<Button
			onClick={() =>
				Modal.confirm({
					title: 'Confirm',
					content: 'Are you sure you want to remove this item?',
					onOk: async () => {
						await handleRemoveCartItem(item);
					},
				})
			}
			icon={<IoTrash size={22} />}
			danger
			type='text'
		/>
	);
};

export default ButtonRemoveCartItem;
