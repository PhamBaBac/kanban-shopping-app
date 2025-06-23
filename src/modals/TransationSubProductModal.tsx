/** @format */

import handleAPI from "@/apis/handleApi";
import { SubProductModel } from "@/models/Products";
import { authSelector } from "@/redux/reducers/authReducer";
import {
  addProduct,
  CartItemModel,
  cartSelector,
  removeProduct,
} from "@/redux/reducers/cartReducer";
import { Button, message, Modal, Space, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface Props {
  visible: boolean;
  onClose: () => void;
  productSelected: CartItemModel; // giữ CartItemModel nếu bạn có interface đó
}

const TransationSubProductModal = ({
  visible,
  onClose,
  productSelected,
}: Props) => {
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [itemSelected, setItemSelected] = useState<SubProductModel>();
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);

  useEffect(() => {
    if (productSelected?.productId) {
      getProductDetail();
    }
  }, [productSelected]);

  const getProductDetail = async () => {
    try {
      const res: any = await handleAPI(
        `/subProducts/get-all-sub-product/${productSelected.productId}`
      );
      const updated = res.result.map((sub: any) => ({
        ...sub,
        productId: productSelected.productId,
      }));
      setSubProducts(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeSubProduct = async () => {
    if (!itemSelected) return;

    const item = itemSelected;
    const newCount =
      productSelected.count > item.qty ? item.qty : productSelected.count;

    if (productSelected.count > item.qty) {
      message.warning(
        `Số lượng bạn chọn vượt quá tồn kho hiện tại. Đã giảm còn ${item.qty}`
      );
    }

    const updatedItem = {
      ...productSelected,
      count: newCount,
      subProductId: item.id,
      size: item.size,
      color: item.color,
      price: item.discount ?? item.price,
      qty: item.qty,
      productId: item.productId,
      image: item.images[0] ?? "",
    };

    try {
      if (auth.userId) {
        await handleAPI(
          `/carts/updateFull?id=${productSelected.id}`,
          updatedItem,
          "put"
        );

        dispatch(
          removeProduct({
            id: productSelected.id,
            subProductId: productSelected.subProductId,
          })
        );
        dispatch(addProduct(updatedItem));
      } else {
        const sessionId = localStorage.getItem("sessionId");

        if (!sessionId) {
          message.error("Phiên chưa được tạo. Không thể thay đổi sản phẩm.");
          return;
        }

        await handleAPI(
          `/redisCarts/updateFull?sessionId=${sessionId}&currentSubProductId=${productSelected.subProductId}`,
          updatedItem,
          "put"
        );

        // Không có id khi lưu Redis nên chỉ dùng subProductId làm key
        dispatch(
          removeProduct({
            subProductId: productSelected.subProductId,
          })
        );
        dispatch(addProduct(updatedItem));
      }

      setItemSelected(undefined);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      onOk={handleChangeSubProduct}
      open={visible}
      onCancel={() => {
        setItemSelected(undefined);
        onClose();
      }}
      title="Chuyển biến thể"
    >
      {itemSelected?.images?.[0] && (
        <img
          src={itemSelected.images[0]}
          alt=""
          style={{
            width: 100,
            height: 120,
            objectFit: "cover",
          }}
        />
      )}
      <div className="mt-4">
        <Typography.Title level={4}>Sizes</Typography.Title>
        <Space wrap>
          {subProducts.map(
            (item) =>
              productSelected.size !== item.size && (
                <Button
                  key={`size-${item.id}`}
                  onClick={() => setItemSelected(item)}
                  type={itemSelected?.id === item.id ? "primary" : "default"}
                >
                  {item.size}
                </Button>
              )
          )}
        </Space>
      </div>
      <div className="mt-4">
        <Typography.Title level={4}>Colors</Typography.Title>
        <Space wrap>
          {subProducts.map(
            (item) =>
              productSelected.color !== item.color && (
                <Button
                  key={`color-${item.id}`}
                  onClick={() => setItemSelected(item)}
                  style={{
                    backgroundColor: item.color,
                    border:
                      itemSelected?.id === item.id ? "2px solid black" : "",
                  }}
                />
              )
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default TransationSubProductModal;
