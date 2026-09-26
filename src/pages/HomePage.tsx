import { ProductItem } from "@/components";
import HeadComponent from "@/components/HeadComponent";
import { CategoyModel, ProductModel } from "@/models/Products";
import { PromotionModel } from "@/models/PromotionModel";
import { Carousel, message } from "antd";
import { CarouselRef } from "antd/es/carousel";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { themeSelector } from "@/redux/reducers/themeSlice";
import {
  BsArrowLeft,
  BsArrowRight,
  BsStarFill,
  BsStar,
  BsStarHalf,
  BsShieldCheck,
  BsTruck,
  BsArrowRepeat,
  BsHeadset,
} from "react-icons/bs";

interface Props {
  promotions: PromotionModel[];
  categories: CategoyModel[];
  bestSellers: ProductModel[];
}

const TESTIMONIALS = [
  {
    id: 1,
    name: "Nguyễn Minh Tuấn",
    role: "Khách hàng thân thiết",
    avatar: "https://i.pravatar.cc/80?img=11",
    rating: 5,
    comment:
      "Sản phẩm chất lượng tuyệt vời, giao hàng nhanh chóng. Mình đã mua nhiều lần và lần nào cũng hài lòng. Sẽ tiếp tục ủng hộ shop!",
  },
  {
    id: 2,
    name: "Trần Thị Lan Anh",
    role: "Fashionista",
    avatar: "https://i.pravatar.cc/80?img=47",
    rating: 5,
    comment:
      "Thiết kế thời trang, chất liệu cao cấp. Mặc vào cảm giác rất thoải mái và được nhiều người khen. Giá cả hợp lý nữa!",
  },
  {
    id: 3,
    name: "Lê Văn Hùng",
    role: "Khách hàng mới",
    avatar: "https://i.pravatar.cc/80?img=32",
    rating: 4,
    comment:
      "Lần đầu mua online nhưng rất tin tưởng. Sản phẩm đúng như mô tả, đóng gói cẩn thận. Nhân viên hỗ trợ nhiệt tình.",
  },
  {
    id: 4,
    name: "Phạm Thu Hương",
    role: "Blogger thời trang",
    avatar: "https://i.pravatar.cc/80?img=25",
    rating: 5,
    comment:
      "Mình review rất nhiều shop thời trang nhưng đây là một trong những nơi mình ưng ý nhất. Chất lượng xứng đáng với giá tiền.",
  },
];

