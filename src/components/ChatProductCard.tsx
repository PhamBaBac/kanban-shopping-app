/** @format */

import React, { useState } from "react";
import { Typography, Button, Tag } from "antd";
import { VND } from "@/utils/handleCurrency";
import { BsBagCheckFill, BsArrowRight } from "react-icons/bs";
import { MdImage } from "react-icons/md";

const { Text, Paragraph } = Typography;

export interface ChatProductCardProps {
  product: {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    images?: string[];
    categories?: Array<{ id: string; title: string }>;
    subProducts?: Array<{
      id?: string;
      price?: number;
      discount?: number;
      stock?: number;
      size?: string;
      color?: string;
      imgURL?: string;
      images?: string[];
    }>;
  };
  isDarkMode?: boolean;
  onSelect?: (product: any) => void;
}

export const ChatProductCard: React.FC<ChatProductCardProps> = ({
  product,
  isDarkMode = false,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const image =
    !imageError && product.images && product.images.length > 0
      ? product.images[0]
      : null;

  const subProducts = product.subProducts || [];
  let minPrice = Infinity;
  let minDiscount = Infinity;
  let hasDiscount = false;
  let totalStock = 0;

  if (subProducts.length > 0) {
    subProducts.forEach((sp) => {
      const p = Number(sp.price) || 0;
      const d = Number(sp.discount) || 0;
      const s = Number(sp.stock) || 0;
      totalStock += s;

      if (p > 0 && p < minPrice) minPrice = p;
      if (d > 0 && d < p) {
        hasDiscount = true;
        if (d < minDiscount) minDiscount = d;
      }
    });
  }

  const isContactPrice = minPrice === Infinity || minPrice === 0;
  const discountPercent =
    hasDiscount && minPrice > 0
      ? Math.round(((minPrice - minDiscount) / minPrice) * 100)
      : 0;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    }
  };

  const isOutOfStock = subProducts.length > 0 && totalStock <= 0;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flex: "0 0 195px",
        width: 195,
        backgroundColor: isDarkMode ? "#27272A" : "#FFFFFF",
        borderRadius: 14,
        border: isDarkMode
          ? isHovered
            ? "1px solid #60A5FA"
            : "1px solid #3F3F46"
          : isHovered
          ? "1px solid #131118"
          : "1px solid #E5E7EB",
        boxShadow: isHovered
          ? isDarkMode
            ? "0 8px 20px rgba(0, 0, 0, 0.45)"
            : "0 8px 20px rgba(0, 0, 0, 0.12)"
          : isDarkMode
          ? "0 2px 8px rgba(0, 0, 0, 0.25)"
          : "0 2px 6px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Khung ảnh sản phẩm */}
      <div
        style={{
          width: "100%",
          height: 140,
          backgroundColor: isDarkMode ? "#1f1f23" : "#F4F4F6",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={product.title}
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 6,
              transition: "transform 0.35s ease",
              transform: isHovered ? "scale(1.06)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color: isDarkMode ? "#71717A" : "#9CA3AF",
            }}
          >
            <MdImage size={36} />
            <span style={{ fontSize: 11 }}>Chưa có ảnh</span>
          </div>
        )}

        {/* Badge Giảm Giá */}
        {hasDiscount && discountPercent > 0 && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "#DC2626",
              color: "#ffffff",
              padding: "2px 6px",
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
            }}
          >
            -{discountPercent}%
          </div>
        )}

        {/* Badge Tình trạng hàng */}
        {isOutOfStock && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "#ffffff",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            Hết hàng
          </div>
        )}
      </div>

      {/* Nội dung thông tin sản phẩm */}
      <div
        style={{
          padding: "10px 10px 12px 10px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div>
          {/* Tên sản phẩm */}
          <Paragraph
            ellipsis={{ rows: 2, tooltip: product.title }}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              lineHeight: "17px",
              margin: 0,
              minHeight: 34,
              color: isDarkMode ? "#F4F4F5" : "#18181B",
            }}
          >
            {product.title}
          </Paragraph>

          {/* Hiển thị Giá tiền */}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {isContactPrice ? (
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isDarkMode ? "#A1A1AA" : "#6B7280",
                }}
              >
                Liên hệ
              </span>
            ) : hasDiscount ? (
              <>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#DC2626",
                  }}
                >
                  {VND.format(minDiscount)}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: isDarkMode ? "#71717A" : "#9CA3AF",
                    textDecoration: "line-through",
                  }}
                >
                  {VND.format(minPrice)}
                </span>
              </>
            ) : (
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: isDarkMode ? "#FBBF24" : "#131118",
                }}
              >
                {VND.format(minPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Nút Mua Hàng */}
        <Button
          type="primary"
          icon={<BsBagCheckFill size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          style={{
            width: "100%",
            height: 32,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: isDarkMode
              ? "linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)"
              : "linear-gradient(135deg, #131118 0%, #27272A 100%)",
            color: isDarkMode ? "#131118" : "#ffffff",
            border: "none",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",
          }}
        >
          Mua ngay
        </Button>
      </div>
    </div>
  );
};

export default ChatProductCard;
