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
import { IoAddSharp, IoHeartOutline } from "react-icons/io5";
import { LuMinus } from "react-icons/lu";
import { PiCableCar } from "react-icons/pi";
import { useSelector } from "react-redux";

const { Text, Paragraph, Title } = Typography;

const ProductDetail = (props: any) => {
  const product: ProductModel =
    props?.pageProps?.product || props?.product || props?.pageProps;
  const cart = useSelector(cartSelector);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<ProductModel[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // Custom hooks for data management
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

  useEffect(() => {
    if (subProductSelected?.imgURL) {
      setSelectedImage(subProductSelected.imgURL);
    } else if (subProductSelected?.images && subProductSelected.images.length > 0) {
      setSelectedImage(subProductSelected.images[0]);
    } else if (product?.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [subProductSelected, product]);

  // AI Related Products (< 5 sản phẩm)
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    setIsLoadingRelated(true);

    const fetchRelated = async () => {
      try {
        // Gọi API AI phân tích sản phẩm liên quan từ backend (dựa trên thể loại và tiêu đề)
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
    subProductSelected?.imgURL ||
    subProductSelected?.images?.[0] ||
    product?.images?.[0] ||
    "";

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
    return {};
  };

  const getAttributeOrder = (key: string): number => {
    const k = key.trim().toLowerCase();
    // 1. Màu sắc
    if (k.includes("màu") || k.includes("color") || k.includes("colour")) return 1;
    // 2. Dung lượng / Bộ nhớ / Kích cỡ / Size / Storage
    if (
      k.includes("dung lượng") ||
      k.includes("bộ nhớ") ||
      k.includes("storage") ||
      k.includes("kích") ||
      k.includes("size")
    ) return 2;
    // 3. Phiên bản
    if (k.includes("phiên bản") || k.includes("version")) return 3;
    // 4. RAM
    if (k.includes("ram")) return 4;
    // 5. Thuộc tính khác
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
    return isNamedColor && values.some((v) => isHexColor(v));
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

    setSubProductSelected(bestCandidate);
  };

  const carouselItems = useMemo(() => {
    if (!subProducts || subProducts.length === 0) return [];
    const seenImgs = new Set<string>();
    const itemsWithDistinctImages: SubProductModel[] = [];

    if (subProductSelected) {
      const mainImg = subProductSelected.images?.[0] || subProductSelected.imgURL;
      if (mainImg) {
        seenImgs.add(mainImg);
      }
      itemsWithDistinctImages.push(subProductSelected);
    }

    subProducts.forEach((sp) => {
      if (sp.id === subProductSelected?.id) return;
      const firstImg = sp.images?.[0] || sp.imgURL;
      if (firstImg && !seenImgs.has(firstImg)) {
        seenImgs.add(firstImg);
        itemsWithDistinctImages.push(sp);
      }
    });

    return itemsWithDistinctImages.length > 0 ? itemsWithDistinctImages : subProducts;
  }, [subProducts, subProductSelected]);

  const renderPrice = () => {
    if (subProductSelected) {
      return (
        <Space>
          <Title className="mt-0" style={{ fontWeight: 400 }} level={3}>
            {VND.format(
              subProductSelected.discount ?? subProductSelected.price
            )}
          </Title>
          {subProductSelected.discount && subProductSelected.discount < subProductSelected.price && (
            <Title
              type="secondary"
              className="mt-0"
              style={{
                fontWeight: 300,
                textDecoration: "line-through",
              }}
              level={3}
            >
              {VND.format(subProductSelected.price)}
            </Title>
          )}
        </Space>
      );
    }

    if (product?.price && product.price.length > 0) {
      const minPrice = Math.min(...product.price);
      const maxPrice = Math.max(...product.price);
      if (minPrice === maxPrice) {
        return (
          <Title className="mt-0" style={{ fontWeight: 400 }} level={3}>
            {VND.format(minPrice)}
          </Title>
        );
      }
      return (
        <Space>
          <Title className="mt-0" style={{ fontWeight: 400, color: "#d32f2f" }} level={3}>
            {VND.format(minPrice)}
          </Title>
          <Title
            type="secondary"
            className="mt-0"
            style={{
              fontWeight: 300,
              textDecoration: "line-through",
            }}
            level={3}
          >
            {VND.format(maxPrice)}
          </Title>
        </Space>
      );
    }

    return (
      <Title className="mt-0" style={{ fontWeight: 400 }} level={3}>
        Liên hệ
      </Title>
    );
  };

  const renderButtonGroup = () => {
    if (!subProductSelected) {
      return (
        <Button
          disabled
          size="large"
          type="primary"
          style={{ minWidth: 200 }}
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
      <>
        <div className="button-groups">
          <Button
            onClick={() => setCount(count + 1)}
            disabled={count >= (availableQty ?? 0)}
            type="text"
            icon={<IoAddSharp size={22} />}
          />
          <Text>{count}</Text>
          <Button
            onClick={() => setCount(count - 1)}
            disabled={count <= 1}
            type="text"
            icon={<LuMinus size={22} />}
          />
        </div>
        <Button
          disabled={availableQty <= 0}
          onClick={handleCart}
          size="large"
          type="primary"
          style={{ minWidth: 200 }}
        >
          Add to Cart
        </Button>
      </>
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
          <div>Error: {error}</div>
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
      <div className="container-fluid mt-3 mb-5">
        <div className="container">
          <Breadcrumb
            items={[
              { key: "home", title: <Link href={"/"}>Home</Link> },
              {
                key: "shop",
                title: (
                  <Link
                    href={
                      product.categories && product.categories.length > 0
                        ? `/shop?catId=${product.categories[product.categories.length - 1].id}`
                        : "/shop"
                    }
                  >
                    Shop
                  </Link>
                ),
              },
              ...(product.categories && product.categories.length > 0
                ? product.categories.map((cat) => ({
                    key: cat.id,
                    title: <Link href={`/shop?catId=${cat.id}`}>{cat.title}</Link>,
                  }))
                : []),
              {
                key: "product-title",
                title: <span style={{ color: "#888" }}>{product.title}</span>,
              },
            ]}
          />

          <div className="row mt-3">
            <div className="col-sm-12 col-md-6">
              <div
                className="bg-light text-center p-4"
                style={{
                  borderRadius: 8,
                  minHeight: 350,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentImage ? (
                  <img
                    style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }}
                    src={currentImage}
                    alt={product.title}
                  />
                ) : (
                  <PiCableCar size={48} className="text-muted" />
                )}
              </div>
              {subProducts.length > 0 && subProductSelected ? (
                <CarouselImages
                  items={carouselItems}
                  onClick={setSubProductSelected}
                />
              ) : product.images && product.images.length > 1 ? (
                <div
                  className="d-flex gap-2 mt-3 overflow-auto justify-content-center"
                  style={{ flexWrap: "wrap" }}
                >
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.title}-${idx}`}
                      onClick={() => setSelectedImage(img)}
                      style={{
                        width: 70,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 6,
                        cursor: "pointer",
                        border:
                          currentImage === img
                            ? "2px solid #131118"
                            : "1px solid #ddd",
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="col">
              <div className="row">
                <div className="col">
                  <Typography.Title className="m-0" level={2} style={{ fontWeight: 600 }}>
                    {product.title}
                  </Typography.Title>
                  {supplier && (
                    <div className="mt-1 mb-2">
                      <span style={{ color: "#1677ff", fontWeight: 500, fontSize: "0.95rem" }}>
                        {supplier.name}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  {subProductSelected ? (
                    <Tag
                      color={subProductSelected.stock > 0 ? "success" : "error"}
                    >
                      {subProductSelected.stock > 0
                        ? `In Stock (${instockQuantity})`
                        : "Out of Stock"}
                    </Tag>
                  ) : (
                    <Tag color="processing">
                      {subProducts.length === 0
                        ? "Đang cập nhật tồn kho"
                        : "Vui lòng chọn phân loại"}
                    </Tag>
                  )}
                </div>
              </div>

              <Space className="mt-2">
                <Rate disabled allowHalf value={averageRate} count={5} />
                <Text type="secondary">({reviews.length}) reviews</Text>
              </Space>

              <div className="mt-3">
                {renderPrice()}
                <Paragraph
                  className="mt-3"
                  style={{ textAlign: "justify", fontSize: "1rem" }}
                >
                  {product.description}
                </Paragraph>

                {attributeKeys.map((key) => {
                  const values = getAvailableValuesForKey(key);
                  if (values.length === 0) return null;

                  const isColor = isColorAttribute(key, values);

                  return (
                    <div className="mt-3" key={key}>
                      <Paragraph
                        style={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          marginBottom: 8,
                        }}
                      >
                        {key}
                      </Paragraph>

                      {isColor ? (
                        <Space size={12} wrap>
                          {values.map((colorVal) => {
                            const isSelected = currentAttributes[key] === colorVal;
                            const isHex = isHexColor(colorVal);

                            return (
                              <Tooltip key={colorVal} title={colorVal}>
                                <a
                                  onClick={() => handleSelectAttribute(key, colorVal)}
                                  style={{
                                    cursor: "pointer",
                                    display: "inline-block",
                                    padding: 2,
                                  }}
                                >
                                  {isHex ? (
                                    <div
                                      className="color-item"
                                      style={{
                                        background: colorVal,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 6,
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
                                      style={{
                                        borderRadius: 6,
                                        fontWeight: isSelected ? 600 : 400,
                                      }}
                                    >
                                      {colorVal}
                                    </Button>
                                  )}
                                </a>
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
                                type={isSelected ? "primary" : "default"}
                                style={{
                                  borderRadius: 6,
                                  fontWeight: isSelected ? 600 : 400,
                                  borderColor: isSelected ? undefined : "#d9d9d9",
                                  boxShadow: isSelected
                                    ? "0 2px 4px rgba(0,0,0,0.12)"
                                    : undefined,
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

                <div className="mt-5">
                  <Space>
                    {renderButtonGroup()}{" "}
                    <Button size="large" icon={<IoHeartOutline size={22} />} />
                  </Space>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Tabs
              items={[
                {
                  key: "1",
                  label: "Description",
                  children: (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: product.content || product.description,
                      }}
                      style={{ textAlign: "justify", fontSize: "1rem" }}
                    />
                  ),
                },
                {
                  key: "2",
                  label: "Reviews",
                  children: (
                    <div>
                      {reviews.length === 0 ? (
                        <div>Chưa có đánh giá nào cho sản phẩm này.</div>
                      ) : (
                        reviews.map((review) => (
                          <div
                            key={review.id}
                            style={{
                              marginBottom: 16,
                              display: "flex",
                              alignItems: "flex-start",
                            }}
                          >
                            <Avatar
                              src={review.userAvatar}
                              size={48}
                              style={{ marginRight: 16 }}
                            />
                            <div>
                              <div style={{ fontWeight: "bold" }}>
                                {review.userFirstname} {review.userLastname}
                              </div>
                              <Rate
                                disabled
                                value={review.star}
                                style={{ fontSize: 18 }}
                              />
                              <div style={{ marginTop: 4, fontSize: 13 }}>
                                <span>
                                  Size: <b>{review.size}</b>
                                </span>
                                <span style={{ marginLeft: 12 }}>
                                  Color:
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: 12,
                                      height: 12,
                                      background: review.color,
                                      border: "1px solid #ccc",
                                      marginLeft: 4,
                                      verticalAlign: "middle",
                                      borderRadius: 3,
                                    }}
                                  />
                                </span>
                              </div>
                              <div style={{ margin: "4px 0" }}>
                                {review.comment}
                              </div>
                              <div style={{ fontSize: 12, color: "#888" }}>
                                {new Date(review.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </div>

                              {review.images &&
                                Array.isArray(review.images) &&
                                review.images.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {review.images.map((img: any, idx: any) => (
                                      <img
                                        key={idx}
                                        src={img}
                                        alt="review-img"
                                        style={{
                                          width: 60,
                                          marginRight: 8,
                                          borderRadius: 4,
                                          border: "1px solid #eee",
                                        }}
                                      />
                                    ))}
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

          {/* Có thì đưa ra, không có thì không hiển thị */}
          {(isLoadingRelated || (relatedProducts && relatedProducts.length > 0)) && (
            <div className="mt-5 mb-5">
              <TabbarComponent
                title="Related products"
                orentation="text-start"
                right={
                  product.categories && product.categories.length > 0 ? (
                    <div className="col-auto d-flex align-items-center">
                      <Link
                        href={`/shop?catId=${
                          typeof product.categories[product.categories.length - 1] === "object"
                            ? product.categories[product.categories.length - 1].id
                            : product.categories[product.categories.length - 1]
                        }`}
                        style={{ fontSize: 14, color: "#1677ff", fontWeight: 500 }}
                      >
                        Xem tất cả &rarr;
                      </Link>
                    </div>
                  ) : undefined
                }
              />

              {isLoadingRelated ? (
                <div className="row mt-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      className="col-sm-6 col-md-4 col-lg-3 mb-4"
                      key={`rel-skel-${n}`}
                    >
                      <Card style={{ borderRadius: 8, overflow: "hidden" }}>
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
                <div className="row mt-3">
                  {relatedProducts.slice(0, 4).map((item) => (
                    <ProductItem item={item} key={item.id} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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

export const getStaticPaths = async () => ({ paths: [], fallback: "blocking" });

export default ProductDetail;
