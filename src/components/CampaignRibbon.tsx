/** @format */

import React from "react";
import { PromotionModel } from "@/models/PromotionModel";
import { isPromotionActive } from "@/utils/promotionHelper";

interface CampaignRibbonProps {
  promotion?: PromotionModel | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Phân tích title của promotion thành 2 phần:
 * Dòng trên: Text nhỏ (vd: "DOUBLE DEAL", "FLASH SALE", "MEGA SALE")
 * Dòng dưới: Số/Tên lớn (vd: "11.11", "12.12", "SALE")
 */
const parseCampaignTitle = (title?: string) => {
  if (!title) return { topText: "DEAL HOT", mainText: "SALE" };
  const parts = title.trim().split(" ");
  if (parts.length >= 2) {
    const mainText = parts[parts.length - 1];
    const topText = parts.slice(0, parts.length - 1).join(" ");
    return { topText, mainText };
  }
  return { topText: "", mainText: title };
};

/**
 * Format giá trị giảm giá thành text hiển thị
 * e.g. type === "PERCENT" && value = 11 -> "-11%"
 * e.g. type !== "PERCENT" && value = 30000 -> "-30K"
 */
const formatDiscountValue = (promo: PromotionModel) => {
  const isPercent =
    promo.type === "PERCENT" ||
    (promo.type as any) === "PERCENTAGE" ||
    (typeof promo.value === "number" && promo.value <= 100);

  if (isPercent) {
    return `-${promo.value}%`;
  }

  if (promo.value >= 1000) {
    return `-${Math.round(promo.value / 1000)}K`;
  }
  return `-${promo.value}`;
};

/**
 * Format điều kiện giảm giá tối đa
 * e.g. maxDiscountAmount = 30000 -> "30K"
 */
const formatMaxDiscount = (amount?: number) => {
  if (!amount || amount <= 0) return null;
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}K`;
  }
  return `${amount}`;
};

const CampaignRibbon: React.FC<CampaignRibbonProps> = ({
  promotion,
  className,
  style,
}) => {
  // Nếu không có promotion hoặc promotion không còn hiệu lực thì không render
  if (!promotion || !isPromotionActive(promotion)) {
    return null;
  }

  const { topText, mainText } = parseCampaignTitle(promotion.title);
  const discountText = formatDiscountValue(promotion);
  const maxDiscountFormatted = formatMaxDiscount(promotion.maxDiscountAmount);

  // Phạm vi áp dụng: ưu tiên description, nếu không có thì fallback "TOÀN BỘ SẢN PHẨM"
  const scopeText =
    (promotion.description && promotion.description.trim())
      ? promotion.description.trim().toUpperCase()
      : (promotion.minOrderAmount && promotion.minOrderAmount > 0)
      ? `ĐƠN TỪ ${Math.round(promotion.minOrderAmount / 1000)}K`
      : "TOÀN BỘ SẢN PHẨM";

  // Màu chủ đạo (mặc định xanh đậm đặc trưng theo ảnh mẫu)
  const themeBlue = "#0052CC";

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        backgroundColor: themeBlue,
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 8px",
        gap: 6,
        userSelect: "none",
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* 1. Bên trái: Tên sự kiện (vd: DOUBLE DEAL / 11.11) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {topText && (
          <span
            style={{
              fontSize: "0.5rem",
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: "0.4px",
              color: "rgba(255, 255, 255, 0.95)",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            {topText}
          </span>
        )}
        <span
          style={{
            fontSize: "1.05rem",
            fontWeight: 900,
            fontStyle: "italic",
            color: "#FFFFFF",
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          {mainText}
        </span>
      </div>

      {/* 2. Ở giữa: Khung trắng chứa % giảm và điều kiện (vd: -11% Tối đa 30K) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 4,
          padding: "2px 6px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 900,
            color: themeBlue,
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          {discountText}
        </span>

        {maxDiscountFormatted && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1,
              justifyContent: "center",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: "0.46rem",
                fontWeight: 700,
                color: themeBlue,
                lineHeight: 1.1,
              }}
            >
              Tối đa
            </span>
            <span
              style={{
                fontSize: "0.55rem",
                fontWeight: 900,
                color: themeBlue,
                lineHeight: 1.1,
              }}
            >
              {maxDiscountFormatted}
            </span>
          </div>
        )}
      </div>

      {/* 3. Bên phải: Phạm vi áp dụng (vd: TOÀN BỘ SẢN PHẨM) */}
      <div
        style={{
          fontSize: "0.6rem",
          fontWeight: 800,
          color: "#FFFFFF",
          letterSpacing: "0.2px",
          textAlign: "right",
          textTransform: "uppercase",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {scopeText}
      </div>
    </div>
  );
};

export default CampaignRibbon;

