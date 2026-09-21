/** @format */

import { TransationSubProductModal } from "@/modals";
import { authSelector, removeAuth } from "@/redux/reducers/authReducer";
import {
  CartItemModel,
  cartSelector,
  removeCarts,
} from "@/redux/reducers/cartReducer";
import { setTheme, themeSelector } from "@/redux/reducers/themeSlice";
import { VND } from "@/utils/handleCurrency";
import {
  Affix,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Drawer,
  Dropdown,
  Input,
  List,
  Menu,
  MenuProps,
  Switch,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import { isItemDeleted, isItemSoldOut, isItemInvalid } from "@/hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AiOutlineTransaction } from "react-icons/ai";
import { BiCart, BiPowerOff, BiSun, BiMoon } from "react-icons/bi";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoHeartOutline, IoSearch } from "react-icons/io5";
import {
  FaUser,
  FaHome,
  FaStore,
  FaBookOpen,
  FaPhoneAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import ButtonRemoveCartItem from "./ButtonRemoveCartItem";
import CategoriesListCard from "./CategoriesListCard";
import axios from "axios";

const { useToken } = theme;

const HeaderComponent = () => {
  const [isVisibleDrawer, setIsVisibleDrawer] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const [visibleModalTransationProduct, setVisibleModalTransationProduct] =
    useState(false);
  const [productSeleted, setProductSeleted] = useState<CartItemModel>();
  const [searchOpen, setSearchOpen] = useState(false);

  const { token } = useToken();
  const auth = useSelector(authSelector);
  const { mode } = useSelector(themeSelector);
  const dispatch = useDispatch();
  const router = useRouter();

  const cart: CartItemModel[] = useSelector(cartSelector);
  const hasInvalidInCart = cart.some(isItemInvalid);
  const isDark = mode === "dark";

  const toggleTheme = () => {
    dispatch(setTheme(mode === "dark" ? "light" : "dark"));
  };

  const handleSignout = async () => {
    try {
      await axios.post(`http://localhost:8080/api/v1/auth/logout`, null, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        withCredentials: true,
      });
    } catch (e) {
      console.error("Logout error:", e);
    }

    localStorage.clear();
    router.push("/");
    dispatch(removeAuth({}));
    dispatch(removeCarts());
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setSearchOpen(false);
      setIsVisibleDrawer(false);
      router.push(`/shop?search=${encodeURIComponent(value.trim())}`);
    }
  };

  const getActiveKey = () => {
    const path = router.pathname;
    if (path.startsWith("/shop")) return "shop";
    if (path === "/story") return "story";
    if (path.startsWith("/blog")) return "blog";
    if (path.startsWith("/contact")) return "contact";
    if (path === "/") return "home";
    return "";
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: <Link href="/profile">Tài khoản</Link>,
      icon: <FaUser size={16} />,
    },
    {
      key: "signout",
      label: "Đăng xuất",
      icon: <BiPowerOff size={18} />,
      danger: true,
      onClick: handleSignout,
    },
  ];

  const desktopMenuItems = [
    {
      label: (
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          Trang chủ
        </Link>
      ),
      key: "home",
    },
    {
      label: (
        <Dropdown
          placement="bottom"
          popupRender={() => <CategoriesListCard type="card" />}
        >
          <Link
            href="/shop"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Cửa hàng
          </Link>
        </Dropdown>
      ),
      key: "shop",
    },
    {
      label: (
        <Link
          href="/story"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          Về chúng tôi
        </Link>
      ),
      key: "story",
    },
    {
      label: (
        <Link href="/blog" style={{ textDecoration: "none", color: "inherit" }}>
          Blog
        </Link>
      ),
      key: "blog",
    },
    {
      label: (
        <Link
          href="/contact"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          Liên hệ
        </Link>
      ),
      key: "contact",
    },
  ];

  const userDisplayName =
    auth.firstName || auth.lastName
      ? `${auth.firstName || ""} ${auth.lastName || ""}`.trim()
      : auth.email
        ? auth.email.split("@")[0]
        : "Khách hàng";

  return (
    <Affix offsetTop={0} style={{ zIndex: 9999 }}>
      <div className="site-header-wrapper">
        <div className="site-header-container">
          {/* Left: Mobile hamburger & Logo */}
          <div className="site-header-left">
            <Button
              className="header-action-btn site-header-hamburger d-lg-none"
              type="text"
              icon={<GiHamburgerMenu size={20} />}
              onClick={() => setIsVisibleDrawer(true)}
              aria-label="Mở menu điều hướng"
            />
            <Link href="/" className="site-header-logo-link">
              <img
                src="/images/logo.png"
                className="site-header-logo-img"
                alt="Kanban Shop Logo"
              />
            </Link>
          </div>

          {/* Center: Desktop horizontal menu */}
          <div className="site-header-center">
            <Menu
              className="site-header-menu"
              mode="horizontal"
              selectedKeys={[getActiveKey()]}
              items={desktopMenuItems}
            />
          </div>

          {/* Mobile Full-width Search Bar Overlay */}
          {searchOpen && (
            <div
              className="site-header-mobile-search d-flex d-md-none"
              style={{
                backgroundColor: isDark ? "#1f1f1f" : "#ffffff",
              }}
            >
              <Input.Search
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                autoFocus
                onSearch={handleSearch}
                className="mobile-search-input"
                style={{ flex: 1 }}
              />
              <Button
                type="text"
                className="mobile-search-close-btn"
                onClick={() => setSearchOpen(false)}
                style={{
                  color: isDark ? "rgba(255,255,255,0.75)" : "#4B5563",
                }}
              >
                Đóng
              </Button>
            </div>
          )}

          {/* Right: Actions */}
          <div className="site-header-right">
            {/* Search - Desktop dropdown & Mobile overlay trigger */}
            <div className="d-none d-md-block">
              <Dropdown
                open={searchOpen}
                onOpenChange={setSearchOpen}
                placement="bottomRight"
                trigger={["click"]}
                popupRender={() => (
                  <Card
                    className="search-dropdown-card"
                    style={{
                      padding: "8px 12px",
                      backgroundColor: token.colorBgContainer,
                    }}
                  >
                    <Input.Search
                      placeholder="Tìm kiếm sản phẩm..."
                      allowClear
                      autoFocus
                      onSearch={handleSearch}
                    />
                  </Card>
                )}
              >
                <Button
                  className="header-action-btn"
                  icon={<IoSearch size={21} />}
                  type="text"
                  aria-label="Tìm kiếm"
                />
              </Dropdown>
            </div>

            {/* Mobile search button */}
            <Button
              className="header-action-btn d-inline-flex d-md-none"
              icon={<IoSearch size={21} />}
              type="text"
              aria-label="Tìm kiếm"
              onClick={() => setSearchOpen((prev) => !prev)}
            />

            {/* Wishlist button */}
            <Button
              className="header-action-btn d-none d-sm-inline-flex"
              icon={<IoHeartOutline size={21} />}
              type="text"
              onClick={() => router.push("/shop")}
              aria-label="Yêu thích"
            />

            {/* Theme toggle button */}
            <Button
              className="header-action-btn"
              icon={
                mode === "dark" ? (
                  <BiSun size={20} color="#FBBF24" />
                ) : (
                  <BiMoon size={20} />
                )
              }
              type="text"
              onClick={toggleTheme}
              aria-label={
                mode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"
              }
              title={
                mode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"
              }
            />

            {/* Mobile Cart Trigger (Drawer) */}
            <div className="d-inline-flex d-md-none">
              <Badge count={cart.length} color="#131118">
                <Button
                  className="header-action-btn"
                  icon={<BiCart size={23} />}
                  type="text"
                  aria-label="Giỏ hàng"
                  onClick={() => setIsCartDrawerOpen(true)}
                />
              </Badge>
            </div>

            {/* Desktop Cart Trigger (Dropdown) */}
            <div className="d-none d-md-inline-flex">
              <Dropdown
                placement="bottomRight"
                trigger={["click"]}
                open={cartDropdownOpen}
                onOpenChange={setCartDropdownOpen}
                popupRender={() => (
                  <Card
                    className="cart-dropdown-card"
                    style={{
                      backgroundColor: token.colorBgContainer,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                    }}
                  >
                    <Typography.Paragraph
                      strong
                      style={{ marginBottom: 12, fontSize: "0.95rem" }}
                    >
                      Bạn có {cart.length} sản phẩm trong giỏ hàng
                    </Typography.Paragraph>

                    {hasInvalidInCart && (
                      <Alert
                        type="error"
                        showIcon
                        message="Có sản phẩm không khả dụng"
                        description="Sản phẩm đã hết hàng hoặc bị xóa. Vui lòng xóa để tiếp tục thanh toán."
                        style={{
                          marginBottom: 12,
                          borderRadius: 6,
                          fontSize: "0.85rem",
                        }}
                      />
                    )}

                    <div className="cart-items-scroll">
                      <List
                        dataSource={cart}
                        renderItem={(item) => (
                          <List.Item
                            key={item.id}
                            extra={
                              <div style={{ display: "flex", gap: 4 }}>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setProductSeleted(item);
                                    setVisibleModalTransationProduct(true);
                                  }}
                                  icon={
                                    <AiOutlineTransaction
                                      size={18}
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
                                  size={48}
                                  shape="square"
                                  style={{ borderRadius: 6 }}
                                />
                              }
                              title={
                                <>
                                  <Typography.Text
                                    ellipsis
                                    style={{
                                      fontWeight: 500,
                                      fontSize: "0.9rem",
                                      display: "block",
                                    }}
                                  >
                                    {item.title}
                                  </Typography.Text>
                                  <Typography.Text
                                    strong
                                    style={{
                                      fontSize: "1rem",
                                      display: "block",
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.count} x {VND.format(item.price)}
                                  </Typography.Text>
                                  {isItemDeleted(item) && (
                                    <Tag
                                      color="error"
                                      style={{
                                        fontSize: "0.75rem",
                                        borderRadius: 4,
                                        marginTop: 4,
                                      }}
                                    >
                                      Đã xóa / Ngừng bán
                                    </Tag>
                                  )}
                                  {isItemSoldOut(item) && (
                                    <Tag
                                      color="warning"
                                      style={{
                                        fontSize: "0.75rem",
                                        borderRadius: 4,
                                        marginTop: 4,
                                      }}
                                    >
                                      Hết hàng
                                    </Tag>
                                  )}
                                </>
                              }
                              description={
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                    marginTop: 4,
                                  }}
                                >
                                  {item.size && (
                                    <Typography.Text
                                      type="secondary"
                                      style={{ fontSize: "0.82rem" }}
                                    >
                                      Size:{" "}
                                      <span style={{ fontWeight: 600 }}>
                                        {item.size}
                                      </span>
                                    </Typography.Text>
                                  )}
                                  {item.size && item.color && (
                                    <Divider
                                      type="vertical"
                                      style={{ margin: "0 2px" }}
                                    />
                                  )}
                                  {item.color && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      {/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
                                        item.color.trim()
                                      ) ? (
                                        <Tooltip title={item.color}>
                                          <div
                                            style={{
                                              width: 14,
                                              height: 14,
                                              backgroundColor: item.color,
                                              border: "1px solid #d9d9d9",
                                              borderRadius: 3,
                                              display: "inline-block",
                                            }}
                                          />
                                        </Tooltip>
                                      ) : (
                                        <Typography.Text
                                          type="secondary"
                                          style={{ fontSize: "0.82rem" }}
                                        >
                                          Màu:{" "}
                                          <span style={{ fontWeight: 600 }}>
                                            {item.color}
                                          </span>
                                        </Typography.Text>
                                      )}
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>

                    <Divider style={{ margin: "12px 0px" }} />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text type="secondary" style={{ fontSize: "0.95rem" }}>
                        Tạm tính:
                      </Typography.Text>
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        {VND.format(
                          cart.reduce((a, b) => a + b.count * b.price, 0)
                        )}
                      </Typography.Title>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <Button
                        onClick={() => {
                          setCartDropdownOpen(false);
                          router.push(`/shop/checkout`);
                        }}
                        type="primary"
                        size="large"
                        style={{ width: "100%" }}
                        disabled={
                          cart.length === 0 ||
                          !auth.accessToken ||
                          hasInvalidInCart
                        }
                      >
                        {!auth.accessToken
                          ? "Vui lòng đăng nhập để thanh toán"
                          : cart.length === 0
                            ? "Giỏ hàng của bạn đang trống"
                            : hasInvalidInCart
                              ? "Vui lòng xóa sản phẩm không khả dụng"
                              : `Thanh toán (${cart.length} sản phẩm)`}
                      </Button>
                    </div>
                  </Card>
                )}
              >
                <Badge count={cart.length} color="#131118">
                  <Button
                    className="header-action-btn"
                    icon={<BiCart size={23} />}
                    type="text"
                    aria-label="Giỏ hàng"
                  />
                </Badge>
              </Dropdown>
            </div>

            <Divider
              type="vertical"
              style={{
                height: 20,
                margin: "0 4px",
                borderColor: token.colorBorderSecondary,
              }}
            />

            {/* User Profile / Login Button */}
            {auth.accessToken && auth.userId ? (
              <Dropdown
                placement="bottomRight"
                overlayStyle={{ minWidth: 200 }}
                menu={{ items: userMenuItems }}
              >
                <Avatar
                  src={auth.avatar}
                  icon={!auth.avatar && <FaUser size={14} />}
                  size={34}
                  style={{
                    cursor: "pointer",
                    backgroundColor: auth.avatar ? "transparent" : token.colorPrimary,
                  }}
                />
              </Dropdown>
            ) : (
              <Button
                type="primary"
                size="middle"
                style={{ borderRadius: 8 }}
                onClick={() => router.push("/auth/login")}
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <Drawer
          open={isVisibleDrawer}
          onClose={() => setIsVisibleDrawer(false)}
          placement="left"
          rootClassName="mobile-nav-drawer"
          width={
            typeof window !== "undefined"
              ? Math.min(320, window.innerWidth * 0.85)
              : 300
          }
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Link
                href="/"
                onClick={() => setIsVisibleDrawer(false)}
                className="site-header-logo-link"
              >
                <img
                  src="/images/logo.png"
                  alt="Kanban Shop Logo"
                  style={{ width: 88, height: "auto" }}
                />
              </Link>
            </div>
          }
        >
          {/* Drawer User Section */}
          <div className="mobile-drawer-user-card">
            {auth.accessToken && auth.userId ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar
                    src={auth.avatar}
                    icon={!auth.avatar && <FaUser size={16} />}
                    size={42}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text
                      strong
                      ellipsis
                      style={{
                        display: "block",
                        fontSize: "0.95rem",
                      }}
                    >
                      {userDisplayName}
                    </Typography.Text>
                    {auth.email && (
                      <Typography.Text
                        type="secondary"
                        ellipsis
                        style={{ display: "block", fontSize: "0.8rem" }}
                      >
                        {auth.email}
                      </Typography.Text>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button
                    size="small"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsVisibleDrawer(false);
                      router.push("/profile");
                    }}
                  >
                    Tài khoản
                  </Button>
                  <Button
                    size="small"
                    danger
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsVisibleDrawer(false);
                      handleSignout();
                    }}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <Typography.Text
                  type="secondary"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    marginBottom: 10,
                  }}
                >
                  Đăng nhập để trải nghiệm mua sắm tốt nhất
                </Typography.Text>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <Button
                    type="primary"
                    size="small"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsVisibleDrawer(false);
                      router.push("/auth/login");
                    }}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    size="small"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsVisibleDrawer(false);
                      router.push("/auth/register");
                    }}
                  >
                    Đăng ký
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Search Bar */}
          <div style={{ marginBottom: 14 }}>
            <Input.Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              onSearch={handleSearch}
            />
          </div>

          <Divider style={{ margin: "10px 0" }} />

          {/* Drawer Main Navigation Links */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Link
              href="/"
              onClick={() => setIsVisibleDrawer(false)}
              className={`mobile-drawer-nav-item ${router.pathname === "/" ? "active" : ""}`}
            >
              <FaHome size={17} />
              <span>Trang chủ</span>
            </Link>

            <Link
              href="/shop"
              onClick={() => setIsVisibleDrawer(false)}
              className={`mobile-drawer-nav-item ${router.pathname.startsWith("/shop") ? "active" : ""}`}
            >
              <FaStore size={17} />
              <span>Cửa hàng (Tất cả sản phẩm)</span>
            </Link>

            {/* Collapsible Categories Section */}
            <Collapse
              ghost
              style={{ padding: 0 }}
              items={[
                {
                  key: "categories",
                  label: (
                    <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>
                      Danh mục sản phẩm
                    </span>
                  ),
                  children: (
                    <div style={{ paddingLeft: 8 }}>
                      <CategoriesListCard
                        type="menu"
                        onItemClick={() => setIsVisibleDrawer(false)}
                      />
                    </div>
                  ),
                },
              ]}
            />

            <Link
              href="/story"
              onClick={() => setIsVisibleDrawer(false)}
              className={`mobile-drawer-nav-item ${router.pathname === "/story" ? "active" : ""}`}
            >
              <FaInfoCircle size={17} />
              <span>Về chúng tôi</span>
            </Link>

            <Link
              href="/blog"
              onClick={() => setIsVisibleDrawer(false)}
              className={`mobile-drawer-nav-item ${router.pathname.startsWith("/blog") ? "active" : ""}`}
            >
              <FaBookOpen size={17} />
              <span>Blog</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsVisibleDrawer(false)}
              className={`mobile-drawer-nav-item ${router.pathname === "/contact" ? "active" : ""}`}
            >
              <FaPhoneAlt size={16} />
              <span>Liên hệ</span>
            </Link>
          </div>

          <Divider style={{ margin: "12px 0" }} />

          {/* Drawer Footer / Theme Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {mode === "dark" ? (
                <BiMoon size={18} color="#A78BFA" />
              ) : (
                <BiSun size={18} color="#F59E0B" />
              )}
              <Typography.Text style={{ fontSize: "0.9rem" }}>
                {mode === "dark" ? "Giao diện tối" : "Giao diện sáng"}
              </Typography.Text>
            </div>
            <Switch
              size="small"
              checked={mode === "dark"}
              onChange={toggleTheme}
            />
          </div>
        </Drawer>

        {/* Mobile Cart Drawer */}
        <Drawer
          open={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          placement="right"
          rootClassName="mobile-cart-drawer"
          width="100%"
          style={{ maxWidth: 360 }}
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                Giỏ hàng ({cart.length})
              </span>
            </div>
          }
          footer={
            cart.length > 0 ? (
              <div style={{ padding: "8px 0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: "0.95rem" }}>
                    Tạm tính:
                  </Typography.Text>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {VND.format(
                      cart.reduce((a, b) => a + b.count * b.price, 0)
                    )}
                  </Typography.Title>
                </div>
                <Button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    router.push(`/shop/checkout`);
                  }}
                  type="primary"
                  size="large"
                  style={{ width: "100%", height: 44, borderRadius: 8 }}
                  disabled={
                    cart.length === 0 ||
                    !auth.accessToken ||
                    hasInvalidInCart
                  }
                >
                  {!auth.accessToken
                    ? "Đăng nhập để thanh toán"
                    : hasInvalidInCart
                      ? "Xóa sản phẩm không khả dụng"
                      : `Thanh toán (${cart.length} sản phẩm)`}
                </Button>
              </div>
            ) : null
          }
        >
          {hasInvalidInCart && (
            <Alert
              type="error"
              showIcon
              message="Có sản phẩm không khả dụng"
              description="Sản phẩm đã hết hàng hoặc bị xóa. Vui lòng xóa để tiếp tục thanh toán."
              style={{
                marginBottom: 12,
                borderRadius: 6,
                fontSize: "0.82rem",
              }}
            />
          )}

          {cart.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: "#8c8c8c",
              }}
            >
              <BiCart size={54} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                Giỏ hàng của bạn đang trống
              </Typography.Paragraph>
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  router.push("/shop");
                }}
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          ) : (
            <List
              dataSource={cart}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ padding: "12px 0" }}
                  extra={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginLeft: 8,
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => {
                          setProductSeleted(item);
                          setVisibleModalTransationProduct(true);
                        }}
                        icon={
                          <AiOutlineTransaction
                            size={16}
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
                        style={{ borderRadius: 6, flexShrink: 0 }}
                      />
                    }
                    title={
                      <>
                        <Typography.Text
                          ellipsis
                          style={{
                            fontWeight: 500,
                            fontSize: "0.9rem",
                            display: "block",
                          }}
                        >
                          {item.title}
                        </Typography.Text>
                        <Typography.Text
                          strong
                          style={{
                            fontSize: "0.95rem",
                            display: "block",
                            marginTop: 2,
                          }}
                        >
                          {item.count} x {VND.format(item.price)}
                        </Typography.Text>
                        {isItemDeleted(item) && (
                          <Tag
                            color="error"
                            style={{
                              fontSize: "0.72rem",
                              borderRadius: 4,
                              marginTop: 4,
                            }}
                          >
                            Đã xóa / Ngừng bán
                          </Tag>
                        )}
                        {isItemSoldOut(item) && (
                          <Tag
                            color="warning"
                            style={{
                              fontSize: "0.72rem",
                              borderRadius: 4,
                              marginTop: 4,
                            }}
                          >
                            Hết hàng
                          </Tag>
                        )}
                      </>
                    }
                    description={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: 4,
                        }}
                      >
                        {item.size && (
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: "0.8rem" }}
                          >
                            Size:{" "}
                            <span style={{ fontWeight: 600 }}>
                              {item.size}
                            </span>
                          </Typography.Text>
                        )}
                        {item.size && item.color && (
                          <Divider
                            type="vertical"
                            style={{ margin: "0 2px" }}
                          />
                        )}
                        {item.color && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
                              item.color.trim()
                            ) ? (
                              <Tooltip title={item.color}>
                                <div
                                  style={{
                                    width: 14,
                                    height: 14,
                                    backgroundColor: item.color,
                                    border: "1px solid #d9d9d9",
                                    borderRadius: 3,
                                    display: "inline-block",
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography.Text
                                type="secondary"
                                style={{ fontSize: "0.8rem" }}
                              >
                                Màu:{" "}
                                <span style={{ fontWeight: 600 }}>
                                  {item.color}
                                </span>
                              </Typography.Text>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
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
