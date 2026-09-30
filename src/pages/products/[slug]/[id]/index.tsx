/** @format */

import { useEffect, useState, useMemo } from "react";
import { CarouselImages, TabbarComponent, ProductItem } from "@/components";
import HeadComponent from "@/components/HeadComponent";
import { appInfo } from "@/constants/appInfos";
import { ProductModel, SubProductModel } from "@/models/Products";
import { cartSelector } from "@/redux/reducers/cartReducer";
import { VND } from "@/utils/handleCurrency";
import { useProductDetail, useCart } from "@/hooks";
import { productService } from "@/services";
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Empty,
  Rate,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
  Spin,
  Tooltip,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { IoAddSharp, IoHeart, IoHeartOutline } from "react-icons/io5";
import { LuMinus } from "react-icons/lu";
import { PiCableCar } from "react-icons/pi";
import { FiTruck, FiShield, FiRefreshCw } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { useWishlist } from "@/hooks/useWishlist";

const { Text, Paragraph, Title } = Typography;

const ProductDetail = (props: any) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="container" style={{ padding: "40px 16px", minHeight: "80vh", maxWidth: 1200, margin: "0 auto" }}>
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <Skeleton.Image active style={{ width: "100%", height: 420, borderRadius: 12 }} />
          </div>
          <div className="col-12 col-lg-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  const product: ProductModel =
    props?.pageProps?.product || props?.product || props?.pageProps;
  const cart = useSelector(cartSelector);
  const { isFavorite, toggleFavorite } = useWishlist();
  const isFav = isFavorite(product?.id);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<ProductModel[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const {
    subProducts,
    supplier,
    reviews,
    subProductSelected,
    setSubProductSelected,
    loading,
    error,
  } = useProductDetail({ product });

  const { count, setCount, instockQuantity, handleCart } = useCart({
    subProductSelected,
    product,
  });

  const getSubProductImage = (sp?: SubProductModel | null): string => {
    if (!sp) return "";
    if (sp.imgURL && typeof sp.imgURL === "string" && sp.imgURL.trim()) {
      return sp.imgURL.trim();
    }
    let imgs: any = sp.images;
    if (typeof imgs === "string") {
      try {
        imgs = JSON.parse(imgs);
      } catch (e) {
        if (imgs.startsWith("http") || imgs.startsWith("/")) {
          return imgs.trim();
        }
      }
    }
    if (Array.isArray(imgs) && imgs.length > 0) {
      for (const img of imgs) {
        if (typeof img === "string" && img.trim()) return img.trim();
        if (img && typeof img === "object" && img.url && typeof img.url === "string") {
          return img.url.trim();
        }
      }
    }
    return "";
  };

  useEffect(() => {
    if (!subProductSelected) return;
    const subImgs: string[] = [];
    if (subProductSelected.imgURL) subImgs.push(subProductSelected.imgURL);
    if (Array.isArray(subProductSelected.images)) {
      subProductSelected.images.forEach((img: any) => {
        const u = typeof img === "string" ? img : img?.url;
        if (u) subImgs.push(u);
      });
    }
    if (selectedImage && subImgs.includes(selectedImage)) {
      return;
    }
    const subImg = getSubProductImage(subProductSelected);
    if (subImg) {
      setSelectedImage(subImg);
    } else if (product?.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [subProductSelected, product]);

  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    setIsLoadingRelated(true);

    const fetchRelated = async () => {
      try {
        const aiProducts = await productService.getRelatedProducts(product.id, 4);
        if (isMounted) {
          setRelatedProducts(aiProducts || []);
        }
      } catch (err) {
        console.error("Error fetching related products:", err);
        if (isMounted) setRelatedProducts([]);
      } finally {
        if (isMounted) setIsLoadingRelated(false);
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  const currentImage =
    selectedImage ||
    getSubProductImage(subProductSelected) ||
    product?.images?.[0] ||
    "";

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
    const cleanAttrs: Record<string, string> = {};
    if (attrs && typeof attrs === "object" && Object.keys(attrs).length > 0) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (!isSystemOrPriceAttribute(k) && v !== undefined && v !== null && String(v).trim()) {
          cleanAttrs[k] = String(v).trim();
        }
      });
    }

    const hasColorKey = Object.keys(cleanAttrs).some((k) => {
      const lower = k.trim().toLowerCase();
      return lower.includes("màu") || lower.includes("color") || lower.includes("colour");
    });
    if (!hasColorKey && sp.color && sp.color.trim()) {
      cleanAttrs["Màu sắc"] = sp.color.trim();
    }

    const hasSizeKey = Object.keys(cleanAttrs).some((k) => {
      const lower = k.trim().toLowerCase();
      return lower.includes("size") || lower.includes("kích") || lower.includes("cỡ");
    });
    if (!hasSizeKey && sp.size && sp.size.trim()) {
      cleanAttrs["Kích cỡ"] = sp.size.trim();
    }

    return cleanAttrs;
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
    if (!subProductSelected) return {};
    return getSubProductAttributes(subProductSelected);
  }, [subProductSelected]);

  const sortSizeValues = (values: string[]): string[] => {
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
      FREESIZE: 99,
      OS: 99,
    };

    return [...values].sort((a, b) => {
      const aUpper = a.trim().toUpperCase();
      const bUpper = b.trim().toUpperCase();

      const aRank = sizeOrder[aUpper];
      const bRank = sizeOrder[bUpper];

      if (aRank !== undefined && bRank !== undefined) {
        return aRank - bRank;
      }
      if (aRank !== undefined) return -1;
      if (bRank !== undefined) return 1;

      const aNum = parseFloat(aUpper);
      const bNum = parseFloat(bUpper);
      if (!isNaN(aNum) && !isNaN(bNum) && String(aNum) === aUpper && String(bNum) === bUpper) {
        return aNum - bNum;
      }

      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    });
  };

  const isSizeAttribute = (key: string) => {
    const k = key.trim().toLowerCase();
    return k.includes("size") || k.includes("kích") || k.includes("cỡ");
  };

  const getAvailableValuesForKey = (key: string): string[] => {
    const valuesSet = new Set<string>();
    subProducts.forEach((sp) => {
      const attrs = getSubProductAttributes(sp);
      if (attrs[key] && attrs[key].trim()) {
        valuesSet.add(attrs[key].trim());
      }
    });
    const list = Array.from(valuesSet);
    if (isSizeAttribute(key)) {
      return sortSizeValues(list);
    }
    return list;
  };

  const isHexColor = (val: string) =>
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(val?.trim());

  const isColorAttribute = (key: string, values?: string[]) => {
    const k = key.trim().toLowerCase();
    const isNamedColor =
      k === "color" ||
      k === "colour" ||
      k === "màu" ||
      k === "màu sắc" ||
      k.includes("màu") ||
      k.includes("color") ||
      k.includes("colour");
    return isNamedColor || (values ? values.some((v) => isHexColor(v)) : false);
  };

  const getColorThumbnail = (key: string, colorVal: string): string => {
    if (subProductSelected) {
      const currentAttrs = getSubProductAttributes(subProductSelected);
      const isMatch =
        currentAttrs[key] === colorVal ||
        (isColorAttribute(key) && subProductSelected.color === colorVal);
      if (isMatch) {
        const img = getSubProductImage(subProductSelected);
        if (img) return img;
      }
    }

    for (const sp of subProducts) {
      const attrs = getSubProductAttributes(sp);
      const isMatch =
        attrs[key] === colorVal ||
        (isColorAttribute(key) && sp.color === colorVal);
      if (isMatch) {
        const img = getSubProductImage(sp);
        if (img) return img;
      }
    }

    if (product?.images && product.images.length > 0) {
      return product.images[0];
    }

    return "";
  };

  const handleSelectAttribute = (targetKey: string, targetValue: string) => {
    const isTargetColor = isColorAttribute(targetKey);
    const matchingCandidates = subProducts.filter((sp) => {
      const attrs = getSubProductAttributes(sp);
      return (
        attrs[targetKey] === targetValue ||
        (isTargetColor && sp.color === targetValue)
      );
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
          (attrs[otherKey] === currentAttributes[otherKey] ||
            (isColorAttribute(otherKey) &&
              sp.color === currentAttributes[otherKey]))
        ) {
          score++;
        }
      });
      if (score > maxScore) {
        maxScore = score;
        bestCandidate = sp;
      }
    });

    setSubProductSelected(bestCandidate);
  };

  const carouselItems = useMemo(() => {
    const seenImgs = new Set<string>();
    const itemsList: Array<{
      id?: string;
      imgURL: string;
      title?: string;
      subProduct?: SubProductModel;
    }> = [];

    if (product?.images && product.images.length > 0) {
      product.images.forEach((img, idx) => {
        if (img && !seenImgs.has(img)) {
          seenImgs.add(img);
          itemsList.push({
            id: `prod-img-${idx}`,
            imgURL: img,
            title: product.title,
          });
        }
      });
    }

    if (subProducts && subProducts.length > 0) {
      subProducts.forEach((sp) => {
        const subImgs: string[] = [];
        if (sp.imgURL) subImgs.push(sp.imgURL);
        if (Array.isArray(sp.images)) {
          sp.images.forEach((img: any) => {
            const url = typeof img === "string" ? img : img?.url;
            if (url) subImgs.push(url);
          });
        }

        subImgs.forEach((img) => {
          if (img && !seenImgs.has(img)) {
            seenImgs.add(img);
            itemsList.push({
              id: sp.id,
              imgURL: img,
              title: (sp as any).title || product?.title,
              subProduct: sp,
            });
          }
        });
      });
    }

    return itemsList;
  }, [product?.images, product?.title, subProducts]);

  const renderPrice = () => {
    if (subProductSelected) {
      const hasDiscount =
        subProductSelected.discount &&
        subProductSelected.discount < subProductSelected.price;
      const discountPercent = hasDiscount
        ? Math.round(
          ((subProductSelected.price - subProductSelected.discount!) /
            subProductSelected.price) *
          100
        )
        : 0;

      return (
        <div
          className="my-2"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
              fontWeight: 700,
              color: hasDiscount ? "#DC2626" : "#131118",
              lineHeight: 1.2,
            }}
          >
            {VND.format(
              subProductSelected.discount ?? subProductSelected.price
            )}
          </span>
          {hasDiscount && (
            <>
              <span
                style={{
                  fontSize: "1.1rem",
                  color: "#9CA3AF",
                  textDecoration: "line-through",
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              >
                {VND.format(subProductSelected.price)}
              </span>
              <Tag
                color="error"
                style={{
                  margin: 0,
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  lineHeight: 1.4,
                }}
              >
                -{discountPercent}%
              </Tag>
            </>
          )}
        </div>
      );
    }

    if (product?.price && product.price.length > 0) {
      const minPrice = Math.min(...product.price);
      const maxPrice = Math.max(...product.price);
      if (minPrice === maxPrice) {
        return (
          <div className="my-2">
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
                fontWeight: 700,
                color: "#131118",
                lineHeight: 1.2,
              }}
            >
              {VND.format(minPrice)}
            </span>
          </div>
        );
      }
      return (
        <div
          className="my-2"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
              fontWeight: 700,
              color: "#131118",
              lineHeight: 1.2,
            }}
          >
            {VND.format(minPrice)}
          </span>
          <span style={{ color: "#9CA3AF", fontSize: "1.2rem", lineHeight: 1 }}>
            -
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.2rem, 3.5vw, 1.5rem)",
              fontWeight: 600,
              color: "#6B7280",
              lineHeight: 1.2,
            }}
          >
            {VND.format(maxPrice)}
          </span>
        </div>
      );
    }

    return (
      <div className="my-2">
        <span style={{ fontSize: "1.3rem", fontWeight: 600, color: "#6B7280" }}>
          Liên hệ
        </span>
      </div>
    );
  };

  const renderButtonGroup = () => {
    if (!subProductSelected) {
      return (
        <Button
          disabled
          size="large"
          type="primary"
          style={{
            flex: "1 1 200px",
            minWidth: 160,
            height: 48,
            borderRadius: 8,
            fontWeight: 500,
          }}
        >
          {subProducts.length === 0
            ? "Chưa có phân loại hàng"
            : "Vui lòng chọn phân loại"}
        </Button>
      );
    }

    const item = cart.find(
      (el: any) => el.subProductId === subProductSelected?.id
    );
    const availableQty = item
      ? (subProductSelected?.stock ?? 0) - item.count
      : subProductSelected?.stock ?? 0;

    return (
      <div className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap flex-grow-1">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            backgroundColor: "#FFFFFF",
            height: 48,
            padding: "0 4px",
            flexShrink: 0,
          }}
        >
          <Button
            onClick={() => setCount(count - 1)}
            disabled={count <= 1}
            type="text"
            icon={<LuMinus size={16} />}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <span
            style={{
              minWidth: 38,
              textAlign: "center",
              fontWeight: 600,
              fontSize: "1rem",
              color: "#131118",
            }}
          >
            {count}
          </span>
          <Button
            onClick={() => setCount(count + 1)}
            disabled={count >= (availableQty ?? 0)}
            type="text"
            icon={<IoAddSharp size={18} />}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>
        <Button
          disabled={availableQty <= 0}
          onClick={handleCart}
          size="large"
          type="primary"
          style={{
            flex: "1 1 180px",
            minWidth: 150,
            height: 48,
            borderRadius: 8,
            backgroundColor: "#131118",
            borderColor: "#131118",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          {availableQty <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
        </Button>
      </div>
    );
  };

  const averageRate = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.star || 0), 0) / reviews.length
    : 0;

  if (!product || !product.id) {
    return (
      <div className="container-fluid mt-5 mb-5 text-center">
        <Spin size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid mt-5 mb-5 text-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-3 mb-5">
        <div className="container text-center">
          <div>Lỗi: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeadComponent
        title={product.title}
        description={product.description}
        url={`${appInfo.baseUrl}/public/products/${product.slug}/${product.id}`}
      />
      <div className="container mt-2 mb-5">
          {/* Breadcrumb Navigation */}
          <div
            className="py-3 mb-4 border-bottom"
            style={{ borderColor: "#F3F4F6" }}
          >
            <Breadcrumb
              items={[
                {
                  key: "home",
                  title: (
                    <Link
                      href={"/"}
                      className="d-flex align-items-center"
                      style={{ color: "#6B7280", textDecoration: "none" }}
                    >
                      <HiOutlineHome size={15} style={{ marginRight: 6 }} />
                      <span>Trang chủ</span>
                    </Link>
                  ),
                },
                {
                  key: "shop",
                  title: (
                    <Link
                      href={
                        product.categories && product.categories.length > 0
                          ? `/shop?catId=${product.categories[
                            product.categories.length - 1
                          ].id
                          }`
                          : "/shop"
                      }
                      style={{ color: "#6B7280", textDecoration: "none" }}
                    >
                      Cửa hàng
                    </Link>
                  ),
                },
                ...(product.categories && product.categories.length > 0
                  ? product.categories.map((cat) => ({
                    key: cat.id,
                    title: (
                      <Link
                        href={`/shop?catId=${cat.id}`}
                        style={{ color: "#6B7280", textDecoration: "none" }}
                      >
                        {cat.title}
                      </Link>
                    ),
                  }))
                  : []),
                {
                  key: "product-title",
                  title: (
                    <span
                      style={{
                        color: "#131118",
                        fontWeight: 600,
                        maxWidth: "clamp(160px, 35vw, 400px)",
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "bottom",
                      }}
                    >
                      {product.title}
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div className="row g-4">
            {/* Left Column: Image Viewer & Gallery */}
            <div className="col-12 col-lg-6">
              <div
                className="bg-white text-center p-3 p-md-4 border shadow-sm position-relative"
                style={{
                  borderRadius: 14,
                  borderColor: "#E5E7EB",
                  minHeight: "clamp(280px, 45vw, 440px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {currentImage ? (
                  <img
                    style={{
                      maxWidth: "100%",
                      maxHeight: "clamp(260px, 45vw, 440px)",
                      objectFit: "contain",
                      transition: "transform 0.3s ease",
                    }}
                    src={currentImage}
                    alt={product.title}
                  />
                ) : (
                  <PiCableCar size={48} className="text-muted" />
                )}
              </div>
              {carouselItems.length > 1 && (
                <div className="mt-3">
                  <CarouselImages
                    items={carouselItems}
                    selectedImageUrl={currentImage}
                    onClick={(val: any) => {
                      const url =
                        val?.imgURL ||
                        (typeof val === "string" ? val : "") ||
                        val?.subProduct?.imgURL;

                      if (url) {
                        setSelectedImage(
                          typeof url === "string" ? url : url?.url || ""
                        );
                      }

                      if (val?.subProduct) {
                        setSubProductSelected(val.subProduct);
                      } else if (val?.price !== undefined && val?.id) {
                        setSubProductSelected(val);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Product Info & Configuration */}
            <div className="col-12 col-lg-6">
              <div>
                {supplier?.name && (
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      color: "#6B7280",
                      marginBottom: 6,
                    }}
                  >
                    {supplier.name}
                  </div>
                )}
                <Typography.Title
                  className="m-0"
                  level={2}
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: "1.85rem",
                    lineHeight: 1.3,
                    color: "#131118",
                  }}
                >
                  {product.title}
                </Typography.Title>

                <div className="d-flex align-items-center gap-3 mt-2 flex-wrap">
                  <Space size={4}>
                    <Rate
                      disabled
                      allowHalf
                      value={averageRate}
                      count={5}
                      style={{ fontSize: 15 }}
                    />
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: "0.88rem",
                        marginLeft: 4,
                      }}
                    >
                      ({reviews.length} đánh giá)
                    </Text>
                  </Space>
                  <span style={{ color: "#D1D5DB" }}>|</span>
                  <div>
                    {subProductSelected ? (
                      <Tag
                        color={
                          subProductSelected.stock > 0 ? "success" : "error"
                        }
                        style={{ borderRadius: 6, fontWeight: 500 }}
                      >
                        {subProductSelected.stock > 0
                          ? `Còn hàng (${instockQuantity})`
                          : "Hết hàng"}
                      </Tag>
                    ) : (
                      <Tag
                        color="processing"
                        style={{ borderRadius: 6, fontWeight: 500 }}
                      >
                        {subProducts.length === 0
                          ? "Đang cập nhật tồn kho"
                          : "Vui lòng chọn phân loại"}
                      </Tag>
                    )}
                  </div>
                </div>

                <div
                  className="mt-3 pb-3 border-bottom"
                  style={{ borderColor: "#F3F4F6" }}
                >
                  {renderPrice()}
                </div>

                <Paragraph
                  className="mt-3 text-secondary"
                  style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                >
                  {product.description}
                </Paragraph>

                {attributeKeys.map((key) => {
                  const values = getAvailableValuesForKey(key);
                  if (values.length === 0) return null;

                  const isColor = isColorAttribute(key, values);
                  const selectedVal =
                    currentAttributes[key] ||
                    (isColor ? subProductSelected?.color : "") ||
                    "";
                  const showOptionsBelow = isColor || values.length > 1;

                  return (
                    <div className={showOptionsBelow ? "mt-4" : "mt-3"} key={key}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          marginBottom: showOptionsBelow ? 10 : 0,
                          color: "#131118",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontWeight: 500, color: "#131118" }}>
                          {key}:
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#131118",
                          }}
                        >
                          {selectedVal || values[0] || "Chưa chọn"}
                        </span>
                      </div>

                      {showOptionsBelow && (
                        isColor ? (
                          <Space size={12} wrap>
                            {values.map((colorVal) => {
                              const isSelected =
                                selectedVal === colorVal ||
                                currentAttributes[key] === colorVal ||
                                subProductSelected?.color === colorVal;
                              const isHex = isHexColor(colorVal);
                              const thumbnailUrl = getColorThumbnail(
                                key,
                                colorVal
                              );

                              return (
                                <Tooltip key={colorVal} title={colorVal}>
                                  <div
                                    onClick={() =>
                                      handleSelectAttribute(key, colorVal)
                                    }
                                    role="button"
                                    tabIndex={0}
                                    style={{
                                      cursor: "pointer",
                                      width: 44,
                                      height: 44,
                                      borderRadius: "50%",
                                      border: isSelected
                                        ? "2px solid #131118"
                                        : "1.5px solid #E5E7EB",
                                      padding: 2,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: "#FFFFFF",
                                      boxShadow: isSelected
                                        ? "0 0 0 1px rgba(19, 17, 24, 0.15)"
                                        : "none",
                                      transition: "all 0.2s ease",
                                      transform: isSelected
                                        ? "scale(1.05)"
                                        : "scale(1)",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.borderColor =
                                          "#9CA3AF";
                                        e.currentTarget.style.transform =
                                          "scale(1.05)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.borderColor =
                                          "#E5E7EB";
                                      e.currentTarget.style.transform =
                                        "scale(1)";
                                      }
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        backgroundColor: "#F9FAFB",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {thumbnailUrl ? (
                                        <img
                                          src={thumbnailUrl}
                                          alt={colorVal}
                                          style={{
                                            width: "90%",
                                            height: "90%",
                                            objectFit: "contain",
                                          }}
                                        />
                                      ) : isHex ? (
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: "50%",
                                            backgroundColor: colorVal,
                                          }}
                                        />
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "#374151",
                                            textAlign: "center",
                                            padding: "0 2px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {colorVal}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Tooltip>
                              );
                            })}
                          </Space>
                        ) : (
                          <Space size={10} wrap>
                            {values.map((val) => {
                              const isSelected =
                                currentAttributes[key] === val;
                              return (
                                <Button
                                  key={val}
                                  type={isSelected ? "primary" : "default"}
                                  style={{
                                    borderRadius: 8,
                                    fontWeight: isSelected ? 600 : 400,
                                    backgroundColor: isSelected
                                      ? "#131118"
                                      : undefined,
                                    borderColor: isSelected
                                      ? "#131118"
                                      : "#E5E7EB",
                                    color: isSelected ? "#FFFFFF" : "#374151",
                                    height: 38,
                                    padding: "0 16px",
                                  }}
                                  onClick={() =>
                                    handleSelectAttribute(key, val)
                                  }
                                >
                                  {val}
                                </Button>
                              );
                            })}
                          </Space>
                        )
                      )}
                    </div>
                  );
                })}

                <div className="mt-4 pt-2">
                  <div className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap">
                    {renderButtonGroup()}
                    <Button
                      size="large"
                      icon={
                        isFav ? (
                          <IoHeart size={22} style={{ color: "#EF4444" }} />
                        ) : (
                          <IoHeartOutline size={22} />
                        )
                      }
                      onClick={() => {
                        if (product) toggleFavorite(product);
                      }}
                      style={{
                        height: 48,
                        width: 48,
                        flexShrink: 0,
                        borderRadius: 8,
                        borderColor: isFav ? "#EF4444" : "#E5E7EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    />
                  </div>
                </div>

                {/* Trust Badges */}
                <div
                  className="mt-4 p-3 border"
                  style={{
                    borderColor: "#E5E7EB",
                    backgroundColor: "#FAFAFA",
                    borderRadius: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px 20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", flex: "1 1 160px" }}>
                    <FiTruck
                      size={18}
                      color="#131118"
                      style={{ marginRight: 8, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      Giao hàng nhanh toàn quốc
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", flex: "1 1 140px" }}>
                    <FiShield
                      size={18}
                      color="#131118"
                      style={{ marginRight: 8, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      100% Chính hãng
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", flex: "1 1 140px" }}>
                    <FiRefreshCw
                      size={16}
                      color="#131118"
                      style={{ marginRight: 8, flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      Đổi trả trong 7 ngày
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Reviews Tabs */}
          <div
            className="mt-5 p-3 p-md-4 bg-white border shadow-sm"
            style={{ borderRadius: 14, borderColor: "#E5E7EB" }}
          >
            <Tabs
              defaultActiveKey="1"
              tabBarStyle={{
                marginBottom: 20,
                borderBottom: "1px solid #F3F4F6",
              }}
              items={[
                {
                  key: "1",
                  label: (
                    <span
                      style={{
                        fontFamily:
                          "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      Mô tả sản phẩm
                    </span>
                  ),
                  children: (
                    <div
                      className="py-2"
                      dangerouslySetInnerHTML={{
                        __html: product.content || product.description,
                      }}
                      style={{
                        textAlign: "justify",
                        fontSize: "0.95rem",
                        lineHeight: 1.7,
                        color: "#374151",
                      }}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span
                      style={{
                        fontFamily:
                          "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: "1rem",
                      }}
                    >
                      Đánh giá ({reviews.length})
                    </span>
                  ),
                  children: (
                    <div className="py-2">
                      {reviews.length === 0 ? (
                        <div className="text-muted py-4 text-center">
                          Chưa có đánh giá nào cho sản phẩm này.
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div
                            key={review.id}
                            style={{
                              marginBottom: 20,
                              paddingBottom: 16,
                              borderBottom: "1px solid #F3F4F6",
                              display: "flex",
                              alignItems: "flex-start",
                            }}
                          >
                            <Avatar
                              src={review.userAvatar}
                              size={44}
                              style={{
                                marginRight: 16,
                                border: "1px solid #E5E7EB",
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    color: "#131118",
                                  }}
                                >
                                  {review.userFirstname}{" "}
                                  {review.userLastname}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#9CA3AF",
                                  }}
                                >
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                              <div className="my-1">
                                <Rate
                                  disabled
                                  value={review.star}
                                  style={{ fontSize: 14 }}
                                />
                              </div>
                              {(review.size || review.color) && (
                                <div
                                  className="d-flex align-items-center gap-2 mb-2"
                                  style={{
                                    fontSize: 12.5,
                                    color: "#6B7280",
                                  }}
                                >
                                  {review.size && (
                                    <span>
                                      Phân loại: <b>{review.size}</b>
                                    </span>
                                  )}
                                  {review.color && (
                                    <span className="d-flex align-items-center gap-1">
                                      Màu:{" "}
                                      {isHexColor(review.color) ? (
                                        <span
                                          style={{
                                            display: "inline-block",
                                            width: 12,
                                            height: 12,
                                            background: review.color,
                                            border: "1px solid #ccc",
                                            borderRadius: 3,
                                          }}
                                        />
                                      ) : (
                                        <b>{review.color}</b>
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: "0.92rem",
                                  color: "#374151",
                                  lineHeight: 1.5,
                                }}
                              >
                                {review.comment}
                              </div>

                              {review.images &&
                                Array.isArray(review.images) &&
                                review.images.length > 0 && (
                                  <div className="d-flex gap-2 mt-2">
                                    {review.images.map(
                                      (img: any, idx: any) => (
                                        <img
                                          key={idx}
                                          src={img}
                                          alt="review-img"
                                          style={{
                                            width: 64,
                                            height: 64,
                                            objectFit: "cover",
                                            borderRadius: 6,
                                            border: "1px solid #E5E7EB",
                                          }}
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Related Products */}
          {(isLoadingRelated ||
            (relatedProducts && relatedProducts.length > 0)) && (
              <div className="mt-5 mb-5">
                <TabbarComponent
                  title="Sản phẩm liên quan"
                  orentation="text-start"
                  right={
                    product.categories && product.categories.length > 0 ? (
                      <div className="col-auto d-flex align-items-center">
                        <Link
                          href={`/shop?catId=${typeof product.categories[
                              product.categories.length - 1
                            ] === "object"
                              ? product.categories[
                                product.categories.length - 1
                              ].id
                              : product.categories[
                              product.categories.length - 1
                              ]
                            }`}
                          style={{
                            fontSize: 14,
                            color: "#131118",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Xem tất cả &rarr;
                        </Link>
                      </div>
                    ) : undefined
                  }
                />

                {isLoadingRelated ? (
                  <div className="row g-3 mt-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        className="col-6 col-md-4 col-lg-3"
                        key={`rel-skel-${n}`}
                      >
                        <Card
                          style={{
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid #E5E7EB",
                          }}
                        >
                          <Skeleton.Image
                            active
                            style={{ width: "100%", height: 180 }}
                          />
                          <Skeleton
                            active
                            paragraph={{ rows: 2 }}
                            style={{ marginTop: 16 }}
                          />
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row g-3 mt-2">
                    {relatedProducts.slice(0, 4).map((item) => (
                      <ProductItem item={item} key={item.id} />
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
    </div>
  );
};

export const getStaticProps = async (context: any) => {
  try {
    console.log("getStaticProps called with params:", context.params);

    if (!context.params?.slug || !context.params?.id) {
      console.log("Missing slug or id params");
      return { notFound: true };
    }

    const product = await productService.getProductDetail(
      context.params.slug,
      context.params.id
    );


    if (!product || !product.id) {
      console.log("Product not found or invalid");
      return { notFound: true };
    }

    return {
      props: { product },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { notFound: true };
  }
};

export const getStaticPaths = async () => ({ paths: [], fallback: true });

export default ProductDetail;