const FEATURES = [
  { icon: BsTruck, title: "Miễn phí vận chuyển", desc: "Đơn hàng từ 500K" },
  { icon: BsArrowRepeat, title: "Đổi trả dễ dàng", desc: "Trong vòng 30 ngày" },
  { icon: BsShieldCheck, title: "Bảo hành chính hãng", desc: "100% chính hãng" },
  { icon: BsHeadset, title: "Hỗ trợ 24/7", desc: "Luôn sẵn sàng giúp bạn" },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div style={{ display: "flex", gap: 2, color: "#FBBF24" }}>
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

const CAT_FALLBACKS = [
  "1445205170230-053b83016050",
  "1490481651871-ab68de25d43d",
  "1441986300917-64674bd600d8",
  "1542291026-7eec264c27ff",
  "1467043237213-65f2da53396f",
  "1485231183945-fffde7ee9e4f",
  "1477720673026-90a1d5bc5741",
  "1562157873-818bc0726f68",
];

const HomePage = (props: Props) => {
  const { promotions, categories, bestSellers } = props;
  const router = useRouter();
  const heroRef = useRef<CarouselRef>(null);
  const [activeHero, setActiveHero] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const { mode } = useSelector(themeSelector);
  const isDark = mode === "dark";
  const rootCats =
    categories && categories.length > 0
      ? categories.filter((c) => !c.parentId).slice(0, 8)
      : [];

  const handlePromoSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      message.warning("Vui lòng nhập địa chỉ email của bạn!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail.trim())) {
      message.error("Định dạng email không hợp lệ!");
      return;
    }
    message.success("Đăng ký nhận ưu đãi thành công!");
    setNewsletterEmail("");
  };

  return (
    <>
      <HeadComponent title="Trang chủ" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hp-root { font-family: var(--font-heading); background: #FAFAFA; }
        .hero-slide { position: relative; height: 560px; overflow: hidden; }
        .hero-slide img { width: 100%; height: 100%; object-fit: cover; transition: transform 8s ease; }
        .hero-slide:hover img { transform: scale(1.04); }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(105deg, rgba(19,17,24,0.76) 0%, rgba(19,17,24,0.3) 55%, transparent 100%); }
        .hero-content { position: absolute; top: 50%; left: 64px; transform: translateY(-50%); max-width: 520px; color: #fff; z-index: 2; }
        .hero-badge { display: inline-block; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); border-radius: 100px; padding: 5px 14px; font-size: 0.78rem; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #fff; margin-bottom: 14px; }
        .hero-title { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; line-height: 1.15; margin-bottom: 12px; color: #fff; }
        .hero-desc { font-size: 0.98rem; color: rgba(255,255,255,0.85); margin-bottom: 24px; line-height: 1.6; }
        .hero-btn { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #131118; border: none; border-radius: 100px; padding: 11px 26px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .hero-btn:hover { background: #131118; color: #fff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        .hero-btn-outline { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.65); border-radius: 100px; padding: 9px 22px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; margin-left: 0; }
        .hero-btn-outline:hover { background: rgba(255,255,255,0.15); border-color: #fff; }
        .hero-nav { position: absolute; bottom: 22px; left: 64px; display: flex; gap: 8px; z-index: 3; }
        .hero-dot { width: 26px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.3s; }
        .hero-dot.active { width: 38px; background: #fff; }
        .hero-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #fff; z-index: 5; }
        .hero-arrow:hover { background: rgba(255,255,255,0.3); }
        .hero-arrow.left { left: 20px; }
        .hero-arrow.right { right: 20px; }
        .features-strip { background: #131118; color: #fff; padding: 22px 0; }
        .feature-item { display: flex; align-items: center; gap: 14px; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.08); }
        .feature-item:last-child { border-right: none; }
        .feature-icon { width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .section-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6B7280; margin-bottom: 6px; }
        .section-title { font-size: clamp(1.35rem, 3vw, 2rem); font-weight: 800; color: #131118; margin: 0; line-height: 1.25; }
        .see-all-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #131118; text-decoration: none; border: 2px solid #131118; padding: 7px 16px; border-radius: 100px; transition: all 0.2s; flex-shrink: 0; }
        .see-all-btn:hover { background: #131118; color: #fff; }
        .cat-card { position: relative; border-radius: 14px; overflow: hidden; cursor: pointer; aspect-ratio: 3/4; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .cat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.18); }
        .cat-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .cat-card:hover img { transform: scale(1.06); }
        .cat-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(19,17,24,0.8) 0%, rgba(19,17,24,0.2) 45%, transparent 70%); }
        .cat-card-label { position: absolute; bottom: 0; left: 0; right: 0; padding: 18px 14px 14px; color: #fff; font-weight: 700; font-size: 0.95rem; }
        .cat-card-label span { display: block; font-size: 0.76rem; font-weight: 400; color: rgba(255,255,255,0.72); margin-top: 2px; }
        .cat-shop-now { display: inline-flex; align-items: center; gap: 4px; font-size: 0.74rem; font-weight: 600; color: #fff; margin-top: 4px; opacity: 0; transform: translateY(6px); transition: all 0.25s; }
        .cat-card:hover .cat-shop-now { opacity: 1; transform: translateY(0); }
        .testimonial-card { background: #fff; border-radius: 16px; border: 1px solid #F3F4F6; padding: 26px 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); height: 100%; transition: all 0.25s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .testimonial-card::before { content: '"'; position: absolute; top: -10px; right: 18px; font-size: 7rem; font-weight: 900; color: #F3F4F6; line-height: 1; font-family: Georgia, serif; pointer-events: none; }
        .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.10); border-color: #E5E7EB; }
        .testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #E5E7EB; flex-shrink: 0; }
        .fade-up { opacity: 0; transform: translateY(24px); animation: fadeUp 0.6s ease forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        @media (max-width: 992px) {
          .hero-slide { height: 440px; }
          .hero-content { left: 36px; max-width: 440px; }
          .hero-nav { left: 36px; }
        }

        @media (max-width: 768px) {
          .hero-slide { height: 380px; }
          .hero-content { left: 18px; right: 18px; max-width: 100%; }
          .hero-title { font-size: 1.55rem; }
          .hero-desc { font-size: 0.88rem; margin-bottom: 18px; }
          .hero-nav { left: 50%; transform: translateX(-50%); bottom: 12px; }
          .hero-arrow { display: none !important; }
          .feature-item { border-right: none; }
          .hp-section { padding: 40px 0 !important; }
        }

        @media (max-width: 576px) {
          .hero-slide { height: 350px; }
          .hero-title { font-size: 1.35rem; }
          .feature-item { gap: 8px; padding: 6px 2px; }
          .feature-icon { width: 34px; height: 34px; }
          .feature-icon svg { width: 16px; height: 16px; }
          .cat-card-label { padding: 12px 10px 10px; font-size: 0.88rem; }
          .cat-shop-now { opacity: 1; transform: none; font-size: 0.7rem; }
          .testimonial-card { padding: 18px 16px; }
          .testimonial-card::before { font-size: 4.5rem; top: 0; right: 10px; }
          .promo-section { padding: 44px 14px !important; }
        }
      `,
        }}
      />

      <div className="hp-root">
        {/* Hero Carousel */}
        <div style={{ position: "relative", background: "#131118" }}>
          <Carousel
            ref={heroRef}
            autoplay
            autoplaySpeed={5000}
            dots={false}
            afterChange={setActiveHero}
            effect="fade"
          >
            {promotions && promotions.length > 0 ? (
              promotions.map((item) => (
                <div key={item.id}>
                  <div className="hero-slide">
                    <img
                      src={
                        item.imageURL ||
                        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80"
                      }
                      alt={item.title}
                    />
                    <div className="hero-overlay" />
                    <div className="hero-content">
                      {item.type === "PERCENT" && (
                        <div className="hero-badge">Ưu đãi chớp nhoáng</div>
                      )}
                      <h1 className="hero-title">
                        {item.title || "Bộ sưu tập mới 2025"}
                      </h1>
                      <p className="hero-desc">
                        {item.type === "PERCENT"
                          ? `Giảm ngay ${item.numOfAvailable}% — Mã: `
                          : "Khám phá bộ sưu tập mới nhất — phong cách riêng biệt của bạn."}
                        {item.type === "PERCENT" && (
                          <strong style={{ color: "#FBBF24", fontSize: "1.1em" }}>
                            {item.code}
                          </strong>
                        )}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <button
                          className="hero-btn"
                          onClick={() => router.push("/shop")}
                        >
                          Mua ngay <BsArrowRight size={14} />
                        </button>
                        <button
                          className="hero-btn-outline"
                          onClick={() => router.push("/shop")}
                        >
                          Xem tất cả
                        </button>
                      </div>
                    </div>
                    <div className="hero-nav">
                      {promotions.map((_, i) => (
                        <div
                          key={i}
                          className={`hero-dot${i === activeHero ? " active" : ""}`}
                          onClick={() => heroRef.current?.goTo(i)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div>
                <div className="hero-slide">
                  <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80"
                    alt="Hero"
                  />
                  <div className="hero-overlay" />
                  <div className="hero-content">
                    <div className="hero-badge">Hàng mới về 2025</div>
                    <h1 className="hero-title">Phong cách định hình bởi bạn</h1>
                    <p className="hero-desc">
                      Khám phá hàng nghìn sản phẩm thời trang cao cấp, phong cách
                      riêng biệt.
                    </p>
                    <button
                      className="hero-btn"
                      onClick={() => router.push("/shop")}
                    >
                      Khám phá ngay <BsArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Carousel>
          <div
            className="hero-arrow left"
            onClick={() => heroRef.current?.prev()}
            aria-label="Previous Slide"
          >
            <BsArrowLeft size={18} />
          </div>
          <div
            className="hero-arrow right"
            onClick={() => heroRef.current?.next()}
            aria-label="Next Slide"
          >
            <BsArrowRight size={18} />
          </div>
        </div>

        {/* Features Strip */}
        <div className="features-strip">
          <div className="container">
            <div className="row g-2 g-md-0">
              {FEATURES.map((f, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <f.icon size={19} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.86rem",
                          color: "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.6)",
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        {rootCats.length > 0 && (
          <section className="hp-section" style={{ padding: "64px 0 52px" }}>
            <div className="container">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 28,
                  gap: 12,
                }}
                className="fade-up"
              >
                <div>
                  <div className="section-label">Danh mục</div>
                  <h2 className="section-title">Danh mục sản phẩm</h2>
                </div>
                <Link href="/shop" className="see-all-btn">
                  Tất cả <BsArrowRight size={13} />
                </Link>
              </div>
              <div className="row g-2 g-sm-3">
                {rootCats.map((cat, i) => (
                  <div
                    key={cat.id}
                    className={`col-6 col-md-3 fade-up delay-${(i % 4) + 1}`}
                  >
                    <div
                      className="cat-card"
                      onClick={() => router.push(`/shop?catId=${cat.id}`)}
                    >
                      <img
                        src={
                          cat.image ||
                          `https://images.unsplash.com/photo-${CAT_FALLBACKS[i % CAT_FALLBACKS.length]}?w=600&q=80`
                        }
                        alt={cat.title}
                        loading="lazy"
                      />
                      <div className="cat-card-overlay" />
                      <div className="cat-card-label">
                        {cat.title}
                        <span>
                          {cat.children?.length
                            ? `${cat.children.length} loại`
                            : "Xem ngay"}
                        </span>
                        <div className="cat-shop-now">
                          Xem ngay <BsArrowRight size={11} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bestsellers */}
        {bestSellers && bestSellers.length > 0 && (
          <section
            className="hp-section"
            style={{
              padding: "52px 0 64px",
              background: isDark ? "#17171c" : "#F9FAFB",
            }}
          >
            <div className="container">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 28,
                  gap: 12,
                }}
                className="fade-up"
              >
                <div>
                  <div className="section-label">Bán chạy nhất</div>
                  <h2 className="section-title">Sản phẩm bán chạy</h2>
                </div>
                <Link href="/shop" className="see-all-btn">
                  Xem tất cả <BsArrowRight size={13} />
                </Link>
              </div>
              <div className="row g-2 g-sm-3">
                {bestSellers.slice(0, 8).map((item) => (
                  <ProductItem item={item} key={item.id} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section
          className="hp-section"
          style={{
            padding: "64px 0",
            background: isDark ? "#121216" : "#fff",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginBottom: 36,
              }}
              className="fade-up"
            >
              <div>
                <div className="section-label">Đánh giá</div>
                <h2 className="section-title">Khách hàng nói gì về chúng tôi</h2>
              </div>
            </div>
            <div className="row g-3 g-sm-4">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.id}
                  className={`col-12 col-sm-6 col-lg-3 fade-up delay-${i + 1}`}
                >
                  <div className="testimonial-card">
                    <StarRating rating={t.rating} />
                    <p
                      style={{
                        margin: "14px 0 18px",
                        fontSize: "0.88rem",
                        lineHeight: 1.65,
                        color: isDark ? "rgba(255,255,255,0.7)" : "#4B5563",
                        position: "relative",
                        zIndex: 1,
                        flex: 1,
                      }}
                    >
                      {t.comment}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <img
                        className="testimonial-avatar"
                        src={t.avatar}
                        alt={t.name}
                        loading="lazy"
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.88rem",
                            color: isDark ? "#ffffff" : "#131118",
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.76rem",
                            color: isDark ? "#9CA3AF" : "#6B7280",
                            marginTop: 1,
                          }}
                        >
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <section
          className="promo-section"
          style={{
            background: "linear-gradient(135deg, #131118 0%, #2d2540 100%)",
            padding: "64px 0",
          }}
        >
          <div className="container text-center" style={{ color: "#fff" }}>
            <div
              style={{
                fontSize: "0.76rem",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                marginBottom: 10,
              }}
            >
              Ưu đãi độc quyền
            </div>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.6rem)",
                fontWeight: 800,
                color: "#fff",
                marginBottom: 14,
                lineHeight: 1.25,
              }}
            >
              Đăng ký nhận <span style={{ color: "#FBBF24" }}>ưu đãi 20%</span>{" "}
              đầu tiên
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.95rem",
                marginBottom: 28,
                maxWidth: 460,
                margin: "0 auto 28px",
                lineHeight: 1.6,
              }}
            >
              Nhận thông báo sớm về các bộ sưu tập mới và ưu đãi độc quyền dành
              riêng cho thành viên.
            </p>
            <form
              onSubmit={handlePromoSubscribe}
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                flexWrap: "wrap",
                width: "100%",
                maxWidth: 440,
                margin: "0 auto",
              }}
            >
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                style={{
                  padding: "11px 18px",
                  borderRadius: "100px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "0.88rem",
                  flex: "1 1 220px",
                  minWidth: 0,
                  outline: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "11px 24px",
                  borderRadius: "100px",
                  background: "#FBBF24",
                  color: "#131118",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Đăng ký ngay
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
