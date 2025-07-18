/** @format */

import { TransationSubProductModal } from "@/modals";
import { authSelector, removeAuth } from "@/redux/reducers/authReducer";
import {
  CartItemModel,
  cartSelector,
  removeCarts,
} from "@/redux/reducers/cartReducer";
import { VND } from "@/utils/handleCurrency";
import {
  Affix,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Dropdown,
  List,
  Menu,
  MenuProps,
  Space,
  Typography,
  theme,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AiOutlineTransaction } from "react-icons/ai";
import { BiCart, BiPowerOff } from "react-icons/bi";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoHeartOutline, IoSearch } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import ButtonRemoveCartItem from "./ButtonRemoveCartItem";
import CategoriesListCard from "./CategoriesListCard";
import { FaUser } from "react-icons/fa";
import axios from "axios";

const { useToken } = theme;

const HeaderComponent = () => {
  const [isVisibleDrawer, setIsVisibleDrawer] = useState(false);
  const [visibleModalTransationProduct, setVisibleModalTransationProduct] =
    useState(false);
  const [productSeleted, setProductSeleted] = useState<CartItemModel>();
  const [isVisibleMenuDrawe, setIsVisibleMenuDrawe] = useState(false);

  const { token } = useToken();
  const auth = useSelector(authSelector);
  const dispatch = useDispatch();

  const router = useRouter();

  const cart: CartItemModel[] = useSelector(cartSelector);

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: <Link href={`/profile`}>Profile</Link>,
      icon: <FaUser size={18} />,
    },
    {
      label: "SignOut",
      icon: <BiPowerOff size={22} />,
      key: "signout",
      danger: true,
      onClick: async () => {
        await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          withCredentials: true,
        });

        localStorage.clear();
        router.push("/");
        dispatch(removeAuth({}));
        dispatch(removeCarts());
      },
    },
  ];

  return (
    <Affix offsetTop={0} style={{ zIndex: 9999 }}>
      <div
        className="container-fluid"
        style={{
          backgroundColor: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="p-3">
          <div className="row">
            <div className="d-none d-sm-block d-md-none">
              <Button
                type="text"
                icon={<GiHamburgerMenu size={22} />}
                onClick={() => setIsVisibleDrawer(true)}
              />
            </div>
            <div className="col d-none d-md-block">
              <img src="/images/logo.png" style={{ width: 100 }} alt="" />
            </div>
            <div className="col d-none d-md-block text-center">
              <Menu
                style={{ border: "none", backgroundColor: "transparent" }}
                mode="horizontal"
                items={[
                  {
                    label: <Link href={"/"}>Home</Link>,
                    key: "home",
                  },
                  {
                    label: (
                      <Dropdown
                        placement="bottom"
                        dropdownRender={() => (
                          <CategoriesListCard type="card" />
                        )}
                      >
                        <Typography.Text
                          onClick={() => setIsVisibleMenuDrawe(true)}
                        >
                          Shop
                        </Typography.Text>
                      </Dropdown>
                    ),
                    key: "shop",
                  },
                  {
                    label: <Link href={"/story"}>Out story</Link>,
                    key: "story",
                  },
                  {
                    label: <Link href={"/blog"}>Blog</Link>,
                    key: "blog",
                  },
                  {
                    label: <Link href={"/contact"}>Contact Us</Link>,
                    key: "contact",
                  },
                ]}
              />
            </div>
            <div className="col text-right">
              <Space>
                <Button icon={<IoSearch size={24} />} type="text" />
                <Button icon={<IoHeartOutline size={24} />} type="text" />
                <Dropdown
                  dropdownRender={() => (
                    <Card
                      className="shadow"
                      style={{
                        minWidth: 480,
                        backgroundColor: token.colorBgContainer,
                      }}
                    >
                      <Typography.Paragraph>
                        You have {cart.length} items in your cart
                      </Typography.Paragraph>

                      <List
                        dataSource={cart}
                        renderItem={(item) => (
                          <List.Item
                            key={item.id}
                            extra={
                              <div>
                                <Button
                                  onClick={() => {
                                    setProductSeleted(item);
                                    setVisibleModalTransationProduct(true);
                                  }}
                                  icon={
                                    <AiOutlineTransaction
                                      size={22}
                                      className="text-muted"
                                    />
                                  }
                                />
                                <ButtonRemoveCartItem item={item} />
                              </div>
                            }
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  src={item.image}
                                  size={52}
                                  shape="square"
                                />
                              }
                              title={
                                <>
                                  <Typography.Text
                                    style={{
                                      fontWeight: 300,
                                      fontSize: "1rem",
                                    }}
                                  >
                                    {item.title}
                                  </Typography.Text>
                                  <Typography.Paragraph
                                    style={{
                                      fontWeight: "bold",
                                      fontSize: "1.2rem",
                                      marginBottom: 12,
                                    }}
                                  >
                                    {item.count} x {VND.format(item.price)}
                                  </Typography.Paragraph>
                                </>
                              }
                              description={
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}
                                >
                                  <Typography.Text>
                                    Size: {item.size}
                                  </Typography.Text>
                                  <Divider type="vertical" />
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <Typography.Text>Color:</Typography.Text>
                                    <div
                                      style={{
                                        width: 20,
                                        height: 20,
                                        backgroundColor: item.color,
                                        border: "1px solid #d9d9d9",
                                        borderRadius: 4,
                                        display: "inline-block",
                                      }}
                                    />
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                      <Divider style={{ margin: "12px 0px" }} />
                      <Typography.Title level={4}>
                        Subtotal:{" "}
                        {VND.format(
                          cart.reduce((a, b) => a + b.count * b.price, 0)
                        )}
                      </Typography.Title>

                      <div className="mt-4">
                        <Button
                          className="mt-2"
                          onClick={() => router.push(`/shop/checkout`)}
                          type="primary"
                          size="large"
                          style={{ width: "100%" }}
                          disabled={cart.length === 0 || !auth.accessToken}
                        >
                          {!auth.accessToken
                            ? "Please login to checkout"
                            : cart.length === 0
                            ? "Your cart is empty"
                            : `Checkout (${cart.length} items)`}
                        </Button>
                      </div>
                    </Card>
                  )}
                >
                  <Badge count={cart.length}>
                    <BiCart size={24} />
                  </Badge>
                </Dropdown>
                <Divider type="vertical" />
                {auth.accessToken && auth.userId ? (
                  <Dropdown overlayStyle={{ minWidth: 320 }} menu={{ items }}>
                    <Avatar src={auth.avatar} />
                  </Dropdown>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => router.push("/auth/login")}
                  >
                    Login
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </div>
        <Drawer
          open={isVisibleDrawer}
          onClick={() => setIsVisibleDrawer(false)}
          placement="left"
        >
          <CategoriesListCard type="menu" />
        </Drawer>

        {productSeleted && (
          <TransationSubProductModal
            visible={visibleModalTransationProduct}
            onClose={() => setVisibleModalTransationProduct(false)}
            productSelected={productSeleted}
          />
        )}
      </div>
    </Affix>
  );
};

export default HeaderComponent;
