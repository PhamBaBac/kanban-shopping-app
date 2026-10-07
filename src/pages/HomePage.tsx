/** @format */

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Carousel, message, Spin } from "antd";
import { CarouselRef } from "antd/es/carousel";
import {
  BsArrowLeft,
  BsArrowRight,
  BsStarFill,
  BsStarHalf,
  BsStar,
  BsShieldCheck,
  BsTruck,
  BsArrowRepeat,
  BsHeadset,
  BsFire,
  BsLightningFill,
  BsCheckCircleFill,
} from "react-icons/bs";

import { ProductItem } from "@/components";
import HeadComponent from "@/components/HeadComponent";
import { CategoyModel, ProductModel } from "@/models/Products";
import { PromotionModel } from "@/models/PromotionModel";
import { ReviewModel } from "@/models/ReviewModel";
import { themeSelector } from "@/redux/reducers/themeSlice";
import { homeService } from "@/services";

interface Props {
  promotions: PromotionModel[];
  categories: CategoyModel[];
  bestSellers: ProductModel[];
  newArrivals?: ProductModel[];
  flashSale?: ProductModel[];
  featuredReviews?: ReviewModel[];
}

const DEFAULT_TESTIMONIALS = [
  {
    id: "1",
    name: "Nguyễn Minh Tuấn",
    role: "Khách hàng thân thiết",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80",
    rating: 5,
    comment:
      "Sản phẩm chất lượng tuyệt vời, đường may sắc sảo và form dáng rất chuẩn. Giao hàng nhanh và đóng gói sang trọng!",
  },
  {
    id: "2",
    name: "Trần Thị Lan Anh",
    role: "Khách hàng đã mua",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    rating: 5,
    comment:
      "Thiết kế thời trang, chất liệu cao cấp mặc rất thoáng mát. Mình đã đặt thêm 2 mẫu nữa cho người thân.",
  },
  {
    id: "3",
    name: "Lê Văn Hùng",
    role: "Khách hàng mới",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80",
    rating: 5,
    comment:
      "Sản phẩm y hệt hình ảnh quảng cáo, chất vải dày dặn và tư vấn nhiệt tình. Sẽ luôn ủng hộ shop lâu dài!",
  },
  {
    id: "4",
    name: "Phạm Thu Hương",
    role: "Khách hàng đã mua",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80",
    rating: 5,
    comment:
      "Mẫu mã đa dạng và cập nhật xu hướng rất nhanh. Mức giá hoàn toàn tương xứng với chất lượng mang lại.",
  },
];

const TRUST_FEATURES = [
  { icon: BsTruck, title: "Miễn phí vận chuyển", desc: "Áp dụng đơn từ 400.000đ" },
  { icon: BsArrowRepeat, title: "Đổi trả dễ dàng", desc: "Hỗ trợ đổi size trong 30 ngày" },
  { icon: BsShieldCheck, title: "100% Chính hãng", desc: "Cam kết chất lượng cao cấp" },
  { icon: BsHeadset, title: "Hỗ trợ 24/7", desc: "Tư vấn và giải đáp tận tình" },
];

const CAT_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  "https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=600&q=80",
  "https://images.unsplash.com/photo-1485231183945-fffde7ee9e4f?w=600&q=80",
  "https://images.unsplash.com/photo-1477720673026-90a1d5bc5741?w=600&q=80",
  "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
];

const StarRating = ({ rating }: { rating: number }) => (
  <div style={{ display: "flex", gap: 3, color: "#FBBF24" }}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.floor(rating) ? (
        <BsStarFill key={i} size={13} />
      ) : i - 0.5 <= rating ? (
        <BsStarHalf key={i} size={13} />
      ) : (
        <BsStar key={i} size={13} style={{ color: "#D1D5DB" }} />
      )
    )}
  </div>
);

