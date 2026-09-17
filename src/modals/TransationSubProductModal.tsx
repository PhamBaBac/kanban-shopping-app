/** @format */

import { SubProductModel } from "@/models/Products";
import { authSelector } from "@/redux/reducers/authReducer";
import {
  addProduct,
  CartItemModel,
  cartSelector,
  changeCount,
  removeProduct,
  syncProducts,
} from "@/redux/reducers/cartReducer";
import { cartService } from "@/services/cartService";
import { productService } from "@/services/productService";
import { VND } from "@/utils/handleCurrency";
import { Button, Divider, message, Modal, Space, Tag, Tooltip, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface Props {
  visible: boolean;
  onClose: () => void;
  productSelected: CartItemModel;
}

const TransationSubProductModal = ({
  visible,
  onClose,
  productSelected,
}: Props) => {
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [itemSelected, setItemSelected] = useState<SubProductModel>();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const auth = useSelector(authSelector);
  const cart = useSelector(cartSelector);

  useEffect(() => {
    if (visible && productSelected?.productId) {
      getProductDetail();
    }
  }, [visible, productSelected]);

  const getProductDetail = async () => {
    const productId = productSelected?.productId;
    if (!productId) return;

    try {
      setLoading(true);
      const result = await productService.getSubProductsByProductId(productId);
      const updated = result.map((sub: any) => ({
        ...sub,
        productId,
      }));
      setSubProducts(updated);

      // Mặc định chọn biến thể hiện tại trong giỏ hàng
      const current =
        updated.find((sp: any) => sp.id === productSelected.subProductId) ||
        updated[0];
      setItemSelected(current);
    } catch (error) {
      console.error("Lỗi khi tải danh sách biến thể:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubProductAttributes = (sp: SubProductModel): Record<string, string> => {
    let attrs: any = sp.attributes;
    if (typeof attrs === "string") {
      try {
        attrs = JSON.parse(attrs);
      } catch (e) {
        attrs = null;
      }
    }
    if (attrs && typeof attrs === "object" && Object.keys(attrs).length > 0) {
      return attrs;
    }

    // Fallback cho sản phẩm cũ chỉ có size / color
    const fallback: Record<string, string> = {};
    if (sp.size) fallback["Size"] = sp.size;
    if (sp.color) fallback["Màu sắc"] = sp.color;
    return fallback;
  };

  const getAttributeOrder = (key: string): number => {
    const k = key.trim().toLowerCase();
    if (k.includes("màu") || k.includes("color") || k.includes("colour")) return 1;
    if (
      k.includes("dung lượng") ||
      k.includes("bộ nhớ") ||
      k.includes("storage") ||
      k.includes("kích") ||
      k.includes("size")
    ) return 2;
    if (k.includes("phiên bản") || k.includes("version")) return 3;
    if (k.includes("ram")) return 4;
    return 10;
  };

  const attributeKeys: string[] = useMemo(() => {
    const keysSet = new Set<string>();
    subProducts.forEach((sp) => {
      const attrs = getSubProductAttributes(sp);
      Object.keys(attrs).forEach((k) => keysSet.add(k));
    });
    return Array.from(keysSet).sort(
      (a, b) => getAttributeOrder(a) - getAttributeOrder(b)
    );
  }, [subProducts]);

  const currentAttributes: Record<string, string> = useMemo(() => {
    if (!itemSelected) return {};
    return getSubProductAttributes(itemSelected);
  }, [itemSelected]);

  const getAvailableValuesForKey = (key: string): string[] => {
    const valuesSet = new Set<string>();
    subProducts.forEach((sp) => {
      const attrs = getSubProductAttributes(sp);
      if (attrs[key] && attrs[key].trim()) {
        valuesSet.add(attrs[key].trim());
      }
    });
    return Array.from(valuesSet);
  };

  const isHexColor = (val: string) =>
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(val?.trim());

  const isColorAttribute = (key: string, values: string[]) => {
    const isNamedColor = /^(color|colour|màu|màu sắc)$/i.test(key.trim());
    return isNamedColor || values.some((v) => isHexColor(v));
  };

  const handleSelectAttribute = (targetKey: string, targetValue: string) => {
    const matchingCandidates = subProducts.filter((sp) => {
      const attrs = getSubProductAttributes(sp);
      return attrs[targetKey] === targetValue;
    });

    if (matchingCandidates.length === 0) return;

    let bestCandidate = matchingCandidates[0];
    let maxScore = -1;

    matchingCandidates.forEach((sp) => {
      const attrs = getSubProductAttributes(sp);
      let score = 0;
      attributeKeys.forEach((otherKey) => {
        if (
          otherKey !== targetKey &&
          currentAttributes[otherKey] &&
          attrs[otherKey] === currentAttributes[otherKey]
        ) {
          score++;
        }
      });
      if (score > maxScore) {
        maxScore = score;
        bestCandidate = sp;
      }
    });

    setItemSelected(bestCandidate);
  };

  const handleChangeSubProduct = async () => {
    if (!itemSelected) return;

    // Nếu chọn đúng biến thể hiện tại thì không cần gọi API
    if (itemSelected.id === productSelected.subProductId) {
      message.info("Bạn đang chọn biến thể hiện tại.");
      onClose();
      return;
    }

    const item = itemSelected;
    const availableStock = item.stock ?? item.qty ?? 0;

    if (availableStock <= 0) {
      message.error("Biến thể này hiện tại đã hết hàng.");
      return;
    }

    const newCount =
      productSelected.count > availableStock ? availableStock : productSelected.count;

    if (productSelected.count > availableStock) {
      message.warning(
        `Số lượng bạn chọn vượt quá tồn kho hiện tại. Đã giảm còn ${availableStock}`
      );
    }

    const attrs = getSubProductAttributes(item);

    // Tìm màu sắc
    let resolvedColor = item.color || "";
    if (!resolvedColor) {
      for (const [k, v] of Object.entries(attrs)) {
        const lowerK = k.trim().toLowerCase();
        if (lowerK.includes("màu") || lowerK.includes("color") || lowerK.includes("colour")) {
          resolvedColor = String(v);
          break;
        }
      }
    }

    // Tổng hợp tất cả các thuộc tính không phải màu sắc (Dung lượng, RAM, Size, v.v.)
    const nonColorList: string[] = [];
    for (const [k, v] of Object.entries(attrs)) {
      const lowerK = k.trim().toLowerCase();
      if (!lowerK.includes("màu") && !lowerK.includes("color") && !lowerK.includes("colour")) {
        if (v) nonColorList.push(String(v));
      }
    }

    let resolvedSize = "";
    if (nonColorList.length > 0) {
      resolvedSize = nonColorList.join(" - ");
    } else if (item.size) {
      resolvedSize = item.size;
    }

    const resolvedImage = item.imgURL || item.images?.[0] || productSelected.image || "";

    const updatedItem: CartItemModel = {
      ...productSelected,
      count: newCount,
      subProductId: item.id,
      size: resolvedSize,
      color: resolvedColor,
      price: item.discount ?? item.price,
      qty: availableStock,
      productId: item.productId,
      image: resolvedImage,
    };

    try {
      if (auth.userId) {
        await cartService.updateCartItem(productSelected.id!, updatedItem);

        // Đồng bộ lại giỏ hàng từ server để tránh conflict / duplicate items
        try {
          const freshCart = await cartService.getCart();
          if (freshCart && Array.isArray(freshCart)) {
            dispatch(syncProducts(freshCart));
          } else {
            fallbackLocalUpdate(updatedItem);
          }
        } catch {
          fallbackLocalUpdate(updatedItem);
        }
      } else {
        const sessionId = localStorage.getItem("sessionId");
        if (!sessionId) {
          message.error("Phiên chưa được tạo. Không thể thay đổi sản phẩm.");
          return;
        }

        await cartService.updateRedisCartItem(
          sessionId,
          productSelected.subProductId,
          updatedItem
        );

        // Đồng bộ lại giỏ hàng từ Redis
        try {
          const freshCart = await cartService.getRedisCart(sessionId);
          if (freshCart && Array.isArray(freshCart)) {
            dispatch(syncProducts(freshCart.flat()));
          } else {
            fallbackLocalUpdate(updatedItem);
          }
        } catch {
          fallbackLocalUpdate(updatedItem);
        }
      }

      message.success("Chuyển đổi biến thể thành công!");
      setItemSelected(undefined);
      onClose();
    } catch (error: any) {
      console.error("Lỗi khi chuyển biến thể:", error);
      message.error(error?.message || "Không thể chuyển đổi biến thể. Vui lòng thử lại.");
    }
  };

  const fallbackLocalUpdate = (updatedItem: CartItemModel) => {
    // Xóa item cũ
    dispatch(
      removeProduct({
        id: productSelected.id,
        subProductId: productSelected.subProductId,
      })
    );
    // Thêm item mới (cartReducer sẽ tự merge nếu subProductId đã tồn tại)
    dispatch(addProduct(updatedItem));
  };

  const currentStock = itemSelected?.stock ?? itemSelected?.qty ?? 0;
  const currentPrice = itemSelected?.discount ?? itemSelected?.price ?? 0;
  const originalPrice = itemSelected?.price ?? 0;

  return (
    <Modal
      onOk={handleChangeSubProduct}
      open={visible}
      confirmLoading={loading}
      okButtonProps={{ disabled: currentStock <= 0 }}
      okText="Xác nhận đổi"
      cancelText="Hủy"
      onCancel={() => {
        setItemSelected(undefined);
        onClose();
      }}
      title="Chuyển đổi biến thể sản phẩm"
      width={520}
    >
      {/* Thông tin preview biến thể đang chọn */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <img
          src={
            itemSelected?.images?.[0] ||
            itemSelected?.imgURL ||
            productSelected.image ||
            ""
          }
          alt={productSelected.title}
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            borderRadius: 8,
            border: "1px solid #eaeaea",
          }}
        />
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {productSelected.title}
          </Typography.Title>
          <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#d32f2f" }}>
              {VND.format(currentPrice)}
            </span>
            {itemSelected?.discount && itemSelected.discount < originalPrice && (
              <span
                style={{
                  fontSize: "0.9rem",
                  textDecoration: "line-through",
                  color: "#888",
                }}
              >
                {VND.format(originalPrice)}
              </span>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            {currentStock > 0 ? (
              <Tag color="success">Còn {currentStock} sản phẩm</Tag>
            ) : (
              <Tag color="error">Hết hàng</Tag>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách thuộc tính động (Màu sắc, Dung lượng, RAM, v.v.) */}
      <div style={{ maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
        {attributeKeys.map((key) => {
          const values = getAvailableValuesForKey(key);
          const isColor = isColorAttribute(key, values);
          const selectedVal = currentAttributes[key];

          return (
            <div key={key} style={{ marginTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Typography.Text strong style={{ fontSize: "0.95rem" }}>
                  {key}
                </Typography.Text>
                {selectedVal && (
                  <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
                    Đã chọn: <b style={{ color: "#333" }}>{selectedVal}</b>
                  </Typography.Text>
                )}
              </div>

              {isColor ? (
                <Space size={12} wrap>
                  {values.map((colorVal) => {
                    const isSelected = selectedVal === colorVal;
                    const isHex = isHexColor(colorVal);

                    return (
                      <Tooltip key={colorVal} title={colorVal}>
                        <div
                          onClick={() => handleSelectAttribute(key, colorVal)}
                          style={{
                            cursor: "pointer",
                            padding: 2,
                            borderRadius: 6,
                            display: "inline-flex",
                          }}
                        >
                          {isHex ? (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                backgroundColor: colorVal,
                                border: isSelected
                                  ? "2px solid #131118"
                                  : "1px solid rgba(0, 0, 0, 0.12)",
                                boxShadow: isSelected
                                  ? "0 4px 10px rgba(0, 0, 0, 0.22)"
                                  : "0 1px 3px rgba(0, 0, 0, 0.08)",
                                transform: isSelected ? "scale(1.05)" : "none",
                                transition: "all 0.2s ease",
                              }}
                            />
                          ) : (
                            <Button
                              type={isSelected ? "primary" : "default"}
                              size="middle"
                            >
                              {colorVal}
                            </Button>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </Space>
              ) : (
                <Space size={8} wrap>
                  {values.map((val) => {
                    const isSelected = selectedVal === val;
                    return (
                      <Button
                        key={val}
                        type={isSelected ? "primary" : "default"}
                        style={{
                          borderRadius: 6,
                          fontWeight: isSelected ? 600 : 400,
                        }}
                        onClick={() => handleSelectAttribute(key, val)}
                      >
                        {val}
                      </Button>
                    );
                  })}
                </Space>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default TransationSubProductModal;
