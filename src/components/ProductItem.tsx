/** @format */

import { colors } from "@/constants/colors";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { VND } from "@/utils/handleCurrency";
import { Button, Card, Space, Typography, Modal, Tag, Tooltip, Spin, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BiHeart, BiSolidHeart, BiTransfer } from "react-icons/bi";
import { BsEye, BsBagCheckFill } from "react-icons/bs";
import { FiShoppingCart } from "react-icons/fi";
import { FaRegStar } from "react-icons/fa";
import { MdImage } from "react-icons/md";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { themeSelector } from "@/redux/reducers/themeSlice";
import { productService } from "@/services";
import { userService } from "@/services/userService";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

interface Props {
  item: ProductModel;
  className?: string;
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
  const [isHovered, setIsHovered] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);

  const ref = useRef<any>();
  const router = useRouter();
  const auth = useSelector(authSelector);
  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";
  const { isFavorite, toggleFavorite } = useWishlist();
  const isFav = isFavorite(item.id);

  const { count, setCount, handleCart } = useCart({
    subProductSelected: selectedSubProduct || undefined,
    product: item,
  });

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
    if (!ref.current) return;
    const updateWidth = () => {
      if (ref.current) {
        setElementWidth(ref.current.offsetWidth);
      }
    };
    updateWidth();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => updateWidth());
      ro.observe(ref.current);
      return () => ro.disconnect();
    }
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

  const isSystemOrPriceAttribute = (key: string): boolean => {
    const k = key.trim().toLowerCase();
    return (
      k === "discounttype" ||
      k === "discountvalue" ||
      k === "discountamount" ||
      k === "discount" ||
      k === "price" ||
      k === "cost" ||
      k === "stock" ||
      k === "qty" ||
      k === "reservedstock"
    );
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
      const cleanAttrs: Record<string, string> = {};
      Object.entries(attrs).forEach(([k, v]) => {
        if (!isSystemOrPriceAttribute(k) && v !== undefined && v !== null && String(v).trim()) {
          cleanAttrs[k] = String(v).trim();
        }
      });
      return cleanAttrs;
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

  const sortAttributeValues = (key: string, values: string[]): string[] => {
    const sizeOrder: Record<string, number> = {
      XXS: 1,
      "2XS": 1,
      XS: 2,
      S: 3,
      M: 4,
      L: 5,
      XL: 6,
      XXL: 7,
      "2XL": 7,
      XXXL: 8,
      "3XL": 8,
      "4XL": 9,
      "5XL": 10,
      "6XL": 11,
      FREESIZE: 99,
      "FREE SIZE": 99,
      OS: 99,
      "ONE SIZE": 99,
    };

    const cleanSizeStr = (s: string): string => {
      return s
        .trim()
        .replace(/^(size|cỡ|kích\s*cỡ|kích\s*thước)\s*:?\s*/i, "")
        .trim()
        .toUpperCase();
    };

    const getStorageBytes = (str: string): number | null => {
      const match = str.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MB|KB)$/);
      if (!match) return null;
      const num = parseFloat(match[1]);
      const unit = match[2];
      if (unit === "KB") return num * 1024;
      if (unit === "MB") return num * 1024 * 1024;
      if (unit === "GB") return num * 1024 * 1024 * 1024;
      if (unit === "TB") return num * 1024 * 1024 * 1024 * 1024;
      return null;
    };

    return [...values].sort((a, b) => {
      const aClean = cleanSizeStr(a);
      const bClean = cleanSizeStr(b);

      // 1. Quần áo size chữ: S, M, L, XL, XXL...
      const aRank = sizeOrder[aClean];
      const bRank = sizeOrder[bClean];
      if (aRank !== undefined && bRank !== undefined) {
        return aRank - bRank;
      }
      if (aRank !== undefined) return -1;
      if (bRank !== undefined) return 1;

      // 2. Dung lượng bộ nhớ: GB, TB...
      const aBytes = getStorageBytes(a);
      const bBytes = getStorageBytes(b);
      if (aBytes !== null && bBytes !== null) {
        return aBytes - bBytes;
      }

      // 3. Size số: 28, 29, 30, 31, 32 hoặc size giày: 38, 39, 40...
      const aNum = parseFloat(aClean);
      const bNum = parseFloat(bClean);
      const isANum = !isNaN(aNum) && String(aNum) === aClean;
      const isBNum = !isNaN(bNum) && String(bNum) === bClean;
      if (isANum && isBNum) {
        return aNum - bNum;
      }
      if (isANum) return -1;
      if (isBNum) return 1;

      // 4. Mặc định theo thứ tự tự nhiên locale
      return a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" });
    });
  };

  const getAvailableValuesForKey = (key: string): string[] => {
    const valuesSet = new Set<string>();
    currentSubProducts.forEach((sp) => {
      const attrs = getSubProductAttributes(sp);
      if (attrs[key] && attrs[key].trim()) {
        valuesSet.add(attrs[key].trim());
      }
    });
    return sortAttributeValues(key, Array.from(valuesSet));
  };

  const handleBuyNow = async () => {
    if (!selectedSubProduct) {
      message.warning("Vui lòng chọn phân loại sản phẩm!");
      return;
    }

    if (selectedSubProduct.stock <= 0) {
      message.warning("Sản phẩm đã hết hàng!");
      return;
    }

    setIsBuyingNow(true);
    try {
      const isSuccess = await handleCart();
      if (isSuccess) {
        setShowQuickView(false);
        router.push(`/shop/checkout?buyNowId=${selectedSubProduct.id}`);
      }
    } catch (err: any) {
      console.error("Lỗi khi mua ngay:", err);
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSubProduct) {
      message.warning("Vui lòng chọn phân loại sản phẩm!");
      return;
    }

    if (selectedSubProduct.stock <= 0) {
      message.warning("Sản phẩm đã hết hàng!");
      return;
    }

    setIsAddingCart(true);
    try {
      const isSuccess = await handleCart();
      if (isSuccess) {
        message.success("Đã thêm sản phẩm vào giỏ hàng thành công!");
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
    } finally {
      setIsAddingCart(false);
    }
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
            <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-destructive, #DC2626)" }}>
              {VND.format(selectedSubProduct.discount!)}
            </span>
            <span style={{ fontSize: "1rem", textDecoration: "line-through", color: "#999" }}>
              {VND.format(selectedSubProduct.price)}
            </span>
            <Tag color="error" style={{ fontWeight: 600 }}>
              -{Math.round(((selectedSubProduct.price - selectedSubProduct.discount!) / selectedSubProduct.price) * 100)}%
            </Tag>
          </div>
        );
      }
      return (
        <div style={{ margin: "6px 0 10px" }}>
          <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-primary, #131118)" }}>
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
      recordView();
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
            return <strong style={{ color: "var(--color-primary, #131118)", whiteSpace: "nowrap" }}>{VND.format(minPrice)}</strong>;
          }
          return (
            <strong style={{ color: "var(--color-primary, #131118)", whiteSpace: "nowrap" }}>
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

    if (minEffective === maxEffective) {
      if (maxOriginal > minEffective) {
        return (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
            <strong style={{ color: "var(--color-destructive, #DC2626)" }}>{VND.format(minEffective)}</strong>
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
      return <strong style={{ color: "var(--color-primary, #131118)", whiteSpace: "nowrap" }}>{VND.format(minEffective)}</strong>;
    }

    return (
      <strong style={{ color: "var(--color-primary, #131118)", whiteSpace: "nowrap" }}>
        {`${VND.format(minEffective)} - ${VND.format(maxEffective)}`}
      </strong>
    );
  };

  const primaryImage = useMemo(() => {
    if (item.images && item.images.length > 0) return item.images[0];
    const subWithImg = currentSubProducts.find((sp) => {
      if (sp.imgURL) return true;
      if (Array.isArray(sp.images) && sp.images.length > 0) return true;
      return false;
    });
    if (subWithImg) {
      return subWithImg.imgURL || (subWithImg.images && subWithImg.images[0]);
    }
    return null;
  }, [item.images, currentSubProducts]);

  const secondaryImage = useMemo(() => {
    if (item.images && item.images.length > 1) return item.images[1];
    const allImages: string[] = [];
    if (item.images && item.images.length > 0) {
      allImages.push(...item.images);
    }
    currentSubProducts.forEach((sp) => {
      if (sp.imgURL && !allImages.includes(sp.imgURL)) {
        allImages.push(sp.imgURL);
      }
      if (Array.isArray(sp.images)) {
        sp.images.forEach((img: any) => {
          const url = typeof img === "string" ? img : img?.url;
          if (url && !allImages.includes(url)) {
            allImages.push(url);
          }
        });
      }
    });
    return allImages.length > 1 ? allImages[1] : null;
  }, [item.images, currentSubProducts]);

  const imageHeight = elementWidth ? elementWidth * 1.1 : 250;

  return (
    <>
      <div
        className={props.className || "col-6 col-md-4 col-lg-3 mb-3 mb-md-4"}
        key={item.id}
      >
        <div
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          ref={ref}
          className="cursor-pointer product-item"
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: imageHeight,
              overflow: "hidden",
            }}
          >
            {primaryImage ? (
              <>
                <img
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: "8px 8px 0 8px",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                    opacity: isHovered && secondaryImage ? 0 : 1,
                    transform: isHovered && !secondaryImage ? "scale(1.04)" : "scale(1)",
                  }}
                  src={primaryImage}
                  alt={item.title}
                />
                {secondaryImage && (
                  <img
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: "8px 8px 0 8px",
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? "scale(1.04)" : "scale(1)",
                      pointerEvents: "none",
                    }}
                    src={secondaryImage}
                    alt={`${item.title} - 2`}
                  />
                )}
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
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
                    icon={
                      isFav ? (
                        <BiSolidHeart size={20} style={{ color: "#EF4444" }} />
                      ) : (
                        <BiHeart size={20} className="text-muted" />
                      )
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(item);
                    }}
                    aria-label={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
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
            className="px-2 px-sm-3 py-2"
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
              {isLoading ? "Đang tải..." : getPriceRange()}
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
        style={{ maxWidth: "calc(100vw - 24px)", top: 20 }}
        destroyOnClose
      >
        <div
          className="quickview-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="quickview-image-col">
            <div
              style={{
                width: "100%",
                height: 320,
                background: isDark ? "#242428" : "#f8f9fa",
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
              <div style={{ fontSize: "0.9rem", color: "var(--color-muted-foreground, #6B7280)", fontWeight: 500, marginBottom: 2 }}>
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
                                        border: isSelected ? "2px solid var(--color-primary, #131118)" : "1px solid rgba(0, 0, 0, 0.12)",
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

            {/* Quantity Stepper & Buy Now / Add to Cart */}
            {(() => {
              const isOutOfStock = !selectedSubProduct || selectedSubProduct.stock <= 0;
              return (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Row 1: Stepper & Nút Mua ngay */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Stepper */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: `1px solid ${isDark ? "#38383e" : "#E5E7EB"}`,
                        borderRadius: 8,
                        backgroundColor: isDark ? "#242428" : "#FFFFFF",
                        height: 42,
                        padding: "0 4px",
                        flexShrink: 0,
                      }}
                    >
                      <Button
                        onClick={() => setCount(Math.max(1, count - 1))}
                        disabled={count <= 1 || isOutOfStock}
                        type="text"
                        size="small"
                        style={{
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          color: isDark ? "#FFFFFF" : "#131118",
                        }}
                      >
                        -
                      </Button>
                      <span
                        style={{
                          minWidth: 32,
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: isDark ? "#FFFFFF" : "#131118",
                        }}
                      >
                        {count}
                      </span>
                      <Button
                        onClick={() => setCount(count + 1)}
                        disabled={isOutOfStock || (selectedSubProduct ? count >= selectedSubProduct.stock : true)}
                        type="text"
                        size="small"
                        style={{
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          color: isDark ? "#FFFFFF" : "#131118",
                        }}
                      >
                        +
                      </Button>
                    </div>

                    {/* Nút Mua Ngay */}
                    <Button
                      type="primary"
                      size="large"
                      icon={<BsBagCheckFill size={15} />}
                      loading={isBuyingNow}
                      disabled={isOutOfStock}
                      onClick={handleBuyNow}
                      style={{
                        flex: 1,
                        height: 42,
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        backgroundColor: isOutOfStock ? undefined : (isDark ? "#ffffff" : "#131118"),
                        borderColor: isOutOfStock ? undefined : (isDark ? "#ffffff" : "#131118"),
                        color: isOutOfStock ? undefined : (isDark ? "#131118" : "#ffffff"),
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      {isOutOfStock ? "Hết hàng" : "Mua ngay"}
                    </Button>
                  </div>

                  {/* Row 2: Thêm vào giỏ & Xem chi tiết trên cùng 1 hàng */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Nút Thêm vào giỏ */}
                    <Button
                      size="large"
                      icon={<FiShoppingCart size={16} />}
                      loading={isAddingCart}
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: "0.92rem",
                        borderColor: isOutOfStock ? undefined : (isDark ? "#4b4b55" : "#131118"),
                        color: isOutOfStock ? undefined : (isDark ? "#ffffff" : "#131118"),
                        backgroundColor: isDark ? "#1f1f23" : "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      Thêm vào giỏ
                    </Button>

                    {/* Nút Xem chi tiết */}
                    <Button
                      type="default"
                      size="large"
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        fontWeight: 500,
                        fontSize: "0.92rem",
                        color: isDark ? "rgba(255,255,255,0.85)" : "#374151",
                        borderColor: isDark ? "#38383e" : "#E5E7EB",
                        backgroundColor: isDark ? "transparent" : "#F9FAFB",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                      onClick={() => {
                        const slug = item.slug || "detail";
                        router.push(`/products/${slug}/${item.id}`);
                      }}
                    >
                      Xem chi tiết &rarr;
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductItem;
