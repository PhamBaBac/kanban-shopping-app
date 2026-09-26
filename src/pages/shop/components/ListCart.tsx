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

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const hasInitializedSelection = React.useRef(false);

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

  useEffect(() => {
    setSelectedRowKeys((prev) =>
      prev.filter((key) => {
        const item = carts.find((c) => c.id === key);
        return item && !isItemInvalid(item);
      })
    );
  }, [carts]);

  const selectedItems = carts.filter(
    (item) => item.id && selectedRowKeys.includes(item.id) && !isItemInvalid(item)
  );

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
                fontFamily: "var(--font-heading)",
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
            fontFamily: "var(--font-heading)",
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
              fontFamily: "var(--font-heading)",
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
                  fontFamily: "var(--font-heading)",
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
            fontFamily: "var(--font-heading)",
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

      {/* Desktop Table View (>= 768px) */}
      <div
        className="d-none d-md-block"
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

      {/* Mobile Card View (< 768px) */}
      <div className="d-block d-md-none">
        {/* Select All on Mobile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FFFFFF",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            marginBottom: "12px",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", margin: 0 }}>
            <input
              type="checkbox"
              checked={
                carts.filter((c) => !isItemInvalid(c)).length > 0 &&
                carts
                  .filter((c) => !isItemInvalid(c))
                  .every((c) => c.id && selectedRowKeys.includes(c.id))
              }
              onChange={(e) => {
                if (e.target.checked) {
                  const validKeys = carts
                    .filter((c) => !isItemInvalid(c) && c.id)
                    .map((c) => c.id as React.Key);
                  setSelectedRowKeys(validKeys);
                } else {
                  setSelectedRowKeys([]);
                }
              }}
              style={{ width: "16px", height: "16px", accentColor: "#131118", cursor: "pointer" }}
            />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#131118" }}>
              Chọn tất cả ({carts.filter((c) => !isItemInvalid(c)).length})
            </span>
          </label>
          <span style={{ fontSize: "12px", color: "#6B7280" }}>
            Đã chọn: <strong style={{ color: "#131118" }}>{selectedItems.length}</strong>
          </span>
        </div>

        {/* List of Cart Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {carts.map((item) => {
            const deleted = isItemDeleted(item);
            const soldOut = isItemSoldOut(item);
            const invalid = deleted || soldOut;
            const maxStock = item.stock ?? item.qty;
            const isChecked = item.id ? selectedRowKeys.includes(item.id) : false;

            return (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "12px",
                  border: isChecked ? "1.5px solid #131118" : "1px solid #E5E7EB",
                  padding: "14px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  opacity: invalid ? 0.65 : 1,
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  {/* Checkbox */}
                  <div style={{ paddingTop: "2px" }}>
                    <input
                      type="checkbox"
                      disabled={invalid}
                      checked={isChecked}
                      onChange={(e) => {
                        if (!item.id) return;
                        if (e.target.checked) {
                          setSelectedRowKeys((prev) => [...prev, item.id as React.Key]);
                        } else {
                          setSelectedRowKeys((prev) => prev.filter((k) => k !== item.id));
                        }
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#131118",
                        cursor: invalid ? "not-allowed" : "pointer",
                      }}
                    />
                  </div>

                  {/* Thumbnail */}
                  <Avatar
                    src={item.image}
                    size={64}
                    shape="square"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      flexShrink: 0,
                      objectFit: "cover",
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                      <Typography.Text
                        strong
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: invalid ? "#9CA3AF" : "#131118",
                          textDecoration: deleted ? "line-through" : undefined,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.3,
                        }}
                      >
                        {item.title}
                      </Typography.Text>
                      <ButtonRemoveCartItem item={item} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                      {item.size && (
                        <Tag
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            padding: "1px 6px",
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
                                padding: "1px 6px",
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
                      <div style={{ marginTop: "4px" }}>
                        <Tag color="error" style={{ borderRadius: 4, fontWeight: 600, fontSize: "11px", margin: 0 }}>
                          Đã ngừng kinh doanh
                        </Tag>
                      </div>
                    )}

                    {soldOut && (
                      <div style={{ marginTop: "4px" }}>
                        <Tag color="warning" style={{ borderRadius: 4, fontWeight: 600, fontSize: "11px", margin: 0 }}>
                          Hết hàng
                        </Tag>
                      </div>
                    )}

                    {/* Price and Quantity Controller */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "12px",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "15px",
                            fontWeight: 700,
                            color: invalid ? "#9CA3AF" : "#131118",
                          }}
                        >
                          {VND.format(item.price)}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px",
                          overflow: "hidden",
                          background: "#FFFFFF",
                        }}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<LuMinus size={12} />}
                          disabled={invalid || item.count <= 1}
                          onClick={() => dispatch(changeCount({ id: item.id, val: -1 }))}
                          style={{
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 0,
                            cursor: invalid || item.count <= 1 ? "not-allowed" : "pointer",
                          }}
                        />
                        <span
                          style={{
                            width: "32px",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: invalid ? "#9CA3AF" : "#131118",
                          }}
                        >
                          {item.count}
                        </span>
                        <Button
                          type="text"
                          size="small"
                          icon={<MdAdd size={12} />}
                          disabled={invalid || item.count >= maxStock}
                          onClick={() => dispatch(changeCount({ id: item.id, val: 1 }))}
                          style={{
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 0,
                            cursor: invalid || item.count >= maxStock ? "not-allowed" : "pointer",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListCart;
