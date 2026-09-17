/** @format */

import { colors } from "@/constants/colors";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { VND } from "@/utils/handleCurrency";
import { Button, Card, Space, Typography, Modal, Tag, Tooltip, Spin } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BiHeart, BiTransfer } from "react-icons/bi";
import { BsEye } from "react-icons/bs";
import { FaRegStar } from "react-icons/fa";
import { MdImage } from "react-icons/md";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { productService } from "@/services";
import { userService } from "@/services/userService";

interface Props {
  item: ProductModel;
}

const { Title, Text, Paragraph } = Typography;

const ProductItem = (props: Props) => {
  const { item } = props;
  const [elementWidth, setElementWidth] = useState();
  const [supplier, setSupplier] = useState<SupplierModel | null>(null);
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [selectedSubProduct, setSelectedSubProduct] = useState<SubProductModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  const ref = useRef<any>();
  const router = useRouter();
  const auth = useSelector(authSelector);

  const availableSubProducts: SubProductModel[] = useMemo(() => {
    if (subProducts && subProducts.length > 0) return subProducts;
    if (item.subProducts && item.subProducts.length > 0) return item.subProducts;
    if (item.subItems && item.subItems.length > 0) return item.subItems;
    return [];
  }, [subProducts, item.subProducts, item.subItems]);

  const currentSubProducts = useMemo(() => {
    return subProducts.length > 0 ? subProducts : availableSubProducts;
  }, [subProducts, availableSubProducts]);

  useEffect(() => {
    const width = ref.current?.offsetWidth;
    setElementWidth(width);
  }, []);

  useEffect(() => {
    if (item.supplierId) {
      fetchSupplierInfo();
    }
  }, [item.supplierId]);

  useEffect(() => {
    if (availableSubProducts.length === 0 && item.id) {
      productService
        .getSubProductsByProductId(item.id)
        .then((res) => {
          if (res && res.length > 0) {
            setSubProducts(res);
          }
        })
        .catch((err) => console.log("Error loading sub-products for item:", err));
    }
  }, [item.id, availableSubProducts.length]);

  const fetchSupplierInfo = async () => {
    try {
      const res = await productService.getSupplier(item.supplierId);
      if (res) {
        setSupplier(res);
      }
    } catch (error) {
      console.log("Error fetching supplier:", error);
    }
  };

  const fetchSubProducts = async () => {
    setQuickViewLoading(true);
    try {
      const res = await productService.getSubProductsByProductId(item.id);
      if (res) {
        setSubProducts(res);
        if (res.length > 0) {
          setSelectedSubProduct((prev) => prev || res[0]);
        }
      }
    } catch (error) {
      console.log("Error fetching sub-products:", error);
    } finally {
      setQuickViewLoading(false);
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
    const fallback: Record<string, string> = {};
    if (sp.color) fallback["Màu sắc"] = sp.color;
    if (sp.size) fallback["Kích cỡ"] = sp.size;
    return fallback;
  };

  const getAttributeOrder = (key: string): number => {
    const k = key.trim().toLowerCase();
    if (k.includes("màu") || k.includes("color")) return 1;
    if (
      k.includes("dung lượng") ||
      k.includes("bộ nhớ") ||
      k.includes("storage") ||
      k.includes("kích") ||
      k.includes("size")
    )
      return 2;
    if (k.includes("phiên bản") || k.includes("version")) return 3;
    if (k.includes("ram")) return 4;
    return 10;
  };

  const attributeKeys: string[] = useMemo(() => {
    const keysSet = new Set<string>();
    currentSubProducts.forEach((sp) => {
      const attrs = getSubProductAttributes(sp);
      Object.keys(attrs).forEach((k) => keysSet.add(k));
    });
    return Array.from(keysSet).sort(
      (a, b) => getAttributeOrder(a) - getAttributeOrder(b)
    );
  }, [currentSubProducts]);

  const currentAttributes: Record<string, string> = useMemo(() => {
    if (!selectedSubProduct) return {};
    return getSubProductAttributes(selectedSubProduct);
  }, [selectedSubProduct]);

  const getAvailableValuesForKey = (key: string): string[] => {
    const valuesSet = new Set<string>();
    currentSubProducts.forEach((sp) => {
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
    return isNamedColor && values.some((v) => isHexColor(v));
  };

  const handleSelectAttribute = (targetKey: string, targetValue: string) => {
    const matchingCandidates = currentSubProducts.filter((sp) => {
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

    setSelectedSubProduct(bestCandidate);
  };

  const renderModalPrice = () => {
    if (selectedSubProduct) {
      const hasDiscount =
        typeof selectedSubProduct.discount === "number" &&
        selectedSubProduct.discount < selectedSubProduct.price &&
        selectedSubProduct.discount > 0;

      if (hasDiscount) {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 10px" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#d32f2f" }}>
              {VND.format(selectedSubProduct.discount!)}
            </span>
            <span style={{ fontSize: "1rem", textDecoration: "line-through", color: "#999" }}>
              {VND.format(selectedSubProduct.price)}
            </span>
            <Tag color="red" style={{ fontWeight: 600 }}>
              -{Math.round(((selectedSubProduct.price - selectedSubProduct.discount!) / selectedSubProduct.price) * 100)}%
            </Tag>
          </div>
        );
      }
      return (
        <div style={{ margin: "6px 0 10px" }}>
          <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#d32f2f" }}>
            {VND.format(selectedSubProduct.price)}
          </span>
        </div>
      );
    }
    return <div style={{ fontSize: "1.2rem", fontWeight: 600, margin: "6px 0 10px" }}>{getPriceRange()}</div>;
  };

  const recordView = async () => {
    try {
      await userService.recordUserActivity({
        userId: auth.userId,
        productId: item.id,
        activityType: "view",
      });
    } catch (error) {
      console.error("Failed to record product view:", error);
    }
  };

  const handleClick = () => {
    if (auth.userId) {
      recordView(); // Fire-and-forget để chuyển trang ngay lập tức
    }
    const slug = item.slug || "detail";
    router.push(`/products/${slug}/${item.id}`);
  };

  const getPriceRange = () => {
    const originalPrices = availableSubProducts
      .map((sub) => (typeof sub.price === "number" ? sub.price : Number(sub.price) || 0))
      .filter((p) => p > 0);

    const effectivePrices = availableSubProducts
      .map((sub) => {
        const p = typeof sub.price === "number" ? sub.price : Number(sub.price) || 0;
        const d = typeof sub.discount === "number" ? sub.discount : Number(sub.discount) || 0;
        return d > 0 && d < p ? d : p;
      })
      .filter((p) => p > 0);

    if (effectivePrices.length === 0) {
      if (item.price && item.price.length > 0) {
        const validItemPrices = item.price.filter((p) => p > 0);
        if (validItemPrices.length > 0) {
          const minPrice = Math.min(...validItemPrices);
          const maxPrice = Math.max(...validItemPrices);
          if (minPrice === maxPrice) {
            return <strong style={{ color: "#d32f2f", whiteSpace: "nowrap" }}>{VND.format(minPrice)}</strong>;
          }
          return (
            <strong style={{ color: "#d32f2f", whiteSpace: "nowrap" }}>
              {`${VND.format(minPrice)} - ${VND.format(maxPrice)}`}
            </strong>
          );
        }
      }
      return <span style={{ color: "#888", fontWeight: 500 }}>Liên hệ</span>;
    }

    const minEffective = Math.min(...effectivePrices);
    const maxEffective = Math.max(...effectivePrices);
    const maxOriginal = originalPrices.length > 0 ? Math.max(...originalPrices) : maxEffective;

    // Nếu tất cả biến thể đều có cùng một giá bán
    if (minEffective === maxEffective) {
      // Có giảm giá so với giá gốc
      if (maxOriginal > minEffective) {
        return (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
            <strong style={{ color: "#d32f2f" }}>{VND.format(minEffective)}</strong>
            <span
              style={{
                textDecoration: "line-through",
                color: "#999",
                fontSize: "0.85em",
              }}
            >
              {VND.format(maxOriginal)}
            </span>
          </div>
        );
      }
      return <strong style={{ color: "#d32f2f", whiteSpace: "nowrap" }}>{VND.format(minEffective)}</strong>;
    }

    // Nếu các biến thể có khoảng giá khác nhau (minEffective !== maxEffective)
    return (
      <strong style={{ color: "#d32f2f", whiteSpace: "nowrap" }}>
        {`${VND.format(minEffective)} - ${VND.format(maxEffective)}`}
      </strong>
    );
  };

  return (
    <>
      <div
        className="col-sm-6 col-md-4 col-lg-3 mb-4"
        key={item.id}
      >
        <div
          onClick={handleClick}
          ref={ref}
          className="cursor-pointer product-item"
        >
          <div style={{ position: "relative" }}>
            {item.images && item.images.length > 0 ? (
              <img
                style={{
                  width: "100%",
                  height: elementWidth ? elementWidth * 1.1 : 250,
                  objectFit: "contain",
                  padding: "8px 8px 0 8px",
                }}
                src={item.images[0]}
                alt={item.title}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: elementWidth ? elementWidth * 1.2 : 250,
                  backgroundColor: `#e0e0e0`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MdImage size={32} color={colors.gray600} />
              </div>
            )}

            <div className="button-container">
              <div
                className="btn-list text-right pr-2"
                style={{
                  height: (elementWidth ? elementWidth * 1.2 : 250) * 0.72,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Space
                  direction="vertical"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Button
                    size="large"
                    className="btn-icon"
                    icon={<FaRegStar size={20} className="text-muted" />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <Button
                    size="large"
                    className="btn-icon"
                    icon={<BiHeart size={20} className="text-muted" />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <Button
                    size="large"
                    className="btn-icon"
                    icon={<BsEye size={20} className="text-muted" />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowQuickView(true);
                      if (!selectedSubProduct && availableSubProducts.length > 0) {
                        setSelectedSubProduct(availableSubProducts[0]);
                      }
                      fetchSubProducts();
                    }}
                  />
                </Space>
              </div>
            </div>
          </div>
          <div
            className="p-2"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="mb-1">
                <Paragraph style={{ fontWeight: "bold", margin: 0 }}>
                  {supplier ? supplier.name : ""}
                </Paragraph>
              </div>
              <Paragraph
                ellipsis={{ rows: 2, tooltip: item.title }}
                style={{ marginBottom: 6 }}
              >
                {item.title}
              </Paragraph>
            </div>
            <Paragraph
              style={{
                fontSize: "0.85rem",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isLoading ? "Loading..." : getPriceRange()}
            </Paragraph>
          </div>
        </div>
      </div>

    {/* Quick View Modal */}
    <Modal
      open={showQuickView}
      onCancel={(e) => {
        e?.stopPropagation?.();
        setShowQuickView(false);
      }}
      footer={null}
      width={720}
      destroyOnClose
    >
      <div
        style={{ display: "flex", gap: 24, padding: "8px 4px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              width: "100%",
              height: 320,
              background: "#f8f9fa",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={
                selectedSubProduct?.imgURL ||
                (selectedSubProduct?.images && selectedSubProduct.images.length > 0
                  ? selectedSubProduct.images[0]
                  : null) ||
                (item.images && item.images.length > 0 ? item.images[0] : "")
              }
              alt={item.title}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {supplier && (
            <div style={{ fontSize: "0.9rem", color: "#1677ff", fontWeight: 500, marginBottom: 2 }}>
              {supplier.name}
            </div>
          )}
          <Title level={4} style={{ margin: "0 0 6px 0", fontWeight: 600 }}>
            {item.title}
          </Title>

          {renderModalPrice()}

          {selectedSubProduct && (
            <div style={{ marginBottom: 10 }}>
              <Tag color={selectedSubProduct.stock > 0 ? "success" : "error"}>
                {selectedSubProduct.stock > 0 ? `Còn hàng (${selectedSubProduct.stock})` : "Hết hàng"}
              </Tag>
            </div>
          )}

          <Paragraph
            ellipsis={{ rows: 2, tooltip: item.description }}
            type="secondary"
            style={{ fontSize: "0.9rem", marginBottom: 12 }}
          >
            {item.description}
          </Paragraph>

          {quickViewLoading ? (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <Spin />
            </div>
          ) : attributeKeys.length > 0 ? (
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
              {attributeKeys.map((key) => {
                const values = getAvailableValuesForKey(key);
                if (values.length === 0) return null;
                const isColor = isColorAttribute(key, values);

                return (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 6, color: "#444" }}>
                      {key}:
                    </div>
                    {isColor ? (
                      <Space size={10} wrap>
                        {values.map((colorVal) => {
                          const isSelected = currentAttributes[key] === colorVal;
                          const isHex = isHexColor(colorVal);

                          return (
                            <Tooltip key={colorVal} title={colorVal}>
                              <div
                                onClick={() => handleSelectAttribute(key, colorVal)}
                                style={{
                                  cursor: "pointer",
                                  padding: 2,
                                  borderRadius: 5,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isHex ? (
                                  <div
                                    style={{
                                      background: colorVal,
                                      width: 26,
                                      height: 26,
                                      borderRadius: 5,
                                      border: isSelected ? "2px solid #131118" : "1px solid rgba(0, 0, 0, 0.12)",
                                      boxShadow: isSelected
                                        ? "0 3px 8px rgba(0, 0, 0, 0.22)"
                                        : "0 1px 3px rgba(0, 0, 0, 0.08)",
                                      transform: isSelected ? "scale(1.05)" : "none",
                                      transition: "all 0.2s ease",
                                    }}
                                  />
                                ) : (
                                  <Button
                                    size="small"
                                    type={isSelected ? "primary" : "default"}
                                    style={{ borderRadius: 6 }}
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
                          const isSelected = currentAttributes[key] === val;
                          return (
                            <Button
                              key={val}
                              size="small"
                              type={isSelected ? "primary" : "default"}
                              onClick={() => handleSelectAttribute(key, val)}
                              style={{
                                borderRadius: 6,
                                fontWeight: isSelected ? 600 : 400,
                                height: 30,
                                padding: "0 12px",
                              }}
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
          ) : null}

          <div style={{ marginTop: 18 }}>
            <Button
              type="primary"
              size="large"
              style={{ width: "100%", borderRadius: 8, height: 40, fontWeight: 500 }}
              onClick={() => {
                const slug = item.slug || "detail";
                router.push(`/products/${slug}/${item.id}`);
              }}
            >
              Xem chi tiết sản phẩm &rarr;
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  </>
);
};

export default ProductItem;
