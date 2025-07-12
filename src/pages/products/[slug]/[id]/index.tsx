/** @format */

import handleAPI from "@/apis/handleApi";
import { CarouselImages, TabbarComponent } from "@/components";
import HeadComponent from "@/components/HeadComponent";
import { appInfo } from "@/constants/appInfos";
import { ProductModel, SubProductModel } from "@/models/Products";
import { SupplierModel } from "@/models/SupplierModel";
import { authSelector } from "@/redux/reducers/authReducer";
import {
  addProduct,
  CartItemModel,
  cartSelector,
  changeCount,
} from "@/redux/reducers/cartReducer";
import { VND } from "@/utils/handleCurrency";
import { getOrCreateSessionId } from "@/utils/session";
import {
  Avatar,
  Breadcrumb,
  Button,
  Empty,
  message,
  Rate,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IoAddSharp, IoHeartOutline } from "react-icons/io5";
import { LuMinus } from "react-icons/lu";
import { PiCableCar } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";

const { Text, Paragraph, Title } = Typography;

const ProductDetail = ({ pageProps }: any) => {
  const { product }: { product: ProductModel } = pageProps;
  const [subProducts, setSubProducts] = useState<SubProductModel[]>([]);
  const [supplier, setSupplier] = useState<SupplierModel | null>(null);
  const [detail, setdetail] = useState<ProductModel>(product);
  const [subProductSelected, setSubProductSelected] =
    useState<SubProductModel>();
  const [count, setCount] = useState(1);
  const [instockQuantity, setInstockQuantity] = useState(
    subProductSelected?.stock
  );
  const [reviews, setReviews] = useState<any[]>([]);

  const auth = useSelector(authSelector);
  const cart: CartItemModel[] = useSelector(cartSelector);

  const dispatch = useDispatch();

  useEffect(() => {
    handleGetSubProducts();
  }, [product.id]);

  useEffect(() => {
    if (product.supplierId) {
      fetchSupplierInfo();
    }
  }, [product.supplierId]);

  const fetchSupplierInfo = async () => {
    try {
      const res: any = await handleAPI(`/suppliers/${product.supplierId}`);
      if (res?.result) setSupplier(res.result);
    } catch (error) {
      console.error("Error fetching supplier:", error);
    }
  };

  const fetchAllReviews = async (subProductIds: string[]) => {
    try {
      const res: any = await handleAPI(
        `/reviewProducts/subProducts?subProductIds=${subProductIds.join(",")}`,
        {},
        "get"
      );
      setReviews(res.result || []);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      setReviews([]);
    }
  };

  const handleGetSubProducts = async () => {
    const res: any = await handleAPI(
      `/subProducts/get-all-sub-product/${product.id}`
    );
    setSubProducts(res.result);

    const subProductIds = res.result.map((item: SubProductModel) => item.id);
    if (subProductIds.length > 0) {
      await fetchAllReviews(subProductIds);
    }
  };

  useEffect(() => {
    if (subProducts.length > 0) {
      setSubProductSelected({
        ...subProducts[0],
        imgURL:
          subProducts[0].images.length > 0 ? subProducts[0].images[0] : "",
      });
    }
  }, [subProducts]);

  useEffect(() => {
    setCount(1);
  }, [subProductSelected]);

  useEffect(() => {
    const item = cart.find((el) => el.subProductId === subProductSelected?.id);
    if (subProductSelected) {
      if (item) {
        setInstockQuantity(subProductSelected.stock - item.count);
      } else {
        setInstockQuantity(subProductSelected.stock);
      }
    }
  }, [cart, subProductSelected]);

  const handleCart = async () => {
    if (!subProductSelected) {
      message.error("Please choose a product!");
      return;
    }

    const isLoggedIn = auth.userId && auth.accessToken;
    const sessionId = getOrCreateSessionId();
    const endpointPrefix = isLoggedIn ? "/carts" : "/redisCarts";

    const value = {
      createdBy: isLoggedIn ? auth.userId : sessionId,
      count,
      subProductId: subProductSelected.id,
      size: subProductSelected.size,
      title: detail.title,
      color: subProductSelected.color,
      price: subProductSelected.discount ?? subProductSelected.price,
      qty: subProductSelected.stock,
      productId: product.id,
      image: subProductSelected.images[0] ?? "",
    };

    const index = cart.findIndex(
      (el) => el.subProductId === value.subProductId
    );

    try {
      if (index !== -1 && cart[index]) {
        await handleAPI(
          `${endpointPrefix}/update?id=${
            isLoggedIn ? cart[index].id : sessionId
          }&count=${cart[index].count + count}`,
          {},
          "put"
        );

        dispatch(
          changeCount({
            id: isLoggedIn ? cart[index].id : null,
            subProductId: cart[index].subProductId,
            val: count,
          })
        );
      } else {
        const res: any = await handleAPI(
          endpointPrefix + (isLoggedIn ? "/add" : ""),
          value,
          "post"
        );

        if (isLoggedIn) {
          if (res?.result?.id)
            dispatch(addProduct({ ...value, id: res.result.id }));
          else message.warning("Add to cart but no ID returned!");
        } else {
          const res: any = await handleAPI(
            `/redisCarts?sessionId=${sessionId}`
          );
          if (res.result) {
            const items = Object.values(res.result) as CartItemModel[];
            items.forEach((item) => {
              const exists = cart.some(
                (c) => c.subProductId === item.subProductId
              );
              if (!exists) dispatch(addProduct(item));
            });
          }
        }
      }
      setCount(1);
    } catch (error: any) {
      if (error?.code === 1021) message.error("This item is out of stock.");
      else if (error?.code === 1012) message.error("Product not found.");
      else message.error(error?.message || "Add to cart failed!");
    }
  };

  const renderButtonGroup = () => {
    const item = cart.find((el) => el.subProductId === subProductSelected?.id);
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

  return subProductSelected ? (
    <div>
      <HeadComponent
        title={detail.title}
        description={detail.description}
        url={`${appInfo.baseUrl}/public/products/${detail.slug}/${detail.id}`}
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
                    {detail.title}
                  </Typography.Title>
                </div>
                <div>
                  <Tag color={subProductSelected.stock > 0 ? "success" : "error"}>
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
                  {detail.description}
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
                        __html: detail.content || detail.description,
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
    const res = await fetch(
      `${appInfo.baseUrl}/public/products/${context.params.slug}/${context.params.id}`
    );
    const result = await res.json();
    if (!result.result) return { notFound: true };
    return { props: { product: result.result } };
  } catch (error) {
    return { notFound: true };
  }
};

export const getStaticPaths = async () => ({ paths: [], fallback: "blocking" });

export default ProductDetail;
