/** @format */

import React from "react";
import { Button, Empty, Typography, Tag, Alert } from "antd";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { authSelector } from "@/redux/reducers/authReducer";
import { useWishlist } from "@/hooks/useWishlist";
import ProductItem from "./ProductItem";
import { FaHeart, FaTrashAlt } from "react-icons/fa";
import { IoBagHandleOutline } from "react-icons/io5";
import { ProductModel } from "@/models/Products";

const { Title, Text } = Typography;

const ProfileWishlist: React.FC = () => {
  const router = useRouter();
  const auth = useSelector(authSelector);
  const { wishlistItems, wishlistCount, clearAll } = useWishlist();

  const isLoggedIn = Boolean(auth?.accessToken);

  return (
    <div className="profile-wishlist-wrapper">
      {/* Header section */}
      <div
        className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="d-flex align-items-center gap-2">
          <Title
            level={4}
            className="mb-0"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              color: "#131118",
              margin: 0,
            }}
          >
            Bộ sưu tập yêu thích
          </Title>
          <Tag
            color="red"
            style={{
              borderRadius: "12px",
              padding: "0 10px",
              fontWeight: 600,
            }}
          >
            {wishlistCount} sản phẩm
          </Tag>
        </div>

        {wishlistCount > 0 && (
          <Button
            danger
            type="text"
            size="small"
            icon={<FaTrashAlt size={12} />}
            onClick={clearAll}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Guest notice banner */}
      {!isLoggedIn && wishlistCount > 0 && (
        <Alert
          type="info"
          showIcon
          message="Lưu trữ vĩnh viễn danh sách yêu thích"
          description={
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-1">
              <Text style={{ fontSize: "13px" }}>
                Bạn đang lưu tạm trên trình duyệt này. Đăng nhập ngay để đồng bộ và lưu trữ danh sách trên mọi thiết bị!
              </Text>
              <Button
                type="primary"
                size="small"
                onClick={() => router.push("/auth/login")}
                style={{
                  background: "#131118",
                  borderColor: "#131118",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
              >
                Đăng nhập ngay
              </Button>
            </div>
          }
          style={{
            borderRadius: "10px",
            marginBottom: "20px",
            backgroundColor: "#F9FAFB",
            border: "1px solid #E5E7EB",
          }}
        />
      )}

      {/* Product List / Grid */}
      {wishlistCount > 0 ? (
        <div className="row g-2 g-sm-3">
          {wishlistItems.map((product: ProductModel) => (
            <ProductItem
              item={product}
              key={product.id}
              className="col-6 col-sm-6 col-md-4 col-lg-4 col-xl-3 mb-3 mb-md-4"
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            padding: "60px 24px",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          <Empty
            image={
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  color: "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <FaHeart size={36} />
              </div>
            }
            description={
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#131118",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Bộ sưu tập yêu thích đang trống
                </span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>
                  Hãy bấm vào biểu tượng trái tim ở bất kỳ sản phẩm nào bạn ưng ý để lưu lại xem sau!
                </span>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<IoBagHandleOutline size={16} />}
              onClick={() => router.push("/shop")}
              style={{
                marginTop: "16px",
                background: "#131118",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontWeight: 600,
                height: "42px",
                padding: "0 24px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Khám phá sản phẩm ngay
            </Button>
          </Empty>
        </div>
      )}
    </div>
  );
};

export default ProfileWishlist;
