/** @format */

import React, { useState, useEffect } from "react";
import { ButtonRemoveCartItem } from "@/components";
import {
  CartItemModel,
  cartSelector,
  changeCount,
} from "@/redux/reducers/cartReducer";
import {
  useCartValidation,
  isItemDeleted,
  isItemSoldOut,
  isItemInvalid,
} from "@/hooks";
import { VND } from "@/utils/handleCurrency";
import { Alert, Avatar, Button, Space, Table, Tag, Typography } from "antd";
import { ColumnProps } from "antd/es/table";
import { LuMinus } from "react-icons/lu";
import { MdAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";

const ListCart = ({
  onSelectItems,
}: {
  onSelectItems?: (items: CartItemModel[]) => void;
}) => {
  const carts: CartItemModel[] = useSelector(cartSelector);
  const dispatch = useDispatch();

  const {
    hasInvalidItems,
    invalidItems,
    removeAllInvalidItems,
  } = useCartValidation();

  // State lưu các key (id) của sản phẩm được chọn
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Tự động loại bỏ các sản phẩm không hợp lệ khỏi danh sách được chọn
  useEffect(() => {
    setSelectedRowKeys((prev) =>
      prev.filter((key) => {
        const item = carts.find((c) => c.id === key);
        return item && !isItemInvalid(item);
      })
    );
  }, [carts]);

  // Lấy danh sách sản phẩm được chọn hợp lệ
  const selectedItems = carts.filter(
    (item) => item.id && selectedRowKeys.includes(item.id) && !isItemInvalid(item)
  );

  // Gửi selectedItems ra ngoài nếu có callback
  useEffect(() => {
    if (onSelectItems) onSelectItems(selectedItems);
  }, [selectedRowKeys, carts]);

  const columns: ColumnProps<CartItemModel>[] = [
    {
      key: "image",
      dataIndex: "image",
      render: (img: string, item: CartItemModel) => (
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar
            src={img}
            size={52}
            shape="square"
            style={{ opacity: isItemInvalid(item) ? 0.5 : 1 }}
          />
        </div>
      ),
    },
    {
      key: "products",
      dataIndex: "",
      title: "Product",
      render: (item: CartItemModel) => {
        const deleted = isItemDeleted(item);
        const soldOut = isItemSoldOut(item);
        const invalid = deleted || soldOut;

        return (
          <div>
            <Typography.Title
              level={5}
              className="m-0"
              style={{
                color: invalid ? "#8c8c8c" : undefined,
                textDecoration: deleted ? "line-through" : undefined,
              }}
            >
              {item.title}
            </Typography.Title>
            <div className="d-flex align-items-center gap-3 mt-1 flex-wrap">
              {item.size && (
                <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
                  <span style={{ color: "#333", fontWeight: 500 }}>{item.size}</span>
                </Typography.Text>
              )}
              {item.color && (
                <div className="d-flex align-items-center gap-1">
                  {/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item.color.trim()) ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        backgroundColor: item.color,
                        border: "1px solid #d9d9d9",
                        borderRadius: 2,
                        verticalAlign: "middle",
                      }}
                    />
                  ) : (
                    <span style={{ color: "#333", fontWeight: 500, fontSize: "0.85rem" }}>
                      {item.color}
                    </span>
                  )}
                </div>
              )}
            </div>

            {deleted && (
              <div className="mt-2">
                <Tag color="error" style={{ borderRadius: 4, fontWeight: 600 }}>
                  Đã xóa / Ngừng kinh doanh
                </Tag>
                <Typography.Text
                  type="danger"
                  style={{ fontSize: "0.82rem", display: "block", marginTop: 2 }}
                >
                  Sản phẩm này đã ngừng bán hoặc bị xóa. Vui lòng xóa khỏi giỏ hàng.
                </Typography.Text>
              </div>
            )}

            {soldOut && (
              <div className="mt-2">
                <Tag color="warning" style={{ borderRadius: 4, fontWeight: 600 }}>
                  Hết hàng / Đã bán hết
                </Tag>
                <Typography.Text
                  style={{ fontSize: "0.82rem", display: "block", color: "#d46b08", marginTop: 2 }}
                >
                  Sản phẩm này hiện đã hết hàng. Vui lòng xóa khỏi giỏ hàng.
                </Typography.Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "price",
      title: "Price",
      dataIndex: "price",
      render: (price: number, item: CartItemModel) => (
        <span style={{ color: isItemInvalid(item) ? "#8c8c8c" : undefined }}>
          {VND.format(price)}
        </span>
      ),
    },
    {
      key: "quantity",
      dataIndex: "",
      title: "Quantity",
      render: (item: CartItemModel) => {
        const invalid = isItemInvalid(item);
        const maxStock = item.stock ?? item.qty;

        return (
          <Space className="btn-groups">
            <Button
              key={"btn-add"}
              onClick={() => dispatch(changeCount({ id: item.id, val: 1 }))}
              disabled={invalid || item.count >= maxStock}
              icon={<MdAdd size={22} className="text-muted" />}
              type="text"
            />
            <Typography.Text
              style={{
                fontSize: "1.1rem",
                padding: "0 10px",
                color: invalid ? "#8c8c8c" : undefined,
              }}
            >
              {`${item.count}`}
            </Typography.Text>
            <Button
              key={`btn-minus`}
              onClick={() => dispatch(changeCount({ id: item.id, val: -1 }))}
              disabled={invalid || item.count <= 1}
              icon={<LuMinus size={22} className="text-muted" />}
              type="text"
            />
          </Space>
        );
      },
      align: "center",
    },
    {
      key: "subtotal",
      title: "SubTotal",
      dataIndex: "",
      render: (item: CartItemModel) =>
        isItemInvalid(item) ? (
          <Typography.Text delete type="secondary">
            {VND.format(item.price * item.count)}
          </Typography.Text>
        ) : (
          VND.format(item.price * item.count)
        ),
    },
    {
      title: "",
      key: "action",
      dataIndex: "",
      render: (item: CartItemModel) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ButtonRemoveCartItem item={item} />
          {isItemInvalid(item) && (
            <Tag color="red" style={{ cursor: "pointer", margin: 0 }}>
              Cần xóa
            </Tag>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ fontWeight: 300 }}
        className="text-muted"
      >
        Checkout
      </Typography.Title>

      {hasInvalidItems && (
        <Alert
          message="Cảnh báo sản phẩm không khả dụng trong giỏ hàng"
          description={
            <div className="d-flex flex-column gap-2 mt-1">
              <div>
                Giỏ hàng của bạn có{" "}
                <strong style={{ color: "#cf1322" }}>
                  {invalidItems.length}
                </strong>{" "}
                sản phẩm đã hết hàng hoặc bị xóa. Bạn cần xóa những sản phẩm này để có thể tiếp tục thanh toán.
              </div>
              <div>
                <Button
                  danger
                  type="primary"
                  size="small"
                  onClick={removeAllInvalidItems}
                  style={{ borderRadius: 4, fontWeight: 500 }}
                >
                  Xóa tất cả sản phẩm không khả dụng ({invalidItems.length})
                </Button>
              </div>
            </div>
          }
          type="error"
          showIcon
          style={{
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #ffccc7",
            backgroundColor: "#fff2f0",
          }}
        />
      )}

      <Table
        dataSource={carts}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled: isItemInvalid(record),
          }),
        }}
        rowKey="id"
        rowClassName={(record) =>
          isItemInvalid(record) ? "table-row-invalid" : ""
        }
      />
    </div>
  );
};

export default ListCart;
