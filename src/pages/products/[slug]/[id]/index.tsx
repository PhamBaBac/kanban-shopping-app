/** @format */

import { CarouselImages, TabbarComponent } from "@/components";
import HeadComponent from "@/components/HeadComponent";
import { appInfo } from "@/constants/appInfos";
import { ProductModel } from "@/models/Products";
import { cartSelector } from "@/redux/reducers/cartReducer";
import { VND } from "@/utils/handleCurrency";
import { useProductDetail, useCart } from "@/hooks";
import { productService } from "@/services";
import {
  Avatar,
  Breadcrumb,
  Button,
  Rate,
  Space,
  Tabs,
  Tag,
  Typography,
  Spin,
} from "antd";
import Link from "next/link";
import { IoAddSharp, IoHeartOutline } from "react-icons/io5";
import { LuMinus } from "react-icons/lu";
import { PiCableCar } from "react-icons/pi";
import { useSelector } from "react-redux";

const { Text, Paragraph, Title } = Typography;

const ProductDetail = ({ pageProps }: any) => {
  const { product }: { product: ProductModel } = pageProps;
  const cart = useSelector(cartSelector);

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

  const renderButtonGroup = () => {
    const item = cart.find(
      (el: any) => el.subProductId === subProductSelected?.id
    );
    const availableQty = item
      ? (subProductSelected?.stock ?? 0) - item.count
      : subProductSelected?.stock ?? 0;

    return (
      subProductSelected && (
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
              disabled={count === 1}
              type="text"
              icon={<LuMinus size={22} />}
            />
          </div>
          <Button
            disabled={availableQty === 0}
            onClick={handleCart}
            size="large"
            type="primary"
            style={{ minWidth: 200 }}
          >
            Add to Cart
          </Button>
        </>
      )
    );
  };

  const averageRate = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.star || 0), 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="container-fluid mt-3 mb-5">
        <div className="container text-center">
          <div>Loading...</div>
        </div>
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

  return subProductSelected ? (
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
              { key: "shop", title: <Link href={"/shop"}>Shop</Link> },
              {
                key: "title",
                title: product.categories.map((item) => item.title).join(" / "),
              },
            ]}
          />

          <div className="row mt-3">
            <div className="col-sm-12 col-md-6">
              <div className="bg-light text-center p-4">
                {!subProductSelected.imgURL &&
                subProductSelected.images.length === 0 ? (
                  <PiCableCar size={48} className="text-muted" />
                ) : (
                  <img
                    style={{ width: "80%" }}
                    src={
                      subProductSelected.imgURL ||
                      subProductSelected.images[0] ||
                      ""
                    }
                  />
                )}
              </div>
              <CarouselImages
                items={subProducts.filter(
                  (item) => item.size === subProductSelected.size
                )}
                onClick={setSubProductSelected}
              />
            </div>

            <div className="col">
              <div className="row">
                <div className="col">
                  <Typography.Title className="m-0" level={2}>
                    {supplier ? supplier.name : "Loading..."}
                  </Typography.Title>
                  <Typography.Title
                    className="mt-0"
                    style={{ fontWeight: 300 }}
                    level={4}
                  >
                    {product.title}
                  </Typography.Title>
                </div>
                <div>
                  <Tag
                    color={subProductSelected.stock > 0 ? "success" : "error"}
                  >
                    {subProductSelected.stock > 0
                      ? `In Stock (${instockQuantity})`
                      : "Out of Stock"}
                  </Tag>
                </div>
              </div>

              <Space className="mt-2">
                <Rate disabled allowHalf value={averageRate} count={5} />
                <Text type="secondary">({reviews.length}) reviews</Text>
              </Space>

              <div className="mt-3">
                <Space>
                  <Title className="mt-0" style={{ fontWeight: 400 }} level={3}>
                    {VND.format(
                      subProductSelected.discount ?? subProductSelected.price
                    )}
                  </Title>
                  {subProductSelected.discount && (
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
                <Paragraph
                  className="mt-3"
                  style={{ textAlign: "justify", fontSize: "1rem" }}
                >
                  {product.description}
                </Paragraph>

                <div className="mt-3">
                  <Paragraph
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      marginBottom: 8,
                    }}
                  >
                    Colors
                  </Paragraph>
                  <Space>
                    {subProducts.length > 0 &&
                      Array.from(
                        new Set(subProducts.map((item) => item.color))
                      ).map((color) => {
                        const itemWithColor = subProducts.find(
                          (item) => item.color === color
                        );
                        return (
                          <a
                            key={color}
                            onClick={() => {
                              const sameSizeItem = subProducts.find(
                                (item) =>
                                  item.color === color &&
                                  item.size === subProductSelected.size
                              );
                              setSubProductSelected(
                                sameSizeItem || itemWithColor!
                              );
                            }}
                          >
                            <div
                              className="color-item"
                              style={{ background: color }}
                            />
                          </a>
                        );
                      })}
                  </Space>
                </div>

                <div className="mt-3">
                  <Paragraph
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      marginBottom: 8,
                    }}
                  >
                    Sizes
                  </Paragraph>
                  <Space>
                    {subProducts.length > 0 &&
                      Array.from(
                        new Set(subProducts.map((item) => item.size))
                      ).map((size) => {
                        const itemWithSize = subProducts.find(
                          (item) => item.size === size
                        );
                        return (
                          <Button
                            key={size}
                            type={
                              subProductSelected.size === size
                                ? "primary"
                                : "default"
                            }
                            onClick={() => {
                              const sameColorItem = subProducts.find(
                                (item) =>
                                  item.size === size &&
                                  item.color === subProductSelected.color
                              );
                              setSubProductSelected(
                                sameColorItem || itemWithSize!
                              );
                            }}
                          >
                            {size}
                          </Button>
                        );
                      })}
                  </Space>
                </div>

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

          <div className="mt-4">
            <TabbarComponent title="Related products" />
          </div>
        </div>
      </div>
    </div>
  ) : null;
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

    console.log("Product fetched:", product);

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
