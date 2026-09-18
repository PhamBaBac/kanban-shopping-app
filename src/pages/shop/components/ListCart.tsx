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
import { Alert, Avatar, Button, Empty, Space, Table, Tag, Typography } from "antd";
import { ColumnProps } from "antd/es/table";
import { LuMinus } from "react-icons/lu";
import { MdAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

const ListCart = ({
  onSelectItems,
}: {
  onSelectItems?: (items: CartItemModel[]) => void;
}) => {
  const router = useRouter();
  const carts: CartItemModel[] = useSelector(cartSelector);
  const dispatch = useDispatch();

  const {
    hasInvalidItems,
    invalidItems,
    removeAllInvalidItems,
  } = useCartValidation();

  // State lưu các key (id) của sản phẩm được chọn
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const hasInitializedSelection = React.useRef(false);

  // Tự động chọn tất cả sản phẩm hợp lệ khi tải giỏ hàng lần đầu
  useEffect(() => {
    if (carts && carts.length > 0 && !hasInitializedSelection.current) {
      const validKeys = carts
        .filter((c) => !isItemInvalid(c) && c.id)
        .map((c) => c.id as React.Key);
      if (validKeys.length > 0) {
        setSelectedRowKeys(validKeys);
        hasInitializedSelection.current = true;
      }
    }
  }, [carts]);

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
      width: 80,
      render: (img: string, item: CartItemModel) => (
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar
            src={img}
            size={64}
            shape="square"
            style={{
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              opacity: isItemInvalid(item) ? 0.45 : 1,
              objectFit: "cover",
            }}
          />
        </div>
      ),
    },
    {
      key: "products",
      dataIndex: "",
      title: "Sản phẩm",
      render: (item: CartItemModel) => {
        const deleted = isItemDeleted(item);
        const soldOut = isItemSoldOut(item);
        const invalid = deleted || soldOut;

        return (
          <div>
            <Typography.Text
              strong
              style={{
                fontFamily: "Rubik, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: invalid ? "#9CA3AF" : "#131118",
                textDecoration: deleted ? "line-through" : undefined,
                display: "block",
              }}
            >
              {item.title}
            </Typography.Text>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              {item.size && (
                <Tag
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    padding: "1px 8px",
                    borderRadius: "4px",
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    color: "#374151",
                  }}
                >
                  Size: <strong>{item.size}</strong>
                </Tag>
              )}
              {item.color && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item.color.trim()) ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        backgroundColor: item.color,
                        border: "1px solid #D1D5DB",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <Tag
                      style={{
                        margin: 0,
                        fontSize: "11px",
                        padding: "1px 8px",
                        borderRadius: "4px",
                        background: "#F3F4F6",
                        border: "1px solid #E5E7EB",
                        color: "#374151",
                      }}
                    >
                      Màu: <strong>{item.color}</strong>
                    </Tag>
                  )}
                </div>
              )}
            </div>

            {deleted && (
              <div style={{ marginTop: "6px" }}>
                <Tag color="error" style={{ borderRadius: 4, fontWeight: 600 }}>
                  Đã ngừng kinh doanh
                </Tag>
                <span style={{ fontSize: "12px", color: "#DC2626", display: "block", marginTop: 2 }}>
                  Sản phẩm đã bị xóa hoặc ngừng bán. Vui lòng xóa khỏi giỏ hàng.
                </span>
              </div>
            )}

            {soldOut && (
              <div style={{ marginTop: "6px" }}>
                <Tag color="warning" style={{ borderRadius: 4, fontWeight: 600 }}>
                  Hết hàng
                </Tag>
                <span style={{ fontSize: "12px", color: "#D97706", display: "block", marginTop: 2 }}>
                  Sản phẩm tạm thời hết hàng. Vui lòng xóa để tiếp tục.
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "price",
      title: "Đơn giá",
      dataIndex: "price",
      align: "right",
      render: (price: number, item: CartItemModel) => (
        <span
          style={{
            fontFamily: "Rubik, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: isItemInvalid(item) ? "#9CA3AF" : "#131118",
          }}
        >
          {VND.format(price)}
        </span>
      ),
    },
    {
      key: "quantity",
      dataIndex: "",
      title: "Số lượng",
      align: "center",
      render: (item: CartItemModel) => {
        const invalid = isItemInvalid(item);
        const maxStock = item.stock ?? item.qty;

        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#FFFFFF",
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<LuMinus size={13} />}
              disabled={invalid || item.count <= 1}
              onClick={() => dispatch(changeCount({ id: item.id, val: -1 }))}
              style={{
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
                cursor: invalid || item.count <= 1 ? "not-allowed" : "pointer",
              }}
            />
            <span
              style={{
                width: "36px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: 700,
                color: invalid ? "#9CA3AF" : "#131118",
              }}
            >
              {item.count}
            </span>
            <Button
              type="text"
              size="small"
              icon={<MdAdd size={13} />}
              disabled={invalid || item.count >= maxStock}
              onClick={() => dispatch(changeCount({ id: item.id, val: 1 }))}
              style={{
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
                cursor: invalid || item.count >= maxStock ? "not-allowed" : "pointer",
              }}
            />
          </div>
        );
      },
    },
    {
      key: "subtotal",
      title: "Thành tiền",
      dataIndex: "",
      align: "right",
      render: (item: CartItemModel) =>
        isItemInvalid(item) ? (
          <Typography.Text delete type="secondary">
            {VND.format(item.price * item.count)}
          </Typography.Text>
        ) : (
          <span
            style={{
              fontFamily: "Rubik, sans-serif",
              fontSize: "15px",
              fontWeight: 700,
              color: "#131118",
            }}
          >
            {VND.format(item.price * item.count)}
          </span>
        ),
    },
    {
      title: "",
      key: "action",
      dataIndex: "",
      align: "center",
      width: 60,
      render: (item: CartItemModel) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ButtonRemoveCartItem item={item} />
        </div>
      ),
    },
  ];

  if (!carts || carts.length === 0) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <Empty
          description={
            <div style={{ marginTop: "8px" }}>
              <span
                style={{
                  fontFamily: "Rubik, sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#131118",
                  display: "block",
                }}
              >
                Giỏ hàng của bạn đang trống
              </span>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                Chưa có sản phẩm nào được chọn để thanh toán.
              </span>
            </div>
          }
        >
          <Button
            type="primary"
            onClick={() => router.push("/")}
            style={{
              marginTop: "16px",
              background: "#131118",
              color: "#FFFFFF",
              borderRadius: "8px",
              fontWeight: 600,
              height: "40px",
              padding: "0 24px",
              cursor: "pointer",
            }}
          >
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h2
          style={{
            fontFamily: "Rubik, sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "#131118",
            margin: 0,
          }}
        >
          Giỏ hàng của bạn ({carts.length})
        </h2>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>
          Vui lòng kiểm tra lại số lượng và sản phẩm cần thanh toán
        </span>
      </div>

      {hasInvalidItems && (
        <Alert
          message="Cảnh báo sản phẩm không khả dụng trong giỏ hàng"
          description={
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              <div style={{ fontSize: "13px" }}>
                Giỏ hàng có{" "}
                <strong style={{ color: "#DC2626" }}>
                  {invalidItems.length}
                </strong>{" "}
                sản phẩm đã hết hàng hoặc ngừng kinh doanh. Bạn cần xóa các sản phẩm này để tiếp tục thanh toán.
              </div>
              <div>
                <Button
                  danger
                  type="primary"
                  size="small"
                  onClick={removeAllInvalidItems}
                  style={{ borderRadius: "6px", fontWeight: 600 }}
                >
                  Xóa tất cả ({invalidItems.length}) sản phẩm lỗi
                </Button>
              </div>
            </div>
          }
          type="error"
          showIcon
          style={{
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #FECACA",
            backgroundColor: "#FEF2F2",
          }}
        />
      )}

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <Table
          dataSource={carts}
          columns={columns}
          pagination={false}
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
    </div>
  );
};

export default ListCart;