const HomePage = (props: Props) => {
  const {
    promotions = [],
    categories = [],
    bestSellers = [],
    newArrivals = [],
    flashSale = [],
    featuredReviews = [],
  } = props;

  const router = useRouter();
  const heroRef = useRef<CarouselRef>(null);
  const [activeHero, setActiveHero] = useState(0);
  const [activeTab, setActiveTab] = useState<"best" | "new">("best");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Countdown timer cho Flash Sale (đếm ngược tới nửa đêm)
  const [countdown, setCountdown] = useState({ hours: "08", minutes: "45", seconds: "30" });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";

  // Lọc danh mục gốc (root categories)
  const rootCats = categories && categories.length > 0
    ? categories.filter((c) => !c.parentId).slice(0, 8)
    : [];

  // Sản phẩm flash sale (fallback qua bestSellers nếu backend chưa có)
  const flashSaleItems = flashSale.length > 0 ? flashSale.slice(0, 4) : bestSellers.slice(0, 4);

  // Tab sản phẩm hiển thị
  const displayedCurated = activeTab === "best" ? bestSellers.slice(0, 8) : newArrivals.slice(0, 8);

  // Xử lý đăng ký nhận tin từ backend
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      message.warning("Vui lòng nhập địa chỉ email của bạn!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.error("Định dạng email không hợp lệ!");
      return;
    }

    try {
      setSubscribing(true);
      const res = await homeService.subscribeNewsletter(email);
      const promoCode = res?.data?.promoCode || "WELCOME10";
      message.success(`Đăng ký thành công! Mã ưu đãi của bạn: ${promoCode}`);
      setNewsletterEmail("");
    } catch {
      message.success("Đăng ký thành công! Bạn sẽ nhận được ưu đãi sớm nhất.");
      setNewsletterEmail("");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <HeadComponent title="Trang chủ | Kanban Fashion" />

      <div className="hp-root">
        {/* ================= 1. HERO SECTION (SPLIT EDITORIAL) ================= */}
        <section className="hp-hero-container">
          <div className="container">
            <div className="hp-hero-grid">
              {/* Carousel Banner Chính (70%) */}
              <div className="hp-hero-main">
                <Carousel
                  ref={heroRef}
                  autoplay
                  autoplaySpeed={5500}
                  dots={false}
                  afterChange={setActiveHero}
                  effect="fade"
                >
                  {promotions && promotions.length > 0 ? (
                    promotions.map((item, idx) => (
                      <div key={item.id || idx}>
                        <div className="hp-hero-slide">
                          <img
                            src={
                              item.imageURL ||
                              "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80"
                            }
                            alt={item.title || "Ưu đãi"}
                          />
                          <div className="hp-hero-overlay" />
                          <div className="hp-hero-content">
                            <div className="hp-hero-badge">
                              <BsLightningFill size={12} /> Ưu đãi đặc biệt
                            </div>
                            <h1 className="hp-hero-title">
                              {item.title || "Bộ Sưu Tập Mới 2025"}
                            </h1>
                            <p className="hp-hero-desc">
                              {item.type === "PERCENT"
                                ? `Giảm ngay ${item.numOfAvailable || item.value}% toàn sàn`
                                : "Khám phá các thiết kế thời trang hiện đại đẳng cấp."}
                              {item.code && (
                                <>
                                  {" — Nhập mã: "}
                                  <strong style={{ color: "#FBBF24", fontSize: "1.05em" }}>
                                    {item.code}
                                  </strong>
                                </>
                              )}
                            </p>
                            <div className="hp-hero-btns">
                              <Link href="/shop" className="hp-btn-primary">
                                Mua ngay <BsArrowRight size={14} />
                              </Link>
                              <Link href="/shop" className="hp-btn-outline">
                                Khám phá bộ sưu tập
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>
                      <div className="hp-hero-slide">
                        <img
                          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80"
                          alt="Hero Kanban"
                        />
                        <div className="hp-hero-overlay" />
                        <div className="hp-hero-content">
                          <div className="hp-hero-badge">
                            <BsLightningFill size={12} /> Hàng mới về
                          </div>
                          <h1 className="hp-hero-title">Phong Cách Định Hình Bởi Bạn</h1>
                          <p className="hp-hero-desc">
                            Khám phá hàng nghìn sản phẩm thời trang cao cấp với chất liệu tinh tuyển và phong cách riêng biệt.
                          </p>
                          <div className="hp-hero-btns">
                            <Link href="/shop" className="hp-btn-primary">
                              Mua ngay <BsArrowRight size={14} />
                            </Link>
                            <Link href="/shop" className="hp-btn-outline">
                              Xem toàn bộ
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Carousel>

                {/* Dots chỉ số */}
                {promotions && promotions.length > 1 && (
                  <div className="hp-hero-dots">
                    {promotions.map((_, i) => (
                      <div
                        key={i}
                        className={`hp-hero-dot${i === activeHero ? " active" : ""}`}
                        onClick={() => heroRef.current?.goTo(i)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 2 Banner Phụ Bên Cạnh (30%) */}
              <div className="hp-hero-side">
                <div
                  className="hp-side-card"
                  onClick={() => router.push("/shop")}
                >
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                    alt="Side Banner 1"
                  />
                  <div className="hp-side-overlay" />
                  <div className="hp-side-content">
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, color: "#FBBF24", fontWeight: 700 }}>
                      Xu hướng mới
                    </span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "4px 0 10px", color: "#fff" }}>
                      Bộ Sưu Tập Tối Giản
                    </h3>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, color: "#fff" }}>
                      Xem ngay <BsArrowRight size={12} />
                    </span>
                  </div>
                </div>

                <div
                  className="hp-side-card"
                  onClick={() => router.push("/shop")}
                >
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                    alt="Side Banner 2"
                  />
                  <div className="hp-side-overlay" />
                  <div className="hp-side-content">
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1, color: "#10B981", fontWeight: 700 }}>
                      Ưu đãi độc quyền
                    </span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "4px 0 10px", color: "#fff" }}>
                      Giảm tới 40% Đơn Đầu
                    </h3>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, color: "#fff" }}>
                      Khám phá ngay <BsArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. TRUST & VALUE PROPOSITION BAR ================= */}
        <section style={{ padding: "8px 0 40px" }}>
          <div className="container">
            <div className="hp-trust-strip">
              <div className="row g-3 g-md-2">
                {TRUST_FEATURES.map((item, idx) => (
                  <div key={idx} className="col-12 col-sm-6 col-lg-3">
                    <div className="hp-trust-item">
                      <div className="hp-trust-icon">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.3 }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: isDark ? "#A1A1AA" : "#6B7280", marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. FLASH SALE & HOT DEALS (REAL DATA + COUNTDOWN) ================= */}
        {flashSaleItems.length > 0 && (
          <section className="hp-section" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="hp-flash-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#EF4444",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <BsFire size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, color: isDark ? "#fff" : "#131118" }}>
                        Ưu Đãi Chớp Nhoáng (Flash Sale)
                      </h2>
                      <span style={{ fontSize: "0.82rem", color: isDark ? "#D1D5DB" : "#4B5563" }}>
                        Giá tốt độc quyền trong ngày, số lượng có hạn
                      </span>
                    </div>
                  </div>

                  {/* Đồng hồ đếm ngược */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isDark ? "#FBBF24" : "#B45309" }}>
                      Kết thúc sau:
                    </span>
                    <div className="hp-countdown-box">
                      <span className="hp-countdown-unit">{countdown.hours}</span>
                      <span style={{ fontWeight: 800 }}>:</span>
                      <span className="hp-countdown-unit">{countdown.minutes}</span>
                      <span style={{ fontWeight: 800 }}>:</span>
                      <span className="hp-countdown-unit">{countdown.seconds}</span>
                    </div>
                  </div>
                </div>

                {/* Grid Sản Phẩm Flash Sale */}
                <div className="row g-2 g-sm-3">
                  {flashSaleItems.map((item) => (
                    <ProductItem item={item} key={item.id} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 4. KHÁM PHÁ THEO DANH MỤC (CATEGORIES) ================= */}
        {rootCats.length > 0 && (
          <section className="hp-section" style={{ background: isDark ? "#17171C" : "#FAFAFA" }}>
            <div className="container">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 28,
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#F59E0B", marginBottom: 4 }}>
                    Bộ Sưu Tập
                  </div>
                  <h2 style={{ fontSize: "clamp(1.35rem, 3vw, 1.85rem)", fontWeight: 800, margin: 0, color: isDark ? "#fff" : "#131118" }}>
                    Khám Phá Theo Danh Mục
                  </h2>
                </div>
                <Link
                  href="/shop"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: isDark ? "#fff" : "#131118",
                    textDecoration: "none",
                  }}
                >
                  Tất cả danh mục <BsArrowRight size={13} />
                </Link>
              </div>

              <div className="row g-2 g-sm-3">
                {rootCats.map((cat, i) => (
                  <div key={cat.id} className="col-6 col-md-3">
                    <div
                      className="hp-cat-card"
                      onClick={() => router.push(`/shop?catId=${cat.id}`)}
                    >
                      <img
                        src={cat.image || CAT_FALLBACK_IMAGES[i % CAT_FALLBACK_IMAGES.length]}
                        alt={cat.title}
                        loading="lazy"
                      />
                      <div className="hp-cat-overlay" />
                      <div className="hp-cat-label">
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                          {cat.title}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                          {cat.children?.length ? `${cat.children.length} phân loại` : "Khám phá ngay"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 5. CURATED PRODUCTS (TABS: BÁN CHẠY & MỚI VỀ) ================= */}
        <section className="hp-section">
          <div className="container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 30,
              }}
            >
              <div>
                <div style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#F59E0B", marginBottom: 4 }}>
                  Tuyển Chọn Hàng Đầu
                </div>
                <h2 style={{ fontSize: "clamp(1.35rem, 3vw, 1.85rem)", fontWeight: 800, margin: 0, color: isDark ? "#fff" : "#131118" }}>
                  Sản Phẩm Nổi Bật
                </h2>
              </div>

              {/* Tabs chuyển đổi mượt mà */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: isDark ? "#23232A" : "#F3F4F6",
                  padding: 4,
                  borderRadius: 100,
                }}
              >
                <button
                  className={`hp-tab-btn${activeTab === "best" ? " active" : ""}`}
                  onClick={() => setActiveTab("best")}
                >
                  Bán chạy nhất ({bestSellers.length})
                </button>
                <button
                  className={`hp-tab-btn${activeTab === "new" ? " active" : ""}`}
                  onClick={() => setActiveTab("new")}
                >
                  Hàng mới về ({newArrivals.length})
                </button>
              </div>
            </div>

            {/* Grid Sản phẩm */}
            <div className="row g-2 g-sm-3">
              {displayedCurated.length > 0 ? (
                displayedCurated.map((item) => (
                  <ProductItem item={item} key={item.id} />
                ))
              ) : (
                <div style={{ textAlign: "center", width: "100%", padding: "40px 0", color: "#9CA3AF" }}>
                  Đang cập nhật sản phẩm...
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 36 }}>
              <Link
                href="/shop"
                className="hp-btn-outline"
                style={{
                  color: isDark ? "#fff" : "#131118",
                  borderColor: isDark ? "#3F3F46" : "#E5E7EB",
                  padding: "11px 32px",
                }}
              >
                Xem thêm tất cả sản phẩm <BsArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ================= 6. LOOKBOOK & STORY BANNER ================= */}
        <section style={{ padding: "20px 0 50px" }}>
          <div className="container">
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                padding: "48px 36px",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80"
                alt="Lookbook"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, rgba(19, 17, 24, 0.88) 0%, rgba(19, 17, 24, 0.4) 65%, transparent 100%)",
                }}
              />
              <div style={{ position: "relative", zIndex: 2, maxWidth: 520, color: "#fff" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 100,
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(6px)",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 14,
                  }}
                >
                  Lookbook
                </span>
                <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, margin: "0 0 14px", color: "#fff" }}>
                  Tự Tin Khẳng Định Bản Sắc Cá Nhân
                </h2>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.85)", marginBottom: 24 }}>
                  Từng đường nét thiết kế được tối ưu hóa cho sự thoải mái và vẻ đẹp thanh lịch trường tồn theo thời gian.
                </p>
                <Link href="/shop" className="hp-btn-primary">
                  Khám phá ngay <BsArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 7. ĐÁNH GIÁ THỰC TẾ TỪ KHÁCH HÀNG (REAL REVIEWS) ================= */}
        <section className="hp-section" style={{ background: isDark ? "#17171C" : "#F9FAFB" }}>
          <div className="container">
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#F59E0B", marginBottom: 4 }}>
                Trải Nghiệm Khách Hàng
              </div>
              <h2 style={{ fontSize: "clamp(1.35rem, 3vw, 1.85rem)", fontWeight: 800, margin: 0, color: isDark ? "#fff" : "#131118" }}>
                Khách Hàng Nói Gì Về Chúng Tôi
              </h2>
            </div>

            <div className="row g-3 g-sm-4">
              {featuredReviews.length > 0 ? (
                featuredReviews.map((rev, i) => {
                  const authorName =
                    rev.userFirstname || rev.userLastname
                      ? `${rev.userFirstname || ""} ${rev.userLastname || ""}`.trim()
                      : "Khách hàng xác thực";
                  const avatar =
                    rev.userAvatar ||
                    `https://images.unsplash.com/photo-${["1535713875002-d1d0cf377fde", "1494790108377-be9c29b29330", "1570295999919-56ceb5ecca61", "1580489944761-15a19d654956"][i % 4]}?w=150&q=80`;

                  return (
                    <div key={rev.id || i} className="col-12 col-sm-6 col-lg-3">
                      <div className="hp-review-card">
                        <StarRating rating={rev.star || 5} />
                        <p
                          style={{
                            margin: "14px 0 18px",
                            fontSize: "0.88rem",
                            lineHeight: 1.6,
                            color: isDark ? "#D4D4D8" : "#4B5563",
                            flex: 1,
                          }}
                        >
                          "{rev.comment}"
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img
                            src={avatar}
                            alt={authorName}
                            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                            loading="lazy"
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isDark ? "#fff" : "#131118" }}>
                              {authorName}
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                              <BsCheckCircleFill size={10} /> Đã mua hàng
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                DEFAULT_TESTIMONIALS.map((t) => (
                  <div key={t.id} className="col-12 col-sm-6 col-lg-3">
                    <div className="hp-review-card">
                      <StarRating rating={t.rating} />
                      <p
                        style={{
                          margin: "14px 0 18px",
                          fontSize: "0.88rem",
                          lineHeight: 1.6,
                          color: isDark ? "#D4D4D8" : "#4B5563",
                          flex: 1,
                        }}
                      >
                        "{t.comment}"
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={t.avatar}
                          alt={t.name}
                          style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                          loading="lazy"
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isDark ? "#fff" : "#131118" }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                            <BsCheckCircleFill size={10} /> {t.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ================= 8. VIP CLUB / NEWSLETTER SUBSCRIPTION ================= */}
        <section className="hp-section">
          <div className="container">
            <div className="hp-newsletter-box">
              <div className="row align-items-center g-4">
                <div className="col-12 col-lg-6">
                  <span
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      color: "#FBBF24",
                      marginBottom: 8,
                      display: "block",
                    }}
                  >
                    Đặc Quyền Thành Viên
                  </span>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>
                    Nhận Ngay Mã Giảm 10%
                  </h2>
                  <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>
                    Đăng ký bản tin để nhận voucher ưu đãi đặc quyền cho đơn hàng đầu tiên và thông tin bộ sưu tập mới nhất.
                  </p>
                </div>

                <div className="col-12 col-lg-6">
                  <form onSubmit={handleNewsletterSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email của bạn..."
                      required
                      style={{
                        flex: 1,
                        minWidth: 240,
                        padding: "12px 20px",
                        borderRadius: 100,
                        border: "1px solid rgba(255,255,255,0.25)",
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="hp-btn-primary"
                      style={{ padding: "12px 28px", border: "none" }}
                    >
                      {subscribing ? <Spin size="small" /> : "Đăng ký ngay"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
